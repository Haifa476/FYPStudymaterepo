import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { Alert, Badge, Empty, Field, FormulaBox, PageHeader, Spinner, fmt } from '../components/ui.jsx';

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

export default function Attendance() {
  const [overview, setOverview] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [detail, setDetail] = useState(null);
  const [date, setDate] = useState(today());
  const [absences, setAbsences] = useState(2);
  const [whatIf, setWhatIf] = useState(null);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/overview');
      setOverview(data.courses);
      setCourseId((cur) => {
        if (cur) return cur;
        const first = data.courses.find((c) => c.summary.classes_conducted > 0) || data.courses[0]; // prefer a course with data
        return first ? String(first.course_id) : '';
      });
    } catch (e) { setError(errorMessage(e)); }
  }, []);
  const loadDetail = useCallback(async () => {
    if (!courseId) return;
    try { setDetail((await api.get(`/courses/${courseId}/attendance`)).data); setWhatIf(null); } catch (e) { setError(errorMessage(e)); }
  }, [courseId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadDetail(); }, [loadDetail]);

  const mark = async (status) => {
    setError('');
    try { await api.post(`/courses/${courseId}/attendance`, { date, status }); await Promise.all([loadDetail(), loadOverview()]); } catch (e) { setError(errorMessage(e)); }
  };
  const del = async (r) => { try { await api.delete(`/attendance/${r.record_id}`); await Promise.all([loadDetail(), loadOverview()]); } catch (e) { setError(errorMessage(e)); } };
  const simulate = async () => {
    try { setWhatIf((await api.post(`/courses/${courseId}/attendance/what-if`, { additional_absences: Number(absences) })).data.result); } catch (e) { setError(errorMessage(e)); }
  };

  if (!overview) return <Spinner />;
  if (overview.length === 0) return <><PageHeader title="Attendance" /><Empty>Add a course first, then record attendance here.</Empty></>;
  const s = detail?.summary;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Record classes, track the percentage against each course's policy, and simulate future absences." />
      <Alert>{error}</Alert>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overview.map((c) => (
          <button key={c.course_id} onClick={() => setCourseId(String(c.course_id))}
            className={`card text-left transition hover:border-brand-500 ${String(c.course_id) === courseId ? 'border-brand-500 ring-2 ring-brand-100' : ''}`}>
            <div className="flex items-center justify-between"><span className="font-semibold">{c.code}</span><Badge kind={c.summary.status} /></div>
            <div className="truncate text-xs text-slate-500">{c.title}</div>
            <div className="mt-2 text-2xl font-semibold">{fmt(c.summary.attendance_percent, '%')}</div>
            <div className="text-xs text-slate-500">{c.summary.classes_attended}/{c.summary.classes_conducted} classes · min {c.summary.policy_min_percent}%</div>
          </button>
        ))}
      </div>

      {s && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 font-semibold">Record a class</h2>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <button className="btn-primary" onClick={() => mark('present')}>Present</button>
              <button className="btn-danger" onClick={() => mark('absent')}>Absent</button>
            </div>

            <h2 className="mb-2 mt-6 font-semibold">Current standing</h2>
            <div className="flex items-center gap-3"><span className="text-3xl font-semibold">{fmt(s.attendance_percent, '%')}</span><Badge kind={s.status} /></div>
            <p className="mt-1 text-sm text-slate-600">{s.message}</p>
            {s.max_additional_absences !== null && <p className="mt-1 text-sm text-slate-600">You can miss up to <b>{s.max_additional_absences}</b> more class(es) and stay at or above {s.policy_min_percent}%.</p>}
            {s.absence_limit !== null && <p className={`mt-1 text-sm ${s.absence_limit_reached ? 'font-medium text-red-600' : 'text-slate-600'}`}>Absence limit: {s.classes_missed} of {s.absence_limit} used.</p>}
            <FormulaBox formula={s.formula} working={s.working} />
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="mb-3 font-semibold">What-if: future absences</h2>
              <div className="flex items-end gap-3">
                <Field label="Additional absences"><input className="input w-28" type="number" min={0} max={200} value={absences} onChange={(e) => setAbsences(e.target.value)} /></Field>
                <button className="btn-ghost" onClick={simulate}>Simulate</button>
              </div>
              {whatIf && (
                <div className="mt-4 text-sm">
                  {whatIf.after_percent === null
                    ? <div>{whatIf.message}</div>
                    : <div>Attendance would go from <b>{fmt(whatIf.before_percent, '%')}</b> to <b>{fmt(whatIf.after_percent, '%')}</b> <Badge kind={whatIf.status_after} /></div>}
                  {whatIf.crosses_threshold && <div className="mt-1 font-medium text-red-600">This would drop you below the policy minimum.</div>}
                  <FormulaBox formula={whatIf.formula} working={whatIf.working} />
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="mb-3 font-semibold">History</h2>
              {detail.records.length === 0 ? <Empty>No classes recorded yet.</Empty> : (
                <ul className="max-h-64 divide-y overflow-y-auto text-sm">
                  {detail.records.map((r) => (
                    <li key={r.record_id} className="flex items-center justify-between py-2">
                      <span>{r.date}</span>
                      <span className={r.status === 'present' ? 'text-emerald-600' : 'text-red-600'}>{r.status}</span>
                      <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => del(r)}>remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
