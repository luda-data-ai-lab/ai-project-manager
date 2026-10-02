import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, mutate } from '../utils/api';
import { formatMoney } from '../utils/format';
import { inputClass } from '../utils/styles';
import { Badge, Button, Card, EmptyState, Field, PageHeader, Spinner } from '../components/common';

const itemTypeLabels = {
  saas: 'SaaS 구독',
  system: '자체 시스템 유지보수',
};
const itemTypeColors = {
  saas: 'bg-violet-100 text-violet-700',
  system: 'bg-blue-100 text-blue-700',
};
const initialForm = () => ({
  item_type: 'saas',
  name: '',
  project_id: '',
  current_monthly_cost: '0',
  ai_build_cost: '0',
  ai_monthly_cost: '0',
  traditional_build_cost: '',
  memo: '',
});
const formatMonths = (value) =>
  value === null ? '회수 불가' : value === 0 ? '즉시' : `${value}개월`;
const formatRoi = (value) => (value === null ? '-' : `${value}%`);

export default function RoiPage() {
  const [years, setYears] = useState(3);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

  const loadSummary = () => api(`/roi/summary?years=${years}`).then(setSummary);

  useEffect(() => {
    loadSummary().catch((error) => toast.error(error.message));
  }, [years]);

  useEffect(() => {
    api('/projects')
      .then(setProjects)
      .catch((error) => toast.error(error.message));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    const body = {
      ...form,
      name: form.name.trim(),
      project_id: form.project_id || null,
      current_monthly_cost: Number(form.current_monthly_cost),
      ai_build_cost: Number(form.ai_build_cost),
      ai_monthly_cost: Number(form.ai_monthly_cost),
      traditional_build_cost:
        form.traditional_build_cost === '' ? null : Number(form.traditional_build_cost),
    };
    const result = await mutate(
      editing ? `/roi/${editing}` : '/roi',
      { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) },
      editing ? 'ROI 항목을 수정했습니다.' : 'ROI 항목을 추가했습니다.',
    );
    if (!result) return;
    setEditing(null);
    setForm(initialForm());
    await loadSummary();
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({
      item_type: item.item_type,
      name: item.name,
      project_id: item.project_id || '',
      current_monthly_cost: String(item.current_monthly_cost),
      ai_build_cost: String(item.ai_build_cost),
      ai_monthly_cost: String(item.ai_monthly_cost),
      traditional_build_cost:
        item.traditional_build_cost == null ? '' : String(item.traditional_build_cost),
      memo: item.memo || '',
    });
    document.getElementById('roi-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const remove = async (item) => {
    if (!window.confirm(`'${item.name}' ROI 항목을 삭제하시겠습니까?`)) return;
    await mutate(`/roi/${item.id}`, { method: 'DELETE' }, 'ROI 항목을 삭제했습니다.');
    await loadSummary();
  };

  if (!summary) return <Spinner />;
  const { totals, items, yearly } = summary;
  const maxCumulative = Math.max(
    1,
    ...yearly.flatMap((row) => [row.current_cumulative, row.ai_cumulative]),
  );
  const kpis = [
    { label: '월 절감액', value: formatMoney(totals.monthly_saving, 'KRW') },
    { label: '연간 절감액', value: formatMoney(totals.annual_saving, 'KRW') },
    {
      label: `${years}년 순이익`,
      value: formatMoney(totals.net_benefit, 'KRW'),
      color: totals.net_benefit >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    { label: 'ROI', value: formatRoi(totals.roi_percent) },
    { label: '투자 회수 기간', value: formatMonths(totals.payback_months) },
    ...(totals.build_saving == null
      ? []
      : [
          {
            label: '개발비 절감 (기존 방식 대비)',
            value: formatMoney(totals.build_saving, 'KRW'),
          },
        ]),
  ];

  return (
    <>
      <PageHeader
        title="AI ROI 계산기"
        description="현재 SaaS·시스템 유지비와 AI로 직접 개발할 때의 비용을 비교합니다."
        action={
          <Button
            onClick={() =>
              document.getElementById('roi-form')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <Plus size={16} className="mr-1 inline" />
            항목 추가
          </Button>
        }
      />
      <Card className="mb-5">
        <Field label="비교 기간">
          <select
            className={inputClass}
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
          >
            {[1, 3, 5].map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </Field>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-slate-500">{kpi.label}</p>
            <p className={`mt-2 text-2xl font-bold ${kpi.color || 'text-slate-900'}`}>
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <h2 className="mb-4 font-semibold">누적 비용 비교</h2>
        {yearly.length ? (
          <div className="space-y-4">
            {yearly.map((row) => (
              <div key={row.year}>
                <p className="mb-2 text-sm font-medium text-slate-700">{row.year}년차</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-slate-500">현재 유지</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-400"
                        style={{ width: `${(row.current_cumulative / maxCumulative) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs font-medium">
                      {formatMoney(row.current_cumulative, 'KRW')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-slate-500">AI 개발</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-violet-500"
                        style={{ width: `${(row.ai_cumulative / maxCumulative) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs font-medium">
                      {formatMoney(row.ai_cumulative, 'KRW')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-400" />
                현재 유지
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />
                AI 개발
              </span>
            </div>
          </div>
        ) : (
          <EmptyState>등록된 ROI 항목이 없습니다.</EmptyState>
        )}
      </Card>
      <Card id="roi-form" className="mt-5">
        <h2 className="mb-4 font-semibold">{editing ? 'ROI 항목 수정' : 'ROI 항목 추가'}</h2>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
          <Field label="유형">
            <select
              className={inputClass}
              value={form.item_type}
              onChange={(event) => setForm({ ...form, item_type: event.target.value })}
            >
              {Object.entries(itemTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="이름">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="연결 프로젝트">
            <select
              className={inputClass}
              value={form.project_id}
              onChange={(event) => setForm({ ...form, project_id: event.target.value })}
            >
              <option value="">없음</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
          {[
            ['current_monthly_cost', '현재 월 비용'],
            ['ai_build_cost', 'AI 개발 초기 비용'],
            ['ai_monthly_cost', 'AI 개발 후 월 운영비'],
          ].map(([field, label]) => (
            <Field key={field} label={label}>
              <input
                required
                min="0"
                step="any"
                type="number"
                className={inputClass}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              />
            </Field>
          ))}
          <Field label="기존 방식 개발 견적 (선택)">
            <input
              min="0"
              step="any"
              type="number"
              className={inputClass}
              value={form.traditional_build_cost}
              onChange={(event) => setForm({ ...form, traditional_build_cost: event.target.value })}
            />
          </Field>
          <Field label="메모">
            <input
              className={inputClass}
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
                  setForm(initialForm());
                }}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="mt-5">
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="pb-3">유형</th>
                  <th className="pb-3">이름</th>
                  <th className="pb-3">프로젝트</th>
                  <th className="pb-3">현재 월 비용</th>
                  <th className="pb-3">AI 초기</th>
                  <th className="pb-3">AI 월</th>
                  <th className="pb-3">월 절감</th>
                  <th className="pb-3">{years}년 순이익</th>
                  <th className="pb-3">ROI</th>
                  <th className="pb-3">회수</th>
                  <th className="pb-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">
                      <Badge
                        label={itemTypeLabels[item.item_type]}
                        color={itemTypeColors[item.item_type]}
                      />
                    </td>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3">{item.project_name || '-'}</td>
                    <td className="py-3">{formatMoney(item.current_monthly_cost, 'KRW')}</td>
                    <td className="py-3">{formatMoney(item.ai_build_cost, 'KRW')}</td>
                    <td className="py-3">{formatMoney(item.ai_monthly_cost, 'KRW')}</td>
                    <td className="py-3">{formatMoney(item.monthly_saving, 'KRW')}</td>
                    <td
                      className={`py-3 font-medium ${item.net_benefit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatMoney(item.net_benefit, 'KRW')}
                    </td>
                    <td className="py-3">{formatRoi(item.roi_percent)}</td>
                    <td className="py-3">{formatMonths(item.payback_months)}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          aria-label="ROI 항목 수정"
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                          onClick={() => edit(item)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          aria-label="ROI 항목 삭제"
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                          onClick={() => remove(item)}
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
          <EmptyState>등록된 ROI 항목이 없습니다.</EmptyState>
        )}
      </Card>
    </>
  );
}
