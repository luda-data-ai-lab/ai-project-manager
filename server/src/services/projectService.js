import { makeId, now, serializeProject } from './helpers.js';

export function projectService(db) {
  const create = async (input) => {
    const time = now();
    const project = {
      id: makeId(),
      name: input.name,
      purpose: input.purpose || null,
      status: input.status || 'planning',
      priority: input.priority || 'medium',
      start_date: input.start_date || null,
      target_date: input.target_date || null,
      tags: JSON.stringify(input.tags || []),
      created_at: time,
      updated_at: time,
    };
    await db('projects').insert(project);
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
    const values = { ...input, updated_at: now() };
    if (values.tags) values.tags = JSON.stringify(values.tags);
    delete values.id;
    delete values.created_at;
    const changed = await db('projects').where({ id }).update(values);
    return changed ? get(id) : null;
  };
  const remove = async (id) => db('projects').where({ id }).del();
  return { create, list, get, update, remove };
}
