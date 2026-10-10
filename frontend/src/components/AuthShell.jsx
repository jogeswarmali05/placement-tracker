import { Target } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-ink-900 p-12 lg:flex">
        <span className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <Target className="h-6 w-6 text-teal-400" /> Placement Tracker
        </span>
        <div>
          <p className="max-w-md font-display text-4xl font-bold leading-tight text-white">
            See which subjects are carrying you and which are holding you back.
          </p>
          <p className="mt-4 max-w-md text-ink-300">
            Log study hours and scores, keep revision notes next to each subject, and let the reports show where to spend tomorrow.
          </p>
        </div>
        <p className="text-sm text-ink-300">Aptitude, DSA, core subjects, interviews, government exams.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}
