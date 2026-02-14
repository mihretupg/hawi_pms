import { useEffect, useState } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return <p className="text-slate-500">Loading dashboard...</p>;
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
