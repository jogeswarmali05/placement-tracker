import { useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Spinner = ({ className = '' }) => (
  <Loader2 className={`h-6 w-6 animate-spin text-teal-700 ${className}`} aria-label="Loading" />
);

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const ok = type === 'success';
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <div role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
        ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const STATUS_STYLE = {
  'Not Started': 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-amber-100 text-amber-800',
  Completed: 'bg-emerald-100 text-emerald-800',
};
export const StatusBadge = ({ status }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE['Not Started']}`}>
    {status}
  </span>
);

export function ProgressBar({ value = 0, color = '#0f766e', label }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="btn-ghost" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="card flex flex-col items-center px-6 py-10 text-center">
    {Icon && <Icon className="mb-3 h-9 w-9 text-slate-300" />}
    <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
  </label>
);

export const confirmDelete = (what) => window.confirm(`Delete ${what}? This cannot be undone.`);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDay = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
export const toInputDate = (d) => {
  if (d) return new Date(d).toISOString().slice(0, 10);
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
export const GROUP_COLORS = ['#0f766e', '#2563eb', '#d97706', '#be123c', '#7c3aed', '#0891b2', '#4d7c0f'];
