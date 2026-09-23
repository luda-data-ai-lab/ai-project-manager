import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { serviceStatusService } from '../services/serviceStatusService.js';

export function serviceRoutes(db) {
  return Router().get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ success: true, data: await serviceStatusService(db) });
    }),
  );
}
