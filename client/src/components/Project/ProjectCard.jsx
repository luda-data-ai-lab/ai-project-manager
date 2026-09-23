import { Link } from 'react-router-dom';
import { Card } from '../common';
import ProjectBadges from './ProjectBadges';
import { formatProjectSchedule } from '../../utils/date';
export default function ProjectCard({ project }) {
  const dday = formatProjectSchedule(project);
  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-2">
          <ProjectBadges {...project} />
          {project.group_name && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {project.group_name}
            </span>
          )}
        </div>
        <h2 className="mt-4 text-lg font-bold">{project.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{project.purpose}</p>
        <div className="mt-5 flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span className="text-xs text-slate-400" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
        {project.target_date && (
          <p
            className={`mt-4 text-xs ${dday.startsWith('D+') ? 'font-medium text-red-600' : 'text-slate-500'}`}
          >
            {project.target_date} · {dday}
          </p>
        )}
      </Card>
    </Link>
  );
}
