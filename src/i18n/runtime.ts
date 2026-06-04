import { DEFAULT_LOCALE, isLocaleId, parseLocale, type LocaleId } from "./locale.js";

const STORAGE_KEY = "energy-company.locale";

let currentLocale: LocaleId = DEFAULT_LOCALE;

export function getLocale(): LocaleId {
  return currentLocale;
}

export function setLocale(locale: LocaleId): void {
  if (!isLocaleId(locale)) return;
  currentLocale = locale;
}

export function initLocaleFromEnvironment(): LocaleId {
  if (typeof process !== "undefined" && process.env?.GAME_LOCALE) {
    const fromEnv = parseLocale(process.env.GAME_LOCALE);
    if (fromEnv) {
      setLocale(fromEnv);
      return fromEnv;
    }
  }
  if (typeof globalThis !== "undefined") {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (storage) {
      try {
        const fromStorage = parseLocale(storage.getItem(STORAGE_KEY));
        if (fromStorage) {
          setLocale(fromStorage);
          return fromStorage;
        }
      } catch {
        /* ignore */
      }
    }
  }
  setLocale(DEFAULT_LOCALE);
  return currentLocale;
}

export function persistLocale(locale: LocaleId): void {
  setLocale(locale);
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
