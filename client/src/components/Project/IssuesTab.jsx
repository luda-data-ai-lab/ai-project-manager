import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, mutate } from '../../utils/api';
import { Badge, Button, Card, EmptyState, Field } from '../common';
import { inputClass } from '../../utils/styles';

const typeLabels = { bug: '버그', improvement: '개선', idea: '아이디어', question: '질문' };
const statusLabels = { open: '열림', in_progress: '진행 중', done: '완료', hold: '보류' };
const priorityLabels = { urgent: '긴급', high: '높음', normal: '보통', low: '낮음' };
const typeColors = {
  bug: 'bg-red-100 text-red-700',
  improvement: 'bg-blue-100 text-blue-700',
  idea: 'bg-violet-100 text-violet-700',
  question: 'bg-slate-100 text-slate-700',
};
const priorityColors = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-slate-100 text-slate-700',
  low: 'bg-slate-100 text-slate-500',
};
const emptyForm = {
  title: '',
  type: 'bug',
  priority: 'normal',
  status: 'open',
  linked_task_id: '',
  description: '',
};

function IssueForm({ initial = emptyForm, tasks, onSave, onCancel }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, linked_task_id: form.linked_task_id || null });
  };
  return (
    <form className="space-y-3" onSubmit={submit}>
      <Field label="제목">
        <input
          className={inputClass}
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="유형">
          <select
            className={inputClass}
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="우선순위">
          <select
            className={inputClass}
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="상태">
          <select
            className={inputClass}
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="연결 작업">
        <select
          className={inputClass}
          value={form.linked_task_id || ''}
          onChange={(event) => setForm({ ...form, linked_task_id: event.target.value })}
        >
          <option value="">연결 안 함</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="설명">
        <textarea
          className={inputClass}
          rows={3}
          value={form.description || ''}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">저장</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}

export default function IssuesTab({ id, tasks }) {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    const query = filter ? `?status=${filter}` : '';
    return api(`/projects/${id}/issues${query}`)
      .then(setIssues)
      .catch((error) => toast.error(error.message));
  };
  useEffect(() => {
    load();
  }, [id, filter]);

  const save = async (values, issueId = null) => {
    const result = await mutate(
      issueId ? `/issues/${issueId}` : `/projects/${id}/issues`,
      { method: issueId ? 'PUT' : 'POST', body: JSON.stringify(values) },
      issueId ? '이슈를 수정했습니다.' : '이슈를 추가했습니다.',
    );
    if (result) {
      setShowForm(false);
      setEditingId(null);
      load();
    }
  };
  const changeStatus = async (issue, status) => {
    const result = await mutate(
      `/issues/${issue.id}`,
      { method: 'PUT', body: JSON.stringify({ status }) },
      '상태를 변경했습니다.',
    );
    if (result) load();
  };
  const remove = async (issue) => {
    if (!confirm('이슈를 삭제하시겠습니까?')) return;
    await mutate(`/issues/${issue.id}`, { method: 'DELETE' }, '삭제했습니다.');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[['', '전체'], ...Object.entries(statusLabels)].map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>이슈 추가</Button>
      </div>
      {showForm && (
        <Card>
          <IssueForm tasks={tasks} onSave={save} onCancel={() => setShowForm(false)} />
        </Card>
      )}
      {issues.length ? (
        issues.map((issue) => (
          <Card key={issue.id}>
            {editingId === issue.id ? (
              <IssueForm
                initial={issue}
                tasks={tasks}
                onSave={(values) => save(values, issue.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{issue.title}</h3>
                    {issue.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                        {issue.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-900"
                      onClick={() => setEditingId(issue.id)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-red-600"
                      onClick={() => remove(issue)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge label={typeLabels[issue.type]} color={typeColors[issue.type]} />
                  <Badge
                    label={priorityLabels[issue.priority]}
                    color={priorityColors[issue.priority]}
                  />
                  <select
                    className="rounded-full border-0 bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                    value={issue.status}
                    onChange={(event) => changeStatus(issue, event.target.value)}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {issue.linked_task_title && (
                    <span className="text-xs text-slate-500">작업: {issue.linked_task_title}</span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(issue.updated_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </>
            )}
          </Card>
        ))
      ) : (
        <EmptyState>등록된 이슈가 없습니다.</EmptyState>
      )}
    </div>
  );
}
