export default function Button({ children, variant = 'primary', className = '', ...props }) {
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
