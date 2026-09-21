import { makeId, nullable, now, pick } from './helpers.js';

const taskColumns = ['title', 'description', 'status', 'assignee', 'sort_order', 'due_date'];

export function taskService(db, search) {
  const list = (project_id) =>
    db('tasks').where({ project_id }).orderBy('sort_order').orderBy('created_at');
  const create = async (project_id, input) => {
    const time = now();
    const task = {
      id: makeId(),
      project_id,
      created_at: time,
      updated_at: time,
      ...pick(input, taskColumns),
      title: input.title,
      description: nullable(input.description || null),
      due_date: nullable(input.due_date || null),
      status: input.status || 'todo',
      assignee: input.assignee || 'self',
      sort_order: input.sort_order ?? 0,
    };
    await db('tasks').insert(task);
    await search?.index('task', task);
    return task;
  };
  const update = async (id, input) => {
    const values = pick(input, taskColumns);
    if (Object.prototype.hasOwnProperty.call(values, 'description'))
      values.description = nullable(values.description);
    if (Object.prototype.hasOwnProperty.call(values, 'due_date'))
      values.due_date = nullable(values.due_date);
    values.updated_at = now();
    const changed = await db('tasks').where({ id }).update(values);
    if (!changed) return null;
    const task = await db('tasks').where({ id }).first();
    await search?.index('task', task);
    return task;
  };
  const remove = async (id) => {
    const task = await db('tasks').where({ id }).first();
    const changed = await db('tasks').where({ id }).del();
    if (changed && task) await search?.remove('task', id);
    return changed;
  };
  return { list, create, update, remove };
}
