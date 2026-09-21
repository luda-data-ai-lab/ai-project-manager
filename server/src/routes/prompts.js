import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function promptRoutes({ prompts }) {
  const router = Router();
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await prompts.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '프롬프트를 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
