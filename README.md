# CodeSync — Real-Time Collaborative Code Editor

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/node-20%2B-brightgreen?style=flat-square)
![Languages](https://img.shields.io/badge/languages-5-orange?style=flat-square)
![Deploy](https://img.shields.io/badge/deployed-Render%20%2B%20Netlify-blue?style=flat-square)

> *Write together. Run instantly. No setup required.*

---

## Why I Built This

Every developer has been there — you're debugging with a colleague over a call, one person shares their screen, the other just watches. You paste code into Slack and it loses all formatting. You try an online editor and it either won't run the code, requires both of you to sign up, or locks everything useful behind a paywall.

Technical interviews are even worse. The candidate types into a Google Doc. The interviewer can't run it. Everyone pretends that's fine.

I built CodeSync because the tools that exist are either too expensive, too limited, or too dependent on third-party APIs that can fail or rate-limit you without warning. I wanted something self-hosted, instant, and actually useful — where you open a room in seconds and just start writing and running code together.

---

## What It Solves

| Problem | How CodeSync handles it |
|---|---|
| Collaborative editors don't run code | Built-in execution engine — no Judge0, no external API |
| Execution APIs cost money or have rate limits | Fully self-hosted — runs directly on your own server |
| Sign-up walls kill momentum | Join a room with just a name, no account needed |
| Shared screens are read-only | Real bidirectional editing with live per-user cursor sync |
| Programs need input but you can't type it | Interactive terminal — type responses live as the program runs |
| Files disappear after the session | File manager to name, save, and download your code |
| Snippets lost between sessions | Optional accounts to save and revisit your work |

---

## How It's Built

The frontend is **React 18 + Vite** with the **Monaco Editor** (the same engine powering VS Code) for a native coding feel. Real-time sync runs over **Socket.IO** — every keystroke, cursor move, chat message, and execution event is broadcast instantly to everyone in the room.

The backend is **Node.js + Express**. Code execution uses Node's `child_process.spawn` to run programs in isolated subprocesses — no third-party sandboxing service needed. The execution is fully **interactive**: the program streams its output live as it runs, and when it calls `input()` or `Scanner.nextLine()`, the terminal input line appears in the browser so the user can respond in real time, exactly like a local terminal.

Each run gets a hard **10-second timeout**, a **512 KB output cap**, and a temp directory that is deleted immediately after execution. Auth is **JWT-based** with bcrypt password hashing. Rooms expire after **30 minutes** of inactivity.

Everything — frontend, backend, and all 5 language runtimes — ships in a single **Docker image**.

---

## Features

- ⚡ **Instant rooms** — create or join with just a name, zero account required
- 🖊️ **Live collaboration** — real-time editing with per-user cursor sync and colour-coded cursors
- 🖥️ **Interactive terminal** — programs run live, stream output instantly, and accept typed input mid-execution
- ▶️ **Self-hosted execution** — no Judge0, no Piston, no third-party API — runs on your server
- 💬 **Collaborative chat** — real-time messages with per-user colour notification badges that pulse when unread
- 📁 **File manager** — manually name your files, auto-appends the right extension, download via browser
- 💾 **Snippet library** — register an account to save and revisit code across sessions
- 🌙 **Dark / Light mode** — because it matters

---

## Supported Languages

| Language | Runtime | Interactive I/O |
|---|---|---|
| Python | Python 3 | `input()` — fully supported |
| JavaScript | Node.js 20 | `readline` — fully supported |
| TypeScript | ts-node | `readline` — fully supported |
| C++ | g++ | `cin` — fully supported |
| Java | JDK (javac + java) | `Scanner` — fully supported |

---

## Quick Start

**Local development:**
```bash
npm run install:all
cp backend/.env.example backend/.env   # set JWT_SECRET
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

**With Docker (all runtimes pre-installed):**
```bash
npm run docker:build && npm run docker:run
# App → http://localhost:3001
```

---

## Deploy

**Render (backend) + Netlify (frontend) — recommended:**
1. Push to GitHub
2. Connect repo on [render.com](https://render.com) — auto-detects `render.yaml` and builds the Docker image
3. Connect repo on [netlify.com](https://netlify.com) — auto-detects `netlify.toml`
4. Set `VITE_BACKEND_URL` on Netlify → your Render service URL
5. Set `CLIENT_URL` on Render → your Netlify site URL

**Single server:**
```bash
cd frontend && npm run build
cd ../backend && node server.js   # serves frontend + API on one port
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | **Required** — used to sign auth tokens |
| `PORT` | `3001` | Port the Express server listens on |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (set to your frontend URL) |
| `VITE_BACKEND_URL` | *(empty = same origin)* | Backend URL for the frontend in production |

---

## Project Structure

```
CodeSync/
├── frontend/               React + Vite frontend
│   └── src/
│       ├── components/     EditorPanel, OutputPanel (terminal), ChatPanel, FilePanel…
│       ├── hooks/          useRoom (socket + terminal), useAuth, useTheme
│       └── pages/          LobbyPage, RoomPage, AuthPage
├── backend/
│   ├── routes/             execute.js, auth.js, snippets.js
│   ├── socket/             handlers.js — all real-time event logic
│   ├── utils/              roomManager.js, userStore.js
│   └── Dockerfile          All 5 language runtimes in one image
├── shared/
│   └── constants.js        Shared Socket.IO event names
├── render.yaml             Render deployment config
└── netlify.toml            Netlify deployment + clipboard headers
```

---

## License

MIT — use it, fork it, deploy it, build on it.

<!-- Contributors section hidden -->
