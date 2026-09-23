import {
  BarChart3,
  Mail,
  DatabaseBackup,
  FolderKanban,
  Menu,
  Search,
  Settings,
  Wallet,
  Waypoints,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const links = [
    ['/', '대시보드', BarChart3],
    ['/projects', '프로젝트', FolderKanban],
    ['/costs', '비용', Wallet],
    ['/relations', '관계도', Waypoints],
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 transition md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-900">
            AI DevTracker
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/search"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <Search size={18} />
            검색
          </NavLink>
          <NavLink
            to="/backup"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <DatabaseBackup size={18} />
            백업
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-3 text-left">
            <img
              src="/luda-logo.jpg"
              alt="LUDA Research Group"
              className="w-12 shrink-0 rounded-lg"
            />
            <p className="whitespace-nowrap text-[11px] font-medium leading-snug text-slate-700">
              Lighting the Universe through
              <br />
              Data and AI
            </p>
          </div>
          <a
            href="mailto:contact@ludaresearch.org"
            className="mt-2 flex items-center justify-center gap-1.5 hover:text-slate-800"
          >
            <Mail size={13} /> contact@ludaresearch.org
          </a>
          <p className="mt-2">© 2026 LUDA. All rights reserved.</p>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <Settings size={17} /> 개인 워크스페이스
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
