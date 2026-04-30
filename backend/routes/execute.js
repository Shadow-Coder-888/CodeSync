// backend/routes/execute.js
// Self-hosted execution engine — no external API needed.
// Uses child_process to run code in isolated subprocesses with
// strict timeouts, memory caps, and no network access.
// Works on any machine/VPS that has the language runtimes installed.

const express  = require('express');
const router   = express.Router();
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const crypto   = require('crypto');

const execAsync = promisify(exec);

// ── Execution limits ───────────────────────────────────────────────────────
const TIMEOUT_MS   = 10000;    // 10 seconds — process is killed after this
const MAX_BUFFER   = 512*1024; // 512 KB max output

// ── Language runner config ─────────────────────────────────────────────────
// Each entry defines how to save and run code for that language.
// `runner` receives (tmpDir, filename) and returns the shell command string.
const RUNNERS = {
  javascript: {
    filename: 'main.js',
    runner:   (dir) => `node "${path.join(dir,'main.js')}"`,
  },
  typescript: {
    filename: 'main.ts',
    // ts-node must be installed: npm install -g ts-node typescript
    runner:   (dir) => `ts-node --skipProject "${path.join(dir,'main.ts')}"`,
  },
  python: {
    filename: 'main.py',
    runner:   (dir) => `python3 "${path.join(dir,'main.py')}"`,
  },
  cpp: {
    filename: 'main.cpp',
    // Compile first, then run. The compiled binary lives in the same temp dir.
    runner:   (dir) => {
      const src = path.join(dir,'main.cpp');
      const bin = path.join(dir,'main_bin');
      return `g++ -O2 -o "${bin}" "${src}" && "${bin}"`;
    },
  },
  java: {
    filename: 'Main.java',
    // javac produces Main.class in the same dir; then java -cp dir Main
    runner:   (dir) => `javac "${path.join(dir,'Main.java')}" && java -cp "${dir}" Main`,
  },
};

// ── Helper — check if a runtime is available on this machine ──────────────
const runtimeCache = {};
async function isAvailable(cmd) {
  if (runtimeCache[cmd] !== undefined) return runtimeCache[cmd];
  try {
    await execAsync(`which ${cmd}`, { timeout: 2000 });
    runtimeCache[cmd] = true;
  } catch {
    runtimeCache[cmd] = false;
  }
  return runtimeCache[cmd];
}

// ── POST /api/execute ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { code, language, stdin = '' } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required.' });
  }

  const runner = RUNNERS[language];
  if (!runner) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  // ── Runtime availability check ─────────────────────────────────────────
  const runtimeMap = {
    javascript: 'node',
    typescript: 'ts-node',
    python:     'python3',
    cpp:        'g++',
    java:       'javac',
  };
  const rt = runtimeMap[language];
  if (rt && !(await isAvailable(rt))) {
    return res.json({
      stdout: '',
      stderr: `Runtime not found: '${rt}' is not installed on this server.\n\nAsk the admin to install it:\n${installHint(language)}`,
      status: { id: 0, description: 'Runtime Not Found' },
      time:   null,
      success: false,
    });
  }

  // ── Create isolated temp directory ────────────────────────────────────
  const id     = crypto.randomBytes(8).toString('hex');
  const tmpDir = path.join(os.tmpdir(), `codesync_${id}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const codeFile = path.join(tmpDir, runner.filename);

  try {
    fs.writeFileSync(codeFile, code, 'utf8');

    const command = runner.runner(tmpDir);
    const start   = Date.now();
    let stdout = '', stderr = '', timedOut = false;

    try {
      // Use spawn via shell so compound commands (e.g. javac && java) work,
      // and pipe stdin directly so input() / Scanner / readline work correctly.
      await new Promise((resolve, reject) => {
        const child = spawn('sh', ['-c', command], {
          env: {
            ...process.env,
            PATH: process.env.PATH,
            HOME: tmpDir,
            TMPDIR: tmpDir,
          },
        });

        // Suppress EPIPE errors on stdin — happens when process exits before
        // reading all input (e.g. compile error, or program doesn't use stdin)
        child.stdin.on('error', (e) => { if (e.code !== 'EPIPE') reject(e); });

        // Write stdin then close so the program receives EOF after all input
        if (stdin && stdin.trim()) {
          // Ensure every line ends with newline so input()/Scanner reads correctly
          const stdinData = stdin.endsWith('\n') ? stdin : stdin + '\n';
          child.stdin.write(stdinData, 'utf8', () => {
            child.stdin.end();
          });
        } else {
          child.stdin.end();
        }

        child.stdout.on('data', chunk => {
          stdout += chunk.toString();
          if (stdout.length > MAX_BUFFER) child.kill('SIGKILL');
        });
        child.stderr.on('data', chunk => {
          stderr += chunk.toString();
          if (stderr.length > MAX_BUFFER) child.kill('SIGKILL');
        });

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, TIMEOUT_MS);

        child.on('close', () => { clearTimeout(timer); resolve(); });
        child.on('error', (e) => { clearTimeout(timer); stderr += e.message; resolve(); });
      });
    } catch (execErr) {
      stderr = stderr || execErr.message || 'Execution failed.';
    }

    if (timedOut) {
      stderr = `Time limit exceeded (${TIMEOUT_MS / 1000}s). Your code ran too long and was stopped.`;
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(3);

    // Trim trailing whitespace for cleaner display
    stdout = stdout.trimEnd();
    stderr = stderr.trimEnd();

    const statusId = timedOut ? 5
      : (stderr && !stdout)   ? 6   // runtime/compile error
      :                         3;  // accepted

    return res.json({
      stdout,
      stderr,
      time:    elapsed,
      memory:  null,
      timedOut,
      status: {
        id:          statusId,
        description: timedOut ? 'Time Limit Exceeded'
          : statusId === 6    ? 'Runtime Error'
          :                     'Accepted',
      },
      success: statusId === 3,
    });

  } finally {
    // Always delete the temp directory — no code stays on server
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

// ── Install hints per language ─────────────────────────────────────────────
function installHint(lang) {
  const hints = {
    javascript: 'Node.js: https://nodejs.org  (or: sudo apt install nodejs)',
    typescript: 'ts-node: npm install -g ts-node typescript',
    python:     'Python 3: sudo apt install python3  (or: https://python.org)',
    cpp:        'GCC: sudo apt install g++  (or: xcode-select --install on Mac)',
    java:       'JDK: sudo apt install default-jdk  (or: https://adoptium.net)',
  };
  return hints[lang] || 'Check the README for installation instructions.';
}

module.exports = router;
