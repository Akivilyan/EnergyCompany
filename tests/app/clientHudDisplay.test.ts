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

  it("shows cashflow tech loan tier bonus on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 4;
    boot.app.controller.state.litTechIds.push("eng_cashflow");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("现金流科技：贷款等级+1 · 有效5级");
    expect(display.detailLines).toContain("可切换贷款 5 档");
  });

  it("shows opex tech reductions on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_ops_contract", "nuclear_ops");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("运维科技：通用运维-10%/核电运维-18%");
  });

  it("keeps opex tech reductions visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_ops_contract");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("运维科技：通用运维-10%");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows generation tier tech branches on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push(
      "wind_3",
      "solar_4",
      "thermal_5",
      "hydro_5"
    );
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("发电科技：风·3/光·4/火·5/水·5");
  });

  it("keeps generation tier tech branches visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("wind_3", "hydro_4");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("发电科技：风·3/水·4");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows nuclear build tier tech on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("nuclear_1", "nuclear_2", "nuclear_3");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("核电科技：可建核电·3");
  });

  it("keeps nuclear build tier tech visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("nuclear_1", "nuclear_2");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("核电科技：可建核电·2");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows storage tech branches on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push(
      "storage_system_1",
      "storage_system_2",
      "storage_system_3"
    );
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("储能科技：风光水储能x2/风光水可研·3/4/5");
  });

  it("keeps storage tech branches visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("storage_system_1", "storage_system_2");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("储能科技：风光水储能x2/风光水可研·3/4");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows grid dispatch tech loss reduction on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_grid_dispatch");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("调度科技：区域线损-10%");
  });

  it("keeps grid dispatch tech visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_grid_dispatch");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("调度科技：区域线损-10%");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows grid tech branches on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("grid_regional", "grid_backbone", "uhv_transmission");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain(
      "电网科技：区域线造价-25%/主干造价-25%/主干线损特高压档"
    );
  });

  it("keeps grid tech branches visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("grid_regional", "uhv_transmission");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("电网科技：区域线造价-25%/主干线损特高压档");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows eco tech branches on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eco_thermal", "eco_nuclear", "eng_green_pr");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("生态科技：火电ECO/核电ECO/全环保城SV+5%");
  });

  it("keeps eco tech branches visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eco_thermal", "eng_green_pr");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("生态科技：火电ECO/全环保城SV+5%");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows strategic tech branches on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("战略科技：超级水电槽+2");
  });

  it("keeps strategic tech branches visible with active loan", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("super_hydro");
    clientNavOpenCompany(boot);
    companyApplyFirstUnlockedLoan(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("战略科技：超级水电槽+2");
    expect(display.detailLine).toContain("小额贷款（30万）");
  });

  it("shows recent monthly cashflow on company hud after settlement", () => {
    const boot = createGameBootstrapFromRepo();
    boot.play.advanceMonthInCurrentCity();
    clientNavOpenCompany(boot);

    const display = buildClientHudDisplay(boot);
    const cashflowLine = display.detailLines.find((line) => line.startsWith("上月M1净现金流"));
    expect(cashflowLine).toBeTruthy();
    expect(cashflowLine).toContain("收入");
    expect(cashflowLine).toContain("运维");
    expect(cashflowLine).toContain("燃料");
    expect(cashflowLine).toContain("贷款");
  });

  it("shows risk-reserve disaster prep and active pressure on company hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.litTechIds.push("eng_risk_reserve");
    clientNavOpenCompany(boot);

    const prep = buildClientHudDisplay(boot);
    expect(prep.detailLines).toContain("灾害备考：M22现金冲击7/9 · 风险储备生效");

    boot.app.controller.state.funds = 10000;
    while (boot.app.controller.state.currentMonth < 23) {
      boot.play.advanceMonthInCurrentCity();
    }
    clientNavOpenCompany(boot);

    const active = buildClientHudDisplay(boot);
    expect(active.detailLines).toContain("灾害压力：剩8月 · 收入92% · 建设108% · 科研108%");
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
    expect(display.detailLines[1]).toContain("后续分叉：3级发电升档/储能闸门/区域网/核电/运维/调度");
    expect(display.detailLines[1]).toContain("4级发电升档/储能闸门/主干网/核电/ECO/现金流/灾害减损");
    expect(display.detailLines[1]).toContain("5级发电升档/储能闸门/特高压/核电/超水电/运维/绿色品牌");
    expect(display.detailLines[2]).toBe("当前可研分叉：发电升档4/建设1");
    expect(display.detailLines[3]).toContain("候选：风电·II");
    expect(display.detailLines[3]).toContain("分叉发电升档");
    expect(display.detailLines[3]).toContain("32资金");
    expect(display.detailLines[3]).toContain("1月");
    expect(display.detailLines[3]).toContain("wind tier <= 2");
  });

  it("shows researchable level-V tech branch mix in tech hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "wind_2",
      "solar_2",
      "thermal_2",
      "hydro_2",
      "storage_system_1",
      "storage_system_2",
      "grid_backbone",
      "nuclear_1",
      "nuclear_2"
    );
    boot.play.openScreen("screen_tech_tree");

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines[2]).toContain("当前可研分叉：");
    expect(display.detailLines[2]).toContain("发电升档4");
    expect(display.detailLines[2]).toContain("储能闸门1");
    expect(display.detailLines[2]).toContain("特高压1");
    expect(display.detailLines[2]).toContain("核电1");
    expect(display.detailLines[2]).toContain("ECO2");
    expect(display.detailLines[2]).toContain("超水电1");
    expect(display.detailLines[2]).toContain("建设1");
    expect(display.detailLines[2]).toContain("运维2");
    expect(display.detailLines[2]).toContain("现金流1");
    expect(display.detailLines[2]).toContain("灾害减损1");
    expect(display.detailLines[2]).toContain("绿色品牌1");
    expect(display.detailLines[3]).toContain("压力队列：");
    expect(display.detailLines[3]).toContain("特大城B（终局都会）·终局负荷->超水电");
    expect(display.detailLines[3]).toContain("省七（高原水风走廊）·水点绑定->发电升档");
    expect(display.detailLines[3]).toContain("省八（边疆综合平衡带）·混合调配->调度");
    expect(display.detailLines[4]).toBe("压力推荐：特大城B（终局都会） · 终局负荷 -> 超水电");
    expect(display.detailLines[5]).toContain("候选：超级水电站");
    expect(display.detailLines[5]).toContain("分叉超水电");
  });

  it("shows trunk tech as level-V pressure candidate after super hydro is lit", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    boot.play.openScreen("screen_tech_tree");

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines[3]).toContain("省六（沿海工业走廊）·主干优先->主干网");
    expect(display.detailLines[4]).toBe("压力推荐：省六（沿海工业走廊） · 主干优先 -> 主干网");
    expect(display.detailLines[5]).toContain("候选：主干电网");
    expect(display.detailLines[5]).toContain("分叉主干网");
    expect(display.detailLines[5]).not.toContain("候选：风电·II");
  });

  it("shows MAP-07 and MAP-08 pressure reasons in tech hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push(
      "super_hydro",
      "grid_regional",
      "grid_backbone",
      "uhv_transmission",
      "nuclear_1",
      "nuclear_2",
      "nuclear_3"
    );
    boot.play.openScreen("screen_tech_tree");

    const hydro = buildClientHudDisplay(boot);
    expect(hydro.detailLines[3]).toContain("省七（高原水风走廊）·水点绑定->发电升档");
    expect(hydro.detailLines[4]).toBe("压力推荐：省七（高原水风走廊） · 水点绑定 -> 发电升档");
    expect(hydro.detailLines[5]).toContain("候选：水电·II");

    boot.app.controller.state.litTechIds.push("hydro_2", "hydro_3", "hydro_4", "hydro_5");

    const dispatch = buildClientHudDisplay(boot);
    expect(dispatch.detailLines[3]).toContain("省八（边疆综合平衡带）·混合调配->调度");
    expect(dispatch.detailLines[4]).toBe("压力推荐：省八（边疆综合平衡带） · 混合调配 -> 调度");
    expect(dispatch.detailLines[5]).toContain("候选：智能调度");
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

  it("shows city eco status and green brand branch in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    const city = boot.app.controller.config.getCity("CITY-START");
    expect(city).toBeTruthy();
    boot.app.controller.state.cities["CITY-START"] = {
      cityId: "CITY-START",
      demandMw: city?.base_demand_mw ?? 0,
      localSupplyMw: 100,
      effectiveSupplyMw: 100,
      netImportMw: 0,
      supplyRatio: 100 / (city?.base_demand_mw ?? 1),
      cityFullyEcoSupply: false,
      ecoCapFactor: 0.8,
      cityBaseSocialValue: city?.city_base_social_value ?? 0
    };

    const partial = buildClientHudDisplay(boot);
    expect(partial.detailLines[0]).toContain("生态非全环保·SV上限80%");

    boot.app.controller.state.cities["CITY-START"].cityFullyEcoSupply = true;
    boot.app.controller.state.cities["CITY-START"].ecoCapFactor = 1;
    boot.app.controller.state.litTechIds.push("eng_green_pr");

    const green = buildClientHudDisplay(boot);
    expect(green.detailLines[0]).toContain("生态全环保+绿色品牌");
  });

  it("shows level-V city operating pressure in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    const city = boot.app.controller.config.getCity("CITY-MAP06-01");
    expect(city).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-MAP06-01"] = {
      cityId: "CITY-MAP06-01",
      demandMw: city?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: city?.city_base_social_value ?? 0
    };
    boot.play.openScreen("screen_city_detail", "CITY-MAP06-01", "MAP-06");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[0]).toContain("负荷1280MW");
    expect(display.detailLines[0]).toContain("本地0/受入0/缺口1280MW");
    expect(display.detailLines[0]).toContain("定位沿海工业枢纽");
    expect(display.detailLines[0]).toContain("压力高负荷/供给缺口/槽位紧/无水电/化石转型/核电选址");
    expect(display.detailLines).toContain("科技解法：核电选址->核电/供给缺口->储能/发电升档/化石转型->ECO/运维");
    expect(display.detailLines).toContain("建造建议：本地风光/火电过渡/核电锚点/高效占槽");
  });

  it("shows MAP-07 and MAP-08 late-map city pressure in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    const map07Hydro = boot.app.controller.config.getCity("CITY-MAP07-01");
    const map07 = boot.app.controller.config.getCity("CITY-MAP07-03");
    const map08 = boot.app.controller.config.getCity("CITY-MAP08-01");
    expect(map07Hydro).toBeTruthy();
    expect(map07).toBeTruthy();
    expect(map08).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;

    boot.app.controller.state.cities["CITY-MAP07-01"] = {
      cityId: "CITY-MAP07-01",
      demandMw: map07Hydro?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map07Hydro?.city_base_social_value ?? 0
    };
    boot.play.openScreen("screen_city_detail", "CITY-MAP07-01", "MAP-07");
    const map07HydroDisplay = buildClientHudDisplay(boot);
    expect(map07HydroDisplay.detailLines[0]).toContain("定位高原水电枢纽");
    expect(map07HydroDisplay.detailLines[0]).toContain("压力供给缺口/槽位紧/水点绑定");
    expect(map07HydroDisplay.detailLines).toContain("科技解法：水点绑定->水电升档/供给缺口->储能/发电升档");

    boot.app.controller.state.cities["CITY-MAP07-03"] = {
      cityId: "CITY-MAP07-03",
      demandMw: map07?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map07?.city_base_social_value ?? 0
    };
    boot.play.openScreen("screen_city_detail", "CITY-MAP07-03", "MAP-07");
    const map07Display = buildClientHudDisplay(boot);
    expect(map07Display.detailLines[0]).toContain("定位山脊风电");
    expect(map07Display.detailLines[0]).toContain("压力供给缺口/无水电");

    boot.app.controller.state.cities["CITY-MAP08-01"] = {
      cityId: "CITY-MAP08-01",
      demandMw: map08?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: map08?.city_base_social_value ?? 0
    };
    boot.play.openScreen("screen_city_detail", "CITY-MAP08-01", "MAP-08");
    const map08Display = buildClientHudDisplay(boot);
    expect(map08Display.detailLines[0]).toContain("定位边疆综合平衡");
    expect(map08Display.detailLines[0]).toContain("压力高负荷/供给缺口/槽位紧/核电选址/混合调配");
    expect(map08Display.detailLines).toContain("科技解法：核电选址->核电/混合调配->调度/供给缺口->储能/发电升档");
    expect(map08Display.detailLines).toContain("建造建议：本地风光/水电锚点/核电锚点/高效占槽/混合调配");
  });

  it("shows MET-B terminal load pressure in city hud", () => {
    const boot = createGameBootstrapFromRepo();
    const metB = boot.app.controller.config.getCity("CITY-METB-01");
    expect(metB).toBeTruthy();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.cities["CITY-METB-01"] = {
      cityId: "CITY-METB-01",
      demandMw: metB?.base_demand_mw ?? 0,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: metB?.city_base_social_value ?? 0
    };
    boot.play.openScreen("screen_city_detail", "CITY-METB-01", "MET-B");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[0]).toContain("负荷2100MW");
    expect(display.detailLines[0]).toContain("定位终局都会枢纽");
    expect(display.detailLines[0]).toContain("压力高负荷/供给缺口/槽位紧/核电选址/终局负荷");
    expect(display.detailLines).toContain("科技解法：终局负荷->超水电/核电选址->核电/供给缺口->储能/发电升档");
    expect(display.detailLines).toContain("建造建议：本地风光/水电锚点/核电锚点/高效占槽");
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
    expect(display.detailLines).toContain("Demand 1920MW · local 0/import 0/gap 1920MW · slots 13/river 0/nuclear 1 · SV 38 · rich wind/solar/fossil · build wind/solar/thermal/nuclear · pressure high demand/supply gap/trunk first/no hydro/fossil transition/nuclear siting");
    expect(display.detailLines).toContain("Pressure breakdown: gap 1920MW · trunk first · no hydro · fossil transition · nuclear siting");
    expect(display.detailLines).toContain("Tech solution: trunk first->backbone grid/nuclear siting->nuclear/supply gap->storage/generation tier/fossil transition->ECO/opex");
    expect(display.detailLines).toContain("Operating plan: secure trunk/close supply gap/local renewables/thermal bridge/nuclear anchor");
    expect(display.detailLines).toContain("Operating role: coastal industrial export");
    expect(display.detailLines).toContain("Action: build trunk first to unlock local links");
  });

  it("shows MET-B terminal operating route in region hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.play.openScreen("screen_region", undefined, "MET-B");

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("负荷2100MW");
    expect(display.detailLines[1]).toContain("建议光伏/水电/核电");
    expect(display.detailLines[1]).toContain("压力高负荷/供给缺口/主干优先/槽位紧/核电选址/终局负荷");
    expect(display.detailLines).toContain("压力拆解：缺口2100MW · 主干优先 · 槽位7 · 核电选址 · 终局负荷2100MW");
    expect(display.detailLines).toContain("科技解法：终局负荷->超水电/主干优先->主干网/核电选址->核电/供给缺口->储能/发电升档");
    expect(display.detailLines).toContain("经营路线：先接主干/补足缺口/本地风光/超水电受入/核电锚点/高效占槽");
    expect(display.detailLines).toContain("经营定位：终局都会负荷");
  });

  it("shows MAP-07 and MAP-08 differentiated level-V operating routes in region hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;

    boot.play.openScreen("screen_region", undefined, "MAP-07");
    const map07 = buildClientHudDisplay(boot);
    expect(map07.detailLines[1]).toContain("负荷1670MW");
    expect(map07.detailLines[1]).toContain("压力供给缺口/主干优先/水点绑定");
    expect(map07.detailLines).toContain("科技解法：主干优先->主干网/水点绑定->水电升档/供给缺口->储能/发电升档");
    expect(map07.detailLines).toContain("经营路线：先接主干/补足缺口/水风外送/本地风光/水电锚点");

    boot.play.openScreen("screen_region", undefined, "MAP-08");
    const map08 = buildClientHudDisplay(boot);
    expect(map08.detailLines[1]).toContain("负荷2020MW");
    expect(map08.detailLines[1]).toContain("压力高负荷/供给缺口/主干优先/核电选址/混合调配");
    expect(map08.detailLines).toContain("压力拆解：缺口2020MW · 主干优先 · 核电选址 · 混合调配");
    expect(map08.detailLines).toContain("科技解法：主干优先->主干网/核电选址->核电/混合调配->调度/供给缺口->储能/发电升档");
    expect(map08.detailLines).toContain("经营路线：先接主干/补足缺口/本地风光/水电锚点/核电锚点/混合调配");
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
    expect(display.detailLines[1]).toContain("压力供给缺口/主干优先");
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
    expect(display.detailLines[1]).toContain("压力高负荷/供给缺口/主干优先/无水电/化石转型/核电选址");
    expect(display.detailLines[1]).toContain("路线先接主干/补足缺口/本地风光/火电兜底/核电锚点");
    expect(display.detailLines).toContain("压力拆解：缺口1920MW · 主干优先 · 无水电 · 化石转型 · 核电选址");
    expect(display.detailLines).toContain("科技解法：主干优先->主干网/核电选址->核电/供给缺口->储能/发电升档/化石转型->ECO/运维");
    expect(display.detailLines).toContain("行动建议：先建主干，进入区域补供给");
  });

  it("shows MET-B terminal operating route on world map hud", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    clientNavOpenWorldMap(boot);

    let guard = 0;
    while (!buildClientHudDisplay(boot).detailLines[1]?.includes("特大城B") && guard < 12) {
      worldCycleTargetCandidate(boot);
      guard += 1;
    }

    const display = buildClientHudDisplay(boot);
    expect(display.detailLines[1]).toContain("特大城B");
    expect(display.detailLines[1]).toContain("定位终局都会负荷");
    expect(display.detailLines[1]).toContain("建议光伏/水电/核电");
    expect(display.detailLines[1]).toContain("压力高负荷/供给缺口/主干优先/槽位紧/核电选址/终局负荷");
    expect(display.detailLines[1]).toContain("路线先接主干/补足缺口/本地风光/超水电受入/核电锚点/高效占槽");
    expect(display.detailLines).toContain("压力拆解：缺口2100MW · 主干优先 · 槽位7 · 核电选址 · 终局负荷2100MW");
    expect(display.detailLines).toContain("科技解法：终局负荷->超水电/主干优先->主干网/核电选址->核电/供给缺口->储能/发电升档");
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

  it("shows finished but isolated super hydro output as world map grid pressure", () => {
    const boot = createGameBootstrapFromRepo();
    boot.app.controller.state.companyLevel = 5;
    boot.app.controller.state.litTechIds.push("super_hydro");
    boot.app.controller.state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };
    clientNavOpenWorldMap(boot);

    const display = buildClientHudDisplay(boot);

    expect(display.detailLines).toContain("超级水电可建 · 完工1/在建0/2 · 接网出力0/4200MW");
    expect(display.detailLines).toContain("超水电接网压力：未接网4200/4200MW");
    expect(display.detailLines).toContain("超水电候选：超级水电二号槽 · 可建 · 未建 · 160资金 · 6月 · 4200MW");
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
