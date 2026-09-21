import { makeId, nullable, now, pick, serializeProject } from './helpers.js';

const projectColumns = [
  'name',
  'purpose',
  'status',
  'priority',
  'start_date',
  'target_date',
  'tags',
];
const normalize = (input) => {
  const values = pick(input, projectColumns);
  for (const column of ['purpose', 'start_date', 'target_date']) {
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  }
  if (Object.prototype.hasOwnProperty.call(values, 'tags'))
    values.tags = JSON.stringify(values.tags || []);
  return values;
};

export function projectService(db, search) {
  const create = async (input) => {
    const time = now();
    const project = {
      id: makeId(),
      created_at: time,
      updated_at: time,
      ...normalize(input),
      status: input.status || 'planning',
      priority: input.priority || 'medium',
      tags: JSON.stringify(input.tags || []),
    };
    await db('projects').insert(project);
    await search?.index('project', project);
    return serializeProject(project);
  };
  const list = async (filters = {}) => {
    const query = db('projects').select('*').orderBy('updated_at', 'desc');
    if (filters.status) query.where('status', filters.status);
    if (filters.priority) query.where('priority', filters.priority);
    if (filters.q)
      query.where((builder) =>
        builder.whereLike('name', `%${filters.q}%`).orWhereLike('purpose', `%${filters.q}%`),
      );
    return (await query).map(serializeProject);
  };
  const get = async (id) => {
    const project = await db('projects').where({ id }).first();
    if (!project) return null;
    const [tasks, latest_memo, env, git] = await Promise.all([
      db('tasks').where({ project_id: id }).orderBy('sort_order').orderBy('created_at'),
      db('pause_resume_memos').where({ project_id: id }).orderBy('recorded_at', 'desc').first(),
      db('environment_configs').where({ project_id: id }).first(),
      db('git_infos').where({ project_id: id }).first(),
    ]);
    return {
      ...serializeProject(project),
      tasks,
      latest_memo: latest_memo
        ? { ...latest_memo, open_files: JSON.parse(latest_memo.open_files || '[]') }
        : null,
      env: env || null,
      git: git || null,
      counts: { tasks: tasks.length, done: tasks.filter((task) => task.status === 'done').length },
    };
  };
  const update = async (id, input) => {
    const values = { ...normalize(input), updated_at: now() };
    const changed = await db('projects').where({ id }).update(values);
    if (!changed) return null;
    const project = await db('projects').where({ id }).first();
    await search?.index('project', project);
    return get(id);
  };
  const remove = async (id) => {
    await search?.removeProject(id);
    return db('projects').where({ id }).del();
  };
  return { create, list, get, update, remove };
}
