// backend/routes/snippets.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { saveSnippet, getSnippets, deleteSnippet } = require('../utils/userStore');

// All snippet routes require auth
router.use(requireAuth);

// GET /api/snippets
router.get('/', (req, res) => {
  res.json({ snippets: getSnippets(req.user.id) });
});

// POST /api/snippets
router.post('/', (req, res) => {
  const { title, code, language } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'code and language are required.' });
  const result = saveSnippet(req.user.id, { title, code, language });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

// DELETE /api/snippets/:id
router.delete('/:id', (req, res) => {
  const result = deleteSnippet(req.user.id, req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ ok: true });
});

module.exports = router;
