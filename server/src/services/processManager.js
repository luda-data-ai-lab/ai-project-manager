import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

const registry = new Map();
const maxLogLines = 200;

const appendLog = (entry, text) => {
  entry.log.push(...String(text).split(/\r?\n/));
  if (entry.log.length > maxLogLines) entry.log.splice(0, entry.log.length - maxLogLines);
};

const killProcess = (child, signal) => {
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      windowsHide: true,
    });
    killer.once('error', () => {
      try {
        child.kill(signal);
      } catch {
        // The child may have already exited.
      }
    });
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // The child may have already exited.
    }
  }
};

export function processManager() {
  const start = (projectId, { command, cwd } = {}) => {
    const existing = registry.get(projectId);
    if (existing?.running) throw new Error('이미 실행 중입니다.');
    if (!String(command || '').trim()) throw new Error('실행 명령어가 설정되지 않았습니다.');
    const workingDirectory = cwd && fs.existsSync(cwd) ? cwd : os.homedir();
    const child = spawn(command, {
      cwd: workingDirectory,
      shell: true,
      env: process.env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const entry = {
      child,
      started_at: new Date().toISOString(),
      exited_at: null,
      exit_code: null,
      running: true,
      log: [],
    };
    registry.set(projectId, entry);
    const pending = { stdout: '', stderr: '' };
    const appendChunk = (stream, chunk) => {
      pending[stream] += String(chunk);
      const lines = pending[stream].split(/\r?\n/);
      pending[stream] = lines.pop();
      if (lines.length) appendLog(entry, lines.join('\n'));
    };
    child.stdout.on('data', (chunk) => appendChunk('stdout', chunk));
    child.stderr.on('data', (chunk) => appendChunk('stderr', chunk));
    const finish = (code) => {
      if (!entry.running) return;
      if (pending.stdout) appendLog(entry, pending.stdout);
      if (pending.stderr) appendLog(entry, pending.stderr);
      entry.running = false;
      entry.exited_at = new Date().toISOString();
      entry.exit_code = code ?? null;
    };
    child.once('exit', (code) => finish(code));
    child.once('error', (error) => {
      appendLog(entry, error.message);
      finish(null);
    });
    return { pid: child.pid, started_at: entry.started_at };
  };

  const get = (projectId) => {
    const entry = registry.get(projectId);
    if (!entry) return null;
    return {
      running: entry.running,
      pid: entry.child.pid ?? null,
      started_at: entry.started_at,
      exited_at: entry.exited_at,
      exit_code: entry.exit_code,
    };
  };

  const stop = (projectId) => {
    const entry = registry.get(projectId);
    if (!entry?.running) throw new Error('실행 중인 프로세스가 없습니다.');
    return new Promise((resolve) => {
      let settled = false;
      let killTimer;
      let forceTimer;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(killTimer);
        clearTimeout(forceTimer);
        resolve(get(projectId));
      };
      entry.child.once('exit', finish);
      entry.child.once('error', finish);
      killProcess(entry.child, 'SIGTERM');
      killTimer = setTimeout(() => {
        if (!entry.running) return;
        killProcess(entry.child, 'SIGKILL');
        forceTimer = setTimeout(() => {
          if (entry.running) {
            entry.running = false;
            entry.exited_at = new Date().toISOString();
            entry.exit_code = null;
          }
          finish();
        }, 500);
      }, 3000);
    });
  };

  const logs = (projectId, lines = 100) => {
    const entry = registry.get(projectId);
    if (!entry) return [];
    const count = Math.max(0, Number(lines) || 0);
    return entry.log.slice(-count);
  };

  return { start, stop, get, logs };
}
