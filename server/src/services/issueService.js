import { makeId, nullable, now, pick } from './helpers.js';

const columns = [
  'title',
  'description',
  'type',
  'status',
  'priority',
  'assignee',
  'linked_task_id',
];

const normalize = (input) => {
  const values = pick(input, columns);
  for (const column of ['description', 'assignee', 'linked_task_id'])
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  return values;
};

export function issueService(db) {
  const list = (project_id, filters = {}) => {
    const query = db('issues')
      .leftJoin('tasks', 'issues.linked_task_id', 'tasks.id')
      .where('issues.project_id', project_id)
      .select('issues.*', 'tasks.title as linked_task_title')
      .orderBy('issues.updated_at', 'desc');
    if (filters.status) query.where('issues.status', filters.status);
    if (filters.type) query.where('issues.type', filters.type);
    return query;
  };
  const create = async (project_id, input) => {
    const time = now();
    const issue = {
      id: makeId(),
      project_id,
      created_at: time,
      updated_at: time,
      ...normalize(input),
      title: input.title,
      type: input.type || 'bug',
      status: input.status || 'open',
      priority: input.priority || 'normal',
      assignee: input.assignee || 'self',
    };
    await db('issues').insert(issue);
    return issue;
  };
  const update = async (id, input) => {
    const values = { ...normalize(input), updated_at: now() };
    const changed = await db('issues').where({ id }).update(values);
    return changed ? db('issues').where({ id }).first() : null;
  };
  const remove = (id) => db('issues').where({ id }).del();
  return { list, create, update, remove };
}
