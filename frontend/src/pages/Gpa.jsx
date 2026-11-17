import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, Field, FormulaBox, PageHeader, Spinner, StatCard, fmt } from '../components/ui.jsx';

export default function Gpa() {
  const { student } = useAuth();
  const [summary, setSummary] = useState(null);
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [scale, setScale] = useState({});
  const [error, setError] = useState('');
  const [add, setAdd] = useState({ course_id: '', letter_grade: 'A' });
  const [target, setTarget] = useState({ target_cgpa: student?.target_cgpa ?? '', remaining_credit_hours: '' });
  const [targetRes, setTargetRes] = useState(null);
  const [scen, setScen] = useState([{ credit_hours: 3, letter_grade: 'A' }]);
  const [whatIf, setWhatIf] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, g, c, sc] = await Promise.all([api.get('/gpa/summary'), api.get('/grades'), api.get('/courses'), api.get('/gpa/scale')]);
      setSummary(s.data); setGrades(g.data.grades); setCourses(c.data.courses); setScale(sc.data.scale);
    } catch (e) { setError(errorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const letters = Object.keys(scale);
  const gradedIds = new Set(grades.map((g) => g.course_id));
  const available = courses.filter((c) => !gradedIds.has(c.course_id));

  const run = async (fn) => { setError(''); try { await fn(); } catch (e) { setError(errorMessage(e)); } };
  const addGrade = (e) => { e.preventDefault(); run(async () => { await api.post('/grades', { course_id: Number(add.course_id), letter_grade: add.letter_grade }); setAdd({ ...add, course_id: '' }); await load(); }); };
  const changeGrade = (g, letter) => run(async () => { await api.put(`/grades/${g.grade_id}`, { letter_grade: letter }); await load(); });
  const delGrade = (g) => run(async () => { await api.delete(`/grades/${g.grade_id}`); await load(); });
  const planTarget = (e) => { e.preventDefault(); run(async () => {
    const body = { remaining_credit_hours: Number(target.remaining_credit_hours) };
    if (target.target_cgpa !== '') body.target_cgpa = Number(target.target_cgpa);
    setTargetRes((await api.post('/gpa/target', body)).data.result);
  }); };
  const simulate = (e) => { e.preventDefault(); run(async () => setWhatIf((await api.post('/gpa/what-if', { scenarios: scen.map((s) => ({ credit_hours: Number(s.credit_hours), letter_grade: s.letter_grade })) })).data.result)); };
  const setScenario = (i, k, v) => setScen(scen.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  if (!summary) return error ? <Alert>{error}</Alert> : <Spinner />;
  const { cgpa, semesters } = summary;

  return (
    <>
      <PageHeader title="GPA / CGPA" subtitle="Grades are converted with the grade-point scale; every result shows its working." />
      <Alert>{error}</Alert>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="CGPA" value={fmt(cgpa.value)} hint={`${cgpa.total_credit_hours} credit hours graded`} />
        <StatCard label="Quality points" value={cgpa.total_quality_points} hint="Σ credit hours × grade points" />
        <StatCard label="Semesters graded" value={semesters.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Grades</h2>
          <form onSubmit={addGrade} className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="Course">
              <select className="input" required value={add.course_id} onChange={(e) => setAdd({ ...add, course_id: e.target.value })}>
                <option value="">Select…</option>
                {available.map((c) => <option key={c.course_id} value={c.course_id}>{c.code} – {c.title}</option>)}
              </select>
            </Field>
            <Field label="Grade"><select className="input" value={add.letter_grade} onChange={(e) => setAdd({ ...add, letter_grade: e.target.value })}>{letters.map((l) => <option key={l}>{l}</option>)}</select></Field>
            <button className="btn-primary" disabled={!add.course_id}>Add grade</button>
          </form>
          {grades.length === 0 ? <Empty>No grades recorded yet.</Empty> : (
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2">Course</th><th>Sem</th><th>Credits</th><th>Grade</th><th>Points</th><th /></tr></thead>
              <tbody className="divide-y">
                {grades.map((g) => (
                  <tr key={g.grade_id}>
                    <td className="py-2 font-medium">{g.course_code}</td><td>{g.semester}</td><td>{g.credit_hours}</td>
                    <td><select aria-label={`Grade for ${g.course_code}`} className="rounded border border-slate-300 px-1 py-0.5" value={g.letter_grade} onChange={(e) => changeGrade(g, e.target.value)}>{letters.map((l) => <option key={l}>{l}</option>)}</select></td>
                    <td>{g.grade_points}</td>
                    <td className="text-right"><button className="text-xs text-red-600 hover:underline" onClick={() => delGrade(g)}>remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Semester GPAs and CGPA</h2>
          {semesters.length === 0 ? <Empty>Add grades to see your GPA.</Empty> : (
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2">Semester</th><th>Credits</th><th>GPA</th></tr></thead>
              <tbody className="divide-y">
                {semesters.map((s) => <tr key={s.semester}><td className="py-2">Semester {s.semester}</td><td>{s.gpa.total_credit_hours}</td><td className="font-medium">{s.gpa.value}</td></tr>)}
                <tr className="bg-slate-50 font-semibold"><td className="py-2">CGPA</td><td>{cgpa.total_credit_hours}</td><td>{cgpa.value}</td></tr>
              </tbody>
            </table>
          )}
          <FormulaBox formula={cgpa.formula} working={cgpa.working} steps={cgpa.steps} />
          <p className="mt-3 text-xs text-slate-400">Scale in use (assumed 4.0 scale – to be verified against university policy): {letters.map((l) => `${l}=${scale[l]}`).join(', ')}</p>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Target CGPA planner</h2>
          <form onSubmit={planTarget} className="flex flex-wrap items-end gap-3">
            <Field label="Target CGPA"><input className="input w-28" type="number" min={0} max={4} step="0.01" value={target.target_cgpa} onChange={(e) => setTarget({ ...target, target_cgpa: e.target.value })} /></Field>
            <Field label="Remaining credit hours"><input className="input w-40" type="number" min={1} required value={target.remaining_credit_hours} onChange={(e) => setTarget({ ...target, remaining_credit_hours: e.target.value })} /></Field>
            <button className="btn-primary">Calculate</button>
          </form>
          {targetRes && (
            <div className="mt-4 text-sm">
              <p className={targetRes.feasible ? 'font-medium text-slate-800' : 'font-medium text-red-600'}>{targetRes.message}</p>
              <FormulaBox formula={targetRes.formula} working={targetRes.working} />
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">What-if: hypothetical grades</h2>
          <form onSubmit={simulate} className="space-y-2">
            {scen.map((s, i) => (
              <div key={i} className="flex items-end gap-3">
                <Field label={i === 0 ? 'Credit hours' : ''}><input className="input w-24" type="number" min={1} max={6} value={s.credit_hours} onChange={(e) => setScenario(i, 'credit_hours', e.target.value)} /></Field>
                <Field label={i === 0 ? 'Grade' : ''}><select className="input" value={s.letter_grade} onChange={(e) => setScenario(i, 'letter_grade', e.target.value)}>{letters.map((l) => <option key={l}>{l}</option>)}</select></Field>
                {scen.length > 1 && <button type="button" className="pb-2 text-xs text-red-600" onClick={() => setScen(scen.filter((_, j) => j !== i))}>remove</button>}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setScen([...scen, { credit_hours: 3, letter_grade: 'B' }])}>+ Add course</button>
              <button className="btn-primary">Project CGPA</button>
            </div>
          </form>
          {whatIf && (
            <div className="mt-4 text-sm">
              CGPA would change from <b>{fmt(whatIf.current_cgpa)}</b> to <b>{fmt(whatIf.projected_cgpa)}</b> ({whatIf.change > 0 ? '+' : ''}{fmt(whatIf.change)}).
              <FormulaBox formula={whatIf.formula} working={whatIf.working} steps={whatIf.steps} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
