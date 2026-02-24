import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", roles: ["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"] },
  { label: "Medicines", to: "/medicines", roles: ["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"] },
  { label: "Stock", to: "/stock", roles: ["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"] },
  { label: "Purchases", to: "/purchases", roles: ["Super Admin", "Admin", "Pharmacist", "Inventory"] },
  { label: "Suppliers", to: "/suppliers", roles: ["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"] },
  { label: "Sales", to: "/sales", roles: ["Super Admin", "Admin", "Pharmacist", "Cashier"] },
  { label: "Reports", to: "/reports", roles: ["Super Admin", "Admin", "Pharmacist", "Cashier"] },
  { label: "Users", to: "/users", roles: ["Super Admin"] },
];

function getActiveLabel(pathname) {
  const normalized = pathname === "/" ? "/dashboard" : pathname;
  if (normalized.startsWith("/settings")) {
    return "Settings";
  }
  const match = navItems.find((item) => normalized.startsWith(item.to));
  return match?.label || "Overview";
}

export default function AppLayout() {
  const location = useLocation();
  const activeLabel = getActiveLabel(location.pathname);
  const { user, logout } = useAuth();
  const allowedNavItems = navItems.filter((item) => item.roles.includes(user?.role || ""));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("hawi_pms_theme");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:flex">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-100">Hawi PMS</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Pharmacy Console</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Operational overview</p>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-5">
            {allowedNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs opacity-70">-&gt;</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ready for shift</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Section</p>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{activeLabel}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Live mode</span>
                <div className="hidden text-right md:block">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Signed in</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || "User"}</p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Profile
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {user?.role || "User"}
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20"
                      >
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-3 dark:border-slate-700 md:hidden">
              {allowedNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
                      isActive
                        ? "bg-brand-700 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
