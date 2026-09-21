import { Badge } from '../common';
import { badgeColors, priorityLabels, projectStatusLabels } from '../../utils/labels';
export default function ProjectBadges({ status, priority }) {
  return (
    <div className="flex gap-2">
      <Badge label={projectStatusLabels[status]} color={badgeColors[status]} />
      <Badge label={`우선순위 ${priorityLabels[priority]}`} color={badgeColors[priority]} />
    </div>
  );
}
