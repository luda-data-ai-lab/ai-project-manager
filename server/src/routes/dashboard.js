import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
export function dashboardRoutes(db) {
  return Router().get(
    '/',
    asyncHandler(async (_req, res) => {
      const { dashboardService } = await import('../services/dashboardService.js');
      res.json({ success: true, data: await dashboardService(db) });
    }),
  );
}
