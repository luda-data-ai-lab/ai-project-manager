import { randomBytes } from 'node:crypto';

export const makeId = () => randomBytes(8).toString('hex');
export const now = () => new Date().toISOString();
export const parseJson = (value, fallback = []) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
export const serializeProject = (project) => ({ ...project, tags: parseJson(project.tags) });
export const serializeMemo = (memo) => ({ ...memo, open_files: parseJson(memo.open_files) });
