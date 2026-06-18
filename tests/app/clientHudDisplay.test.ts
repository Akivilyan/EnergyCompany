import { beforeEach, describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import {
  buildClientHudDisplay,
  formatLoanTierLabel
} from "../../src/app/clientHudDisplay.js";
import { getClientHudCapabilities } from "../../src/app/clientHudCapabilities.js";
import { clientNavOpenCompany } from "../../src/app/screenNavController.js";
import { companyApplyFirstUnlockedLoan } from "../../src/app/companyHudController.js";
import { DEFAULT_LOCALE, setLocale } from "../../src/i18n/index.js";

describe("clientHudDisplay", () => {
  beforeEach(() => {
    setLocale(DEFAULT_LOCALE);
  });

  it("formats loan tier with readable Chinese label", () => {
    expect(formatLoanTierLabel("loan_1")).toBe("小额贷款（30万）");
  });

  it("splits company status and loan detail lines", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);
    const display = buildClientHudDisplay(boot);
    expect(display.statusLine).toMatch(/^公司 · \d+级 · 资金\d+ · 广告\d+次$/);
    expect(display.detailLine).toContain("小额贷款（30万）");
    expect(display.detailLine).not.toContain("loan_1");
  });

  it("keeps company hud lines compact for portrait device layout", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    const display = buildClientHudDisplay(boot);
    const lines = [...display.statusLines, ...display.detailLines];

    expect(display.statusLines).toEqual(["公司 1 级", "资金 140", "广告剩余 10 次"]);
    expect(display.detailLines).toEqual(["社会价值 0/1（升级进度）", "无在贷"]);
    expect(lines.filter((line) => line.includes("社会价值"))).toHaveLength(1);
    expect(lines.some((line) => line.includes("返回层"))).toBe(false);
    expect(lines).toHaveLength(5);
  });

  it("exposes locked hud capabilities before company level 2", () => {
    const boot = createGameBootstrapFromRepo();
    expect(getClientHudCapabilities(boot)).toEqual({
      canQueueRegionLink: false,
      canOperateTech: false
    });
  });
});
