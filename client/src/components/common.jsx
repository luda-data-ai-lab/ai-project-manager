import { X } from 'lucide-react';
export function Badge({ value, label, color }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${color || 'bg-slate-100 text-slate-700'}`}
    >
      {label || value}
    </span>
  );
}
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const colors = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  };
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${colors[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
export function EmptyState({ children = '아직 데이터가 없습니다.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
export function Spinner() {
  return <div className="animate-pulse text-sm text-slate-400">불러오는 중...</div>;
}
export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
