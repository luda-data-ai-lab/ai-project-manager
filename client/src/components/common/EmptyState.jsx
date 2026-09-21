export default function EmptyState({ children = '아직 데이터가 없습니다.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
