import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Field } from '../components/ui.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', graduationYear: '', targetRole: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true); setError('');
    try {
      await register(form);
      navigate('/subjects', { replace: true }); // start by setting up groups
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Set up in a minute, then add your subjects."
      footer={<>Already registered? <Link className="font-semibold text-teal-700 hover:underline" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Full name"><input required className="input" value={form.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email"><input type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password (8+ characters)">
          <input type="password" required minLength={8} className="input" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Graduation year"><input type="number" min="1990" max="2100" className="input" value={form.graduationYear} onChange={set('graduationYear')} placeholder="2027" /></Field>
          <Field label="Target role"><input className="input" value={form.targetRole} onChange={set('targetRole')} placeholder="Software Engineer" /></Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
