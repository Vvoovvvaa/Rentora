"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminAuthApi } from "@/lib/api";

type AdminAuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  signIn: (gmail: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
const ADMIN_TOKEN_KEY = "rentora_admin_token";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAuthenticated(Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    ready,
    authenticated,
    signIn: async (gmail, password) => {
      const result = await adminAuthApi.login({ gmail, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, result.accessToken);
      setAuthenticated(true);
    },
    signOut: () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAuthenticated(false);
    },
  }), [authenticated, ready]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}
