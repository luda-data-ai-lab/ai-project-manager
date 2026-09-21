import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateIssue } from '../middleware/validate.js';

export function issueRoutes({ issues }) {
  const router = Router();
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const error = validateIssue(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      const data = await issues.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ success: false, error: '이슈를 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await issues.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '이슈를 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
