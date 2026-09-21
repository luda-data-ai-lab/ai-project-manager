import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function searchRoutes(searchService) {
  return Router().get(
    '/',
    asyncHandler(async (req, res) => {
      if (!req.query.q?.trim())
        return res.status(400).json({ success: false, error: '검색어는 필수입니다.' });
      const data = await searchService.search({
        q: req.query.q,
        type: req.query.type,
        project: req.query.project,
      });
      res.json({ success: true, data });
    }),
  );
}
