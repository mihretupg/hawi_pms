import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function SalesPage() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState(1);

  async function loadAll() {
    const [medList, saleList] = await Promise.all([api.listMedicines(), api.listSales()]);
    setMedicines(medList);
    setSales(saleList);
  }

  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    await api.createSale({
      customer_name: customerName || null,
      items: [{ medicine_id: Number(medicineId), quantity: Number(quantity) }],
    });

    setCustomerName("");
    setMedicineId("");
    setQuantity(1);
    loadAll();
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
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Recent Sales</h3>
        <ul className="space-y-2">
          {sales.map((sale) => (
            <li key={sale.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium">Sale #{sale.id} - ${sale.total_amount.toFixed(2)}</p>
              <p className="text-sm text-slate-500">{sale.customer_name || "Walk-in customer"}</p>
              <p className="text-xs text-slate-400">{new Date(sale.sold_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
