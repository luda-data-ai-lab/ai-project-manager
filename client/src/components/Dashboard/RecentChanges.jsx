import { useState } from 'react';
import { Card, EmptyState } from '../common';
export default function RecentChanges({ changes }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? changes : changes.slice(0, 5);
  return (
    <Card>
      <h2 className="mb-4 font-semibold">최근 변경</h2>
      {changes.length ? (
        visible.map((item, index) => (
          <div
            key={`${item.type}-${item.at}-${index}`}
            className="flex gap-3 border-l-2 border-slate-200 pb-4 pl-4 text-sm"
          >
            <div>
              <p>
                <span className="font-medium">{item.project_name}</span> · {item.title}
              </p>
              <p className="text-xs text-slate-400">{new Date(item.at).toLocaleString('ko-KR')}</p>
            </div>
          </div>
        ))
      ) : (
        <EmptyState />
      )}
      {changes.length > 5 && (
        <button
          className="mt-1 text-sm text-blue-600 hover:underline"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '접기' : `더 보기 (${changes.length - 5}개)`}
        </button>
      )}
    </Card>
  );
}
