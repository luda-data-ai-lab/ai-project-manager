import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { BarChart3, FolderKanban, Menu, Plus, Search, Settings, Trash2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from './utils/api';
import { badgeColors, priorityLabels, projectStatusLabels, taskStatusLabels } from './utils/labels';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Spinner,
} from './components/common';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500';
const statusOptions = Object.entries(projectStatusLabels);
function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const links = [
    ['/', '대시보드', BarChart3],
    ['/projects', '프로젝트', FolderKanban],
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white p-5 transition md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-900">
            DevTracker
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400">
            <Search size={18} />
            검색 <span className="ml-auto text-[10px]">준비 중</span>
          </div>
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <Settings size={17} /> 개인 워크스페이스
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
function ProjectBadge({ status, priority }) {
  return (
    <div className="flex gap-2">
      <Badge label={projectStatusLabels[status]} color={badgeColors[status]} />
      <Badge label={`우선순위 ${priorityLabels[priority]}`} color={badgeColors[priority]} />
    </div>
  );
}
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((e) => toast.error(e.message));
  }, []);
  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader title="대시보드" description="지금 바로 필요한 개발 현황을 확인하세요." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 font-semibold">진행 중 프로젝트</h2>
          {data.active_projects.length ? (
            data.active_projects.map((p) => (
              <Link
                to={`/projects/${p.id}`}
                key={p.id}
                className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"
              >
                <span className="font-medium">{p.name}</span>
                <Badge label={projectStatusLabels[p.status]} color={badgeColors[p.status]} />
              </Link>
            ))
          ) : (
            <EmptyState>진행 중인 프로젝트가 없습니다.</EmptyState>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">다음 할 일</h2>
          {data.next_tasks.length ? (
            data.next_tasks.map((t) => (
              <div key={t.id} className="mb-3">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-slate-500">{t.project_name}</p>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">막힌 작업</h2>
          {data.blocked_tasks.length ? (
            data.blocked_tasks.map((t) => (
              <div key={t.id} className="mb-3">
                <div className="flex items-center gap-2">
                  <Badge label="막힘" color={badgeColors.blocked} />
                  <span className="text-sm font-medium">{t.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.project_name}</p>
              </div>
            ))
          ) : (
            <EmptyState>막힌 작업이 없습니다.</EmptyState>
          )}
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">최근 변경</h2>
          {data.recent_changes.length ? (
            data.recent_changes.map((item, i) => (
              <div
                key={`${item.type}-${item.at}-${i}`}
                className="flex gap-3 border-l-2 border-slate-200 pb-4 pl-4 text-sm"
              >
                <div>
                  <p>
                    <span className="font-medium">{item.project_name}</span> · {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(item.at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-amber-700">마감 임박</h2>
          {data.due_soon.length ? (
            data.due_soon.map((p) => (
              <Link
                to={`/projects/${p.id}`}
                key={p.id}
                className="mb-3 flex justify-between rounded-lg bg-amber-50 p-3 text-sm"
              >
                <span>{p.name}</span>
                <b>D-{p.days_left}</b>
              </Link>
            ))
          ) : (
            <EmptyState>마감 임박 프로젝트가 없습니다.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
function ProjectForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    target_date: '',
    ...initial,
    tags: initial?.tags?.join(', ') || '',
  });
  const save = async (event) => {
    event.preventDefault();
    try {
      const body = {
        ...form,
        tags: form.tags
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      };
      const data = initial
        ? await api(`/projects/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/projects', { method: 'POST', body: JSON.stringify(body) });
      toast.success('저장했습니다.');
      onSaved(data);
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <Modal title={initial ? '프로젝트 수정' : '새 프로젝트'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="프로젝트 이름">
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="목적">
          <textarea
            className={inputClass}
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="상태">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statusOptions.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="우선순위">
            <select
              className={inputClass}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {Object.entries(priorityLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일">
            <input
              type="date"
              className={inputClass}
              value={form.start_date || ''}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </Field>
          <Field label="목표일">
            <input
              type="date"
              className={inputClass}
              value={form.target_date || ''}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </Field>
        </div>
        <Field label="태그 (쉼표로 구분)">
          <input
            className={inputClass}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </Field>
        <Button className="w-full">{initial ? '수정 저장' : '프로젝트 만들기'}</Button>
      </form>
    </Modal>
  );
}
function Projects() {
  const [projects, setProjects] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', q: '' });
  const [modal, setModal] = useState(false);
  const load = () =>
    api(
      `/projects?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))}`,
    )
      .then(setProjects)
      .catch((e) => toast.error(e.message));
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
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="프로젝트 검색"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select
          className={inputClass + ' max-w-[150px]'}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">모든 상태</option>
          {statusOptions.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className={inputClass + ' max-w-[150px]'}
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">모든 우선순위</option>
          {Object.entries(priorityLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {!projects ? (
        <Spinner />
      ) : projects.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <ProjectBadge {...project} />
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
                  <p className="mt-4 text-xs text-slate-500">목표일 {project.target_date}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState>등록된 프로젝트가 없습니다.</EmptyState>
      )}
      {modal && <ProjectForm onClose={() => setModal(false)} onSaved={() => load()} />}
    </>
  );
}
function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(false);
  const load = () =>
    api(`/projects/${id}`)
      .then(setData)
      .catch((e) => toast.error(e.message));
  useEffect(load, [id]);
  if (!data) return <Spinner />;
  const updateTask = async (task, status) => {
    await api(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };
  const addTask = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    if (!title) return;
    await api(`/projects/${id}/tasks`, { method: 'POST', body: JSON.stringify({ title }) });
    e.target.reset();
    load();
  };
  const addMemo = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await api(`/projects/${id}/memos`, {
      method: 'POST',
      body: JSON.stringify({
        last_work: form.get('last_work'),
        blocker: form.get('blocker'),
        next_work: form.get('next_work'),
      }),
    });
    e.target.reset();
    load();
  };
  const remove = async () => {
    if (confirm('프로젝트를 삭제하시겠습니까?')) {
      await api(`/projects/${id}`, { method: 'DELETE' });
      navigate('/projects');
    }
  };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="text-sm text-slate-500">
            ← 프로젝트
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
          <div className="mt-2">
            <ProjectBadge {...data} />
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
        {[
          ['overview', '개요'],
          ['tasks', '작업'],
          ['prompts', '프롬프트'],
          ['documents', '문서'],
          ['issues', '이슈'],
          ['settings', '설정'],
        ].map(([key, label]) => (
          <button
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview data={data} onMemo={addMemo} />}
      {tab === 'tasks' && (
        <Tasks
          data={data}
          onTask={updateTask}
          onAdd={addTask}
          onDelete={async (task) => {
            await api(`/tasks/${task.id}`, { method: 'DELETE' });
            load();
          }}
        />
      )}
      {tab === 'settings' && <SettingsTab id={id} data={data} onSaved={load} />}
      {['prompts', 'documents', 'issues'].includes(tab) && (
        <EmptyState>Phase 2에서 제공됩니다.</EmptyState>
      )}
      {edit && <ProjectForm initial={data} onClose={() => setEdit(false)} onSaved={() => load()} />}
    </>
  );
}
function Overview({ data, onMemo }) {
  const [memos, setMemos] = useState([]);
  useEffect(() => {
    api(`/projects/${data.id}/memos`).then(setMemos);
  }, [data.id]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-semibold">프로젝트 정보</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">시작일</dt>
            <dd>{data.start_date || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">목표일</dt>
            <dd>{data.target_date || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">작업</dt>
            <dd>
              {data.counts.done} / {data.counts.tasks} 완료
            </dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">중단 메모 작성</h2>
        <form onSubmit={onMemo} className="space-y-3">
          <input name="last_work" required placeholder="마지막 작업" className={inputClass} />
          <input name="blocker" placeholder="막힌 부분" className={inputClass} />
          <input name="next_work" placeholder="다음 작업" className={inputClass} />
          <Button>메모 저장</Button>
        </form>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="mb-4 font-semibold">메모 기록</h2>
        {memos.length ? (
          memos.map((memo) => (
            <div
              className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
              key={memo.id}
            >
              <p className="mb-2 text-xs text-slate-400">
                {new Date(memo.recorded_at).toLocaleString('ko-KR')}
              </p>
              <p>
                <b>마지막 작업:</b> {memo.last_work}
              </p>
              <p>
                <b>막힌 부분:</b> {memo.blocker || '-'}
              </p>
              <p>
                <b>다음 작업:</b> {memo.next_work || '-'}
              </p>
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </Card>
    </div>
  );
}
function Tasks({ data, onTask, onAdd, onDelete }) {
  return (
    <>
      <form onSubmit={onAdd} className="mb-5 flex gap-2">
        <input name="title" placeholder="새 작업 제목" className={inputClass} />
        <Button>
          <Plus size={16} className="mr-1 inline" />
          작업 추가
        </Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-4">
        {Object.entries(taskStatusLabels).map(([status, label]) => (
          <div key={status} className="rounded-xl bg-slate-100 p-3">
            <h3 className="mb-3 text-sm font-semibold">{label}</h3>
            {data.tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <Card key={task.id} className="mb-2 p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                  )}
                  <div className="mt-3 flex gap-1">
                    <select
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={task.status}
                      onChange={(e) => onTask(task, e.target.value)}
                    >
                      {Object.entries(taskStatusLabels).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      className="p-1 text-slate-400 hover:text-red-600"
                      onClick={() => onDelete(task)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
function SettingsTab({ id, data, onSaved }) {
  const [env, setEnv] = useState(data.env || {});
  const [git, setGit] = useState(data.git || {});
  const save = async (type, values) => {
    await api(`/projects/${id}/${type}`, { method: 'PUT', body: JSON.stringify(values) });
    toast.success('저장했습니다.');
    onSaved();
  };
  const form = (title, values, setValues, type, fields) => (
    <Card>
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-3">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              className={inputClass}
              value={values[key] || ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <Button className="mt-4" onClick={() => save(type, values)}>
        저장
      </Button>
    </Card>
  );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {form('실행 환경', env, setEnv, 'env', [
        ['source_folder', '소스 폴더'],
        ['run_command', '실행 명령어'],
        ['run_port', '실행 포트'],
        ['access_url', '접속 URL'],
        ['runtime', '개발 환경'],
        ['install_command', '설치 명령어'],
        ['env_vars_location', '환경변수 위치'],
        ['db_config_path', 'DB 설정 경로'],
      ])}
      {form('Git 정보', git, setGit, 'git', [
        ['repo_url', '저장소 URL'],
        ['branch', '브랜치'],
        ['last_commit', '최근 커밋'],
        ['last_pushed_at', '마지막 push'],
      ])}
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<Detail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
