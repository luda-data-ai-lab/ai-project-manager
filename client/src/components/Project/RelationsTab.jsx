import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mutate } from '../../utils/api';
import { Badge, Button, Card, EmptyState, Field } from '../common';
import { inputClass } from '../../utils/styles';

const relationLabels = {
  depends_on: '의존',
  shares_module: '공통 모듈',
  uses_api: 'API 사용',
  precedes: '선행',
};
const relationColors = {
  depends_on: 'bg-slate-100 text-slate-700',
  shares_module: 'bg-indigo-100 text-indigo-700',
  uses_api: 'bg-emerald-100 text-emerald-700',
  precedes: 'bg-amber-100 text-amber-700',
};

function RelationRow({ relation, projectId, onDelete }) {
  const outgoing = relation.source_id === projectId;
  const otherId = outgoing ? relation.target_id : relation.source_id;
  const otherName = outgoing ? relation.target_name : relation.source_name;
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <Badge
        label={relationLabels[relation.relation_type]}
        color={relationColors[relation.relation_type]}
      />
      <Link
        to={`/projects/${otherId}?tab=relations`}
        className="font-medium text-blue-600 hover:underline"
      >
        {otherName}
      </Link>
      {relation.label && (
        <span className="min-w-0 flex-1 truncate text-sm text-slate-500">{relation.label}</span>
      )}
      <button
        aria-label="관계 삭제"
        className="rounded p-1.5 text-red-500 hover:bg-red-50"
        onClick={() => onDelete(relation)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function RelationsTab({ id }) {
  const [relations, setRelations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ target_id: '', relation_type: 'depends_on', label: '' });

  const loadRelations = () => api(`/projects/${id}/relations`).then(setRelations);
  useEffect(() => {
    Promise.all([loadRelations(), api('/projects').then(setProjects)]).catch(() => {});
  }, [id]);

  const addRelation = async (event) => {
    event.preventDefault();
    const result = await mutate(
      `/projects/${id}/relations`,
      { method: 'POST', body: JSON.stringify(form) },
      '관계를 추가했습니다.',
    );
    if (!result) return;
    setForm({ target_id: '', relation_type: 'depends_on', label: '' });
    await loadRelations();
  };

  const removeRelation = async (relation) => {
    if (!window.confirm('관계를 삭제하시겠습니까?')) return;
    await mutate(`/relations/${relation.id}`, { method: 'DELETE' }, '관계를 삭제했습니다.');
    await loadRelations();
  };

  const outgoing = relations.filter((relation) => relation.source_id === id);
  const incoming = relations.filter((relation) => relation.target_id === id);
  const renderList = (items, emptyText) =>
    items.length ? (
      items.map((relation) => (
        <RelationRow
          key={relation.id}
          relation={relation}
          projectId={id}
          onDelete={removeRelation}
        />
      ))
    ) : (
      <EmptyState>{emptyText}</EmptyState>
    );

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-4 font-semibold">관계 추가</h2>
        <form onSubmit={addRelation} className="grid gap-3 md:grid-cols-3">
          <Field label="대상 프로젝트">
            <select
              required
              className={inputClass}
              value={form.target_id}
              onChange={(event) => setForm({ ...form, target_id: event.target.value })}
            >
              <option value="">프로젝트를 선택하세요</option>
              {projects
                .filter((project) => project.id !== id)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="관계 유형">
            <select
              className={inputClass}
              value={form.relation_type}
              onChange={(event) => setForm({ ...form, relation_type: event.target.value })}
            >
              {Object.entries(relationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="라벨">
            <input
              className={inputClass}
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
          </Field>
          <div>
            <Button type="submit">관계 추가</Button>
          </div>
        </form>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">이 프로젝트가 →</h2>
          {renderList(outgoing, '연결된 대상 프로젝트가 없습니다.')}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">→ 이 프로젝트</h2>
          {renderList(incoming, '연결된 출발 프로젝트가 없습니다.')}
        </Card>
      </div>
    </div>
  );
}
