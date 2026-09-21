import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateTask } from '../middleware/validate.js';
export function taskRoutes({ tasks }) {
  const router = Router();
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const error = validateTask(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      const data = await tasks.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ success: false, error: '작업을 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await tasks.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '작업을 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
