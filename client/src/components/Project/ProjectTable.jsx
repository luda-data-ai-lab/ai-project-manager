import { Link } from 'react-router-dom';
import ProjectBadges from './ProjectBadges';
import { formatProjectSchedule } from '../../utils/date';
export default function ProjectTable({ projects }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
          <tr>
            {['이름', '그룹', '상태', '우선순위', '목표일', '일정', '태그'].map((title) => (
              <th className="px-4 py-3 font-medium" key={title}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const dday = formatProjectSchedule(project);
            return (
              <tr className="border-b border-slate-100 last:border-0" key={project.id}>
                <td className="px-4 py-4 font-medium">
                  <Link to={`/projects/${project.id}`} className="hover:text-blue-600">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-4">{project.group_name || '-'}</td>
                <td className="px-4 py-4">
                  <ProjectBadges status={project.status} priority={project.priority} />
                </td>
                <td className="px-4 py-4">{project.priority}</td>
                <td className="px-4 py-4">{project.target_date || '-'}</td>
                <td
                  className={`px-4 py-4 ${dday.startsWith('D+') ? 'font-medium text-red-600' : ''}`}
                >
                  {dday || '-'}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {project.tags.join(', ') || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
