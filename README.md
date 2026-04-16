# ⚡ CodeSync — Real-Time Collaborative Coding Platform

No API keys. No external services. Code runs directly on our server.

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- The language runtimes you want to support (see below)

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Set up environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run
```bash
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

---

## 🌐 Deploy to the Internet — Two Services, Both Free

### Backend → Render.com (free tier)
1. Push this repo to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically — click **Apply**
5. Set `CLIENT_URL` environment variable to your Netlify URL (after step below)
6. Deploy — you get a URL like `https://codesync-backend.onrender.com`

### Frontend → Netlify (free)
1. Go to https://netlify.com → Add new site → Import from GitHub
2. Netlify detects `netlify.toml` automatically
3. Add environment variable: `VITE_BACKEND_URL=https://codesync-backend.onrender.com`
4. Deploy — you get a URL like `https://codesync.netlify.app`

Then go back to Render and set `CLIENT_URL=https://codesync.netlify.app` and redeploy.

---

## 🔧 Language Runtimes

The execution engine uses whatever is installed on the server.

| Language   | Runtime needed       | Install (Ubuntu/Debian)            |
|------------|----------------------|------------------------------------|
| JavaScript | node (v18+)          | Already available (server is Node) |
| TypeScript | ts-node, typescript  | `npm install -g ts-node typescript`|
| Python     | python3              | `sudo apt install python3`         |
| C++        | g++                  | `sudo apt install g++`             |
| Go         | go                   | `sudo apt install golang`          |
| Java       | javac + java (JDK)   | `sudo apt install default-jdk`     |
| Rust       | rustc                | `curl -sSf https://sh.rustup.rs \| sh` |

The **Dockerfile** installs all of these automatically — so on Render (which uses Docker), every language works out of the box.

For **local development**, only install what you need. The engine will show a friendly "not installed" message for missing runtimes instead of crashing.

---

## 🐳 Docker (optional for local)

```bash
# Build the image (installs all runtimes inside it)
npm run docker:build

# Run the backend in Docker
npm run docker:run

# Stop it
npm run docker:stop
```

---

## ✨ Features

- Instant rooms — no account needed
- Monaco Editor (VS Code engine) with live cursor sync
- Real code execution on your own server — 7 languages
- Integrated chat — starts empty, real users only
- Session replay — auto-snapshots every 5 seconds
- Optional auth — register to save snippets
- Dark / light mode

---

## 🛡 Security

- Code runs in isolated child processes with a 10-second timeout
- Output capped at 512KB
- No network access from executed code (no external calls possible from userland)
- Temp files created per execution and deleted immediately after
- Rate limiting: 120 API requests/min, 3s cooldown on code runs

---

## 📁 Structure

```
codesync/
├── frontend/          React + Vite + Monaco Editor
├── backend/
│   ├── routes/
│   │   ├── execute.js ← self-hosted execution engine (no API)
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   └── snippets.js
│   ├── socket/        Socket.IO real-time handlers
│   ├── utils/         roomManager, userStore
│   ├── Dockerfile     all language runtimes in one image
│   └── server.js
├── shared/
│   └── constants.js
├── render.yaml        Render deployment config
└── netlify.toml       Netlify deployment config
```
