"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, userApi } from "@/lib/api";
import { AUTH_FAILURE_EVENT, clearUserSession, emitAuthFailure, getAuthFailureKind, type AuthFailureKind, USER_TOKEN_KEY } from "@/lib/auth-session";
import type { User } from "@/types/models";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authNotice: AuthFailureKind | "signed-out" | null;
  signIn: (gmail: string, password: string) => Promise<void>;
  signUp: (data: { name: string; phone: string; age: number; gmail: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  dismissAuthNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<AuthFailureKind | "signed-out" | null>(null);

  const clearState = useCallback(() => {
    clearUserSession();
    setUser(null);
  }, []);

  useEffect(() => {
    const onAuthFailure = (event: Event) => {
      const failure = (event as CustomEvent<AuthFailureKind>).detail;
      clearState();
      setAuthNotice(failure);
      router.replace(failure === "account-blocked" ? "/account-blocked" : "/login");
    };
    window.addEventListener(AUTH_FAILURE_EVENT, onAuthFailure);
    return () => window.removeEventListener(AUTH_FAILURE_EVENT, onAuthFailure);
  }, [clearState, router]);

  const refresh = useCallback(async () => {
    try {
      setUser(await userApi.me());
    } catch {
      clearState();
    }
  }, [clearState]);

  useEffect(() => {
    void Promise.resolve().then(refresh).finally(() => setLoading(false));
  }, [refresh]);

  const signIn = async (gmail: string, password: string) => {
    try {
      const data = await authApi.login({ gmail, password });
      localStorage.setItem(USER_TOKEN_KEY, data.accessToken);
      await refresh();
    } catch (error) {
      const failure = getAuthFailureKind(error);
      if (failure === "account-blocked") emitAuthFailure(failure);
      throw error;
    }
  };

  const signUp = async (data: { name: string; phone: string; age: number; gmail: string; password: string }) => {
    const result = await authApi.register(data);
    localStorage.setItem(USER_TOKEN_KEY, result.accessToken);
    await refresh();
  };

  const signOut = async () => {
    const token = localStorage.getItem(USER_TOKEN_KEY);
    try {
      if (token) await authApi.logout();
    } catch {
      // Local sign-out still succeeds if the server is unavailable or the token is already invalid.
    } finally {
      clearState();
      setAuthNotice("signed-out");
      router.replace("/login");
    }
  };

  return <AuthContext.Provider value={{ user, loading, authNotice, signIn, signUp, signOut, refresh, dismissAuthNotice: () => setAuthNotice(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
