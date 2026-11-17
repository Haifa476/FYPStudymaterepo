import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Badge, Empty, PageHeader, Spinner, StatCard, fmt } from '../components/ui.jsx';

const COLORS = { safe: '#10b981', at_risk: '#f59e0b', below_threshold: '#ef4444', no_data: '#cbd5e1' };

export default function Dashboard() {
  const { student } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard/summary').then((r) => setData(r.data)).catch((e) => setError(errorMessage(e))); }, []);

  if (!data) return error ? <Alert>{error}</Alert> : <Spinner />;
  const alerts = data.attendance.filter((c) => c.summary.status === 'below_threshold' || c.summary.status === 'at_risk');
  const chart = data.attendance.filter((c) => c.summary.classes_conducted > 0).map((c) => ({ code: c.code, percent: c.summary.attendance_percent ?? 0, status: c.summary.status, min: c.summary.policy_min_percent }));

  return (
    <>
      <PageHeader title={`Welcome, ${student.name.split(' ')[0]}`} subtitle="A snapshot of your academic standing." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CGPA" value={fmt(data.cgpa.value)} hint={student.target_cgpa ? `Target ${student.target_cgpa}` : `${data.cgpa.total_credit_hours} credit hours`} />
        <StatCard label="Courses" value={data.counts.courses} />
        <StatCard label="Open assessments" value={data.counts.pending_assessments} hint="Not yet graded" />
        <StatCard label="Attendance alerts" value={alerts.length} hint="Courses near/below minimum" />
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((c) => (
            <Alert key={c.course_id} kind={c.summary.status === 'below_threshold' ? 'error' : 'info'}>
              <b>{c.code}</b>: {c.summary.attendance_percent}% attendance (minimum {c.summary.policy_min_percent}%). {c.summary.message}
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Attendance by course</h2>
          {chart.length === 0 ? <Empty>No attendance recorded yet.</Empty> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="code" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="percent" radius={[4, 4, 0, 0]}>{chart.map((c, i) => <Cell key={i} fill={COLORS[c.status]} />)}</Bar>
                  {chart[0] && <ReferenceLine y={chart[0].min} stroke="#64748b" strokeDasharray="4 4" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">Dashed line = policy minimum of the first course. Colours: green safe, amber warning, red below minimum.</p>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">GPA by semester</h2>
          {data.semester_gpas.length === 0 ? <Empty>Add grades on the <Link className="text-brand-600" to="/gpa">GPA page</Link> to see your trend.</Empty> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.semester_gpas.map((s) => ({ name: `Sem ${s.semester}`, gpa: s.gpa }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} /><YAxis domain={[0, 4]} fontSize={12} />
                  <Tooltip /><Line type="monotone" dataKey="gpa" stroke="#4f46e5" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Upcoming assessments</h2>
          {data.upcoming_assessments.length === 0 ? <Empty>Nothing due soon.</Empty> : (
            <ul className="divide-y text-sm">
              {data.upcoming_assessments.map((a) => (
                <li key={a.assessment_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><b>{a.course_code}</b> · {a.title} <span className="text-slate-400">({a.type})</span></span>
                  <span className="flex items-center gap-3"><span className="text-slate-500">Due {a.due_date}</span><Badge kind={a.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
