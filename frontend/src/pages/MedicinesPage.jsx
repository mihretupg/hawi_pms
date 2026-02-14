import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const initialForm = {
  name: "",
  generic_name: "",
  batch_number: "",
  expiry_date: "",
  unit_price: "",
  stock_qty: "",
  supplier_id: "",
};

const pageSizes = [10, 25, 50];

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  async function load() {
    try {
      setLoading(true);
      const [medList, supplierList] = await Promise.all([api.listMedicines(), api.listSuppliers()]);
      setMedicines(medList);
      setSuppliers(supplierList);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, supplierFilter, pageSize]);

  const supplierMap = useMemo(() => {
    return new Map(suppliers.map((s) => [String(s.id), s.name]));
  }, [suppliers]);

  const filtered = useMemo(() => {
    let list = filterByQuery(medicines, query, ["name", "generic_name", "batch_number", "expiry_date"]);
    if (supplierFilter !== "all") {
      list = list.filter((med) => String(med.supplier_id ?? "") === supplierFilter);
    }
    return list;
  }, [medicines, query, supplierFilter]);

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  async function submit(e) {
    e.preventDefault();

    try {
      await api.createMedicine({
        ...form,
        unit_price: Number(form.unit_price),
        stock_qty: Number(form.stock_qty),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      });

      setForm(initialForm);
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to add medicine");
    }
  }

  async function onAdjustStock(medicineId, delta) {
    try {
      await api.adjustMedicineStock(medicineId, delta);
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update stock");
    }
  }

  function exportCsv() {
    const columns = [
      { header: "Name", accessor: "name" },
      { header: "Generic", accessor: "generic_name" },
      { header: "Batch", accessor: "batch_number" },
      { header: "Expiry", accessor: "expiry_date" },
      { header: "Unit Price", accessor: "unit_price" },
      { header: "Stock", accessor: "stock_qty" },
      { header: "Supplier", accessor: (row) => supplierMap.get(String(row.supplier_id)) || "" },
    ];

    const csv = buildCsv(filtered, columns);
    downloadCsv("medicines.csv", csv);
  }

  if (loading) {
    return <p className="text-slate-500">Loading medicines...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Medicines</h2>
          <p className="text-sm text-slate-500">{total} items</p>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, batch, or expiry"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="all">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
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

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input className="rounded border px-3 py-2" placeholder="Medicine name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-3 py-2" placeholder="Generic name" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Batch" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} required />
        <input className="rounded border px-3 py-2" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
        <input className="rounded border px-3 py-2" type="number" min="0.01" step="0.01" placeholder="Unit price" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
        <input className="rounded border px-3 py-2" type="number" min="0" placeholder="Stock qty" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} required />
        <select className="rounded border px-3 py-2" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
          <option value="">Supplier (optional)</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="rounded bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700">Add Medicine</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Batch</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>
                  No medicines found.
                </td>
              </tr>
            ) : (
              pageItems.map((medicine) => (
                <tr key={medicine.id} className="border-t">
                  <td className="p-3">{medicine.name}</td>
                  <td className="p-3">{medicine.batch_number}</td>
                  <td className="p-3">{medicine.expiry_date}</td>
                  <td className="p-3">${medicine.unit_price}</td>
                  <td className="p-3">{medicine.stock_qty}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 hover:bg-slate-100"
                      onClick={() => onAdjustStock(medicine.id, 10)}
                    >
                      +10
                    </button>
                  </td>
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
    </section>
  );
}