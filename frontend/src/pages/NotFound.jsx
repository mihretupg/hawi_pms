import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold text-slate-800">Page not found</h2>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}