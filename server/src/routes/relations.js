import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateRelation } from '../middleware/validate.js';

const notFound = (res) =>
  res.status(400).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
const isDuplicate = (error) =>
  error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
  /UNIQUE constraint failed/i.test(error?.message || '');

export function projectRelationRoutes({ relations, db }) {
  const router = Router();
  router.get(
    '/:pid/relations',
    asyncHandler(async (req, res) => {
      if (!(await db('projects').where({ id: req.params.pid }).first())) return notFound(res);
      res.json({ success: true, data: await relations.listForProject(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/relations',
    asyncHandler(async (req, res) => {
      const source_id = req.params.pid;
      if (!(await db('projects').where({ id: source_id }).first())) return notFound(res);
      const validationError = validateRelation({ ...req.body, source_id });
      if (validationError === '프로젝트를 찾을 수 없습니다.')
        return res.status(400).json({ success: false, error: validationError });
      if (!(await db('projects').where({ id: req.body.target_id }).first())) return notFound(res);
      if (validationError) return res.status(400).json({ success: false, error: validationError });
      try {
        res.status(201).json({
          success: true,
          data: await relations.create({ ...req.body, source_id }),
        });
      } catch (createError) {
        if (isDuplicate(createError))
          return res.status(400).json({ success: false, error: '이미 존재하는 관계입니다.' });
        throw createError;
      }
    }),
  );
  return router;
}

export function relationRoutes({ relations }) {
  const router = Router();
  router.get(
    '/graph',
    asyncHandler(async (_req, res) => {
      res.json({ success: true, data: await relations.graph() });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const changed = await relations.remove(req.params.id);
      if (!changed)
        return res.status(404).json({ success: false, error: '관계를 찾을 수 없습니다.' });
      res.json({ success: true, data: null });
    }),
  );
  return router;
}
