import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { buildCsv, downloadCsv, filterByQuery, paginate } from "../utils/table";

const roles = ["Super Admin", "Admin", "Pharmacist", "Cashier", "Inventory"];
const pageSizes = [10, 25, 50];

const emptyForm = { name: "", email: "", role: roles[0], password: "" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, pageSize]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setMessage("");
    api
      .listUsers()
      .then((data) => {
        if (!ignore) setUsers(data);
      })
      .catch((err) => {
        if (!ignore) setError(err?.message || "Failed to load users.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const activeCount = useMemo(() => users.filter((u) => u.active).length, [users]);

  const filtered = useMemo(() => {
    let list = filterByQuery(users, query, ["name", "email", "role"]);
    if (roleFilter !== "all") {
      list = list.filter((user) => user.role === roleFilter);
    }
    return list;
  }, [users, query, roleFilter]);

  const { pageItems, pageCount, page: safePage, total } = paginate(filtered, page, pageSize);

  async function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      password: form.password.trim() || undefined,
    };
    if (!payload.name || !payload.email) return;

    setError("");
    setMessage("");
    try {
      const created = await api.createUser(payload);
      setUsers((prev) => [created, ...prev]);
      setForm(emptyForm);
      setMessage("User created. Default password applied.");
    } catch (err) {
      setError(err?.message || "Failed to create user.");
    }
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  }

  async function saveEdit() {
    setError("");
    setMessage("");
    try {
      const updated = await api.updateUser(editingId, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      setEditingId(null);
      setMessage("User updated.");
    } catch (err) {
      setError(err?.message || "Failed to update user.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function removeUser(id) {
    setError("");
    setMessage("");
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setMessage("User deleted.");
    } catch (err) {
      setError(err?.message || "Failed to delete user.");
    }
  }

  async function toggleStatus(id) {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    setError("");
    setMessage("");
    try {
      const updated = await api.updateUserStatus(id, !target.active);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setMessage("User status updated.");
    } catch (err) {
      setError(err?.message || "Failed to update status.");
    }
  }

  async function resetPassword(user) {
    const newPassword = window.prompt(
      "Enter a new password to set for this user. Leave blank to use the default password."
    );
    if (newPassword === null) return;

    setError("");
    setMessage("");
    try {
      await api.resetUserPassword(user.id, newPassword.trim() || null);
      setMessage("Password reset completed.");
    } catch (err) {
      setError(err?.message || "Failed to reset password.");
    }
  }

  function exportCsv() {
    const columns = [
      { header: "Name", accessor: "name" },
      { header: "Email", accessor: "email" },
      { header: "Role", accessor: "role" },
      { header: "Status", accessor: (row) => (row.active ? "Active" : "Inactive") },
    ];
    const csv = buildCsv(filtered, columns);
    downloadCsv("users.csv", csv);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">{activeCount} active users</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          Roles: Super Admin, Admin, Pharmacist, Cashier, Inventory
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Add User</h3>
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="password"
            placeholder="Password (optional)"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="w-full rounded-lg bg-brand-700 px-3 py-2 font-medium text-white">Create User</button>
          <p className="text-xs text-slate-400">
            Leave password blank to use the default password from the backend.
          </p>
        </form>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Team Members</h3>
              <p className="text-xs text-slate-500">{total} records</p>
            </div>
          </div>
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {loading ? <p className="text-sm text-slate-500">Loading users...</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
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
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-3 py-2">
                        {editingId === user.id ? (
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full rounded border border-slate-300 px-2 py-1"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{user.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === user.id ? (
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                            className="w-full rounded border border-slate-300 px-2 py-1"
                          />
                        ) : (
                          <span className="text-slate-600">{user.email}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === user.id ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                            className="w-full rounded border border-slate-300 px-2 py-1"
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{user.role}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            user.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {editingId === user.id ? (
                            <>
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(user)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(user.id)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                              >
                                {user.active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => resetPassword(user)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                              >
                                Reset Password
                              </button>
                              <button
                                type="button"
                                onClick={() => removeUser(user.id)}
                                className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
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
    </section>
  );
}
