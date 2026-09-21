import { now } from './helpers.js';
export async function dashboardService(db) {
  const current = now();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const active_projects = await db('projects')
    .whereIn('status', ['development', 'testing'])
    .orderBy('updated_at', 'desc');
  const todo = await db('tasks')
    .join('projects', 'tasks.project_id', 'projects.id')
    .where('tasks.status', 'todo')
    .select('tasks.*', 'projects.name as project_name')
    .orderBy('tasks.sort_order')
    .orderBy('tasks.created_at');
  const next_tasks = Object.values(
    todo.reduce((all, task) => {
      if (!all[task.project_id]) all[task.project_id] = task;
      return all;
    }, {}),
  );
  const blocked_tasks = await db('tasks')
    .join('projects', 'tasks.project_id', 'projects.id')
    .where('tasks.status', 'blocked')
    .select('tasks.*', 'projects.name as project_name')
    .orderBy('tasks.updated_at', 'desc');
  const [tasks, memos, projects] = await Promise.all([
    db('tasks')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('tasks.updated_at', '>=', since)
      .select(
        'tasks.project_id',
        'tasks.title',
        'tasks.updated_at as at',
        'projects.name as project_name',
      ),
    db('pause_resume_memos')
      .join('projects', 'pause_resume_memos.project_id', 'projects.id')
      .where('recorded_at', '>=', since)
      .select(
        'pause_resume_memos.project_id',
        'pause_resume_memos.last_work as title',
        'pause_resume_memos.recorded_at as at',
        'projects.name as project_name',
      ),
    db('projects')
      .where('updated_at', '>=', since)
      .select('id as project_id', 'name as project_name', 'name as title', 'updated_at as at'),
  ]);
  const recent_changes = [
    ...tasks.map((x) => ({ type: 'task', ...x })),
    ...memos.map((x) => ({ type: 'memo', ...x })),
    ...projects.map((x) => ({ type: 'project', ...x })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);
  const due_soon = (
    await db('projects').whereNotIn('status', ['completed', 'paused']).whereNotNull('target_date')
  )
    .filter((project) => {
      const days = Math.ceil((new Date(project.target_date) - new Date(current)) / 86400000);
      return days >= 0 && days <= 7;
    })
    .map((project) => ({
      ...project,
      days_left: Math.ceil((new Date(project.target_date) - new Date(current)) / 86400000),
    }));
  return { active_projects, next_tasks, blocked_tasks, recent_changes, due_soon };
}
