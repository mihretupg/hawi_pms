import { formatEtbPlain } from "./format";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function openSaleReceiptPrint(sale, medicineById = new Map()) {
  const saleCode = sale.sale_code || `#${sale.id}`;
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
        <title>Receipt ${escapeHtml(saleCode)}</title>
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
              <div><strong>Receipt:</strong> ${escapeHtml(saleCode)}</div>
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
    return { ok: false, message: "Popup blocked. Allow popups to print receipt." };
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return { ok: true };
}
