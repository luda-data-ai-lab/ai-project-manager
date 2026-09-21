import { Card, EmptyState, Badge } from '../common';
import { badgeColors } from '../../utils/labels';
export default function BlockedTasks({ tasks }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">막힌 작업</h2>
      {tasks.length ? (
        tasks.map((task) => (
          <div key={task.id} className="mb-3">
            <div className="flex items-center gap-2">
              <Badge label="막힘" color={badgeColors.blocked} />
              <span className="text-sm font-medium">{task.title}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{task.project_name}</p>
          </div>
        ))
      ) : (
        <EmptyState>막힌 작업이 없습니다.</EmptyState>
      )}
    </Card>
  );
}
