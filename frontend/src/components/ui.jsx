import { useEffect } from 'react';

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Alert = ({ kind = 'error', children }) => {
  if (!children) return null;
  const styles = { error: 'border-red-200 bg-red-50 text-red-700', success: 'border-emerald-200 bg-emerald-50 text-emerald-700', info: 'border-sky-200 bg-sky-50 text-sky-700' };
  return <div role="alert" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}>{children}</div>;
};

export const Spinner = () => <div className="py-10 text-center text-sm text-slate-400">Loading…</div>;

export const Empty = ({ children }) => <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;

export const StatCard = ({ label, value, hint }) => (
  <div className="card">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);

const BADGES = {
  safe: ['Safe', 'bg-emerald-100 text-emerald-700'],
  at_risk: ['Warning', 'bg-amber-100 text-amber-800'],
  below_threshold: ['Below minimum', 'bg-red-100 text-red-700'],
  no_data: ['No data', 'bg-slate-100 text-slate-600'],
  pending: ['Pending', 'bg-amber-100 text-amber-800'],
  submitted: ['Submitted', 'bg-sky-100 text-sky-700'],
  graded: ['Graded', 'bg-emerald-100 text-emerald-700'],
};
export const Badge = ({ kind }) => {
  const [text, cls] = BADGES[kind] || [kind, 'bg-slate-100 text-slate-600'];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
};

export function Field({ label, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shows the formula and the worked calculation returned by the API (NFR-02 transparency). */
export function FormulaBox({ formula, working, steps }) {
  if (!formula) return null;
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <div className="font-semibold text-slate-700">How this is calculated</div>
      <div className="mt-1 font-mono">{formula}</div>
      {working && <div className="mt-1 font-mono text-brand-700">{working}</div>}
      {steps?.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-slate-500">Show per-course working</summary>
          <table className="mt-2 w-full text-left">
            <thead><tr className="text-slate-400"><th className="pr-2">Course</th><th className="pr-2">Credits</th><th className="pr-2">Points</th><th>Credits × points</th></tr></thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={i}><td className="pr-2">{s.label || '—'}</td><td className="pr-2">{s.credit_hours}</td><td className="pr-2">{s.grade_points}</td><td>{s.quality_points}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

export const fmt = (v, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);
