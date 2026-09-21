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
  const [tasks, memos, projects, calendarProjects, calendarTasks] = await Promise.all([
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
    db('projects').where((query) => {
      query.whereNotNull('start_date').orWhereNotNull('target_date');
    }),
    db('tasks')
      .join('projects', 'tasks.project_id', 'projects.id')
      .whereNotNull('tasks.due_date')
      .whereNot('tasks.status', 'done')
      .select(
        'tasks.due_date',
        'tasks.id as task_id',
        'tasks.title as task_title',
        'tasks.status',
        'tasks.project_id',
        'projects.name as project_name',
      ),
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
  const calendar = [
    ...calendarProjects
      .flatMap((project) => [
        project.start_date && {
          date: project.start_date.slice(0, 10),
          type: 'start',
          project_id: project.id,
          project_name: project.name,
          status: project.status,
        },
        project.target_date && {
          date: project.target_date.slice(0, 10),
          type: 'target',
          project_id: project.id,
          project_name: project.name,
          status: project.status,
        },
      ])
      .filter(Boolean),
    ...calendarTasks.map((task) => ({
      date: task.due_date.slice(0, 10),
      type: 'task_due',
      project_id: task.project_id,
      project_name: task.project_name,
      task_id: task.task_id,
      task_title: task.task_title,
      status: task.status,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return { active_projects, next_tasks, blocked_tasks, recent_changes, due_soon, calendar };
}
