import { makeId, nullable, now, pick, serializeMemo } from './helpers.js';
const memoColumns = ['last_work', 'blocker', 'next_work', 'open_files', 'reference'];
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
    const values = pick(input, memoColumns);
    const memo = {
      id: makeId(),
      project_id,
      recorded_at: now(),
      ...values,
      last_work: input.last_work,
      blocker: nullable(input.blocker || null),
      next_work: nullable(input.next_work || null),
      open_files: JSON.stringify(input.open_files || []),
      reference: nullable(input.reference || null),
    };
    await db('pause_resume_memos').insert(memo);
    return serializeMemo(memo);
  };
  return { list, latest, create };
}
