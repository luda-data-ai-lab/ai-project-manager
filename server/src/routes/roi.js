import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateRoiItem } from '../middleware/validate.js';

const ensureProject = async (db, projectId) => {
  if (!projectId) return true;
  return Boolean(await db('projects').where({ id: projectId }).first());
};

export function roiRoutes({ roi, db }) {
  const router = Router();
  router.get(
    '/summary',
    asyncHandler(async (req, res) => {
      let years = 3;
      if (req.query.years !== undefined) {
        years = Number(req.query.years);
        if (!Number.isInteger(years) || years < 1 || years > 10)
          return res.status(400).json({ success: false, error: '기간은 1~10년이어야 합니다.' });
      }
      res.json({ success: true, data: await roi.summary({ years }) });
    }),
  );
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ success: true, data: await roi.list() });
    }),
  );
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const error = validateRoiItem(req.body);
      if (error) return res.status(400).json({ success: false, error });
      if (!(await ensureProject(db, req.body.project_id)))
        return res.status(400).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.status(201).json({ success: true, data: await roi.create(req.body) });
    }),
  );
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const error = validateRoiItem(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      if (!(await ensureProject(db, req.body.project_id)))
        return res.status(400).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const data = await roi.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ success: false, error: 'ROI 항목을 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await roi.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: 'ROI 항목을 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
