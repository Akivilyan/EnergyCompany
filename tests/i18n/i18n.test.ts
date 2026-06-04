import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_LOCALE, getLocale, setLocale, t, tScreenLabel } from "../../src/i18n/index.js";

describe("i18n", () => {
  beforeEach(() => {
    setLocale(DEFAULT_LOCALE);
  });

  it("defaults to zh-CN", () => {
    expect(getLocale()).toBe("zh-CN");
    expect(t("hud.btn.build_wind")).toBe("建造风场");
  });

  it("switches to English", () => {
    setLocale("en");
    expect(t("hud.btn.next_month")).toBe("Next Month");
  });

  it("interpolates params", () => {
    expect(t("hud.status.city", { month: 1, funds: 140, city: "CITY-START" })).toContain("第1月");
    setLocale("en");
    expect(t("hud.status.city", { month: 1, funds: 140, city: "CITY-START" })).toBe("M1 · 140 · CITY-START");
  });

  it("resolves messageKey errors in Chinese", () => {
    expect(t("company.error.loan_already_active")).toBe("已有贷款，不能再借");
  });

  it("localizes screen labels", () => {
    expect(tScreenLabel("screen_city_detail")).toBe("城市");
    setLocale("en");
    expect(tScreenLabel("screen_city_detail")).toBe("City");
  });
});
