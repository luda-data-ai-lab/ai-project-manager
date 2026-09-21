import { useEffect, useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { inputClass } from '../utils/styles';
import { priorityLabels, projectStatusLabels } from '../utils/labels';
import { Button, EmptyState, PageHeader, Spinner } from '../components/common';
import ProjectCard from '../components/Project/ProjectCard';
import ProjectForm from '../components/Project/ProjectForm';
import ProjectTable from '../components/Project/ProjectTable';
export default function ProjectsPage() {
  const [projects, setProjects] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', q: '' });
  const [modal, setModal] = useState(false);
  const [view, setView] = useState('card');
  const load = () =>
    api(
      `/projects?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))}`,
    )
      .then(setProjects)
      .catch((error) => toast.error(error.message));
  useEffect(load, [filters.status, filters.priority, filters.q]);
  return (
    <>
      <PageHeader
        title="프로젝트"
        description="모든 프로젝트를 한 곳에서 관리하세요."
        action={
          <Button onClick={() => setModal(true)}>
            <Plus size={16} className="mr-1 inline" />새 프로젝트
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="프로젝트 검색"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <select
          className={`${inputClass} max-w-[150px]`}
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">모든 상태</option>
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} max-w-[150px]`}
          value={filters.priority}
          onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
        >
          <option value="">모든 우선순위</option>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            aria-label="카드 보기"
            className={`rounded p-1.5 ${view === 'card' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
            onClick={() => setView('card')}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label="목록 보기"
            className={`rounded p-1.5 ${view === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
            onClick={() => setView('table')}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {!projects ? (
        <Spinner />
      ) : projects.length ? (
        view === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard project={project} key={project.id} />
            ))}
          </div>
        ) : (
          <ProjectTable projects={projects} />
        )
      ) : (
        <EmptyState>등록된 프로젝트가 없습니다.</EmptyState>
      )}
      {modal && <ProjectForm onClose={() => setModal(false)} onSaved={load} />}
    </>
  );
}
