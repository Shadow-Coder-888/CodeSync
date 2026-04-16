// backend/routes/rooms.js
const express = require('express');
const router = express.Router();
const rm = require('../utils/roomManager');

// POST /api/rooms/create
router.post('/create', (req, res) => {
  const room = rm.createRoom();
  res.json({ roomId: room.id });
});

// GET /api/rooms/:id — check if room exists
router.get('/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  if (!rm.roomExists(id)) return res.status(404).json({ error: 'Room not found.' });
  const state = rm.getRoomState(id);
  const full = state.users.length >= parseInt(process.env.MAX_USERS_PER_ROOM || 5);
  res.json({ id, userCount: state.users.length, language: state.language, full });
});

module.exports = router;
