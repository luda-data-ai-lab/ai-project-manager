import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, mutate } from '../utils/api';
import { Button, EmptyState, Spinner } from '../components/common';
import ProjectBadges from '../components/Project/ProjectBadges';
import ProjectForm from '../components/Project/ProjectForm';
import OverviewTab from '../components/Project/OverviewTab';
import SettingsTab from '../components/Project/SettingsTab';
import TaskBoard from '../components/Task/TaskBoard';
import TaskForm from '../components/Task/TaskForm';
import TerminalTab from '../components/Project/TerminalTab';
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(false);
  const load = () => {
    setError(null);
    return api(`/projects/${id}`)
      .then(setData)
      .catch((loadError) => {
        toast.error(loadError.message);
        setError(loadError.message);
      });
  };
  useEffect(() => {
    load();
  }, [id]);
  if (error && !data) {
    return (
      <EmptyState>
        <p>{error}</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          프로젝트 목록으로
        </Button>
      </EmptyState>
    );
  }
  if (!data) return <Spinner />;
  const updateTask = async (task, status) => {
    await mutate(
      `/tasks/${task.id}`,
      { method: 'PUT', body: JSON.stringify({ status }) },
      '작업 상태를 변경했습니다.',
    );
    load();
  };
  const addTask = async (values) => {
    await mutate(
      `/projects/${id}/tasks`,
      { method: 'POST', body: JSON.stringify(values) },
      '작업을 추가했습니다.',
    );
    load();
  };
  const deleteTask = async (task) => {
    await mutate(`/tasks/${task.id}`, { method: 'DELETE' }, '작업을 삭제했습니다.');
    load();
  };
  const remove = async () => {
    if (confirm('프로젝트를 삭제하시겠습니까?')) {
      await mutate(`/projects/${id}`, { method: 'DELETE' }, '프로젝트를 삭제했습니다.');
      navigate('/projects');
    }
  };
  const tabs = [
    ['overview', '개요'],
    ['tasks', '작업'],
    ['terminal', '터미널'],
    ['prompts', '프롬프트'],
    ['documents', '문서'],
    ['issues', '이슈'],
    ['settings', '설정'],
  ];
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="text-sm text-slate-500">
            ← 프로젝트
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
          <div className="mt-2">
            <ProjectBadges {...data} />
          </div>
          <p className="mt-3 text-sm text-slate-500">{data.purpose}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEdit(true)}>
            수정
          </Button>
          <Button variant="danger" onClick={remove}>
            <Trash2 size={16} className="mr-1 inline" />
            삭제
          </Button>
        </div>
      </div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([key, label]) => (
          <button
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab data={data} onRefresh={load} />}
      {tab === 'tasks' && (
        <>
          <TaskForm onSubmit={addTask} />
          <TaskBoard tasks={data.tasks} onStatus={updateTask} onDelete={deleteTask} />
        </>
      )}
      {tab === 'terminal' && <TerminalTab projectId={id} env={data.env} />}
      {tab === 'settings' && <SettingsTab id={id} data={data} onSaved={load} />}
      {['prompts', 'documents', 'issues'].includes(tab) && (
        <EmptyState>Phase 2에서 제공됩니다.</EmptyState>
      )}
      {edit && <ProjectForm initial={data} onClose={() => setEdit(false)} onSaved={load} />}
    </>
  );
}
