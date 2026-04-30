// backend/socket/handlers.js
const { EVENTS, LIMITS } = require('../../shared/constants');
const rm = require('../utils/roomManager');
const { spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const crypto = require('crypto');

// Language runner config (mirrors execute.js)
const RUNNERS = {
  javascript: { filename: 'main.js',   cmd: (dir) => `node "${path.join(dir,'main.js')}"` },
  typescript: { filename: 'main.ts',   cmd: (dir) => `ts-node --skipProject "${path.join(dir,'main.ts')}"` },
  python:     { filename: 'main.py',   cmd: (dir) => `python3 -u "${path.join(dir,'main.py')}"` },
  cpp:        { filename: 'main.cpp',  cmd: (dir) => { const bin = path.join(dir,'main_bin'); return `g++ -O2 -o "${bin}" "${path.join(dir,'main.cpp')}" && "${bin}"`; } },
  java:       { filename: 'Main.java', cmd: (dir) => `javac "${path.join(dir,'Main.java')}" && java -cp "${dir}" Main` },
};

const TIMEOUT_MS = 10000;
const MAX_OUTPUT = 512 * 1024;

// Active processes per socket: socketId -> { child, tmpDir }
const activeProcs = new Map();

function initSocketHandlers(io) {
  const meta = new Map(); // socketId -> { roomId, lastRun, lastChat }

  io.on('connection', (socket) => {
    meta.set(socket.id, { roomId: null, lastRun: 0, lastChat: 0 });

    // JOIN
    socket.on(EVENTS.ROOM_JOIN, ({ roomId, username, createIfMissing, userId }) => {
      if (!username?.trim()) return socket.emit(EVENTS.ROOM_ERROR, { message: 'Username is required.' });
      const rid = roomId?.trim().toUpperCase();
      if (!rid) return socket.emit(EVENTS.ROOM_ERROR, { message: 'Room ID is required.' });

      if (!rm.roomExists(rid)) {
        if (createIfMissing) rm.createRoom(rid);
        else return socket.emit(EVENTS.ROOM_ERROR, { message: `Room "${rid}" does not exist.` });
      }

      const result = rm.addUser(rid, socket.id, username, userId);
      if (result.error) return socket.emit(EVENTS.ROOM_ERROR, { message: result.error });

      socket.join(rid);
      meta.get(socket.id).roomId = rid;

      // Send full state to the joiner
      socket.emit(EVENTS.ROOM_STATE, rm.getRoomState(rid));

      // Notify others
      socket.to(rid).emit(EVENTS.ROOM_USER_JOINED, {
        user: result.user,
        users: rm.getPublicUsers(rid),
      });
    });

    // CODE CHANGE
    socket.on(EVENTS.CODE_CHANGE, ({ roomId, code }) => {
      const rid = roomId?.toUpperCase();
      if (!rid || code == null || code.length > LIMITS.MAX_CODE_LENGTH) return;
      rm.updateCode(rid, code);
      socket.to(rid).emit(EVENTS.CODE_SYNC, { code });
    });

    // LANG CHANGE
    socket.on(EVENTS.LANG_CHANGE, ({ roomId, language }) => {
      const rid = roomId?.toUpperCase();
      if (!rid || !language) return;
      rm.updateLang(rid, language);
      socket.to(rid).emit(EVENTS.LANG_CHANGE, { language });
    });

    // CURSOR
    socket.on(EVENTS.CURSOR_MOVE, ({ roomId, position }) => {
      const rid = roomId?.toUpperCase();
      if (!rid || !position) return;
      rm.updateCursor(rid, socket.id, position);
      const room = rm.getRoom(rid);
      const user = room?.users.get(socket.id);
      if (!user) return;
      socket.to(rid).emit(EVENTS.CURSOR_UPDATE, {
        userId: user.id, username: user.username,
        color: user.color, position,
      });
    });

    // CHAT — no echoing back dummy messages; only real user messages
    socket.on(EVENTS.CHAT_MESSAGE, ({ roomId, text }) => {
      const rid = roomId?.toUpperCase();
      if (!rid || !text?.trim()) return;

      const m = meta.get(socket.id);
      const now = Date.now();
      if (now - m.lastChat < LIMITS.RATE_LIMIT_CHAT_MS) return;
      m.lastChat = now;

      const room = rm.getRoom(rid);
      const user = room?.users.get(socket.id);
      if (!user) return;

      const msg = rm.addChat(rid, {
        userId: user.id, username: user.username, color: user.color,
        text: text.trim().slice(0, LIMITS.MAX_CHAT_MESSAGE_LENGTH),
      });
      if (msg) io.to(rid).emit(EVENTS.CHAT_MESSAGE, msg);
    });

    // REPLAY SNAPSHOT
    socket.on(EVENTS.REPLAY_SNAPSHOT, ({ roomId, code }) => {
      const rid = roomId?.toUpperCase();
      if (rid && code != null) rm.addSnapshot(rid, code);
    });

    // REPLAY REQUEST
    socket.on(EVENTS.REPLAY_REQUEST, ({ roomId }) => {
      const rid = roomId?.toUpperCase();
      const room = rm.getRoom(rid);
      if (!room) return;
      socket.emit(EVENTS.REPLAY_DATA, { snapshots: room.replaySnapshots });
    });

    // CODE RUN notification (actual execution via REST)
    socket.on(EVENTS.CODE_RUN, ({ roomId }) => {
      const rid = roomId?.toUpperCase();
      const m = meta.get(socket.id);
      const now = Date.now();
      if (now - m.lastRun < LIMITS.RATE_LIMIT_CODE_RUN_MS) {
        return socket.emit(EVENTS.ROOM_ERROR, { message: 'Please wait before running again.' });
      }
      m.lastRun = now;
      const room = rm.getRoom(rid);
      const user = room?.users.get(socket.id);
      io.to(rid).emit(EVENTS.CODE_RUNNING, { triggeredBy: user?.username || 'Someone' });
    });

    // ── INTERACTIVE TERMINAL ─────────────────────────────────────────────

    // TERM_START: compile + run code, stream output back live
    socket.on(EVENTS.TERM_START, ({ roomId, code, language }) => {
      const rid = roomId?.toUpperCase();
      const m = meta.get(socket.id);
      const now = Date.now();
      if (now - m.lastRun < LIMITS.RATE_LIMIT_CODE_RUN_MS) {
        return socket.emit(EVENTS.TERM_ERROR, { text: 'Please wait before running again.' });
      }
      m.lastRun = now;

      // Kill any existing process for this socket
      killProc(socket.id);

      const runner = RUNNERS[language];
      if (!runner) return socket.emit(EVENTS.TERM_ERROR, { text: `Unsupported language: ${language}` });

      // Notify room
      const room = rm.getRoom(rid);
      const user = room?.users.get(socket.id);
      io.to(rid).emit(EVENTS.CODE_RUNNING, { triggeredBy: user?.username || 'Someone' });

      // Create temp dir and write code
      const tmpDir = path.join(os.tmpdir(), `codesync_term_${crypto.randomBytes(6).toString('hex')}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, runner.filename), code, 'utf8');

      const command = runner.cmd(tmpDir);
      let totalOutput = 0;

      const child = spawn('sh', ['-c', command], {
        env: { ...process.env, HOME: tmpDir, TMPDIR: tmpDir, PYTHONUNBUFFERED: '1' },
      });

      activeProcs.set(socket.id, { child, tmpDir });

      child.stdin.on('error', () => {}); // suppress EPIPE

      // Stream stdout live to client
      child.stdout.on('data', (chunk) => {
        totalOutput += chunk.length;
        if (totalOutput > MAX_OUTPUT) { killProc(socket.id); return; }
        socket.emit(EVENTS.TERM_OUTPUT, { text: chunk.toString() });
      });

      // Stream stderr live
      child.stderr.on('data', (chunk) => {
        totalOutput += chunk.length;
        socket.emit(EVENTS.TERM_OUTPUT, { text: chunk.toString(), isErr: true });
      });

      // Timeout
      const timer = setTimeout(() => {
        socket.emit(EVENTS.TERM_OUTPUT, { text: `\nTime limit exceeded (${TIMEOUT_MS/1000}s)\n`, isErr: true });
        killProc(socket.id);
      }, TIMEOUT_MS);

      child.on('close', (code) => {
        clearTimeout(timer);
        activeProcs.delete(socket.id);
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        socket.emit(EVENTS.TERM_DONE, { exitCode: code ?? 0 });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        socket.emit(EVENTS.TERM_OUTPUT, { text: err.message, isErr: true });
        socket.emit(EVENTS.TERM_DONE, { exitCode: 1 });
      });
    });

    // TERM_INPUT: user typed something — send to process stdin
    socket.on(EVENTS.TERM_INPUT, ({ text }) => {
      const proc = activeProcs.get(socket.id);
      if (!proc?.child) return;
      try {
        proc.child.stdin.write(text);
      } catch {}
    });

    // TERM_KILL: user manually stopped execution
    socket.on(EVENTS.TERM_KILL, () => killProc(socket.id));

    // ─────────────────────────────────────────────────────────────────────

    // DISCONNECT
    socket.on('disconnect', () => {
      const { roomId } = meta.get(socket.id) || {};
      killProc(socket.id);
      if (roomId) {
        const user = rm.removeUser(roomId, socket.id);
        if (user) {
          io.to(roomId).emit(EVENTS.ROOM_USER_LEFT, {
            userId: user.id, username: user.username,
            users: rm.getPublicUsers(roomId),
          });
        }
      }
      meta.delete(socket.id);
    });
  });
}

module.exports = { initSocketHandlers };

function killProc(socketId) {
  const proc = activeProcs.get(socketId);
  if (!proc) return;
  try { proc.child.kill('SIGKILL'); } catch {}
  try { fs.rmSync(proc.tmpDir, { recursive: true, force: true }); } catch {}
  activeProcs.delete(socketId);
}
