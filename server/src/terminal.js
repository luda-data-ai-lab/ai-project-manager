import fs from 'node:fs';
import os from 'node:os';
import pty from 'node-pty';
import { WebSocketServer } from 'ws';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function attachTerminal(httpServer, db) {
  if (process.env.TERMINAL_ENABLED === 'false') return null;

  const wss = new WebSocketServer({ server: httpServer, path: '/api/terminal' });
  wss.on('connection', async (ws, request) => {
    if (!LOOPBACK_ADDRESSES.has(request.socket.remoteAddress)) {
      ws.close(1008, 'Terminal is only available from localhost');
      return;
    }

    const query = new URL(request.url, 'http://localhost').searchParams;
    const projectId = query.get('projectId');
    const environment = projectId
      ? await db('environment_configs').where({ project_id: projectId }).first()
      : null;
    const sourceFolder = environment?.source_folder;
    const cwd = sourceFolder && fs.existsSync(sourceFolder) ? sourceFolder : os.homedir();
    const terminal = pty.spawn(process.env.SHELL || 'bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env,
    });

    const send = (data) => {
      if (ws.readyState === 1) ws.send(data);
    };
    terminal.onData(send);
    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'input') terminal.write(String(message.data || ''));
        if (message.type === 'resize') {
          const cols = Number(message.cols);
          const rows = Number(message.rows);
          if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0)
            terminal.resize(cols, rows);
        }
      } catch {
        // Ignore malformed terminal messages.
      }
    });
    ws.on('close', () => terminal.kill());
    terminal.onExit(() => {
      if (ws.readyState === 1) ws.close();
    });
  });
  return wss;
}
