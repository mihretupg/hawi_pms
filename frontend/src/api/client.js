const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("hawi_pms_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const user = getStoredUser();
  const authHeaders =
    user && Number.isFinite(user.id)
      ? {
          "X-User-Id": String(user.id),
          "X-User-Role": user.role,
        }
      : {};

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
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
  listUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (userId, payload) => request(`/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateUserStatus: (userId, active) =>
    request(`/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteUser: (userId) => request(`/users/${userId}`, { method: "DELETE" }),
  resetUserPassword: (userId, newPassword) =>
    request(`/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword || null }),
    }),
  changePassword: (payload) =>
    request("/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
};
