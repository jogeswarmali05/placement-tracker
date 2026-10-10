import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Gauge, CheckCircle2, BookOpen, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { reportAPI, errMsg } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, EmptyState, PageHeader, ProgressBar, Spinner } from '../components/ui.jsx';

const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="card p-4">
    <div className="flex items-center gap-2 text-sm text-slate-500"><Icon className="h-4 w-4" /> {label}</div>
    <p className="mt-2 font-display text-3xl font-bold text-ink-900">{value}</p>
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

const SubjectList = ({ items, empty, tone }) =>
  items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : (
    <ul className="divide-y divide-slate-100">
      {items.map((s) => (
        <li key={s._id} className="flex items-center justify-between py-2 text-sm">
          <span><span className="font-medium text-slate-800">{s.name}</span> <span className="text-slate-400">· {s.groupName}</span></span>
          {s.avgScore !== null && <span className={`font-semibold ${tone}`}>{s.avgScore}%</span>}
        </li>
      ))}
    </ul>
  );

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { reportAPI.analytics().then(setData).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <div className="grid place-items-center py-24"><Spinner /></div>;

  const { overview: o, groups, strengths, weakAreas, notStarted, weekly } = data;
  const maxH = Math.max(1, ...weekly.map((d) => d.hours));
  const firstName = user.name.split(' ')[0];

  if (o.subjects === 0)
    return (
      <>
        <PageHeader title={`Welcome, ${firstName}`} subtitle="Start by creating groups and subjects to track." />
        <EmptyState icon={Layers} title="Nothing to track yet" text="Create groups like Placement or Skills, then add subjects under them.">
          <Link to="/subjects" className="btn-primary">Set up subjects</Link>
        </EmptyState>
      </>
    );

  return (
    <>
      <PageHeader title={`Hi ${firstName}`}
        subtitle={user.targetRole ? `Preparing for ${user.targetRole}${user.graduationYear ? ` · batch of ${user.graduationYear}` : ''}` : 'Your preparation at a glance'}>
        <Link to="/reports" className="btn-primary">Log progress</Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Gauge} label="Overall progress" value={`${o.overallProgress}%`} hint={`across ${o.subjects} subjects`} />
        <Stat icon={CheckCircle2} label="Completed" value={`${o.completed}/${o.subjects}`} hint="subjects finished" />
        <Stat icon={Clock} label="Hours logged" value={o.totalHours} hint="all time" />
        <Stat icon={BookOpen} label="Average score" value={o.avgScore === null ? '—' : `${o.avgScore}%`} hint="across scored subjects" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold">Progress by group</h2>
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g._id}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-slate-800">{g.name}</span>
                  <span className="text-slate-500">{g.progress}% · {g.hours}h{g.avgScore !== null && ` · avg ${g.avgScore}%`}</span>
                </div>
                <ProgressBar value={g.progress} color={g.color} label={`${g.name} progress`} />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Hours this week</h2>
          <div className="flex h-36 items-end gap-2">
            {weekly.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] text-slate-500">{d.hours || ''}</span>
                <div className="w-full rounded-t bg-teal-600" style={{ height: `${(d.hours / maxH) * 100}%`, minHeight: d.hours ? 4 : 2, opacity: d.hours ? 1 : 0.2 }} />
                <span className="text-xs text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><TrendingUp className="h-5 w-5 text-emerald-600" /> Strengths</h2>
          <SubjectList items={strengths} tone="text-emerald-700" empty="Subjects scoring 75% or more will show up here." />
        </section>
        <section className="card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><TrendingDown className="h-5 w-5 text-orange-600" /> Needs work</h2>
          <SubjectList items={weakAreas} tone="text-orange-700" empty="No subject is scoring below 60%." />
        </section>
        <section className="card p-5">
          <h2 className="mb-2 text-lg font-bold">Not started</h2>
          <SubjectList items={notStarted} tone="" empty="Every subject has at least one log." />
        </section>
      </div>
    </>
  );
}
