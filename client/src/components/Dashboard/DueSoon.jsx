import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../common';
export default function DueSoon({ projects }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-amber-700">마감 임박</h2>
      {projects.length ? (
        projects.map((project) => (
          <Link
            to={`/projects/${project.id}`}
            key={project.id}
            className="mb-3 flex justify-between rounded-lg bg-amber-50 p-3 text-sm"
          >
            <span>{project.name}</span>
            <b>D-{project.days_left}</b>
          </Link>
        ))
      ) : (
        <EmptyState>마감 임박 프로젝트가 없습니다.</EmptyState>
      )}
    </Card>
  );
}
