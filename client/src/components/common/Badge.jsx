export default function Badge({ value, label, color }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${color || 'bg-slate-100 text-slate-700'}`}
    >
      {label || value}
    </span>
  );
}
