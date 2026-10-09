import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { isLocalRequest } from '../terminal.js';
import { processManager } from '../services/processManager.js';
import { serviceStatusService } from '../services/serviceStatusService.js';

const localOnly = (request, response) => {
  if (isLocalRequest(request)) return true;
  response.status(403).json({ success: false, error: '로컬에서만 사용할 수 있습니다.' });
  return false;
};

export function serviceRoutes(db) {
  const manager = processManager();
  const ensureProject = async (request, response) => {
    const project = await db('projects').where({ id: request.params.pid }).first();
    if (!project) {
      response.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      return false;
    }
    return true;
  };
  const router = Router();
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ success: true, data: await serviceStatusService(db) });
    }),
  );
  router.post(
    '/:pid/start',
    asyncHandler(async (req, res) => {
      if (!localOnly(req, res) || !(await ensureProject(req, res))) return;
      const environment = await db('environment_configs')
        .where({ project_id: req.params.pid })
        .first();
      try {
        manager.start(req.params.pid, {
          command: environment?.run_command,
          cwd: environment?.source_folder,
        });
        res.json({ success: true, data: manager.get(req.params.pid) });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    }),
  );
  router.post(
    '/:pid/stop',
    asyncHandler(async (req, res) => {
      if (!localOnly(req, res) || !(await ensureProject(req, res))) return;
      try {
        await manager.stop(req.params.pid);
        res.json({ success: true, data: manager.get(req.params.pid) });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    }),
  );
  router.get(
    '/:pid/logs',
    asyncHandler(async (req, res) => {
      if (!localOnly(req, res) || !(await ensureProject(req, res))) return;
      const status = manager.get(req.params.pid);
      res.json({
        success: true,
        data: { lines: manager.logs(req.params.pid), ...(status || {}) },
      });
    }),
  );
  return router;
}
