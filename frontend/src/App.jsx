import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";
import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MedicinesPage from "./pages/MedicinesPage";
import NotFound from "./pages/NotFound";
import PurchasesPage from "./pages/PurchasesPage";
import SalesPage from "./pages/SalesPage";
import SettingsPage from "./pages/SettingsPage";
import StockPage from "./pages/StockPage";
import SuppliersPage from "./pages/SuppliersPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const allRoles = ["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"];
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
        <Route
          path="dashboard"
          element={
            <RequireRole roles={allRoles}>
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="medicines"
          element={
            <RequireRole roles={["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"]}>
              <MedicinesPage />
            </RequireRole>
          }
        />
        <Route
          path="stock"
          element={
            <RequireRole roles={["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"]}>
              <StockPage />
            </RequireRole>
          }
        />
        <Route
          path="suppliers"
          element={
            <RequireRole roles={["Super Admin", "Admin", "Pharmacist", "Inventory", "Cashier"]}>
              <SuppliersPage />
            </RequireRole>
          }
        />
        <Route
          path="purchases"
          element={
            <RequireRole roles={["Super Admin", "Admin", "Pharmacist", "Inventory"]}>
              <PurchasesPage />
            </RequireRole>
          }
        />
        <Route
          path="sales"
          element={
            <RequireRole roles={["Super Admin", "Admin", "Pharmacist", "Cashier"]}>
              <SalesPage />
            </RequireRole>
          }
        />
        <Route
          path="users"
          element={
            <RequireRole roles={["Super Admin"]}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <SettingsPage />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
