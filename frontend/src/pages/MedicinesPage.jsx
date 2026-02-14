import { useState } from "react";

export function MedicinesPage({ medicines, suppliers, onCreate, onAdjustStock }) {
  const [form, setForm] = useState({
    name: "",
    generic_name: "",
    batch_number: "",
    expiry_date: "",
    unit_price: "",
    stock_qty: "",
    supplier_id: "",
  });

  async function submit(e) {
    e.preventDefault();
    await onCreate({
      ...form,
      unit_price: Number(form.unit_price),
      stock_qty: Number(form.stock_qty),
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
    });

    setForm({ name: "", generic_name: "", batch_number: "", expiry_date: "", unit_price: "", stock_qty: "", supplier_id: "" });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Medicines</h2>

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
            {medicines.map((medicine) => (
              <tr key={medicine.id} className="border-t">
                <td className="p-3">{medicine.name}</td>
                <td className="p-3">{medicine.batch_number}</td>
                <td className="p-3">{medicine.expiry_date}</td>
                <td className="p-3">${medicine.unit_price}</td>
                <td className="p-3">{medicine.stock_qty}</td>
                <td className="p-3">
                  <button
                    className="rounded border px-2 py-1 hover:bg-slate-100"
                    onClick={() => onAdjustStock(medicine.id, 10)}
                  >
                    +10
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
