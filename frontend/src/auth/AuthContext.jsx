import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "hawi_pms_auth";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = async ({ username, password }) => {
    const trimmed = username?.trim();
    if (!trimmed || !password) {
      return { ok: false, message: "Username and password are required." };
    }

    try {
      const userData = await api.login({ username: trimmed, password });
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || "Login failed." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
