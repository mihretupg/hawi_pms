import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import MedicinesPage from "./pages/MedicinesPage";
import SuppliersPage from "./pages/SuppliersPage";
import SalesPage from "./pages/SalesPage";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "medicines", label: "Medicines" },
  { key: "suppliers", label: "Suppliers" },
  { key: "sales", label: "Sales" },
];

export default function App() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-brand-900 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold md:text-3xl">Pharmacy Management System</h1>
          <p className="mt-2 text-sm text-brand-100">React + Tailwind + FastAPI + PostgreSQL</p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                active === tab.key ? "bg-brand-700 text-white" : "bg-white text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          {active === "dashboard" && <DashboardPage />}
          {active === "medicines" && <MedicinesPage />}
          {active === "suppliers" && <SuppliersPage />}
          {active === "sales" && <SalesPage />}
        </main>
      </div>
    </div>
  );
}
