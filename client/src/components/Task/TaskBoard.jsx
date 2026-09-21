import { Card } from '../common';
import { taskStatusLabels } from '../../utils/labels';
import TaskCard from './TaskCard';
export default function TaskBoard({ tasks, onStatus, onDelete }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {Object.entries(taskStatusLabels).map(([status, label]) => (
        <div key={status} className="rounded-xl bg-slate-100 p-3">
          <h3 className="mb-3 text-sm font-semibold">{label}</h3>
          {tasks
            .filter((task) => task.status === status)
            .map((task) => (
              <TaskCard key={task.id} task={task} onStatus={onStatus} onDelete={onDelete} />
            ))}
          {!tasks.some((task) => task.status === status) && (
            <Card className="p-3 text-xs text-slate-400">작업 없음</Card>
          )}
        </div>
      ))}
    </div>
  );
}
