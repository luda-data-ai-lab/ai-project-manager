import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState } from '../common';
import { badgeColors, projectStatusLabels } from '../../utils/labels';
export default function ActiveProjects({ projects }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">진행 중 프로젝트</h2>
      {projects.length ? (
        projects.map((project) => (
          <Link
            to={`/projects/${project.id}`}
            key={project.id}
            className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"
          >
            <span className="font-medium">{project.name}</span>
            <Badge
              label={projectStatusLabels[project.status]}
              color={badgeColors[project.status]}
            />
          </Link>
        ))
      ) : (
        <EmptyState>진행 중인 프로젝트가 없습니다.</EmptyState>
      )}
    </Card>
  );
}
