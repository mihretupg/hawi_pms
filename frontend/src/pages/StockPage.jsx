import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatEtbPlain } from "../utils/format";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const pageSizes = [10, 25, 50];
const LOW_STOCK_THRESHOLD = 10;

export default function StockPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  async function loadStock() {
    try {
      setLoading(true);
      const [medicines, suppliers] = await Promise.all([api.listMedicines(), api.listSuppliers()]);
      const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
      const normalized = medicines
        .map((medicine) => ({
          ...medicine,
          supplier_name: supplierById.get(medicine.supplier_id) || "Unassigned",
          stock_value: Number(medicine.unit_price || 0) * Number(medicine.stock_qty || 0),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setRows(normalized);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const filtered = useMemo(
    () =>
      filterByQuery(rows, query, ["name", "generic_name", "batch_number", "supplier_name", "expiry_date", "stock_qty"]),
    [rows, query]
  );

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  const summary = useMemo(() => {
    const totalUnits = rows.reduce((sum, row) => sum + Number(row.stock_qty || 0), 0);
    const totalStockValue = rows.reduce((sum, row) => sum + Number(row.stock_value || 0), 0);
    const lowStockItems = rows.filter((row) => Number(row.stock_qty || 0) <= LOW_STOCK_THRESHOLD).length;
    return { totalUnits, totalStockValue, lowStockItems };
  }, [rows]);

  function exportCsv() {
    const columns = [
      { header: "Medicine", accessor: "name" },
      { header: "Generic Name", accessor: "generic_name" },
      { header: "Batch", accessor: "batch_number" },
      { header: "Expiry Date", accessor: "expiry_date" },
      { header: "Supplier", accessor: "supplier_name" },
      { header: "Unit Price (ETB)", accessor: "unit_price" },
      { header: "Stock Qty", accessor: "stock_qty" },
      { header: "Stock Value (ETB)", accessor: (row) => Number(row.stock_value || 0).toFixed(2) },
    ];
    const csv = buildCsv(filtered, columns);
    downloadCsv("stock-report.csv", csv);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Medicines</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overall Units In Stock</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{summary.totalUnits}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Stock Value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{formatEtbPlain(summary.totalStockValue)}</p>
          <p className="mt-1 text-xs text-slate-500">Low stock items: {summary.lowStockItems}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Stock Module</h3>
            <p className="text-xs text-slate-500">{total} records</p>
          </div>
          {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search medicine, batch, supplier..."
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
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

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Medicine</th>
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2">Unit Price</th>
                <th className="px-3 py-2">Stock Qty</th>
                <th className="px-3 py-2">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={7}>
                    No stock records found.
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.generic_name || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.batch_number}</td>
                    <td className="px-3 py-2 text-slate-600">{row.supplier_name}</td>
                    <td className="px-3 py-2 text-slate-600">{row.expiry_date}</td>
                    <td className="px-3 py-2 text-slate-600">{formatEtbPlain(row.unit_price)}</td>
                    <td className="px-3 py-2 text-slate-600">
                      <span
                        className={
                          Number(row.stock_qty) <= LOW_STOCK_THRESHOLD ? "font-semibold text-rose-600" : "text-slate-600"
                        }
                      >
                        {row.stock_qty}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatEtbPlain(row.stock_value)}</td>
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
