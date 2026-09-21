import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, mutate } from '../utils/api';
import { formatMoney } from '../utils/format';
import { inputClass } from '../utils/styles';
import { Badge, Button, Card, EmptyState, Field, PageHeader, Spinner } from '../components/common';

const categoryLabels = {
  ai_tool: 'AI 도구',
  server: '서버',
  other: '기타',
};
const categoryColors = {
  ai_tool: 'bg-violet-100 text-violet-700',
  server: 'bg-blue-100 text-blue-700',
  other: 'bg-slate-100 text-slate-700',
};
const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month, offset) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
};
const initialForm = (period) => ({
  project_id: '',
  category: 'ai_tool',
  vendor: '',
  amount: '',
  currency: 'KRW',
  period,
  memo: '',
});

export default function CostsPage() {
  const [searchParams] = useSearchParams();
  const defaultTo = currentMonth();
  const [projects, setProjects] = useState([]);
  const [costs, setCosts] = useState(null);
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState({ from: shiftMonth(defaultTo, -5), to: defaultTo });
  const [filters, setFilters] = useState({
    period: '',
    category: '',
    project_id: searchParams.get('project') || '',
  });
  const [form, setForm] = useState(initialForm(defaultTo));
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api('/projects')
      .then(setProjects)
      .catch((error) => toast.error(error.message));
  }, []);

  const loadCosts = () => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    );
    return api(`/costs?${query}`).then(setCosts);
  };
  const loadSummary = () =>
    api(`/costs/summary?from=${range.from}&to=${range.to}`).then(setSummary);

  useEffect(() => {
    Promise.all([loadCosts(), loadSummary()]).catch((error) => toast.error(error.message));
  }, [filters.period, filters.category, filters.project_id, range.from, range.to]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    for (const row of summary?.by_category || []) {
      if (!totals[row.category]) totals[row.category] = [];
      totals[row.category].push(row);
    }
    return totals;
  }, [summary]);
  const categoryMax = Math.max(
    1,
    ...Object.values(categoryTotals).map((rows) =>
      rows.reduce((total, row) => total + row.total, 0),
    ),
  );
  const projectTotals = useMemo(() => {
    const totals = {};
    for (const row of summary?.by_project || []) {
      const key = row.project_id || 'common';
      if (!totals[key]) totals[key] = { name: row.project_name, rows: [] };
      totals[key].rows.push(row);
    }
    return Object.values(totals);
  }, [summary]);

  const save = async (event) => {
    event.preventDefault();
    const body = {
      ...form,
      project_id: form.project_id || null,
      amount: Number(form.amount),
    };
    const result = await mutate(
      editing ? `/costs/${editing}` : '/costs',
      { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) },
      editing ? '비용을 수정했습니다.' : '비용을 추가했습니다.',
    );
    if (!result) return;
    setEditing(null);
    setForm(initialForm(currentMonth()));
    await Promise.all([loadCosts(), loadSummary()]);
  };

  const remove = async (cost) => {
    if (!window.confirm('비용 기록을 삭제하시겠습니까?')) return;
    const result = await mutate(`/costs/${cost.id}`, { method: 'DELETE' }, '비용을 삭제했습니다.');
    await Promise.all([loadCosts(), loadSummary()]);
  };

  const edit = (cost) => {
    setEditing(cost.id);
    setForm({
      project_id: cost.project_id || '',
      category: cost.category,
      vendor: cost.vendor,
      amount: String(cost.amount),
      currency: cost.currency,
      period: cost.period,
      memo: cost.memo || '',
    });
  };

  if (!costs || !summary) return <Spinner />;
  return (
    <>
      <PageHeader
        title="비용"
        description="AI 도구, 서버, 기타 프로젝트 비용을 추적하세요."
        action={
          <Button onClick={() => document.getElementById('cost-form')?.scrollIntoView()}>
            <Plus size={16} className="mr-1 inline" />
            비용 추가
          </Button>
        }
      />
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="요약 시작월">
            <input
              type="month"
              className={inputClass}
              value={range.from}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
            />
          </Field>
          <Field label="요약 종료월">
            <input
              type="month"
              className={inputClass}
              value={range.to}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
            />
          </Field>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {['KRW', 'USD'].map((currency) => (
          <Card key={currency}>
            <p className="text-sm text-slate-500">합계 ({currency})</p>
            <p className="mt-2 text-2xl font-bold">
              {formatMoney(summary.total_by_currency[currency], currency)}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">분류별 비용</h2>
          <div className="space-y-4">
            {Object.entries(categoryLabels).map(([category, label]) => {
              const rows = categoryTotals[category] || [];
              const total = rows.reduce((sum, row) => sum + row.total, 0);
              return (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-slate-500">
                      {rows.map((row) => formatMoney(row.total, row.currency)).join(' · ') || '-'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${category === 'ai_tool' ? 'bg-violet-500' : category === 'server' ? 'bg-blue-500' : 'bg-slate-500'}`}
                      style={{ width: `${(total / categoryMax) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">프로젝트별 비용</h2>
          {projectTotals.length ? (
            <div className="space-y-3">
              {projectTotals.map((project) => (
                <div key={project.name} className="flex justify-between text-sm">
                  <span>{project.name}</span>
                  <span className="text-slate-500">
                    {project.rows.map((row) => formatMoney(row.total, row.currency)).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>선택한 기간에 비용이 없습니다.</EmptyState>
          )}
        </Card>
      </div>
      <Card id="cost-form" className="mt-5">
        <h2 className="mb-4 font-semibold">{editing ? '비용 수정' : '비용 추가'}</h2>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
          <Field label="프로젝트">
            <select
              className={inputClass}
              value={form.project_id}
              onChange={(event) => setForm({ ...form, project_id: event.target.value })}
            >
              <option value="">공통(프로젝트 없음)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="분류">
            <select
              className={inputClass}
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="업체">
            <input
              required
              className={inputClass}
              value={form.vendor}
              onChange={(event) => setForm({ ...form, vendor: event.target.value })}
            />
          </Field>
          <Field label="금액">
            <input
              required
              min="0"
              step="0.01"
              type="number"
              className={inputClass}
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </Field>
          <Field label="통화">
            <select
              className={inputClass}
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            >
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Field label="기간">
            <input
              required
              type="month"
              className={inputClass}
              value={form.period}
              onChange={(event) => setForm({ ...form, period: event.target.value })}
            />
          </Field>
          <Field label="메모">
            <input
              className={`${inputClass} md:col-span-2`}
              value={form.memo}
              onChange={(event) => setForm({ ...form, memo: event.target.value })}
            />
          </Field>
          <div className="flex items-end gap-2">
            <Button type="submit">{editing ? '수정 저장' : '추가'}</Button>
            {editing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setForm(initialForm(currentMonth()));
                }}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="mt-5">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="기간">
            <input
              type="month"
              className={inputClass}
              value={filters.period}
              onChange={(event) => setFilters({ ...filters, period: event.target.value })}
            />
          </Field>
          <Field label="분류">
            <select
              className={inputClass}
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">모든 분류</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="프로젝트">
            <select
              className={inputClass}
              value={filters.project_id}
              onChange={(event) => setFilters({ ...filters, project_id: event.target.value })}
            >
              <option value="">모든 프로젝트</option>
              <option value="common">공통(프로젝트 없음)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {costs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="pb-3">기간</th>
                  <th className="pb-3">분류</th>
                  <th className="pb-3">업체</th>
                  <th className="pb-3">프로젝트</th>
                  <th className="pb-3">금액</th>
                  <th className="pb-3">메모</th>
                  <th className="pb-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">{cost.period}</td>
                    <td className="py-3">
                      <Badge
                        label={categoryLabels[cost.category]}
                        color={categoryColors[cost.category]}
                      />
                    </td>
                    <td className="py-3">{cost.vendor}</td>
                    <td className="py-3">{cost.project_name || '공통'}</td>
                    <td className="py-3 font-medium">{formatMoney(cost.amount, cost.currency)}</td>
                    <td className="max-w-xs truncate py-3 text-slate-500">{cost.memo || '-'}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          aria-label="비용 수정"
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                          onClick={() => edit(cost)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          aria-label="비용 삭제"
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                          onClick={() => remove(cost)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>등록된 비용이 없습니다.</EmptyState>
        )}
      </Card>
    </>
  );
}
