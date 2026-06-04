import { en } from "./messages/en.js";
import { zhCN } from "./messages/zh-CN.js";
import { getLocale, setLocale } from "./runtime.js";

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, parseLocale, isLocaleId, type LocaleId } from "./locale.js";
export {
  getLocale,
  setLocale,
  initLocaleFromEnvironment,
  persistLocale
} from "./runtime.js";
export { initLocaleForPreview, ensureChineseDefaultForDev } from "./previewLocale.js";

const MESSAGES = {
  "zh-CN": zhCN,
  en
} as const;

function lookup(locale: keyof typeof MESSAGES, key: string): string | undefined {
  return MESSAGES[locale][key];
}

/** 翻译；缺 key 时回退 en → zh-CN → 原 key。 */
export function t(key: string, params?: Record<string, string | number>): string {
  const locale = getLocale();
  const raw =
    lookup(locale, key) ??
    lookup("en", key) ??
    lookup("zh-CN", key) ??
    key;
  if (!params) return raw;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw
  );
}

export function tScreenLabel(screenId: string): string {
  const key = `hud.screen.${screenId}`;
  const translated = t(key);
  return translated === key ? screenId : translated;
}
