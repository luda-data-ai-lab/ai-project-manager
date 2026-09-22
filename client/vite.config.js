import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const apiPort = Number(env.PORT || 3001);
  return {
    plugins: [react()],
    define: { __API_PORT__: JSON.stringify(apiPort) },
    server: {
      port: 5173,
      proxy: {
        '/api/terminal': { target: `ws://localhost:${apiPort}`, ws: true },
        '/api': `http://localhost:${apiPort}`,
      },
    },
  };
});
