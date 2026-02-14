import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Medicines", to: "/medicines" },
  { label: "Suppliers", to: "/suppliers" },
  { label: "Sales", to: "/sales" },
  { label: "Users", to: "/users" },
];

function getActiveLabel(pathname) {
  const normalized = pathname === "/" ? "/dashboard" : pathname;
  const match = navItems.find((item) => normalized.startsWith(item.to));
  return match?.label || "Overview";
}

export default function AppLayout() {
  const location = useLocation();
  const activeLabel = getActiveLabel(location.pathname);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Hawi PMS</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Pharmacy Console</h2>
            <p className="mt-1 text-xs text-slate-500">Operational overview</p>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs opacity-70">→</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm font-medium text-slate-700">Ready for shift</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</p>
                <h1 className="text-xl font-semibold text-slate-900">{activeLabel}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Live mode</span>
                <div className="hidden md:block text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Signed in</p>
                  <p className="text-sm font-medium text-slate-700">{user?.name || "User"}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Log out
                </button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-3 md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
                      isActive ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}