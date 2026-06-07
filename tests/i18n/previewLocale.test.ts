import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_LOCALE, getLocale } from "../../src/i18n/index.js";
import { initLocaleForPreview } from "../../src/i18n/previewLocale.js";

describe("previewLocale", () => {
  beforeEach(() => {
    (globalThis as { URLSearchParams?: typeof URLSearchParams }).URLSearchParams = undefined;
  });

  it("parses ?locale=en without URLSearchParams", () => {
    (globalThis as { location?: { search: string } }).location = { search: "?locale=en" };
    initLocaleForPreview();
    expect(getLocale()).toBe("en");
    delete (globalThis as { location?: { search: string } }).location;
  });

  it("falls back to zh-CN when no query API exists", () => {
    delete (globalThis as { location?: unknown }).location;
    initLocaleForPreview();
    expect(getLocale()).toBe(DEFAULT_LOCALE);
  });
});
