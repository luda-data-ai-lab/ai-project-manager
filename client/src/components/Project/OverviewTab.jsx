import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mutate } from '../../utils/api';
import { formatMoney } from '../../utils/format';
import { Card, EmptyState } from '../common';
import MemoBox from './MemoBox';
import MemoForm from './MemoForm';
export default function OverviewTab({ data, onRefresh }) {
  const [memos, setMemos] = useState([]);
  const [costs, setCosts] = useState([]);
  useEffect(() => {
    api(`/projects/${data.id}/memos`)
      .then(setMemos)
      .catch(() => {});
  }, [data.id]);
  useEffect(() => {
    api(`/costs?project_id=${data.id}`)
      .then(setCosts)
      .catch(() => {});
  }, [data.id]);
  const costTotals = costs.reduce((totals, cost) => {
    totals[cost.currency] = (totals[cost.currency] || 0) + cost.amount;
    return totals;
  }, {});
  const addMemo = async (values) => {
    await mutate(
      `/projects/${data.id}/memos`,
      { method: 'POST', body: JSON.stringify(values) },
      '메모를 저장했습니다.',
    );
    setMemos(await api(`/projects/${data.id}/memos`));
    onRefresh();
  };
  return (
    <div className="space-y-5">
      <MemoBox memo={data.latest_memo} />
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
            {data.deploy?.service_url && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">배포</dt>
                <dd className="truncate">
                  <a
                    href={data.deploy.service_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {data.deploy.service_url}
                  </a>
                </dd>
              </div>
            )}
            {costs.length > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">비용</dt>
                <dd className="flex gap-2">
                  {Object.entries(costTotals).map(([currency, total]) => (
                    <Link
                      key={currency}
                      to={`/costs?project=${data.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {formatMoney(total, currency)}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">중단 메모 작성</h2>
          <MemoForm onSubmit={addMemo} />
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">메모 기록</h2>
        {memos.length ? memos.map((memo) => <MemoBox memo={memo} key={memo.id} />) : <EmptyState />}
      </Card>
    </div>
  );
}
