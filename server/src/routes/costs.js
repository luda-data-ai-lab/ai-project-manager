import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateCost } from '../middleware/validate.js';

const ensureProject = async (db, projectId) => {
  if (!projectId) return true;
  return Boolean(await db('projects').where({ id: projectId }).first());
};

export function costRoutes({ costs, db }) {
  const router = Router();
  router.get(
    '/summary',
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: await costs.summary(req.query) });
    }),
  );
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: await costs.list(req.query) });
    }),
  );
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const error = validateCost(req.body);
      if (error) return res.status(400).json({ success: false, error });
      if (!(await ensureProject(db, req.body.project_id)))
        return res.status(400).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.status(201).json({ success: true, data: await costs.create(req.body) });
    }),
  );
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const error = validateCost(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      if (!(await ensureProject(db, req.body.project_id)))
        return res.status(400).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const data = await costs.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ success: false, error: '비용 기록을 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await costs.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '비용 기록을 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
