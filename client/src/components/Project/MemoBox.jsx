import { Card, EmptyState } from '../common';
export default function MemoBox({ memo }) {
  if (!memo) return <EmptyState>기록된 중단·재개 메모가 없습니다.</EmptyState>;
  return (
    <Card className="border-slate-300 bg-slate-50 font-mono text-sm">
      <h2 className="mb-4 font-sans font-semibold">── 중단·재개 메모 ──</h2>
      <div className="space-y-2">
        <p>
          <b>마지막 작업:</b> {memo.last_work}
        </p>
        <p>
          <b>막힌 부분:</b> {memo.blocker || '-'}
        </p>
        <p>
          <b>다음 작업:</b> {memo.next_work || '-'}
        </p>
        <p>
          <b>열어둘 파일:</b> {memo.open_files?.join(', ') || '-'}
        </p>
        <p>
          <b>참고 자료:</b> {memo.reference || '-'}
        </p>
        <p>
          <b>기록일:</b>{' '}
          {memo.recorded_at ? new Date(memo.recorded_at).toLocaleString('ko-KR') : '-'}
        </p>
      </div>
      <p className="mt-4">────────────────────────</p>
    </Card>
  );
}
