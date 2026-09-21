import { makeId, now } from './helpers.js';

export function taskService(db) {
  const list = (project_id) =>
    db('tasks').where({ project_id }).orderBy('sort_order').orderBy('created_at');
  const create = async (project_id, input) => {
    const time = now();
    const task = {
      id: makeId(),
      project_id,
      title: input.title,
      description: input.description || null,
      status: input.status || 'todo',
      assignee: input.assignee || 'self',
      sort_order: input.sort_order ?? 0,
      created_at: time,
      updated_at: time,
    };
    await db('tasks').insert(task);
    return task;
  };
  const update = async (id, input) => {
    const values = { ...input, updated_at: now() };
    delete values.id;
    delete values.project_id;
    delete values.created_at;
    const changed = await db('tasks').where({ id }).update(values);
    return changed ? db('tasks').where({ id }).first() : null;
  };
  return { list, create, update, remove: (id) => db('tasks').where({ id }).del() };
}
