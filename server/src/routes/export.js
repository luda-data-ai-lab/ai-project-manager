import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

const dateStamp = () => new Date().toISOString().slice(0, 10).replaceAll('-', '');
const attachment = (res, filename, contentType) => {
  const fallback = /^[\x20-\x7e]+$/.test(filename) ? filename : 'download';
  return res
    .type(contentType)
    .set(
      'Content-Disposition',
      `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
};

const projectSlug = (project) =>
  project.name
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || project.id;

export function exportRoutes({ exporter, projects }) {
  const router = Router();
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const data = await exporter.exportAll();
      attachment(res, `devtracker-export-${dateStamp()}.json`, 'application/json').send(data);
    }),
  );
  router.get(
    '/projects/:pid',
    asyncHandler(async (req, res) => {
      const data = await exporter.exportProject(req.params.pid);
      if (!data)
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      attachment(res, `devtracker-export-${dateStamp()}.json`, 'application/json').send(data);
    }),
  );
  router.get(
    '/projects/:pid/markdown',
    asyncHandler(async (req, res) => {
      const project = await projects.get(req.params.pid);
      if (!project)
        return res.status(404).json({ success: false, error: '프로젝트를 찾을 수 없습니다.' });
      const content = await exporter.exportMarkdown(req.params.pid);
      attachment(res, `${projectSlug(project)}.md`, 'text/markdown; charset=utf-8').send(content);
    }),
  );
  return router;
}

export function importRoutes({ exporter }) {
  return Router().post(
    '/',
    asyncHandler(async (req, res) => {
      const mode = req.query.mode || 'merge';
      if (!['merge', 'replace'].includes(mode))
        return res
          .status(400)
          .json({ success: false, error: '가져오기 모드가 올바르지 않습니다.' });
      const counts = await exporter.importData(req.body, { mode });
      res.json({ success: true, data: { counts } });
    }),
  );
}
