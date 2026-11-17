import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/courses', label: 'Courses', icon: '▤' },
  { to: '/attendance', label: 'Attendance', icon: '✓' },
  { to: '/gpa', label: 'GPA / CGPA', icon: '★' },
];

export default function Layout() {
  const { student, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-indigo-100 hover:bg-brand-700'}`;

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between bg-brand-900 px-4 py-3 text-white md:hidden">
        <span className="font-semibold">StudyMate</span>
        <button aria-label="Toggle menu" onClick={() => setOpen(!open)} className="text-xl">☰</button>
      </header>

      <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 bg-brand-900 p-4 md:block md:min-h-screen md:w-60`}>
        <div className="mb-6 hidden px-3 text-xl font-bold text-white md:block">StudyMate</div>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}><span aria-hidden>{n.icon}</span>{n.label}</NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-brand-700 px-3 pt-4 text-sm text-indigo-200">
          <div className="truncate font-medium text-white">{student?.name}</div>
          <div className="truncate text-xs">{student?.email}</div>
          <button onClick={logout} className="mt-3 text-xs underline hover:text-white">Log out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
