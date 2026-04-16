# ── CodeSync Backend Dockerfile ─────────────────────────────────────────────
# Installs every language runtime the execution engine supports.
# Build: docker build -t codesync-backend .
# Run:   docker run -p 3001:3001 --env-file .env codesync-backend

FROM node:20-slim

# ── System deps + language runtimes ─────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # C++ compiler
    g++ \
    # Python 3
    python3 \
    python3-pip \
    # Go
    golang \
    # Java (JDK for javac + java)
    default-jdk \
    # Rust (installed via rustup below — apt version is too old)
    curl \
    ca-certificates \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# ── Rust via rustup (official, latest stable) ───────────────────────────────
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --default-toolchain stable --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

# ── TypeScript + ts-node globally ───────────────────────────────────────────
RUN npm install -g ts-node typescript

# ── App setup ───────────────────────────────────────────────────────────────
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
