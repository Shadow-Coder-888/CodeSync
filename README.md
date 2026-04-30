# CodeSync — Real-Time Collaborative Coding

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen?style=flat-square)
![Languages](https://img.shields.io/badge/languages-5-orange?style=flat-square)

Write and run code together in real-time. No sign-up needed to start.

---

## Features

- ⚡ **Instant rooms** — create or join with just a name
- 🖊️ **Live collaboration** — real-time editing with cursor sync
- ▶️ **Code execution** — self-hosted, no third-party API
- 💬 **Integrated chat** — colour-coded per user
- 📁 **File manager** — name and save files with correct extensions
- 💾 **Snippet library** — save your work with an account
- 🌙 **Dark / Light mode**

## Languages

| Language | Runtime |
|---|---|
| JavaScript | Node.js |
| TypeScript | ts-node |
| Python | Python 3 |
| C++ | g++ |
| Java | JDK |

## Quick Start

```bash
npm run install:all
cp backend/.env.example backend/.env  # set JWT_SECRET
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

**Docker:**
```bash
npm run docker:build && npm run docker:run
```

## Deploy

**Render + Netlify:**
1. Push to GitHub → connect repo on [render.com](https://render.com) (auto-detects `render.yaml`)
2. Connect repo on [netlify.com](https://netlify.com) (auto-detects `netlify.toml`)
3. Set `VITE_BACKEND_URL` on Netlify and `CLIENT_URL` on Render

**Single server:**
```bash
cd frontend && npm run build
cd ../backend && node server.js
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | Required. Signs auth tokens |
| `PORT` | `3001` | Backend port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `VITE_BACKEND_URL` | *(empty)* | Frontend: backend URL (production) |

## License

MIT
