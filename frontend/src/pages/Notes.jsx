import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Trash2, Search, NotebookPen, ArrowLeft, Save } from 'lucide-react';
import { noteAPI, subjectAPI, errMsg } from '../services/api.js';
import { Alert, EmptyState, PageHeader, Spinner, confirmDelete, fmtDate } from '../components/ui.jsx';

export default function Notes() {
  const [params, setParams] = useSearchParams();
  const subjectFilter = params.get('subject') || '';
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState(null); // note being edited or a new unsaved note
  const [view, setView] = useState('write'); // write | preview
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => { subjectAPI.list().then(setSubjects).catch((e) => setError(errMsg(e))); }, []);

  const loadNotes = useCallback(async () => {
    try {
      setNotes(await noteAPI.list({ subject: subjectFilter || undefined, q: q || undefined }));
    } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [subjectFilter, q]);

  // Debounced search / filter
  useEffect(() => { const t = setTimeout(loadNotes, 250); return () => clearTimeout(t); }, [loadNotes]);

  const newNote = () => {
    setError(''); setSaved(''); setView('write');
    setDraft({ title: '', content: '', subject: subjectFilter || subjects[0]?._id || '' });
  };
  const openNote = (n) => { setError(''); setSaved(''); setView('write'); setDraft({ ...n, subject: n.subject?._id || n.subject }); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setSaved('');
    try {
      const payload = { title: draft.title, content: draft.content, subject: draft.subject };
      const note = draft._id ? await noteAPI.update(draft._id, payload) : await noteAPI.create(payload);
      setDraft({ ...note, subject: note.subject._id });
      setSaved('Note saved');
      loadNotes();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!draft._id || !confirmDelete(`"${draft.title}"`)) return;
    try { await noteAPI.remove(draft._id); setDraft(null); loadNotes(); } catch (err) { setError(errMsg(err)); }
  };

  if (loading) return <div className="grid place-items-center py-24"><Spinner /></div>;

  if (!subjects.length)
    return (
      <>
        <PageHeader title="Notes" />
        <EmptyState icon={NotebookPen} title="Add a subject first" text="Notes are stored under subjects.">
          <Link to="/subjects" className="btn-primary">Go to subjects</Link>
        </EmptyState>
      </>
    );

  return (
    <>
      <PageHeader title="Notes" subtitle="Revision notes per subject. Markdown supported.">
        <button className="btn-primary" onClick={newNote}><Plus className="h-4 w-4" /> New note</button>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className={draft ? 'hidden lg:block' : ''}>
          <select className="input mb-2" value={subjectFilter} aria-label="Filter by subject"
            onChange={(e) => (e.target.value ? setParams({ subject: e.target.value }) : setParams({}))}>
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.group?.name})</option>)}
          </select>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search notes" />
          </div>
          {notes.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              {q ? 'No notes match your search.' : 'No notes yet for this view.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n._id}>
                  <button onClick={() => openNote(n)}
                    className={`card w-full p-3 text-left transition-colors hover:border-teal-600 ${draft?._id === n._id ? '!border-teal-600 bg-teal-50/50' : ''}`}>
                    <p className="truncate font-semibold text-slate-800">{n.title}</p>
                    <p className="truncate text-xs text-slate-500">{n.subject?.name} · {fmtDate(n.updatedAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={draft ? '' : 'hidden lg:block'}>
          {!draft ? (
            <EmptyState icon={NotebookPen} title="Pick a note or start a new one" text="Write summaries, formulas, or interview answers you want to revise later." />
          ) : (
            <form onSubmit={save} className="card p-4 sm:p-5">
              <button type="button" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 lg:hidden" onClick={() => setDraft(null)}>
                <ArrowLeft className="h-4 w-4" /> All notes
              </button>
              <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_220px]">
                <input required maxLength={120} className="input font-display text-base font-semibold" placeholder="Note title" aria-label="Title"
                  value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <select required className="input" aria-label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div className="mb-2 inline-flex rounded-md border border-slate-200 p-0.5" role="tablist">
                {['write', 'preview'].map((v) => (
                  <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
                    className={`rounded px-3 py-1 text-sm font-semibold capitalize ${view === v ? 'bg-ink-900 text-white' : 'text-slate-600'}`}>{v}</button>
                ))}
              </div>

              {view === 'write' ? (
                <textarea className="input min-h-[360px] font-mono leading-6" aria-label="Note content"
                  placeholder={'# Heading\n- bullet point\n**bold**, `code`, [link](https://…)'}
                  value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
              ) : (
                <div className="md-body min-h-[360px] rounded-md border border-slate-200 p-4">
                  {draft.content.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown> : <p className="text-slate-400">Nothing to preview yet.</p>}
                </div>
              )}

              <div className="mt-3 space-y-2"><Alert>{error}</Alert><Alert type="success">{saved}</Alert></div>
              <div className="mt-4 flex items-center justify-between">
                {draft._id ? <button type="button" className="btn-secondary !text-red-600" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button> : <span />}
                <button className="btn-primary" disabled={busy}><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save note'}</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
