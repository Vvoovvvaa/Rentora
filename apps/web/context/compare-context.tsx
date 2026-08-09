"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
type CompareContextValue = {
  selectedIds: number[];
  toggleProperty: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  message: string;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const storageKey = "rentora_compare_properties";
const normalizeIds = (values: unknown[]) => Array.from(new Set(values.map((value) => typeof value === "number" ? value : typeof value === "object" && value ? Number((value as { id?: unknown }).id) : Number(value)).filter((id) => Number.isInteger(id) && id > 0))).slice(0, 2);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as unknown;
      if (Array.isArray(stored)) {
        const timer = window.setTimeout(() => setSelected(normalizeIds(stored)), 0);
        return () => window.clearTimeout(timer);
      }
    } catch { localStorage.removeItem(storageKey); }
  }, []);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(selectedIds)); }, [selectedIds]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(""), 3500); return () => window.clearTimeout(timer); }, [message]);

  const value = useMemo<CompareContextValue>(() => ({
    selectedIds,
    toggleProperty: (id) => setSelected((current) => {
      if (!Number.isInteger(id) || id <= 0) return current;
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) { setMessage("You can compare up to two homes at a time."); return current; }
      return [...current, id];
    }),
    remove: (id) => setSelected((current) => current.filter((item) => item !== id)),
    clear: () => setSelected([]),
    isSelected: (id) => selectedIds.includes(id),
    message,
  }), [message, selectedIds]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error("useCompare must be used inside CompareProvider");
  return value;
}
