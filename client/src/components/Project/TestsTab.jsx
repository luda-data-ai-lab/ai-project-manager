import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, mutate } from '../../utils/api';
import { inputClass } from '../../utils/styles';
import { Badge, Button, EmptyState } from '../common';

const methods = { manual: '수동', auto: '자동', browser: '브라우저' };
const results = { pass: '통과', fail: '실패', untested: '미테스트' };
const resultColors = {
  pass: 'bg-emerald-100 text-emerald-700',
  fail: 'bg-red-100 text-red-700',
  untested: 'bg-slate-100 text-slate-600',
};

export default function TestsTab({ id }) {
  const [records, setRecords] = useState([]);
  const [values, setValues] = useState({
    target: '',
    method: 'manual',
    result: 'untested',
    unresolved_issues: '',
  });
  const load = () =>
    api(`/projects/${id}/tests`)
      .then(setRecords)
      .catch(() => {});
  useEffect(() => {
    load();
  }, [id]);
  const submit = async (event) => {
    event.preventDefault();
    const created = await mutate(
      `/projects/${id}/tests`,
      { method: 'POST', body: JSON.stringify(values) },
      '테스트 기록을 추가했습니다.',
    );
    if (created) {
      setValues({ target: '', method: 'manual', result: 'untested', unresolved_issues: '' });
      load();
    }
  };
  const remove = async (record) => {
    if (!confirm('테스트 기록을 삭제하시겠습니까?')) return;
    const deleted = await mutate(
      `/tests/${record.id}`,
      { method: 'DELETE' },
      '테스트 기록을 삭제했습니다.',
    );
    load();
  };
  const passed = records.filter((record) => record.result === 'pass').length;
  const failed = records.filter((record) => record.result === 'fail').length;
  return (
    <div className="space-y-5">
      <div className="flex gap-3 text-sm">
        <Badge label={`통과 ${passed}`} color="bg-emerald-100 text-emerald-700" />
        <Badge label={`실패 ${failed}`} color="bg-red-100 text-red-700" />
        <Badge label={`전체 ${records.length}`} />
      </div>
      <form
        onSubmit={submit}
        className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
      >
        <input
          required
          placeholder="테스트 대상"
          className={inputClass}
          value={values.target}
          onChange={(event) => setValues({ ...values, target: event.target.value })}
        />
        <select
          className={inputClass}
          value={values.method}
          onChange={(event) => setValues({ ...values, method: event.target.value })}
        >
          {Object.entries(methods).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={values.result}
          onChange={(event) => setValues({ ...values, result: event.target.value })}
        >
          {Object.entries(results).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button>테스트 추가</Button>
        <textarea
          className={`${inputClass} md:col-span-3`}
          placeholder="미해결 이슈 (선택)"
          value={values.unresolved_issues}
          onChange={(event) => setValues({ ...values, unresolved_issues: event.target.value })}
        />
      </form>
      {!records.length ? (
        <EmptyState>아직 테스트 기록이 없습니다.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">테스트일</th>
                <th className="px-4 py-3">대상</th>
                <th className="px-4 py-3">방법</th>
                <th className="px-4 py-3">결과</th>
                <th className="px-4 py-3">미해결 이슈</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {record.tested_at?.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-4 py-3 font-medium">{record.target}</td>
                  <td className="px-4 py-3">{methods[record.method] || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge label={results[record.result]} color={resultColors[record.result]} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-500">
                    {record.unresolved_issues || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => remove(record)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
