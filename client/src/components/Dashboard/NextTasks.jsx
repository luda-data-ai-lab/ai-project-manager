import { Card, EmptyState } from '../common';
export default function NextTasks({ tasks }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">다음 할 일</h2>
      {tasks.length ? (
        tasks.map((task) => (
          <div key={task.id} className="mb-3">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-slate-500">{task.project_name}</p>
            {task.due_date && <p className="text-xs text-amber-600">마감 {task.due_date}</p>}
          </div>
        ))
      ) : (
        <EmptyState />
      )}
    </Card>
  );
}
