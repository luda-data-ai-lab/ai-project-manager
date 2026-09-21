import { makeId, now, serializeMemo } from './helpers.js';
export function memoService(db) {
  const list = async (project_id) =>
    (await db('pause_resume_memos').where({ project_id }).orderBy('recorded_at', 'desc')).map(
      serializeMemo,
    );
  const latest = async (project_id) => {
    const item = await db('pause_resume_memos')
      .where({ project_id })
      .orderBy('recorded_at', 'desc')
      .first();
    return item ? serializeMemo(item) : null;
  };
  const create = async (project_id, input) => {
    const memo = {
      id: makeId(),
      project_id,
      last_work: input.last_work,
      blocker: input.blocker || null,
      next_work: input.next_work || null,
      open_files: JSON.stringify(input.open_files || []),
      reference: input.reference || null,
      recorded_at: now(),
    };
    await db('pause_resume_memos').insert(memo);
    return serializeMemo(memo);
  };
  return { list, latest, create };
}
