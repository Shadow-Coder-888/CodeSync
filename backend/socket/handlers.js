// backend/socket/handlers.js
const { EVENTS, LIMITS } = require('../../shared/constants');
const rm = require('../utils/roomManager');

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

    // DISCONNECT
    socket.on('disconnect', () => {
      const { roomId } = meta.get(socket.id) || {};
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
