import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Layers, NotebookPen, BarChart3 } from 'lucide-react';
import { groupAPI, subjectAPI, errMsg } from '../services/api.js';
import { Alert, EmptyState, Field, Modal, PageHeader, Spinner, confirmDelete, GROUP_COLORS } from '../components/ui.jsx';

const SUGGESTED = ['Academic', 'Placement', 'Government Job', 'Skills'];

function GroupForm({ initial, onSaved, onClose }) {
  const [form, setForm] = useState({ name: initial?.name || '', description: initial?.description || '', color: initial?.color || GROUP_COLORS[0] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      initial?._id ? await groupAPI.update(initial._id, form) : await groupAPI.create(form);
      onSaved();
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <Field label="Group name"><input required autoFocus maxLength={60} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Placement" /></Field>
      <Field label="Description (optional)"><input maxLength={300} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <div>
        <span className="label">Colour</span>
        <div className="flex gap-2">
          {GROUP_COLORS.map((c) => (
            <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} aria-label={`Colour ${c}`} aria-pressed={form.color === c}
              className={`h-7 w-7 rounded-full ring-offset-2 ${form.color === c ? 'ring-2 ring-ink-900' : ''}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save group'}</button>
      </div>
    </form>
  );
}

function SubjectForm({ initial, groups, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '', description: initial?.description || '',
    group: initial?.group?._id || initial?.group || groups[0]?._id || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      initial?._id ? await subjectAPI.update(initial._id, form) : await subjectAPI.create(form);
      onSaved();
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <Field label="Subject name"><input required autoFocus maxLength={80} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" /></Field>
      <Field label="Group">
        <select required className="input" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </Field>
      <Field label="Description (optional)"><input maxLength={300} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save subject'}</button>
      </div>
    </form>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupModal, setGroupModal] = useState(null);     // null | {} | group
  const [subjectModal, setSubjectModal] = useState(null); // null | { group } | subject

  const load = useCallback(async () => {
    try {
      const [g, s] = await Promise.all([groupAPI.list(), subjectAPI.list()]);
      setGroups(g); setSubjects(s);
    } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saved = () => { setGroupModal(null); setSubjectModal(null); load(); };

  const removeGroup = async (g) => {
    const n = subjects.filter((s) => s.group?._id === g._id).length;
    if (!confirmDelete(`"${g.name}"${n ? ` with its ${n} subject(s), reports and notes` : ''}`)) return;
    try { await groupAPI.remove(g._id); load(); } catch (e) { setError(errMsg(e)); }
  };
  const removeSubject = async (s) => {
    if (!confirmDelete(`"${s.name}" with its reports and notes`)) return;
    try { await subjectAPI.remove(s._id); load(); } catch (e) { setError(errMsg(e)); }
  };
  const addSuggested = async () => {
    try {
      for (let i = 0; i < SUGGESTED.length; i++) await groupAPI.create({ name: SUGGESTED[i], color: GROUP_COLORS[i] });
      load();
    } catch (e) { setError(errMsg(e)); }
  };

  if (loading) return <div className="grid place-items-center py-24"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Subjects & groups" subtitle="Groups hold subjects. Reports and notes attach to subjects.">
        <button className="btn-secondary" onClick={() => setGroupModal({})}><Plus className="h-4 w-4" /> New group</button>
        <button className="btn-primary" disabled={!groups.length} onClick={() => setSubjectModal({})}><Plus className="h-4 w-4" /> New subject</button>
      </PageHeader>
      <div className="mb-4"><Alert>{error}</Alert></div>

      {groups.length === 0 ? (
        <EmptyState icon={Layers} title="No groups yet" text="Groups keep related subjects together, such as Academic, Placement, Government Job or Skills.">
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={addSuggested}>Add the four suggested groups</button>
            <button className="btn-secondary" onClick={() => setGroupModal({})}>Create my own</button>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const list = subjects.filter((s) => s.group?._id === g._id);
            return (
              <section key={g._id} className="card overflow-hidden" style={{ borderTopColor: g.color, borderTopWidth: 3 }}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">{g.name} <span className="text-sm font-normal text-slate-400">({list.length})</span></h2>
                    {g.description && <p className="text-sm text-slate-500">{g.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn-secondary !py-1.5" onClick={() => setSubjectModal({ group: g._id })}><Plus className="h-4 w-4" /> Subject</button>
                    <button className="btn-ghost" aria-label={`Edit ${g.name}`} onClick={() => setGroupModal(g)}><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost hover:!text-red-600" aria-label={`Delete ${g.name}`} onClick={() => removeGroup(g)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {list.length === 0 ? (
                  <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">No subjects in this group yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100">
                    {list.map((s) => (
                      <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{s.name}</p>
                          {s.description && <p className="truncate text-sm text-slate-500">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Link to={`/reports?subject=${s._id}`} className="btn-ghost gap-1 text-xs font-semibold"><BarChart3 className="h-4 w-4" /> Reports</Link>
                          <Link to={`/notes?subject=${s._id}`} className="btn-ghost gap-1 text-xs font-semibold"><NotebookPen className="h-4 w-4" /> Notes</Link>
                          <button className="btn-ghost" aria-label={`Edit ${s.name}`} onClick={() => setSubjectModal(s)}><Pencil className="h-4 w-4" /></button>
                          <button className="btn-ghost hover:!text-red-600" aria-label={`Delete ${s.name}`} onClick={() => removeSubject(s)}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {groupModal && (
        <Modal title={groupModal._id ? 'Edit group' : 'New group'} onClose={() => setGroupModal(null)}>
          <GroupForm initial={groupModal} onSaved={saved} onClose={() => setGroupModal(null)} />
        </Modal>
      )}
      {subjectModal && (
        <Modal title={subjectModal._id ? 'Edit subject' : 'New subject'} onClose={() => setSubjectModal(null)}>
          <SubjectForm initial={subjectModal} groups={groups} onSaved={saved} onClose={() => setSubjectModal(null)} />
        </Modal>
      )}
    </>
  );
}
