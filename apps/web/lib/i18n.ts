import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import am from '@/messages/am.json';

export const LOCALE_STORAGE_KEY = 'rentora_locale';
export const supportedLocales = ['en', 'ru', 'am'] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationValues = Record<string, string | number>;

const dictionaries: Record<Locale, Record<string, unknown>> = { en, ru, am };
const intlLocales: Record<Locale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  am: 'hy-AM',
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (supportedLocales as readonly string[]).includes(value)
  );
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : 'en';
  } catch {
    return 'en';
  }
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* Storage can be unavailable in private contexts. */
  }
}

function valueAt(dictionary: Record<string, unknown>, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (current, part) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[part]
          : undefined,
      dictionary,
    );
}

export function translate(
  locale: Locale,
  key: string,
  values?: TranslationValues,
) {
  const localized = valueAt(dictionaries[locale], key);
  const fallback = valueAt(dictionaries.en, key);
  const template =
    typeof localized === 'string'
      ? localized
      : typeof fallback === 'string'
        ? fallback
        : '';
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values?.[name] ?? `{${name}}`),
  );
}

export function translateList(locale: Locale, key: string): string[] {
  const localized = valueAt(dictionaries[locale], key);
  const fallback = valueAt(dictionaries.en, key);
  const values = Array.isArray(localized)
    ? localized
    : Array.isArray(fallback)
      ? fallback
      : [];
  return values.filter((value): value is string => typeof value === 'string');
}

export function t(key: string, values?: TranslationValues) {
  return translate(getStoredLocale(), key, values);
}

export function localeTag(locale: Locale) {
  return intlLocales[locale];
}

export function formatLocalizedNumber(
  value: number | string,
  locale = getStoredLocale(),
  options?: Intl.NumberFormatOptions,
) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(localeTag(locale), options).format(number)
    : '—';
}

export function formatLocalizedDate(
  value: string | number | Date,
  locale = getStoredLocale(),
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(localeTag(locale), options).format(date);
}
