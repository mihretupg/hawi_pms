import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const initialForm = { name: "", phone: "", address: "" };
const pageSizes = [10, 25, 50];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  const load = async () => {
    try {
      setLoading(true);
      const list = await api.listSuppliers();
      setSuppliers(list);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.createSupplier(form);
      setForm(initialForm);
      load();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to create supplier");
    }
  }

  const filtered = useMemo(() => {
    return filterByQuery(suppliers, query, ["name", "phone", "address"]);
  }, [suppliers, query]);

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  function exportCsv() {
    const columns = [
      { header: "Name", accessor: "name" },
      { header: "Phone", accessor: "phone" },
      { header: "Address", accessor: "address" },
    ];
    const csv = buildCsv(filtered, columns);
    downloadCsv("suppliers.csv", csv);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Add Supplier</h3>
        <input required placeholder="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input placeholder="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input placeholder="address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <button className="w-full rounded-lg bg-brand-700 px-3 py-2 font-medium text-white">Save</button>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </form>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Suppliers</h3>
            <p className="text-xs text-slate-500">{total} records</p>
          </div>
          {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={3}>
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                pageItems.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-3 py-2 text-slate-600">{s.phone || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{s.address || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <p>
            Page {safePage} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage(safePage + 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}