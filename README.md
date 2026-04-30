# CodeSync — Real-Time Collaborative Coding

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen?style=flat-square)
![Languages](https://img.shields.io/badge/languages-5-orange?style=flat-square)

> *Write together. Run instantly. No setup required.*

---

## Why I Built This

Every developer has been there — you're debugging with a colleague over a call, one person shares their screen, the other just watches. You paste code into Slack and it loses all formatting. You try an online editor and it either won't run the code, requires both of you to sign up, or locks the good stuff behind a paywall.

Technical interviews are even worse. The candidate types into a Google Doc. The interviewer can't run it. Everyone pretends that's fine.

I built CodeSync because the tools that exist are either too expensive, too limited, or too dependent on third-party APIs. I wanted something self-hosted, instant, and actually useful — where you can open a room in seconds and just start writing and running code together.

---

## What It Solves

| Problem | How CodeSync handles it |
|---|---|
| Collaborative editors don't run code | Built-in execution engine — no Judge0, no external API |
| Execution APIs cost money / have rate limits | Fully self-hosted — runs on your own server |
| Sign-up walls kill momentum | Join a room with just a name, no account needed |
| Shared screens are read-only | Real bidirectional editing with live cursor sync |
| Files disappear after the session | File manager to name, save, and download your code |
| Snippets lost between sessions | Optional accounts to save and revisit your work |

---

## How It's Built

The frontend is **React + Vite** with the **Monaco Editor** (the same engine powering VS Code) for a native coding feel. Real-time sync runs over **Socket.IO** — every keystroke, cursor move, and chat message is broadcast instantly to everyone in the room.

The backend is **Node.js + Express**. Code execution uses Node's `child_process` to spawn isolated subprocesses per run — no sandboxing service needed. Each run gets a hard 10-second timeout, a 512 KB output cap, and a temp directory that's deleted immediately after. Auth is **JWT-based** with an in-memory store (swap in a database for production). Rooms expire after 30 minutes of inactivity.

Everything — frontend, backend, and all 5 language runtimes — ships in a single **Docker image**.

---

## Features

- ⚡ **Instant rooms** — create or join with just a name, no account needed
- 🖊️ **Live collaboration** — real-time editing with per-user cursor sync
- ▶️ **Code execution** — self-hosted, sandboxed, no third-party API
- 💬 **Integrated chat** — colour-coded notification badges per user
- 📁 **File manager** — manually name and save files with the right extension
- 💾 **Snippet library** — register to save code across sessions
- 🌙 **Dark / Light mode**

---

## Supported Languages

| Language | Runtime |
|---|---|
| JavaScript | Node.js |
| TypeScript | ts-node |
| Python | Python 3 |
| C++ | g++ |
| Java | JDK (javac + java) |

---

## Quick Start

```bash
npm run install:all
cp backend/.env.example backend/.env   # set your JWT_SECRET
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

**With Docker (all runtimes included):**
```bash
npm run docker:build && npm run docker:run
```

---

## Deploy

**Render (backend) + Netlify (frontend):**
1. Push to GitHub → connect on [render.com](https://render.com) — auto-detects `render.yaml`
2. Connect on [netlify.com](https://netlify.com) — auto-detects `netlify.toml`
3. Set `VITE_BACKEND_URL` on Netlify → your Render URL
4. Set `CLIENT_URL` on Render → your Netlify URL

**Single server (simplest):**
```bash
cd frontend && npm run build
cd ../backend && node server.js   # serves everything on one port
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | Required — signs auth tokens |
| `PORT` | `3001` | Backend port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `VITE_BACKEND_URL` | *(empty = same origin)* | Backend URL for frontend in production |

---

## License

MIT — use it, fork it, deploy it, build on it.

<!-- Contributors section hidden -->
