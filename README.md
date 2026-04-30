# CodeSync — Real-Time Collaborative Coding Platform

> *Write together. Run instantly. No setup required.*

![CodeSync](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen?style=flat-square)
![Languages](https://img.shields.io/badge/languages-5-orange?style=flat-square)

---

## Why I Built This

Every developer has been there.

You're on a video call trying to debug something with a colleague. One person shares their screen. The other watches, unable to type. You paste code into Slack, it loses its formatting. You try an online editor — it requires both of you to sign up, won't run the code, or locks real-time collaboration behind a paywall.

Technical interviews are worse. The candidate pastes code into a Google Doc. The interviewer can't run it. Everyone pretends that's fine.

**Collaborative coding tools exist, but they're either expensive, require API keys, rely on third-party execution sandboxes, or gate the most useful features behind subscriptions.** The free options are read-only. The good ones cost money.

I built CodeSync to solve this properly.

---

## What CodeSync Does

CodeSync is a real-time collaborative coding platform where two or more people can write and **actually run code together** — with zero setup, no account required, and no external execution APIs.

Everything runs on your own server. The code execution engine is self-hosted: your code never leaves the machine, there are no rate limits imposed by a third party, and you're not paying per execution.

### The Real Problems It Solves

| Problem | CodeSync's Answer |
|---|---|
| Collaborative editors don't run code | Full execution engine built in — 5 languages |
| Execution APIs cost money or have rate limits | Self-hosted: runs directly on the server |
| Sign-up walls kill momentum | Instant rooms — join with just a name |
| Shared screens are read-only | Real bidirectional editing with live cursor sync |
| Code pasted into chat loses context | Persistent room state |
| Snippets disappear after the session | Optional accounts to save your work |

---

## Features

- **Instant rooms** — create or join a room in seconds, no account needed
- **Monaco Editor** — the same engine that powers VS Code, with syntax highlighting for all 5 languages
- **Real code execution** — runs on your server, not a third-party API
- **Live cursor sync** — see exactly where your collaborator is typing
- **Integrated chat** — keeps conversation and code in the same window
- **File manager** — create, name, and save multiple files per session
- **Snippet library** — register an account to save and revisit your code
- **Dark / Light mode** — because it matters

---

## Supported Languages

| Language | Runtime |
|---|---|
| JavaScript | Node.js |
| TypeScript | ts-node |
| Python | Python 3 |
| C++ | g++ |
| Java | JDK (javac + java) |

All runtimes are bundled inside the Docker image — no manual installation needed on Render or any Docker host.

---

## Security

Code runs in isolated child processes. Each execution is sandboxed:

- **10-second hard timeout** — runaway loops are killed automatically
- **512 KB output cap** — prevents memory flooding from verbose output
- **No network access** from executed code
- **Temp files** created per execution and deleted immediately after
- **Rate limiting** — 120 API requests/min per IP, 3-second cooldown between code runs
- **Room limits** — max 5 users per room, rooms expire after 30 minutes of inactivity

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- Language runtimes for whichever languages you want to support (the execution engine gives a friendly error for missing ones — it won't crash)

### Install & Run

```bash
# Install all dependencies
npm run install:all

# Set up environment files
cp backend/.env.example backend/.env
# Edit backend/.env and set your JWT_SECRET

# Start both servers
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

### Run with Docker (all runtimes included)

```bash
# Build the image — installs all 5 language runtimes inside it
npm run docker:build

# Run
npm run docker:run

# Stop
npm run docker:stop
```

---

## Deploying to Production

### Option 1: Render (backend) + Netlify (frontend)

**Backend on Render:**
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. Click **Apply**
5. After deploy, note your Render URL (e.g. `https://codesync-backend.onrender.com`)

**Frontend on Netlify:**
1. Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
2. Netlify detects `netlify.toml` automatically
3. Add environment variable: `VITE_BACKEND_URL=https://codesync-backend.onrender.com`
4. Deploy

Then go back to Render and set `CLIENT_URL=https://your-site.netlify.app` and redeploy.

### Option 2: Single server (backend serves frontend)

The backend already serves the built frontend as static files. Build the frontend once:

```bash
cd frontend && npm run build
```

Then start the backend — it serves everything on one port:

```bash
cd backend && node server.js
```

This is the simplest production setup and what the Docker image uses.

---

## Project Structure

```
codesync/
├── frontend/                   React + Vite + Monaco Editor
│   └── src/
│       ├── pages/              Home, Room, Auth, Snippets
│       ├── hooks/              useSocket, useAuth, useRoom
│       └── components/         Editor, Chat, UserList, Toolbar
├── backend/
│   ├── routes/
│   │   ├── execute.js          Self-hosted code execution engine
│   │   ├── auth.js             JWT register / login / me
│   │   ├── rooms.js            Room create / join / state
│   │   └── snippets.js         Save and retrieve code snippets
│   ├── socket/
│   │   └── handlers.js         Socket.IO real-time event handlers
│   ├── utils/
│   │   ├── roomManager.js      In-memory room state
│   │   └── userStore.js        In-memory user + snippet store
│   ├── middleware/
│   │   └── auth.js             JWT verification middleware
│   ├── Dockerfile              All 5 language runtimes in one image
│   └── server.js               Express + Socket.IO entry point
├── shared/
│   └── constants.js            Socket event names + limits (shared by both)
├── render.yaml                 Render.com deployment config
└── netlify.toml                Netlify deployment config
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret for signing auth tokens | Required |
| `ROOM_EXPIRY_MS` | Room inactivity timeout (ms) | `1800000` (30 min) |
| `MAX_USERS_PER_ROOM` | Max collaborators per room | `5` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | URL of the backend (production only) |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT — use it, fork it, deploy it, build on it.
