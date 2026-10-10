import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, BarChart3, NotebookPen, UserCircle, LogOut, Menu, X, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subjects', label: 'Subjects & groups', icon: Layers },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-teal-600/20 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'}`}>
          <Icon className="h-[18px] w-[18px]" /> {label}
        </NavLink>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-900 py-5">
      <div className="mb-6 flex items-center gap-2 px-6">
        <Target className="h-6 w-6 text-teal-400" />
        <span className="font-display text-lg font-bold text-white">Placement Tracker</span>
      </div>
      {nav}
      <div className="mx-3 mt-4 border-t border-ink-700 pt-4">
        <div className="mb-3 px-3">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-ink-300">{user?.targetRole || user?.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink-900 px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-display font-bold text-white"><Target className="h-5 w-5 text-teal-400" /> Placement Tracker</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-white"><Menu /></button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 text-white"><X /></button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="w-full px-4 py-6 sm:px-8 lg:ml-64 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>
    </div>
  );
}
