import { beforeEach, describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import {
  buildClientHudDisplay,
  formatLoanTierLabel
} from "../../src/app/clientHudDisplay.js";
import { getClientHudCapabilities } from "../../src/app/clientHudCapabilities.js";
import { cityHudCycleBuildCandidate } from "../../src/app/cityHudController.js";
import { clientNavOpenCompany, clientNavOpenWorldMap } from "../../src/app/screenNavController.js";
import {
  companyApplyFirstUnlockedLoan,
  companyCycleLoanCandidate
} from "../../src/app/companyHudController.js";
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
    expect(display.detailLines).toEqual(["社会价值 0/1（升级进度）", "候选：小额贷款（30万） · 月供3", "无在贷"]);
    expect(lines.filter((line) => line.includes("社会价值"))).toHaveLength(1);
    expect(lines.some((line) => line.includes("返回层"))).toBe(false);
    expect(lines).toHaveLength(6);
  });

  it("shows switched company loan candidate before applying", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;
    clientNavOpenCompany(boot);
    companyCycleLoanCandidate(boot);

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("中额贷款（80万）");
    expect(display.detailLines[2]).toBe("可切换贷款 2 档");
  });

  it("shows selected research candidate and researchable count on tech screen", () => {
    const boot = createGameBootstrapFromRepo();
    boot.play.buildInCurrentCity("wind", 1);
    boot.play.buildInCurrentCity("wind", 1);
    for (let i = 0; i < 2; i += 1) {
      boot.play.advanceMonthInCurrentCity();
    }
    boot.play.openScreen("screen_tech_tree");

    const display = buildClientHudDisplay(boot);
    expect(display.statusLines).toEqual(["已点亮 4 项科技", "可研 5 项"]);
    expect(display.detailLines[0]).toBe("当前无在研项目");
    expect(display.detailLines[1]).toContain("候选：风电·II");
  });

  it("exposes locked hud capabilities before company level 2", () => {
    const boot = createGameBootstrapFromRepo();
    expect(getClientHudCapabilities(boot)).toEqual({
      canBuildInCity: true,
      canCycleBuildCandidate: true,
      canQueueRegionLink: false,
      canCycleRegionLink: false,
      canOperateTech: false
    });
  });

  it("shows selected city build candidate and candidate count on city screen", () => {
    const boot = createGameBootstrapFromRepo();
    cityHudCycleBuildCandidate(boot);

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[0]).toContain("候选：光伏");
    expect(display.detailLines[1]).toBe("可切换建造 4 项");
  });

  it("shows eng_bulk_procure-adjusted build cost in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.litTechIds.push("eng_bulk_procure");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[0]).toContain("11资金");
  });

  it("shows selected region link candidate and candidate count on region screen", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    boot.play.openScreen("screen_region", undefined, "MAP-02");

    const display = buildClientHudDisplay(boot);
    expect(display.statusLines).toContain("可玩链路 2");
    expect(display.detailLines.some((line) => line.includes("CITY-MAP02-01->"))).toBe(true);
  });

  it("shows grid_regional-adjusted region link cost in hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    boot.app.controller.state.litTechIds.push("grid_regional");
    boot.play.openScreen("screen_region", undefined, "MAP-01");

    const display = buildClientHudDisplay(boot);
    expect(
      display.detailLines.some((line) => line.includes("CITY-START->") && line.includes("6"))
    ).toBe(true);
  });

  it("shows grid_backbone-adjusted trunk link cost in hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;
    boot.app.controller.state.litTechIds.push("grid_backbone");
    boot.play.openScreen("screen_region", undefined, "MAP-03");

    const display = buildClientHudDisplay(boot);
    expect(
      display.detailLines.some((line) => line.includes("CITY-MAP03-01->") && line.includes("6"))
    ).toBe(true);
  });

  it("shows world map unlock progress and next unlock", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);

    const display = buildClientHudDisplay(boot);
    expect(display.statusLines.some((line) => line.includes("3/10"))).toBe(true);
    expect(display.detailLines[0]).toContain("4级");
    expect(display.detailLines[1]).toContain("主干线可建");
  });
});
