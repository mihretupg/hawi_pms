import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatEtbPlain } from "../utils/format";
import { openSaleReceiptPrint } from "../utils/receipt";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const pageSizes = [10, 25, 50];

export default function SalesPage() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [lastCommittedSale, setLastCommittedSale] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  async function loadAll() {
    try {
      setLoading(true);
      const [medList, saleList] = await Promise.all([api.listMedicines(), api.listSales()]);
      setMedicines(medList);
      setSales(saleList);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load sales data");
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

  const medicineById = useMemo(
    () => new Map(medicines.map((medicine) => [medicine.id, medicine.name])),
    [medicines]
  );

  function getSaleItemsText(sale) {
    const items = sale?.items || [];
    if (!items.length) return "-";
    return items
      .map((item) => `${medicineById.get(item.medicine_id) || `#${item.medicine_id}`} x${item.quantity}`)
      .join(", ");
  }

  function printSaleReceipt(sale) {
    const receiptResult = openSaleReceiptPrint(sale, medicineById);
    if (!receiptResult.ok) {
      setError(receiptResult.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const savedSale = await api.createSale({
        customer_name: customerName || null,
        items: [{ medicine_id: Number(medicineId), quantity: Number(quantity) }],
      });
      setLastCommittedSale(savedSale);

      setCustomerName("");
      setMedicineId("");
      setQuantity(1);
      loadAll();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to record sale");
    }
  }

  const filtered = useMemo(() => {
    return filterByQuery(sales, query, [
      "id",
      "sale_code",
      "customer_name",
      "seller_name",
      "seller_username",
      "sold_at",
      (row) => getSaleItemsText(row),
      (row) => row.total_amount,
    ]);
  }, [sales, query, medicineById]);

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  function exportCsv() {
    const columns = [
      { header: "Sale ID", accessor: (row) => row.sale_code || `#${row.id}` },
      { header: "Seller", accessor: (row) => row.seller_name || row.seller_username || "-" },
      { header: "Customer", accessor: "customer_name" },
      { header: "Items", accessor: (row) => getSaleItemsText(row) },
      { header: "Total", accessor: (row) => formatEtbPlain(row.total_amount) },
      { header: "Sold At", accessor: "sold_at" },
    ];
    const csv = buildCsv(filtered, columns);
    downloadCsv("sales.csv", csv);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Record Sale</h3>
        <input
          placeholder="customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <select
          required
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Select medicine</option>
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>{m.name} (stock: {m.stock_qty})</option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <button className="w-full rounded-lg bg-brand-700 px-3 py-2 font-medium text-white">Save Sale</button>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        {lastCommittedSale ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-emerald-700">Sale committed: {lastCommittedSale.sale_code || `#${lastCommittedSale.id}`}</p>
            <p className="mt-1">Customer: {lastCommittedSale.customer_name || "Walk-in customer"}</p>
            <div className="mt-2 overflow-hidden rounded border border-emerald-100 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-1">Item</th>
                    <th className="px-2 py-1">Qty</th>
                    <th className="px-2 py-1">Price</th>
                    <th className="px-2 py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lastCommittedSale.items || []).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1">{medicineById.get(item.medicine_id) || `Medicine #${item.medicine_id}`}</td>
                      <td className="px-2 py-1">{item.quantity}</td>
                      <td className="px-2 py-1">{formatEtbPlain(item.unit_price)}</td>
                      <td className="px-2 py-1">{formatEtbPlain(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-semibold">Total: {formatEtbPlain(lastCommittedSale.total_amount)}</p>
              <button
                type="button"
                onClick={() => printSaleReceipt(lastCommittedSale)}
                className="rounded border border-emerald-200 bg-white px-3 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Print Receipt
              </button>
            </div>
          </div>
        ) : null}
      </form>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Recent Sales</h3>
            <p className="text-xs text-slate-500">{total} records</p>
          </div>
          {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by seller, customer, or sale id"
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
                <th className="px-3 py-2">Sale ID</th>
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Sold Items</th>
                <th className="px-3 py-2">Total (ETB)</th>
                <th className="px-3 py-2">Sold At</th>
                <th className="px-3 py-2">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={7}>
                    No sales found.
                  </td>
                </tr>
              ) : (
                pageItems.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="px-3 py-2 font-medium text-slate-800">{sale.sale_code || `#${sale.id}`}</td>
                    <td className="px-3 py-2 text-slate-600">{sale.seller_name || sale.seller_username || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{sale.customer_name || "Walk-in customer"}</td>
                    <td className="px-3 py-2 text-slate-600">{getSaleItemsText(sale)}</td>
                    <td className="px-3 py-2 text-slate-600">{formatEtbPlain(sale.total_amount)}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(sale.sold_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => printSaleReceipt(sale)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Print
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
      </div>
    </div>
  );
}
