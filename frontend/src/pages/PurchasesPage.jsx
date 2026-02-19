import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatEtbPlain } from "../utils/format";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const pageSizes = [10, 25, 50];

const initialLine = {
  medicine_id: "",
  quantity: 1,
  unit_cost: "",
};

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");
  const [line, setLine] = useState(initialLine);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  async function loadAll() {
    try {
      setLoading(true);
      const [supplierList, medicineList, purchaseList] = await Promise.all([
        api.listSuppliers(),
        api.listMedicines(),
        api.listPurchases(),
      ]);
      setSuppliers(supplierList);
      setMedicines(medicineList);
      setPurchases(purchaseList);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load purchase data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  function addItem() {
    setError("");
    if (!line.medicine_id || Number(line.quantity) <= 0 || Number(line.unit_cost) <= 0) {
      setError("Select medicine, quantity, and unit cost before adding item.");
      return;
    }

    const med = medicines.find((m) => m.id === Number(line.medicine_id));
    if (!med) {
      setError("Selected medicine not found.");
      return;
    }

    const nextItem = {
      medicine_id: Number(line.medicine_id),
      medicine_name: med.name,
      quantity: Number(line.quantity),
      unit_cost: Number(line.unit_cost),
      line_total: Number(line.quantity) * Number(line.unit_cost),
    };

    setItems((prev) => [...prev, nextItem]);
    setLine(initialLine);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitPurchase(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!items.length) {
      setError("Add at least one item to create a purchase.");
      return;
    }

    setSaving(true);
    try {
      await api.createPurchase({
        supplier_id: supplierId ? Number(supplierId) : null,
        invoice_number: invoiceNumber || null,
        note: note || null,
        items: items.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      });

      setSupplierId("");
      setInvoiceNumber("");
      setNote("");
      setItems([]);
      setLine(initialLine);
      setSuccess("Purchase recorded and stock updated.");
      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  }

  const draftTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.line_total || 0), 0),
    [items]
  );

  const filtered = useMemo(() => {
    return filterByQuery(purchases, query, [
      "id",
      "invoice_number",
      "note",
      "purchased_at",
      (row) => row.total_amount,
      (row) => row.items?.length || 0,
    ]);
  }, [purchases, query]);

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  function exportCsv() {
    const columns = [
      { header: "Purchase ID", accessor: "id" },
      { header: "Invoice", accessor: "invoice_number" },
      { header: "Items", accessor: (row) => row.items?.length || 0 },
      { header: "Total", accessor: (row) => formatEtbPlain(row.total_amount) },
      { header: "Purchased At", accessor: "purchased_at" },
    ];

    const csv = buildCsv(filtered, columns);
    downloadCsv("purchases.csv", csv);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <form onSubmit={submitPurchase} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Purchase</h3>

        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Supplier (optional)</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <input
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Invoice number"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />

        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Add Line Item</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={line.medicine_id}
              onChange={(e) => setLine((prev) => ({ ...prev, medicine_id: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Select medicine</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name} (stock: {med.stock_qty})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={line.quantity}
              onChange={(e) => setLine((prev) => ({ ...prev, quantity: e.target.value }))}
              placeholder="Quantity"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={line.unit_cost}
              onChange={(e) => setLine((prev) => ({ ...prev, unit_cost: e.target.value }))}
              placeholder="Unit cost (ETB)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-900"
            >
              Add Item
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">Items</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{items.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">Draft total</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatEtbPlain(draftTotal)}</span>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            {items.map((item, index) => (
              <div key={`${item.medicine_id}-${index}`} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs dark:bg-slate-900">
                <span className="pr-2 text-slate-700 dark:text-slate-200">
                  {item.medicine_name} x{item.quantity} @ {formatEtbPlain(item.unit_cost)}
                </span>
                <button type="button" onClick={() => removeItem(index)} className="text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-700 px-3 py-2 font-semibold text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Purchase"}
        </button>
      </form>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Purchase History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{total} records</p>
          </div>
          {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice, date, note"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    No purchases found.
                  </td>
                </tr>
              ) : (
                pageItems.map((purchase) => (
                  <tr key={purchase.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">#{purchase.id}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{purchase.invoice_number || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{purchase.items?.length || 0}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatEtbPlain(purchase.total_amount)}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(purchase.purchased_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Page {safePage} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-slate-600"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage(safePage + 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
