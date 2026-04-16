// backend/utils/roomManager.js
const { nanoid } = require('nanoid');
const { LIMITS, USER_COLORS } = require('../../shared/constants');

const rooms = new Map();

function genRoomId() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = () => c[Math.floor(Math.random() * c.length)];
  return `${r()}${r()}-${r()}${r()}${r()}${r()}`;
}

function createRoom(customId) {
  const id = customId || genRoomId();
  if (rooms.has(id)) return rooms.get(id);
  const room = {
    id, code: '', language: 'javascript',
    users: new Map(), chatHistory: [], replaySnapshots: [],
    createdAt: Date.now(), lastActivity: Date.now(), expiryTimer: null,
  };
  rooms.set(id, room);
  scheduleExpiry(room);
  return room;
}

function getRoom(id) { return rooms.get(id) || null; }
function roomExists(id) { return rooms.has(id); }

function addUser(roomId, socketId, username, userId) {
  const room = getRoom(roomId);
  if (!room) return { error: 'Room not found.' };
  if (room.users.size >= LIMITS.MAX_USERS_PER_ROOM)
    return { error: `Room is full (max ${LIMITS.MAX_USERS_PER_ROOM} users).` };

  const colorIdx = room.users.size % USER_COLORS.length;
  const user = {
    id: userId || nanoid(8),
    socketId, username: username.trim().slice(0, 32),
    color: USER_COLORS[colorIdx],
    joinedAt: Date.now(),
    cursor: { lineNumber: 1, column: 1 },
  };
  room.users.set(socketId, user);
  room.lastActivity = Date.now();
  scheduleExpiry(room);
  return { user, room };
}

function removeUser(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return null;
  const user = room.users.get(socketId);
  room.users.delete(socketId);
  if (room.users.size === 0) scheduleExpiry(room, 5 * 60 * 1000);
  return user;
}

function getPublicUsers(roomId) {
  const room = getRoom(roomId);
  if (!room) return [];
  return Array.from(room.users.values()).map(({ socketId, ...u }) => u);
}

function updateCode(roomId, code) {
  const room = getRoom(roomId);
  if (!room) return;
  room.code = code.slice(0, LIMITS.MAX_CODE_LENGTH);
  room.lastActivity = Date.now();
  scheduleExpiry(room);
}

function updateLang(roomId, language) {
  const room = getRoom(roomId);
  if (room) { room.language = language; room.lastActivity = Date.now(); }
}

function updateCursor(roomId, socketId, pos) {
  const room = getRoom(roomId);
  if (!room) return;
  const u = room.users.get(socketId);
  if (u) u.cursor = pos;
}

function addChat(roomId, msg) {
  const room = getRoom(roomId);
  if (!room) return null;
  const m = { id: nanoid(8), ...msg, timestamp: Date.now() };
  room.chatHistory.push(m);
  if (room.chatHistory.length > LIMITS.MAX_CHAT_HISTORY) room.chatHistory.shift();
  room.lastActivity = Date.now();
  return m;
}

function addSnapshot(roomId, code) {
  const room = getRoom(roomId);
  if (!room || room.replaySnapshots.length >= 500) return;
  room.replaySnapshots.push({ code, timestamp: Date.now() });
}

function getRoomState(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  return {
    id: room.id, code: room.code, language: room.language,
    users: getPublicUsers(roomId), chatHistory: room.chatHistory,
    createdAt: room.createdAt,
  };
}

function scheduleExpiry(room, ms) {
  if (room.expiryTimer) clearTimeout(room.expiryTimer);
  room.expiryTimer = setTimeout(() => {
    rooms.delete(room.id);
    console.log(`[Room ${room.id}] expired.`);
  }, ms || LIMITS.ROOM_EXPIRY_MS);
}

module.exports = {
  genRoomId, createRoom, getRoom, roomExists,
  addUser, removeUser, getPublicUsers,
  updateCode, updateLang, updateCursor,
  addChat, addSnapshot, getRoomState,
};
