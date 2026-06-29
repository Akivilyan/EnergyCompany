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
import { worldCycleTargetCandidate } from "../../src/app/worldHudController.js";
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
      canCancelRegionLink: false,
      canQueueWorldTrunk: false,
      canQueueSuperHydro: false,
      canOperateTech: false
    });
  });

  it("shows selected city build candidate and candidate count on city screen", () => {
    const boot = createGameBootstrapFromRepo();
    cityHudCycleBuildCandidate(boot);

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[0]).toContain("负荷1320MW");
    expect(display.detailLines[0]).toContain("定位负荷中心");
    expect(display.detailLines[1]).toContain("候选：光伏");
    expect(display.detailLines[2]).toBe("可切换建造 4 项");
  });

  it("shows eng_bulk_procure-adjusted build cost in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.litTechIds.push("eng_bulk_procure");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("11资金");
  });

  it("shows highest lit wind tier in city hud candidate text", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 2;
    boot.app.controller.state.litTechIds.push("wind_2");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("II");
    expect(display.detailLines[1]).toContain("24");
    expect(display.detailLines[1]).toContain("3");
  });

  it("shows city build resource and storage multipliers", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("storage_system_1");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("产能");
    expect(display.detailLines[1]).toContain("资源x");
    expect(display.detailLines[1]).toContain("储能x2");
  });

  it("shows selected region link candidate and candidate count on region screen", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    boot.play.openScreen("screen_region", undefined, "MAP-02");

    const display = buildClientHudDisplay(boot);
    expect(display.statusLines).toContain("可玩链路 2");
    expect(display.detailLines.some((line) => line.includes("CITY-MAP02-01->"))).toBe(true);
  });

  it("shows level-V region demand, SV, and resource profile in region hud", () => {
    setLocale("en");
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.play.openScreen("screen_region", undefined, "MAP-06");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines).toContain("Demand 1920MW · local 0/import 0/gap 1920MW · slots 13/river 0/nuclear 1 · SV 38 · rich wind/solar/fossil · build wind/solar/thermal/nuclear");
    expect(display.detailLines).toContain("Operating role: coastal industrial export");
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
    expect(display.detailLines[1]).toContain("供给0/1440MW(0%)");
    expect(display.detailLines[1]).toContain("本地0/受入0/缺口1440MW");
    expect(display.detailLines[1]).toContain("定位资源外送省");
    expect(display.detailLines[1]).toContain("富集风/光");
    expect(display.detailLines[1]).toContain("建议风电/光伏");
  });

  it("shows selected world trunk candidate and queue capability", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    clientNavOpenWorldMap(boot);
    worldCycleTargetCandidate(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines.some((line) => line.includes("->") && line.includes("8"))).toBe(true);
    expect(display.detailLines.some((line) => line.includes("线损750MW"))).toBe(true);
    expect(getClientHudCapabilities(boot).canQueueWorldTrunk).toBe(true);
  });

  it("shows active world trunk progress and loss in the focused region detail", () => {
    setLocale("en");
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 3;
    const queued = boot.app.controller.runCommand({
      type: "queue_grid_link",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP02-01",
      linkType: "trunk"
    });
    expect(queued.ok).toBe(true);
    clientNavOpenWorldMap(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines[1]).toContain("Trunk building");
    expect(display.detailLines[1]).toContain("1m");
    expect(display.detailLines[1]).toContain("loss 750MW");
    expect(display.detailLines[1]).toContain("slots 13/river 1/nuclear 1");
  });

  it("updates world map operating profile when cycling the selected target", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (!buildClientHudDisplay(boot).detailLines[1]?.includes("省六") && guard < 12) {
      worldCycleTargetCandidate(boot);
      guard += 1;
    }

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("省六");
    expect(display.detailLines[1]).toContain("供给0/1920MW(0%)");
    expect(display.detailLines[1]).toContain("本地0/受入0/缺口1920MW");
    expect(display.detailLines[1]).toContain("定位沿海工业外送");
    expect(display.detailLines[1]).toContain("富集风/光");
    expect(display.detailLines[1]).toContain("建议风电/光伏/火电/核电");
  });

  it("shows level-V super hydro slot progress on world map hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenWorldMap(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("超级水电可建 · 完工0/在建0/2 · 接网出力0/0MW");
    expect(display.detailLines).toContain("超水电候选：超级水电一号槽 · 可建 · 未建 · 160资金 · 6月 · 4200MW");
  });

  it("hides super hydro queue capability when the selected strategic slot is unaffordable", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.funds = 159;
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenWorldMap(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("超水电候选：超级水电一号槽 · 可建 · 未建 · 160资金 · 6月 · 4200MW");
    expect(getClientHudCapabilities(boot).canQueueSuperHydro).toBe(false);
  });
});
