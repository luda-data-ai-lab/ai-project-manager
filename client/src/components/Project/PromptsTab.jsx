import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, mutate } from '../../utils/api';
import { Button, Card, EmptyState, Field } from '../common';
import { inputClass } from '../../utils/styles';

const tools = {
  devin: ['Devin', 'bg-violet-100 text-violet-700'],
  claude: ['Claude', 'bg-orange-100 text-orange-700'],
  cursor: ['Cursor', 'bg-blue-100 text-blue-700'],
  other: ['기타', 'bg-slate-100 text-slate-700'],
};

const emptyForm = {
  tool: 'devin',
  task_id: '',
  prompt_text: '',
  result_summary: '',
  commit_hash: '',
};

export default function PromptsTab({ id, tasks }) {
  const [prompts, setPrompts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = () =>
    api(`/projects/${id}/prompts`)
      .then(setPrompts)
      .catch((error) => toast.error(error.message));
  useEffect(() => {
    load();
  }, [id]);

  const save = async (event) => {
    event.preventDefault();
    const created = await mutate(
      `/projects/${id}/prompts`,
      { method: 'POST', body: JSON.stringify({ ...form, task_id: form.task_id || null }) },
      '프롬프트를 저장했습니다.',
    );
    if (created) {
      setForm(emptyForm);
      setShowForm(false);
      load();
    }
  };

  const remove = async (prompt) => {
    if (!confirm('프롬프트 기록을 삭제하시겠습니까?')) return;
    await mutate(`/prompts/${prompt.id}`, { method: 'DELETE' }, '삭제했습니다.');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((value) => !value)}>프롬프트 기록</Button>
      </div>
      {showForm && (
        <Card>
          <form className="space-y-3" onSubmit={save}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="도구">
                <select
                  className={inputClass}
                  value={form.tool}
                  onChange={(event) => setForm({ ...form, tool: event.target.value })}
                >
                  {Object.entries(tools).map(([value, [label]]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="연결 작업">
                <select
                  className={inputClass}
                  value={form.task_id}
                  onChange={(event) => setForm({ ...form, task_id: event.target.value })}
                >
                  <option value="">연결 안 함</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="프롬프트 내용">
              <textarea
                className={inputClass}
                required
                rows={5}
                value={form.prompt_text}
                onChange={(event) => setForm({ ...form, prompt_text: event.target.value })}
              />
            </Field>
            <Field label="결과 요약">
              <textarea
                className={inputClass}
                rows={3}
                value={form.result_summary}
                onChange={(event) => setForm({ ...form, result_summary: event.target.value })}
              />
            </Field>
            <Field label="커밋 해시">
              <input
                className={inputClass}
                value={form.commit_hash}
                onChange={(event) => setForm({ ...form, commit_hash: event.target.value })}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">저장</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </form>
        </Card>
      )}
      {prompts.length ? (
        prompts.map((prompt) => {
          const [toolLabel, toolColor] = tools[prompt.tool] || tools.other;
          const isExpanded = expanded[prompt.id];
          const canToggle = prompt.prompt_text.length > 240;
          return (
            <Card key={prompt.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toolColor}`}>
                  {toolLabel}
                </span>
                <span className="text-xs text-slate-400">
                  {format(new Date(prompt.used_at), 'yyyy-MM-dd HH:mm')}
                </span>
                <button
                  type="button"
                  className="ml-auto text-slate-400 hover:text-red-600"
                  onClick={() => remove(prompt)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p
                className={`mt-3 whitespace-pre-wrap text-sm text-slate-700 ${isExpanded ? '' : 'max-h-36 overflow-hidden'}`}
              >
                {prompt.prompt_text}
              </p>
              {canToggle && (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                  onClick={() => setExpanded({ ...expanded, [prompt.id]: !isExpanded })}
                >
                  {isExpanded ? '접기' : '더보기'}
                </button>
              )}
              {prompt.result_summary && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">
                  결과 요약: {prompt.result_summary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {prompt.commit_hash && <code className="font-mono">{prompt.commit_hash}</code>}
                {prompt.task_title && <span>연결 작업: {prompt.task_title}</span>}
              </div>
            </Card>
          );
        })
      ) : (
        <EmptyState>아직 기록된 프롬프트가 없습니다.</EmptyState>
      )}
    </div>
  );
}
