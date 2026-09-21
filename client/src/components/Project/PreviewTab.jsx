import { ExternalLink, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, EmptyState } from '../common';

const secondaryClass =
  'rounded-lg px-4 py-2 text-sm font-medium transition bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50';

export default function PreviewTab({ env, onGoSettings }) {
  const [key, setKey] = useState(0);
  const url = useMemo(() => {
    const port = String(env?.run_port || '').trim();
    const configured = env?.access_url?.trim() || (port ? `http://localhost:${port}` : '');
    if (!configured) return null;
    return /^[a-z][a-z\d+\-.]*:\/\//i.test(configured) ? configured : `http://${configured}`;
  }, [env]);

  if (!url) {
    return (
      <EmptyState>
        <p>
          설정 탭에서 접속 URL 또는 실행 포트를 입력하면 여기에서 실행 중인 서비스를 볼 수 있습니다.
        </p>
        <Button variant="secondary" className="mt-4" onClick={onGoSettings}>
          설정으로 이동
        </Button>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-600">{url}</span>
        <Button variant="secondary" onClick={() => setKey((value) => value + 1)}>
          <RefreshCw size={16} className="mr-1 inline" />
          새로고침
        </Button>
        <a href={url} target="_blank" rel="noreferrer" className={secondaryClass}>
          <ExternalLink size={16} className="mr-1 inline" />새 탭에서 열기
        </a>
      </div>
      <iframe
        key={key}
        src={url}
        title="실행 화면"
        className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white"
      />
      <p className="mt-2 text-xs text-slate-500">
        서비스가 실행 중이어야 하며, X-Frame-Options 등으로 임베드를 막는 앱은 새 탭에서 열어
        주세요.
      </p>
    </div>
  );
}
