import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Field } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue tracking your preparation."
      footer={<>New here? <Link className="font-semibold text-teal-700 hover:underline" to="/register">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Email">
          <input type="email" required autoComplete="email" className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}
