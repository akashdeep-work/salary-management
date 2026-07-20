import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span className="mr-4 font-semibold text-slate-900">ACME Salary Manager</span>
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/employees" className={linkClass}>Employees</NavLink>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}