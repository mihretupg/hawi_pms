import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login({ username, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg md:grid-cols-[1.1fr,1fr]">
          <div className="hidden flex-col justify-between bg-brand-900 p-8 text-white md:flex">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-100">Hawi Medium Clinic</p>
              <h1 className="mt-4 text-3xl font-semibold">Pharmacy Management Console</h1>
              <p className="mt-3 text-sm text-brand-100">
                Track inventory, manage suppliers, and record sales with clarity.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-xs text-brand-50">
              Secure access for authorized team members only.
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">Sign in to continue to Hawi PMS.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                disabled={loading}
                className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-400">
              Use the admin credentials configured in the backend environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
