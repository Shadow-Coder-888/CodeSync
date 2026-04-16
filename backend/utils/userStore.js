// backend/utils/userStore.js
// In-memory user store. Replace with MongoDB/PostgreSQL in production.
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const users = new Map(); // email -> user object
const savedSnippets = new Map(); // userId -> [ snippets ]

async function createUser(email, password, username) {
  if (users.has(email.toLowerCase())) {
    return { error: 'Email already registered.' };
  }
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: nanoid(12),
    email: email.toLowerCase().trim(),
    username: username.trim().slice(0, 32),
    passwordHash: hash,
    createdAt: Date.now(),
  };
  users.set(user.email, user);
  savedSnippets.set(user.id, []);
  return { user: sanitize(user) };
}

async function loginUser(email, password) {
  const user = users.get(email.toLowerCase().trim());
  if (!user) return { error: 'Invalid email or password.' };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: 'Invalid email or password.' };
  return { user: sanitize(user) };
}

function getUser(id) {
  for (const u of users.values()) {
    if (u.id === id) return sanitize(u);
  }
  return null;
}

function saveSnippet(userId, { title, code, language }) {
  const list = savedSnippets.get(userId);
  if (!list) return { error: 'User not found.' };
  const snippet = {
    id: nanoid(8),
    title: (title || 'Untitled').slice(0, 60),
    code,
    language,
    savedAt: Date.now(),
  };
  list.unshift(snippet);
  if (list.length > 50) list.pop(); // cap at 50 snippets
  return { snippet };
}

function getSnippets(userId) {
  return savedSnippets.get(userId) || [];
}

function deleteSnippet(userId, snippetId) {
  const list = savedSnippets.get(userId);
  if (!list) return { error: 'User not found.' };
  const idx = list.findIndex(s => s.id === snippetId);
  if (idx === -1) return { error: 'Snippet not found.' };
  list.splice(idx, 1);
  return { ok: true };
}

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { createUser, loginUser, getUser, saveSnippet, getSnippets, deleteSnippet };
