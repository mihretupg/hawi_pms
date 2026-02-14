import { useEffect, useState } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <p className="text-slate-500">Loading dashboard...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="mt-1 text-sm">{error}</p>
        <button onClick={load} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Medicines" value={stats.medicine_count} />
      <StatCard label="Suppliers" value={stats.supplier_count} />
      <StatCard label="Low Stock Items" value={stats.low_stock_count} />
      <StatCard label="Total Sales" value={`$${stats.total_sales.toFixed(2)}`} />
    </div>
  );
}