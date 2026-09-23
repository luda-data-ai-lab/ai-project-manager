import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import { priorityLabels, projectStatusLabels } from '../../utils/labels';
import { inputClass } from '../../utils/styles';
import { Button, Field, Modal } from '../common';
const statusOptions = Object.entries(projectStatusLabels);
export default function ProjectForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    group_name: '',
    purpose: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    target_date: '',
    ...initial,
    tags: initial?.tags?.join(', ') || '',
  });
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    api('/projects/groups')
      .then(setGroups)
      .catch(() => {});
  }, []);
  const save = async (event) => {
    event.preventDefault();
    try {
      const body = {
        name: form.name,
        group_name: form.group_name || null,
        purpose: form.purpose || null,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const data = initial
        ? await api(`/projects/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/projects', { method: 'POST', body: JSON.stringify(body) });
      toast.success('저장했습니다.');
      onSaved(data);
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <Modal title={initial ? '프로젝트 수정' : '새 프로젝트'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="프로젝트 이름">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="그룹">
            <input
              className={inputClass}
              list="project-groups"
              value={form.group_name || ''}
              onChange={(event) => setForm({ ...form, group_name: event.target.value })}
            />
            <datalist id="project-groups">
              {groups.map((group) => (
                <option key={group} value={group} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="목적">
          <textarea
            className={inputClass}
            value={form.purpose || ''}
            onChange={(event) => setForm({ ...form, purpose: event.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="상태">
            <select
              className={inputClass}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {statusOptions.map(([value, label]) => (
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일">
            <input
              type="date"
              className={inputClass}
              value={form.start_date || ''}
              onChange={(event) => setForm({ ...form, start_date: event.target.value })}
            />
          </Field>
          <Field label="목표일">
            <input
              type="date"
              className={inputClass}
              value={form.target_date || ''}
              onChange={(event) => setForm({ ...form, target_date: event.target.value })}
            />
          </Field>
        </div>
        <Field label="태그 (쉼표로 구분)">
          <input
            className={inputClass}
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
        </Field>
        <Button className="w-full">{initial ? '수정 저장' : '프로젝트 만들기'}</Button>
      </form>
    </Modal>
  );
}
