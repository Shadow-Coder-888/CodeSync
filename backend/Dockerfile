FROM node:20-slim

# System deps + language runtimes (JavaScript via Node, Python, C++, Java)
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ python3 python3-pip default-jdk ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# TypeScript globally
RUN npm install -g ts-node typescript

# ── Build frontend ───────────────────────────────────────────────────────────
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Setup backend ────────────────────────────────────────────────────────────
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/ ./

# Copy the built frontend where server.js expects it (/frontend/dist)
RUN mkdir -p /frontend && cp -r /build/frontend/dist /frontend/dist

EXPOSE 3001
CMD ["node", "server.js"]
