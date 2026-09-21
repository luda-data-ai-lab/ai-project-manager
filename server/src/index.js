import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'node:http';
import knex from 'knex';
import config from '../knexfile.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { configService } from './services/configService.js';
import { documentService } from './services/documentService.js';
import { issueService } from './services/issueService.js';
import { memoService } from './services/memoService.js';
import { promptService } from './services/promptService.js';
import { projectService } from './services/projectService.js';
import { taskService } from './services/taskService.js';
import { searchService } from './services/searchService.js';
import { testRecordService } from './services/testRecordService.js';
import { relationService } from './services/relationService.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { projectRoutes } from './routes/projects.js';
import { documentRoutes } from './routes/documents.js';
import { issueRoutes } from './routes/issues.js';
import { promptRoutes } from './routes/prompts.js';
import { taskRoutes } from './routes/tasks.js';
import { attachTerminal } from './terminal.js';
import { searchRoutes } from './routes/search.js';
import { testRoutes } from './routes/tests.js';
import { testRecordRoutes } from './routes/testRecords.js';
import { projectRelationRoutes, relationRoutes } from './routes/relations.js';

dotenv.config();
export function createApp(db, search = searchService(db)) {
  const services = {
    projects: projectService(db, search),
    tasks: taskService(db, search),
    memos: memoService(db),
    configs: configService(db),
    prompts: promptService(db, search),
    issues: issueService(db, search),
    documents: documentService(db, search),
    tests: testRecordService(db),
    relations: relationService(db),
    db,
  };
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.get('/api/terminal/status', (_req, res) =>
    res.json({ success: true, data: { enabled: process.env.TERMINAL_ENABLED !== 'false' } }),
  );
  app.use('/api/projects', projectRoutes(services));
  app.use('/api/projects', testRoutes(services));
  app.use('/api/projects', projectRelationRoutes(services));
  app.use('/api/tasks', taskRoutes(services));
  app.use('/api/prompts', promptRoutes(services));
  app.use('/api/issues', issueRoutes(services));
  app.use('/api/documents', documentRoutes(services));
  app.use('/api/search', searchRoutes(search));
  app.use('/api/tests', testRecordRoutes(services));
  app.use('/api/relations', relationRoutes(services));
  app.use('/api/dashboard', dashboardRoutes(db));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
const db = knex(config);
if (process.env.NODE_ENV !== 'test') {
  const search = searchService(db);
  const app = createApp(db, search);
  const server = http.createServer(app);
  attachTerminal(server, db);
  const port = Number(process.env.PORT || 3001);
  db.migrate
    .latest()
    .then(() => search.reindex())
    .then(() => server.listen(port, () => console.log(`DevTracker server listening on ${port}`)))
    .catch((error) => {
      console.error('Failed to start server', error);
      process.exitCode = 1;
    });
}
export { db };
