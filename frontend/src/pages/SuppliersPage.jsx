import { useEffect, useState } from "react";
import { api } from "../api/client";

const initialForm = { name: "", phone: "", address: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = () => api.listSuppliers().then(setSuppliers).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    await api.createSupplier(form);
    setForm(initialForm);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Add Supplier</h3>
        <input required placeholder="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input placeholder="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input placeholder="address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <button className="w-full rounded-lg bg-brand-700 px-3 py-2 font-medium text-white">Save</button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Suppliers</h3>
        <ul className="space-y-2">
          {suppliers.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-slate-500">{s.phone || "-"}</p>
              <p className="text-sm text-slate-500">{s.address || "-"}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
