import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ClipboardList } from 'lucide-react';
import { reportAPI, subjectAPI, errMsg } from '../services/api.js';
import {
  Alert, EmptyState, Field, Modal, PageHeader, ProgressBar, Spinner, StatusBadge,
  confirmDelete, fmtDate, toInputDate,
} from '../components/ui.jsx';

const STATUSES = ['Not Started', 'In Progress', 'Completed'];
const scoreColor = (s) => (s === null ? '#94a3b8' : s >= 75 ? '#059669' : s >= 60 ? '#d97706' : '#c2410c');

// "HH:mm" -> minutes since midnight
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Hours between start and end, rounded to the nearest 0.25h. Handles sessions that cross midnight.
const calcHours = (start, end) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return '';
  let diff = e - s;
  if (diff <= 0) diff += 24 * 60;
  return Math.round(diff / 15) / 4;
};

// "14:30" -> "2:30 PM"
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function SubjectSelect({ subjects, value, onChange, allowAll, required }) {
  const byGroup = subjects.reduce((acc, s) => {
    const k = s.group?.name || 'Other';
    (acc[k] = acc[k] || []).push(s);
    return acc;
  }, {});
  return (
    <select className="input" value={value} required={required} onChange={(e) => onChange(e.target.value)}>
      {allowAll ? <option value="">All subjects</option> : <option value="" disabled>Select subject</option>}
      {Object.entries(byGroup).map(([g, list]) => (
        <optgroup key={g} label={g}>{list.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</optgroup>
      ))}
    </select>
  );
}

function ReportForm({ initial, subjects, defaultSubject, onSaved, onClose }) {
  const [form, setForm] = useState({
    subject: initial?.subject?._id || defaultSubject || '',
    unitName: initial?.unitName || '',
    topicsCovered: initial?.topicsCovered || '',
    date: toInputDate(initial?.date),
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    status: initial?.status || 'In Progress',
    score: initial?.score ?? '',
    hoursSpent: initial?.hoursSpent ?? '',
    remarks: initial?.remarks || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // When start/end change, auto-fill hours (still editable afterwards)
  const setTime = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    const hrs = calcHours(next.startTime, next.endTime);
    if (hrs !== '') next.hoursSpent = hrs;
    setForm(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      initial?._id ? await reportAPI.update(initial._id, form) : await reportAPI.create(form);
      onSaved();
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Subject"><SubjectSelect required subjects={subjects} value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} /></Field>
        <Field label="Unit name">
          <input type="text" required maxLength={120} className="input" value={form.unitName} onChange={set('unitName')} placeholder="e.g. Unit 3: Thermodynamics" />
        </Field>
      </div>
      <Field label="Topics covered">
        <textarea rows={2} required maxLength={500} className="input" value={form.topicsCovered} onChange={set('topicsCovered')} placeholder="e.g. First law, entropy, Carnot cycle" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" required className="input" value={form.date} max={toInputDate()} onChange={set('date')} /></Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Start time"><input type="time" required className="input" value={form.startTime} onChange={setTime('startTime')} /></Field>
        <Field label="End time"><input type="time" required className="input" value={form.endTime} onChange={setTime('endTime')} /></Field>
        <Field label="Hours spent"><input type="number" min="0" max="24" step="0.25" className="input" value={form.hoursSpent} onChange={set('hoursSpent')} /></Field>
        <Field label="Score (0–100, optional)"><input type="number" min="0" max="100" className="input" value={form.score} onChange={set('score')} /></Field>
      </div>
      <Field label="Remarks (optional)">
        <textarea rows={3} maxLength={500} className="input" value={form.remarks} onChange={set('remarks')} placeholder="What was hard? Anything to revisit?" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save report'}</button>
      </div>
    </form>
  );
}

function Overview({ data }) {
  const { groups, subjects, strengths, weakAreas } = data;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g._id} className="card p-4" style={{ borderLeftColor: g.color, borderLeftWidth: 4 }}>
            <p className="font-display font-bold text-ink-900">{g.name}</p>
            <p className="mb-3 text-xs text-slate-500">{g.subjectCount} subjects · {g.hours}h · {g.avgScore === null ? 'no scores yet' : `avg ${g.avgScore}%`}</p>
            <ProgressBar value={g.progress} color={g.color} label={`${g.name} progress`} />
            <p className="mt-1 text-right text-xs font-semibold text-slate-600">{g.progress}%</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><TrendingUp className="h-4 w-4 text-emerald-600" /> Strong areas (75%+)</h3>
          {strengths.length ? strengths.map((s) => <p key={s._id} className="flex justify-between py-1 text-sm"><span>{s.name} <span className="text-slate-400">· {s.groupName}</span></span><b className="text-emerald-700">{s.avgScore}%</b></p>)
            : <p className="text-sm text-slate-500">None yet. Log scores to see strengths.</p>}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><TrendingDown className="h-4 w-4 text-orange-600" /> Weak areas (below 60%)</h3>
          {weakAreas.length ? weakAreas.map((s) => <p key={s._id} className="flex justify-between py-1 text-sm"><span>{s.name} <span className="text-slate-400">· {s.groupName}</span></span><b className="text-orange-700">{s.avgScore}%</b></p>)
            : <p className="text-sm text-slate-500">Nothing below 60%. Keep it up.</p>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>{['Subject', 'Group', 'Status', 'Sessions', 'Hours', 'Avg score', 'Last activity'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <tr key={s._id}>
                <td className="px-4 py-2.5 font-medium"><Link className="hover:text-teal-700 hover:underline" to={`/notes?subject=${s._id}`}>{s.name}</Link></td>
                <td className="px-4 py-2.5"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.groupName}</td>
                <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2.5">{s.sessions}</td>
                <td className="px-4 py-2.5">{s.hours}</td>
                <td className="w-40 px-4 py-2.5">
                  {s.avgScore === null ? <span className="text-slate-400">—</span> : (
                    <div className="flex items-center gap-2"><div className="flex-1"><ProgressBar value={s.avgScore} color={scoreColor(s.avgScore)} label="score" /></div><span className="w-10 text-right font-semibold">{s.avgScore}%</span></div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{fmtDate(s.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ subject: params.get('subject') || '', status: '' });
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [s, a, r] = await Promise.all([subjectAPI.list(), reportAPI.analytics(), reportAPI.list(clean)]);
      setSubjects(s); setAnalytics(a); setReports(r); setError('');
    } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { loadAll(); }, [loadAll]);

  // A deep link from a subject (?subject=ID) opens the log tab
  useEffect(() => { if (params.get('subject')) setTab('log'); }, []); // eslint-disable-line

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    if (k === 'subject') v ? setParams({ subject: v }) : setParams({});
  };
  const remove = async (r) => {
    if (!confirmDelete('this report')) return;
    try { await reportAPI.remove(r._id); loadAll(); } catch (e) { setError(errMsg(e)); }
  };

  if (loading) return <div className="grid place-items-center py-24"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Reports" subtitle="Log your progress and see where you stand.">
        <button className="btn-primary" disabled={!subjects.length} onClick={() => setModal({})}><Plus className="h-4 w-4" /> Log progress</button>
      </PageHeader>
      <div className="mb-4"><Alert>{error}</Alert></div>

      {subjects.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Add a subject first" text="Reports are logged against subjects.">
          <Link to="/subjects" className="btn-primary">Go to subjects</Link>
        </EmptyState>
      ) : (
        <>
          <div className="mb-5 inline-flex rounded-md border border-slate-200 bg-white p-1" role="tablist">
            {[['overview', 'Overview'], ['log', 'Activity log']].map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-ink-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>

          {tab === 'overview' && analytics && <Overview data={analytics} />}

          {tab === 'log' && (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                <SubjectSelect allowAll subjects={subjects} value={filters.subject} onChange={(v) => setFilter('subject', v)} />
                <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                  <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {reports.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No reports match" text="Log a study session to start building your history." />
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>{['Date', 'Subject', 'Unit', 'Topics covered', 'Time', 'Status', 'Score', 'Hours', 'Remarks', ''].map((h, i) => <th key={i} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((r) => (
                        <tr key={r._id}>
                          <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(r.date)}</td>
                          <td className="px-4 py-2.5 font-medium">{r.subject?.name || 'Deleted subject'}<span className="block text-xs font-normal text-slate-400">{r.subject?.group?.name}</span></td>
                          <td className="px-4 py-2.5">{r.unitName || '—'}</td>
                          <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-600" title={r.topicsCovered}>{r.topicsCovered || '—'}</td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            {r.startTime && r.endTime ? `${fmtTime(r.startTime)} – ${fmtTime(r.endTime)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-2.5">{r.score ?? '—'}</td>
                          <td className="px-4 py-2.5">{r.hoursSpent}</td>
                          <td className="max-w-[220px] truncate px-4 py-2.5 text-slate-500" title={r.remarks}>{r.remarks || '—'}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right">
                            <button className="btn-ghost" aria-label="Edit report" onClick={() => setModal(r)}><Pencil className="h-4 w-4" /></button>
                            <button className="btn-ghost hover:!text-red-600" aria-label="Delete report" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {modal && (
        <Modal wide title={modal._id ? 'Edit report' : 'Log progress'} onClose={() => setModal(null)}>
          <ReportForm initial={modal} subjects={subjects} defaultSubject={filters.subject}
            onSaved={() => { setModal(null); loadAll(); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </>
  );
}
