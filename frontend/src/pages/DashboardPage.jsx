import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import { formatEtbPlain } from "../utils/format";

function buildSalesSeries(sales, days = 7) {
  const buckets = new Map();
  const labels = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, 0);
    labels.push(key);
  }

  sales.forEach((sale) => {
    const key = new Date(sale.sold_at).toISOString().slice(0, 10);
    if (!buckets.has(key)) return;
    buckets.set(key, buckets.get(key) + Number(sale.total_amount || 0));
  });

  return labels.map((key) => ({
    key,
    label: new Date(`${key}T00:00:00`).toLocaleDateString("en-ET", { month: "short", day: "numeric" }),
    value: buckets.get(key) || 0,
  }));
}

function SalesLineChart({ points }) {
  if (!points.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No sales data yet.</p>;
  }

  const width = 560;
  const height = 220;
  const padX = 28;
  const padY = 20;
  const maxValue = Math.max(...points.map((p) => p.value), 1);

  const linePoints = points
    .map((point, index) => {
      const x = padX + (index * (width - padX * 2)) / Math.max(points.length - 1, 1);
      const y = height - padY - (point.value / maxValue) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padX},${height - padY} ${linePoints} ${width - padX},${height - padY}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[520px]">
        <defs>
          <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#94a3b8" strokeWidth="1" />
        <line x1={padX} y1={padY} x2={padX} y2={height - padY} stroke="#94a3b8" strokeWidth="1" />
        <polygon points={areaPoints} fill="url(#salesArea)" />
        <polyline points={linePoints} fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        {points.map((point, index) => {
          const x = padX + (index * (width - padX * 2)) / Math.max(points.length - 1, 1);
          const y = height - padY - (point.value / maxValue) * (height - padY * 2);
          return <circle key={point.key} cx={x} cy={y} r="4" fill="#047857" />;
        })}
        {points.map((point, index) => {
          const x = padX + (index * (width - padX * 2)) / Math.max(points.length - 1, 1);
          return (
            <text key={`${point.key}-label`} x={x} y={height - 6} textAnchor="middle" fontSize="11" fill="#64748b">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function CategoryBars({ bars }) {
  if (!bars.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No category data yet.</p>;
  }

  const max = Math.max(...bars.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {bars.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate pr-2">{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-brand-600 transition-all"
              style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [statsData, salesData, medicinesData, suppliersData] = await Promise.all([
        api.getStats(),
        api.listSales(),
        api.listMedicines(),
        api.listSuppliers(),
      ]);
      setStats(statsData);
      setSales(salesData);
      setMedicines(medicinesData);
      setSuppliers(suppliersData);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const readiness = useMemo(() => {
    if (!stats) return 0;
    if (!stats.medicine_count) return 100;
    const healthy = stats.medicine_count - stats.low_stock_count;
    return Math.max(0, Math.min(100, Math.round((healthy / stats.medicine_count) * 100)));
  }, [stats]);

  const topSelling = useMemo(() => {
    if (!sales.length || !medicines.length) return [];
    const medicineById = new Map(medicines.map((med) => [med.id, med]));
    const totals = new Map();

    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const current = totals.get(item.medicine_id) || { qty: 0, revenue: 0 };
        totals.set(item.medicine_id, {
          qty: current.qty + item.quantity,
          revenue: current.revenue + item.line_total,
        });
      });
    });

    return Array.from(totals.entries())
      .map(([medicineId, summary]) => ({
        medicineId,
        name: medicineById.get(medicineId)?.name || `#${medicineId}`,
        qty: summary.qty,
        revenue: summary.revenue,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, medicines]);

  const expiringSoon = useMemo(() => {
    if (!medicines.length) return [];
    const today = new Date();
    const horizonDays = 183;

    return medicines
      .map((med) => {
        const expiry = new Date(`${med.expiry_date}T00:00:00`);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return { ...med, diffDays };
      })
      .filter((med) => med.diffDays >= 0 && med.diffDays <= horizonDays)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5);
  }, [medicines]);

  const salesSeries = useMemo(() => buildSalesSeries(sales, 7), [sales]);

  const categoryBars = useMemo(() => {
    if (!medicines.length) return [];
    const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    const totals = new Map();

    medicines.forEach((med) => {
      const label = supplierById.get(med.supplier_id) || "Unassigned";
      totals.set(label, (totals.get(label) || 0) + Number(med.stock_qty || 0));
    });

    return Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [medicines, suppliers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-3xl border border-slate-200 bg-white skeleton-shimmer dark:border-slate-700 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 rounded-2xl border border-slate-200 bg-white skeleton-shimmer dark:border-slate-700 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border border-slate-200 bg-white skeleton-shimmer dark:border-slate-700 dark:bg-slate-800" />
          <div className="h-72 rounded-2xl border border-slate-200 bg-white skeleton-shimmer dark:border-slate-700 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="mt-1 text-sm">{error}</p>
        <button onClick={load} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="absolute -right-10 top-6 h-32 w-32 rounded-full bg-brand-100/70 blur-3xl anim-float" />
        <div className="absolute -left-10 bottom-4 h-24 w-24 rounded-full bg-emerald-100/70 blur-3xl anim-float" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Shift Snapshot</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">Pharmacy Operations Overview</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Clean operational view for inventory, sales, and supplier flow.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-slate-600 dark:bg-slate-700/40">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Readiness</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{readiness}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory coverage</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="anim-fade-up anim-delay-1">
          <StatCard label="Medicines" value={stats.medicine_count} hint="Tracked products" />
        </div>
        <div className="anim-fade-up anim-delay-2">
          <StatCard label="Suppliers" value={stats.supplier_count} hint="Active vendor base" />
        </div>
        <div className="anim-fade-up anim-delay-3">
          <StatCard label="Low Stock" value={stats.low_stock_count} hint="Needs replenishment" />
        </div>
        <div className="anim-fade-up anim-delay-4">
          <StatCard label="Sales" value={formatEtbPlain(stats.total_sales)} hint="Current reporting window" />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Frequent shortcuts for daily operations.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/sales" className="rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900">
            Sell Now
          </Link>
          <Link to="/purchases" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-100 dark:hover:bg-slate-700/60">
            Add Purchase
          </Link>
          <Link to="/suppliers" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-100 dark:hover:bg-slate-700/60">
            Add Supplier
          </Link>
          <Link to="/medicines" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-100 dark:hover:bg-slate-700/60">
            Restock Items
          </Link>
          <Link to="/stock" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-100 dark:hover:bg-slate-700/60">
            Open Stock Module
          </Link>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sales Trend (7 Days)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Line graph of daily sales totals.</p>
          </div>
          <SalesLineChart points={salesSeries} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Stock By Category</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bar chart grouped by supplier category.</p>
          </div>
          <CategoryBars bars={categoryBars} />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Moving Items</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Highest volume medicines in sales records.</p>
          <div className="space-y-3">
            {topSelling.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No sales data available yet.</p>
            ) : (
              topSelling.map((item) => (
                <div key={item.medicineId} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-600">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.qty} units sold - {formatEtbPlain(item.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Expiring Batches</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Medicines nearing expiry within 6 months.</p>
          <div className="space-y-3">
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No batches expiring soon.</p>
            ) : (
              expiringSoon.map((med) => (
                <div key={med.id} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-600">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expires {med.expiry_date} - Stock {med.stock_qty} - {med.diffDays} days left
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
