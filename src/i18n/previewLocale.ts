import { DEFAULT_LOCALE, parseLocale, type LocaleId } from "./locale.js";
import { initLocaleFromEnvironment, persistLocale } from "./runtime.js";

/** Cocos 浏览器预览：?locale=en|zh-CN，否则 localStorage，否则默认简中。 */
export function initLocaleForPreview(): LocaleId {
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const loc = (globalThis as { location?: { search?: string } }).location;
    const search = loc?.search ?? "";
    if (search) {
      const params = new URLSearchParams(search);
      const fromQuery = parseLocale(params.get("locale"));
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
