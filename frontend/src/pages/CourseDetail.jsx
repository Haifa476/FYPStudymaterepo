import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client.js';
import { Alert, Badge, Empty, Field, Modal, PageHeader, Spinner, fmt } from '../components/ui.jsx';

const TYPES = ['assignment', 'quiz', 'midterm', 'final', 'project'];
const BLANK = { type: 'assignment', title: '', due_date: '', weight_percent: '', max_marks: '', obtained_marks: '' };

function AssessmentForm({ courseId, initial, onSaved, onCancel }) {
  const [f, setF] = useState(initial ? { ...BLANK, ...initial, due_date: initial.due_date || '', obtained_marks: initial.obtained_marks ?? '' } : BLANK);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError('');
    const body = {
      type: f.type, title: f.title.trim(), due_date: f.due_date || null,
      weight_percent: Number(f.weight_percent), max_marks: Number(f.max_marks),
      obtained_marks: f.obtained_marks === '' ? null : Number(f.obtained_marks),
    };
    try {
      if (initial) await api.put(`/assessments/${initial.assessment_id}`, body);
      else await api.post('/assessments', { ...body, course_id: courseId });
      onSaved();
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Alert>{error}</Alert>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Type"><select className="input" value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <div className="col-span-2"><Field label="Title"><input className="input" required value={f.title} onChange={set('title')} /></Field></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date"><input className="input" type="date" value={f.due_date} onChange={set('due_date')} /></Field>
        <Field label="Weight (%)"><input className="input" type="number" min={0} max={100} step="0.01" required value={f.weight_percent} onChange={set('weight_percent')} /></Field>
        <Field label="Max marks"><input className="input" type="number" min={0.01} step="0.01" required value={f.max_marks} onChange={set('max_marks')} /></Field>
        <Field label="Obtained marks" hint="Leave empty if not graded yet"><input className="input" type="number" min={0} step="0.01" value={f.obtained_marks} onChange={set('obtained_marks')} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary">Save assessment</button>
      </div>
    </form>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([api.get(`/courses/${id}`), api.get('/assessments', { params: { course_id: id } })]);
      setCourse(c.data.course); setItems(a.data.assessments);
    } catch (e) { setError(errorMessage(e)); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try { await api.delete(`/assessments/${a.assessment_id}`); load(); } catch (e) { setError(errorMessage(e)); }
  };

  if (error && !course) return <><Alert>{error}</Alert><Link className="text-brand-600" to="/courses">← Back to courses</Link></>;
  if (!course || !items) return <Spinner />;
  const totalWeight = items.reduce((s, a) => s + a.weight_percent, 0);

  return (
    <>
      <Link className="text-sm text-brand-600 hover:underline" to="/courses">← Back to courses</Link>
      <PageHeader title={`${course.code} – ${course.title}`} subtitle={`Semester ${course.semester} · ${course.credit_hours} credit hours · assessment weight allocated: ${totalWeight}%`}
        action={<button className="btn-primary" onClick={() => setEditing('new')}>+ Add assessment</button>} />
      <Alert>{error}</Alert>
      {items.length === 0 ? <Empty>No assessments yet for this course.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y">
              {items.map((a) => (
                <tr key={a.assessment_id}>
                  <td className="px-4 py-3 font-medium">{a.title}</td><td className="px-4 py-3 capitalize">{a.type}</td>
                  <td className="px-4 py-3">{fmt(a.due_date)}</td><td className="px-4 py-3">{a.weight_percent}%</td>
                  <td className="px-4 py-3">{a.obtained_marks === null ? '—' : a.obtained_marks} / {a.max_marks}</td>
                  <td className="px-4 py-3"><Badge kind={a.status} /></td>
                  <td className="px-4 py-3 text-right"><button className="mr-3 text-brand-600 hover:underline" onClick={() => setEditing(a)}>Edit</button><button className="text-red-600 hover:underline" onClick={() => remove(a)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing === 'new' ? 'Add assessment' : 'Edit assessment'} onClose={() => setEditing(null)}>
          <AssessmentForm courseId={course.course_id} initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        </Modal>
      )}
    </>
  );
}
