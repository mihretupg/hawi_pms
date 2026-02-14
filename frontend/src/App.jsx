import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MedicinesPage from "./pages/MedicinesPage";
import NotFound from "./pages/NotFound";
import SalesPage from "./pages/SalesPage";
import SuppliersPage from "./pages/SuppliersPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}