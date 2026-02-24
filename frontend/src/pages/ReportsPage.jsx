import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatEtbPlain } from "../utils/format";
import { openSaleReceiptPrint } from "../utils/receipt";
import { filterByQuery, paginate } from "../utils/table";

const pageSizes = [10, 25, 50];

export default function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [medicineById, setMedicineById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, medicinesData] = await Promise.all([api.listSales(), api.listMedicines()]);
      setSales(salesData);
      setMedicineById(new Map(medicinesData.map((medicine) => [medicine.id, medicine.name])));
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const filtered = useMemo(
    () =>
      filterByQuery(sales, query, [
        "id",
        "sale_code",
        "customer_name",
        "seller_name",
        "seller_username",
        "sold_at",
        (row) => row.total_amount,
      ]),
    [sales, query]
  );

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  function printReceipt(sale) {
    const result = openSaleReceiptPrint(sale, medicineById);
    if (!result.ok) {
      setError(result.message);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Reports</h3>
          <p className="text-xs text-slate-500">{total} sales records</p>
        </div>
        {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by sale id, seller, customer..."
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
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Sale ID</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>
                  No sales found.
                </td>
              </tr>
            ) : (
              pageItems.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="px-3 py-2 font-medium text-slate-800">{sale.sale_code || `#${sale.id}`}</td>
                  <td className="px-3 py-2 text-slate-600">{new Date(sale.sold_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-600">{sale.seller_name || sale.seller_username || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{sale.customer_name || "Walk-in customer"}</td>
                  <td className="px-3 py-2 text-slate-600">{formatEtbPlain(sale.total_amount)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => printReceipt(sale)}
                      className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Print Receipt
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
  );
}
