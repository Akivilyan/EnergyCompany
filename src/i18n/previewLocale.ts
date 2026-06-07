import { DEFAULT_LOCALE, parseLocale, type LocaleId } from "./locale.js";
import { initLocaleFromEnvironment, persistLocale } from "./runtime.js";

/** 不依赖 URLSearchParams（微信小游戏基础库未提供）。 */
function getQueryParam(search: string, key: string): string | null {
  if (typeof URLSearchParams !== "undefined") {
    return new URLSearchParams(search).get(key);
  }
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (!query) return null;
  for (const segment of query.split("&")) {
    if (!segment) continue;
    const eq = segment.indexOf("=");
    const rawKey = eq >= 0 ? segment.slice(0, eq) : segment;
    const rawVal = eq >= 0 ? segment.slice(eq + 1) : "";
    try {
      if (decodeURIComponent(rawKey.replace(/\+/g, " ")) === key) {
        return decodeURIComponent(rawVal.replace(/\+/g, " "));
      }
    } catch {
      if (rawKey === key) return rawVal;
    }
  }
  return null;
}

function readLocaleFromWxLaunchQuery(): LocaleId | null {
  const wx = (globalThis as { wx?: { getLaunchOptionsSync?: () => { query?: Record<string, string> } } })
    .wx;
  if (!wx?.getLaunchOptionsSync) return null;
  try {
    const query = wx.getLaunchOptionsSync().query;
    const raw = query?.locale ?? query?.lang;
    return parseLocale(raw ?? null);
  } catch {
    return null;
  }
}

/** Cocos 浏览器预览：?locale=en|zh-CN；微信小游戏：启动 query；否则 localStorage，否则默认简中。 */
export function initLocaleForPreview(): LocaleId {
  const fromWx = readLocaleFromWxLaunchQuery();
  if (fromWx) {
    persistLocale(fromWx);
    return fromWx;
  }
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const loc = (globalThis as { location?: { search?: string } }).location;
    const search = loc?.search ?? "";
    if (search) {
      const fromQuery = parseLocale(getQueryParam(search, "locale"));
      if (fromQuery) {
        persistLocale(fromQuery);
        return fromQuery;
      }
    }
  }
  return initLocaleFromEnvironment();
}

/** 人肉测试默认简中；无 localStorage 记录时写入 zh-CN。 */
export function ensureChineseDefaultForDev(): void {
  initLocaleForPreview();
  if (typeof globalThis !== "undefined") {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage?.getItem("energy-company.locale")) {
      persistLocale(DEFAULT_LOCALE);
    }
  }
}
