// backend/server.js
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const path       = require('path');
const { Server } = require('socket.io');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { initSocketHandlers } = require('./socket/handlers');

const app    = express();
const server = http.createServer(app);

// CLIENT_URL can be a comma-separated list for multiple origins
// e.g. CLIENT_URL=https://codesync.netlify.app,http://localhost:5173
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = CLIENT_URL.split(',').map(s => s.trim());

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: false,
};

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '256kb' }));

// Rate limiting — 120 req/min per IP on all API routes
const limiter = rateLimit({
  windowMs: 60000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});
app.use('/api', limiter);

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/rooms',   require('./routes/rooms'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/snippets',require('./routes/snippets'));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all: send index.html for any non-API route (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

initSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ CodeSync backend running on port ${PORT}`);
  console.log(`   Allowed origins : ${allowedOrigins.join(', ')}\n`);
});
