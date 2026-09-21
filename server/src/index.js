import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import knex from 'knex';
import config from '../knexfile.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { configService } from './services/configService.js';
import { memoService } from './services/memoService.js';
import { projectService } from './services/projectService.js';
import { taskService } from './services/taskService.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';

dotenv.config();
export function createApp(db) {
  const services = {
    projects: projectService(db),
    tasks: taskService(db),
    memos: memoService(db),
    configs: configService(db),
  };
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use('/api/projects', projectRoutes(services));
  app.use('/api/tasks', taskRoutes(services));
  app.use('/api/dashboard', dashboardRoutes(db));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
const db = knex(config);
if (process.env.NODE_ENV !== 'test') {
  const app = createApp(db);
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => console.log(`DevTracker server listening on ${port}`));
}
export { db };
