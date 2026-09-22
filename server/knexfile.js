import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [path.join(serverDir, '.env'), path.join(serverDir, '..', '.env')],
});
const filename = process.env.DB_PATH || './data/devtracker.db';
if (filename !== ':memory:')
  fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });

export default {
  client: 'better-sqlite3',
  useNullAsDefault: true,
  connection: { filename },
  pool: {
    afterCreate: (connection, done) => {
      connection.pragma('foreign_keys = ON');
      done(null, connection);
    },
  },
  migrations: { directory: './db/migrations' },
  seeds: { directory: './db/seeds' },
};
