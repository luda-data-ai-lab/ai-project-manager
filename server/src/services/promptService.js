import { makeId, nullable, now, pick } from './helpers.js';

const columns = ['task_id', 'tool', 'prompt_text', 'result_summary', 'commit_hash', 'used_at'];

export function promptService(db) {
  const list = (project_id) =>
    db('prompt_logs')
      .leftJoin('tasks', 'prompt_logs.task_id', 'tasks.id')
      .where('prompt_logs.project_id', project_id)
      .select('prompt_logs.*', 'tasks.title as task_title')
      .orderBy('prompt_logs.used_at', 'desc');
  const create = async (project_id, input) => {
    const values = pick(input, columns);
    const prompt = {
      id: makeId(),
      project_id,
      task_id: nullable(values.task_id || null),
      tool: input.tool || 'devin',
      prompt_text: input.prompt_text,
      result_summary: nullable(values.result_summary || null),
      commit_hash: nullable(values.commit_hash || null),
      used_at: input.used_at || now(),
    };
    await db('prompt_logs').insert(prompt);
    return { ...prompt, task_title: null };
  };
  const remove = (id) => db('prompt_logs').where({ id }).del();
  return { list, create, remove };
}
