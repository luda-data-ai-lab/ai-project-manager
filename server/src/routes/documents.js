import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateDocument } from '../middleware/validate.js';

export function documentRoutes({ documents }) {
  const router = Router();
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const data = await documents.get(req.params.id);
      if (!data) return res.status(404).json({ success: false, error: '문서를 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const error = validateDocument(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      const data = await documents.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ success: false, error: '문서를 찾을 수 없습니다.' });
      res.json({ success: true, data });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await documents.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '문서를 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
