import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function testRecordRoutes({ tests }) {
  return Router().delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await tests.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '테스트 기록을 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
}
