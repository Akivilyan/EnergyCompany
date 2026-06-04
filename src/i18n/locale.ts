/** 当前 v0 仅支持简中与英语。 */
export type LocaleId = "zh-CN" | "en";

export const DEFAULT_LOCALE: LocaleId = "zh-CN";

export const SUPPORTED_LOCALES: readonly LocaleId[] = ["zh-CN", "en"];

export function parseLocale(raw: string | null | undefined): LocaleId | null {
  if (!raw) return null;
  const norm = raw.trim().replace(/_/g, "-");
  if (norm === "zh" || norm === "zh-CN") return "zh-CN";
  if (norm === "en" || norm === "en-US") return "en";
  return null;
}

export function isLocaleId(value: string): value is LocaleId {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
