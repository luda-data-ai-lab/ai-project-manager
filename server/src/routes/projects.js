import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  validateConfig,
  validateDocument,
  validateIssue,
  validateMemo,
  validatePrompt,
  validateProject,
  validateTask,
} from '../middleware/validate.js';

export function projectRoutes({ projects, tasks, memos, configs, prompts, issues, documents, db }) {
  const router = Router();
  const ensureProject = async (request, response) => {
    const project = await projects.get(request.params.id);
    if (!project) {
      response.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      return null;
    }
    return project;
  };
  router.get(
    '/',
    asyncHandler(async (req, res) =>
      res.json({ success: true, data: await projects.list(req.query) }),
    ),
  );
  router.get(
    '/groups',
    asyncHandler(async (_req, res) => res.json({ success: true, data: await projects.groups() })),
  );
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const error = validateProject(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res.status(201).json({ success: true, data: await projects.create(req.body) });
    }),
  );
  router.get(
    '/:pid/prompts',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await prompts.list(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/prompts',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validatePrompt(req.body);
      if (error) return res.status(400).json({ success: false, error });
      if (req.body.task_id) {
        const task = await db('tasks')
          .where({ id: req.body.task_id, project_id: req.params.pid })
          .first();
        if (!task)
          return res.status(400).json({ success: false, error: '연결할 작업을 찾을 수 없습니다.' });
      }
      res.status(201).json({ success: true, data: await prompts.create(req.params.pid, req.body) });
    }),
  );
  router.get(
    '/:pid/issues',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await issues.list(req.params.pid, req.query) });
    }),
  );
  router.post(
    '/:pid/issues',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validateIssue(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res.status(201).json({ success: true, data: await issues.create(req.params.pid, req.body) });
    }),
  );
  router.get(
    '/:pid/documents',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await documents.list(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/documents',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validateDocument(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res
        .status(201)
        .json({ success: true, data: await documents.create(req.params.pid, req.body) });
    }),
  );
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const data = await ensureProject(req, res);
      if (data) res.json({ success: true, data });
    }),
  );
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      if (!(await ensureProject(req, res))) return;
      const error = validateProject(req.body, true);
      if (error) return res.status(400).json({ success: false, error });
      res.json({ success: true, data: await projects.update(req.params.id, req.body) });
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      if (!(await ensureProject(req, res))) return;
      await projects.remove(req.params.id);
      res.json({ success: true, data: null });
    }),
  );
  router.get(
    '/:pid/tasks',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await tasks.list(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/tasks',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validateTask(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res.status(201).json({ success: true, data: await tasks.create(req.params.pid, req.body) });
    }),
  );
  router.get(
    '/:pid/memos',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await memos.list(req.params.pid) });
    }),
  );
  router.get(
    '/:pid/memos/latest',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      res.json({ success: true, data: await memos.latest(req.params.pid) });
    }),
  );
  router.post(
    '/:pid/memos',
    asyncHandler(async (req, res) => {
      if (!(await projects.get(req.params.pid)))
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const error = validateMemo(req.body);
      if (error) return res.status(400).json({ success: false, error });
      res.status(201).json({ success: true, data: await memos.create(req.params.pid, req.body) });
    }),
  );
  for (const [name, service] of [
    ['env', configs.env],
    ['git', configs.git],
    ['deploy', configs.deploy],
  ]) {
    router.get(
      `/:pid/${name}`,
      asyncHandler(async (req, res) => {
        if (!(await projects.get(req.params.pid)))
          return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
        res.json({ success: true, data: (await service.get(req.params.pid)) || null });
      }),
    );
    router.put(
      `/:pid/${name}`,
      asyncHandler(async (req, res) => {
        if (!(await projects.get(req.params.pid)))
          return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
        const error = validateConfig(req.body);
        if (error) return res.status(400).json({ success: false, error });
        res.json({ success: true, data: await service.upsert(req.params.pid, req.body) });
      }),
    );
  }
  return router;
}
