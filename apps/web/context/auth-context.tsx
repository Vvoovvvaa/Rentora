"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authApi, userApi } from "@/lib/api";
import type { User } from "@/types/models";

type AuthContextValue = { user: User | null; loading: boolean; signIn: (gmail: string, password: string) => Promise<void>; signUp: (data: { name: string; phone: string; age: number; gmail: string; password: string }) => Promise<void>; signOut: () => void; refresh: () => Promise<void>; };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  const refresh = async () => { try { setUser(await userApi.me()); } catch { localStorage.removeItem("rentora_token"); setUser(null); } };
  useEffect(() => { void Promise.resolve().then(refresh).finally(() => setLoading(false)); }, []);
  const signIn = async (gmail: string, password: string) => { const data = await authApi.login({ gmail, password }); localStorage.setItem("rentora_token", data.accessToken); await refresh(); };
  const signUp = async (data: { name: string; phone: string; age: number; gmail: string; password: string }) => { const result = await authApi.register(data); localStorage.setItem("rentora_token", result.accessToken); await refresh(); };
  const signOut = () => { localStorage.removeItem("rentora_token"); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
