import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { costService } from './services/costService.js';
import { roiService } from './services/roiService.js';
import { exportService } from './services/exportService.js';
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
import { costRoutes } from './routes/costs.js';
import { roiRoutes } from './routes/roi.js';
import { exportRoutes, importRoutes } from './routes/export.js';
import { serviceRoutes } from './routes/services.js';

export function createApp(db, search = searchService(db), { clientDist } = {}) {
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
    costs: costService(db),
    roi: roiService(db),
    exporter: exportService(db, search),
    db,
  };
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '20mb' }));
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
  app.use('/api/costs', costRoutes(services));
  app.use('/api/roi', roiRoutes(services));
  app.use('/api/export', exportRoutes(services));
  app.use('/api/import', importRoutes(services));
  app.use('/api/dashboard', dashboardRoutes(db));
  app.use('/api/services', serviceRoutes(db));
  if (clientDist) {
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      const staticFiles = express.static(clientDist);
      app.use((request, response, next) => {
        if (request.path === '/api' || request.path.startsWith('/api/')) return next();
        return staticFiles(request, response, next);
      });
      app.get(/^\/(?!api(?:\/|$)).*/, (_request, response) => response.sendFile(indexPath));
    }
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
const db = knex(config);
if (process.env.NODE_ENV !== 'test') {
  const search = searchService(db);
  const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const app = createApp(
    db,
    search,
    process.env.NODE_ENV === 'production'
      ? { clientDist: path.resolve(serverDirectory, '../client/dist') }
      : {},
  );
  const server = http.createServer(app);
  attachTerminal(server, db);
  const port = Number(process.env.PORT || 3001);
  db.migrate
    .latest()
    .then(() => search.reindex())
    .then(() =>
      server.listen(port, process.env.HOST || undefined, () =>
        console.log(`AI DevTracker server listening on ${port}`),
      ),
    )
    .catch((error) => {
      console.error('Failed to start server', error);
      process.exitCode = 1;
    });
}
export { db };
