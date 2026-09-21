import { Trash2 } from 'lucide-react';
import { Card } from '../common';
import { taskStatusLabels } from '../../utils/labels';
export default function TaskCard({ task, onStatus, onDelete }) {
  return (
    <Card className="mb-2 p-3">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-slate-500">{task.description}</p>}
      <div className="mt-3 flex gap-1">
        <select
          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
          value={task.status}
          onChange={(event) => onStatus(task, event.target.value)}
        >
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="p-1 text-slate-400 hover:text-red-600" onClick={() => onDelete(task)}>
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}
