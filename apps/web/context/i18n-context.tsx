"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredLocale, localeTag, setStoredLocale, translate, translateList, type Locale, type TranslationValues } from "@/lib/i18n";
import { setPresentationLocale } from "@/components/property-presentation";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
  tList: (key: string) => string[];
  formatNumber: (value: number | string, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const updateLocale = (nextLocale: Locale) => { setPresentationLocale(nextLocale); setLocaleState(nextLocale); };
  useEffect(() => { const timer = window.setTimeout(() => updateLocale(getStoredLocale()), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
  }, [locale]);
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => { setStoredLocale(nextLocale); updateLocale(nextLocale); },
    t: (key, values) => translate(locale, key, values),
    tList: (key) => translateList(locale, key),
    formatNumber: (number, options) => {
      const parsed = Number(number);
      return Number.isFinite(parsed) ? new Intl.NumberFormat(localeTag(locale), options).format(parsed) : "—";
    },
    formatDate: (date, options) => {
      const parsed = new Date(date);
      return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat(localeTag(locale), options || { year: "numeric", month: "short", day: "numeric" }).format(parsed);
    },
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
