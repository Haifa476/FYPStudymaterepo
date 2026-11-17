import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/client.js';
import { Alert, Field } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', program: '', current_semester: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const payload = { name: form.name, email: form.email, password: form.password };
    if (form.program.trim()) payload.program = form.program.trim();
    if (form.current_semester) payload.current_semester = Number(form.current_semester);
    try { await register(payload); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Create your account</h1>
          <p className="text-sm text-slate-500">StudyMate is a personal planner – your data is visible only to you.</p>
        </div>
        <Alert>{error}</Alert>
        <Field label="Full name"><input className="input" required minLength={2} value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a digit"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Field label="Program (optional)"><input className="input" value={form.program} onChange={set('program')} /></Field></div>
          <Field label="Semester"><input className="input" type="number" min={1} max={12} value={form.current_semester} onChange={set('current_semester')} /></Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link className="font-medium text-brand-600" to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
