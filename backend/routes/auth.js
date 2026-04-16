// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { createUser, loginUser, getUser } = require('../utils/userStore');
const { signToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ error: 'email, password and username are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (username.trim().length < 2)
    return res.status(400).json({ error: 'Username must be at least 2 characters.' });

  const result = await createUser(email, password, username);
  if (result.error) return res.status(409).json({ error: result.error });

  const token = signToken(result.user);
  res.status(201).json({ token, user: result.user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required.' });

  const result = await loginUser(email, password);
  if (result.error) return res.status(401).json({ error: result.error });

  const token = signToken(result.user);
  res.json({ token, user: result.user });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = getUser(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

module.exports = router;
