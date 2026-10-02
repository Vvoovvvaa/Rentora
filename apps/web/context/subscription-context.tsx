"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import { subscriptionApi } from "@/lib/api";
import type { CurrentSubscription } from "@/types/models";

type SubscriptionContextValue = {
  subscription: CurrentSubscription | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionContext =
  createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] =
    useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      if (!user) {
        setSubscription(null);
        return;
      }

      try {
        setSubscription(await subscriptionApi.me());
      } catch {
        // Plans remain publicly usable when the current subscription cannot load.
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, refresh]);

  return (
    <SubscriptionContext.Provider
      value={{ subscription, loading, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);

  if (!value) {
    throw new Error(
      "useSubscription must be used inside SubscriptionProvider",
    );
  }

  return value;
}
