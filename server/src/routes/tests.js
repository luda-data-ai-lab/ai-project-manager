import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateTestRecord } from '../middleware/validate.js';

export function testRoutes({ projects, tests }) {
  const router = Router();
  router.get(
    '/:pid/tests',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await tests.list(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/tests',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validateTestRecord(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res.status(201).json({ success: true, data: await tests.create(req.params.pid, req.body) });
    }),
  );
  return router;
}
