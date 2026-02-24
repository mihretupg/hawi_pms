import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatEtbPlain } from "../utils/format";
import { filterByQuery, paginate } from "../utils/table";

const pageSizes = [10, 25, 50];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
    const itemsHtml = (sale.items || [])
      .map((item) => {
        const name = medicineById.get(item.medicine_id) || `Medicine #${item.medicine_id}`;
        return `
          <tr>
            <td>${escapeHtml(name)}</td>
            <td style="text-align:right;">${escapeHtml(item.quantity)}</td>
            <td style="text-align:right;">${escapeHtml(formatEtbPlain(item.unit_price))}</td>
            <td style="text-align:right;">${escapeHtml(formatEtbPlain(item.line_total))}</td>
          </tr>
        `;
      })
      .join("");

    const soldAt = new Date(sale.sold_at).toLocaleString();
    const seller = sale.seller_name || sale.seller_username || "Unknown";
    const customer = sale.customer_name || "Walk-in customer";
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt #${escapeHtml(sale.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
            .receipt { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; padding: 16px; }
            .header { margin-bottom: 12px; }
            .header h1 { font-size: 18px; margin: 0 0 6px; }
            .meta { font-size: 13px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th, td { border-bottom: 1px solid #eee; padding: 8px 4px; }
            th { text-align: left; }
            .total { margin-top: 14px; text-align: right; font-size: 15px; font-weight: 700; }
            .footer { margin-top: 18px; font-size: 12px; color: #444; }
            @media print {
              body { margin: 0; }
              .receipt { border: 0; max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Hawi Pharmacy - Sales Receipt</h1>
              <div class="meta">
                <div><strong>Receipt:</strong> #${escapeHtml(sale.id)}</div>
                <div><strong>Date:</strong> ${escapeHtml(soldAt)}</div>
                <div><strong>Seller:</strong> ${escapeHtml(seller)}</div>
                <div><strong>Customer:</strong> ${escapeHtml(customer)}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th style="text-align:right;">Qty</th>
                  <th style="text-align:right;">Unit Price</th>
                  <th style="text-align:right;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total">Total: ${escapeHtml(formatEtbPlain(sale.total_amount))}</div>
            <div class="footer">Thank you.</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=900");
    if (!printWindow) {
      setError("Popup blocked. Allow popups to print receipt.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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
                  <td className="px-3 py-2 font-medium text-slate-800">#{sale.id}</td>
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
