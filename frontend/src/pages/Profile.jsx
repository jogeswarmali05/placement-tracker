import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI, errMsg } from '../services/api.js';
import { Alert, Field, PageHeader } from '../components/ui.jsx';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '', email: user.email || '', graduationYear: user.graduationYear || '',
    targetRole: user.targetRole || '', college: user.college || '', phone: user.phone || '',
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      const data = await userAPI.updateProfile(form);
      setUser(data.user);
      setMsg({ type: 'success', text: 'Profile updated' });
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Personal details</h2>
      <Alert type={msg.type}>{msg.text}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input type="email" required className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Graduation year"><input type="number" min="1990" max="2100" className="input" value={form.graduationYear} onChange={set('graduationYear')} /></Field>
        <Field label="Target role"><input className="input" value={form.targetRole} onChange={set('targetRole')} /></Field>
        <Field label="College / university"><input className="input" value={form.college} onChange={set('college')} /></Field>
        <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
      </div>
      <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return setMsg({ type: 'error', text: 'New password must be at least 8 characters' });
    if (form.newPassword !== form.confirm) return setMsg({ type: 'error', text: 'New passwords do not match' });
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await userAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed' });
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Change password</h2>
      <Alert type={msg.type}>{msg.text}</Alert>
      <Field label="Current password"><input type="password" required autoComplete="current-password" className="input" value={form.currentPassword} onChange={set('currentPassword')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password"><input type="password" required autoComplete="new-password" className="input" value={form.newPassword} onChange={set('newPassword')} /></Field>
        <Field label="Confirm new password"><input type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} /></Field>
      </div>
      <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></div>
    </form>
  );
}

export default function Profile() {
  return (
    <>
      <PageHeader title="Profile" subtitle="Your details and account security." />
      <div className="max-w-3xl space-y-5"><ProfileForm /><PasswordForm /></div>
    </>
  );
}
