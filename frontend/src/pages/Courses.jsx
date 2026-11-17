import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client.js';
import { Alert, Empty, Field, Modal, PageHeader, Spinner, fmt } from '../components/ui.jsx';

const BLANK = { code: '', title: '', instructor: '', credit_hours: 3, semester: 1, attendance_policy_min_percent: 75, max_allowed_absences: '', difficulty_rating: '' };

function CourseForm({ initial, onSaved, onCancel }) {
  const [f, setF] = useState(initial ? { ...BLANK, ...initial, instructor: initial.instructor ?? '', max_allowed_absences: initial.max_allowed_absences ?? '', difficulty_rating: initial.difficulty_rating ?? '' } : BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const num = (v) => (v === '' ? null : Number(v));
    const body = {
      code: f.code.trim(), title: f.title.trim(), instructor: f.instructor.trim() || null,
      credit_hours: Number(f.credit_hours), semester: Number(f.semester),
      attendance_policy_min_percent: Number(f.attendance_policy_min_percent),
      max_allowed_absences: num(f.max_allowed_absences), difficulty_rating: num(f.difficulty_rating),
    };
    try {
      const res = initial ? await api.put(`/courses/${initial.course_id}`, body) : await api.post('/courses', body);
      onSaved(res.data.course);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Alert>{error}</Alert>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Code"><input className="input" required value={f.code} onChange={set('code')} /></Field>
        <div className="col-span-2"><Field label="Title"><input className="input" required value={f.title} onChange={set('title')} /></Field></div>
      </div>
      <Field label="Instructor (label only)"><input className="input" value={f.instructor} onChange={set('instructor')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Credit hours (1–6)"><input className="input" type="number" min={1} max={6} required value={f.credit_hours} onChange={set('credit_hours')} /></Field>
        <Field label="Semester (1–12)"><input className="input" type="number" min={1} max={12} required value={f.semester} onChange={set('semester')} /></Field>
        <Field label="Min. attendance %" hint="Policy threshold for this course"><input className="input" type="number" min={0} max={100} step="0.01" required value={f.attendance_policy_min_percent} onChange={set('attendance_policy_min_percent')} /></Field>
        <Field label="Max allowed absences" hint="Optional"><input className="input" type="number" min={0} value={f.max_allowed_absences} onChange={set('max_allowed_absences')} /></Field>
        <Field label="Difficulty (1–5)" hint="Optional"><input className="input" type="number" min={1} max={5} value={f.difficulty_rating} onChange={set('difficulty_rating')} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save course'}</button>
      </div>
    </form>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | course

  const load = useCallback(() => api.get('/courses').then((r) => setCourses(r.data.courses)).catch((e) => setError(errorMessage(e))), []);
  useEffect(() => { load(); }, [load]);

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.code}? Its assessments, attendance and grade will also be deleted.`)) return;
    try { await api.delete(`/courses/${c.course_id}`); load(); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Courses" subtitle="Manage the courses you are taking or have completed." action={<button className="btn-primary" onClick={() => setEditing('new')}>+ Add course</button>} />
      <Alert>{error}</Alert>
      {!courses ? <Spinner /> : courses.length === 0 ? <Empty>No courses yet. Add your first course to get started.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Sem</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Min. attendance</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((c) => (
                <tr key={c.course_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.code}</td>
                  <td className="px-4 py-3"><Link className="text-brand-600 hover:underline" to={`/courses/${c.course_id}`}>{c.title}</Link>{c.instructor && <div className="text-xs text-slate-400">{c.instructor}</div>}</td>
                  <td className="px-4 py-3">{c.semester}</td>
                  <td className="px-4 py-3">{c.credit_hours}</td>
                  <td className="px-4 py-3">{fmt(c.attendance_policy_min_percent, '%')}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="mr-3 text-brand-600 hover:underline" onClick={() => setEditing(c)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing === 'new' ? 'Add course' : `Edit ${editing.code}`} onClose={() => setEditing(null)}>
          <CourseForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        </Modal>
      )}
    </>
  );
}
