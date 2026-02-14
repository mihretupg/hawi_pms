const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getStats: () => request("/dashboard/stats"),
  listMedicines: () => request("/medicines"),
  createMedicine: (payload) => request("/medicines", { method: "POST", body: JSON.stringify(payload) }),
  adjustMedicineStock: (medicineId, delta) =>
    request(`/medicines/${medicineId}/stock?delta=${encodeURIComponent(delta)}`, { method: "PATCH" }),
  listSuppliers: () => request("/suppliers"),
  createSupplier: (payload) => request("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
  listSales: () => request("/sales"),
  createSale: (payload) => request("/sales", { method: "POST", body: JSON.stringify(payload) }),
};
