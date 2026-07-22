import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import { syncOperableCities } from "../../src/sim/core/settleNextMonth.js";
import { getFacilityTierSpec } from "../../src/sim/core/technologyEffects.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import type { GameState } from "../../src/sim/index.js";

describe("economy and company growth", () => {
  function withCity(state: GameState, config: ConfigRepo, cityId: string): GameState {
    const city = config.getCity(cityId);
    if (!city) {
      throw new Error(`missing ${cityId}`);
    }
    state.cities[city.city_id] = {
      cityId: city.city_id,
      demandMw: city.base_demand_mw,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: city.city_base_social_value
    };
    return state;
  }

  function withSecondCity(state: GameState, config: ConfigRepo): GameState {
    return withCity(state, config, "CITY-MAP01-02");
  }

  it("M10 does not downgrade company level when SV drops", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 3;
    state.facilities = {};

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(3);
  });

  it("M6 applies eng_ops_contract opex discount", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.litTechIds.push("eng_ops_contract");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 0,
      monthlyOpex: 10,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.report.steps.find((step) => step.stepId === "M6_opex_settlement")?.metrics.opex).toBe(9);
  });

  it("claim_ad_reward speedup immediately eco-syncs completed nuclear facilities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 4;
    state.facilities["fac-nuclear"] = {
      id: "fac-nuclear",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 12,
      monthlyFuel: 0
    };
    state.researches["eco_nuclear"] = {
      researchId: "rq-eco-nuclear",
      techId: "eco_nuclear",
      monthsRemaining: 2
    };

    const speedup = dispatch(
      state,
      { type: "claim_ad_reward", adType: "speedup" },
      config,
      defaultPorts
    );
    expect(speedup.ok).toBe(true);
    if (!speedup.ok) return;
    expect(speedup.value.state.litTechIds).toContain("eco_nuclear");
    expect(speedup.value.state.facilities["fac-nuclear"]?.isEco).toBe(true);
  });

  it("M3 eco_nuclear completion immediately eco-syncs city supply status", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 4;
    state.facilities["fac-nuclear"] = {
      id: "fac-nuclear",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 2000,
      monthlyOpex: 12,
      monthlyFuel: 0
    };
    state.researches["eco_nuclear"] = {
      researchId: "rq-eco-nuclear",
      techId: "eco_nuclear",
      monthsRemaining: 1
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("eco_nuclear");
    expect(month.value.state.facilities["fac-nuclear"]?.isEco).toBe(true);
    expect(month.value.state.cities["CITY-START"].cityFullyEcoSupply).toBe(true);
    expect(month.value.state.cities["CITY-START"].ecoCapFactor).toBe(1);
  });

  it("M6 applies nuclear_ops opex discount only to nuclear facilities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.litTechIds.push("nuclear_ops");
    state.facilities["fac-nuclear"] = {
      id: "fac-nuclear",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 0,
      monthlyOpex: 50,
      monthlyFuel: 0
    };
    state.facilities["fac-wind"] = {
      id: "fac-wind",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 0,
      monthlyOpex: 10,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.report.steps.find((step) => step.stepId === "M6_opex_settlement")?.metrics.opex).toBe(51);
  });

  it("M6 stacks general and nuclear-specific opex discounts with floor rounding", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.litTechIds.push("eng_ops_contract", "nuclear_ops");
    state.facilities["fac-nuclear"] = {
      id: "fac-nuclear",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 0,
      monthlyOpex: 50,
      monthlyFuel: 0
    };
    state.facilities["fac-wind"] = {
      id: "fac-wind",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 0,
      monthlyOpex: 10,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.report.steps.find((step) => step.stepId === "M6_opex_settlement")?.metrics.opex).toBe(45);
  });

  it("M9 applies eng_green_pr bonus only to fully eco-supplied cities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.litTechIds.push("eng_green_pr");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 2000,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.socialValueCurrent).toBe(21);
  });

  it("M9 does not apply eng_green_pr bonus to non-eco supplied cities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.litTechIds.push("eng_green_pr");
    state.facilities["fac-thermal"] = {
      id: "fac-thermal",
      cityId: "CITY-START",
      facilityId: "thermal",
      tier: 1,
      outputMw: 2000,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-START"].cityFullyEcoSupply).toBe(false);
    expect(month.value.state.socialValueCurrent).toBe(16);
  });

  it("M10 promotes tutorial run to level II with lowered threshold", () => {
    const config = loadTestConfig();
    const state = createInitialState(config, { doctrineId: "tutorial" });
    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(2);
  });

  it("M10 tutorial level-II threshold reads from run config", () => {
    const config = loadTestConfig();
    config.bundle.runConfig.tutorial_level2_sv_threshold = 5;
    const state = createInitialState(config, { doctrineId: "tutorial" });
    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(1);
  });

  it("M10 normal level-II threshold reads from company level config", () => {
    const config = loadTestConfig();
    const level2 = config.bundle.companyLevels.find((row) => row.level === 2);
    expect(level2).toBeTruthy();
    if (!level2) return;
    level2.sv_threshold = 5;
    const state = createInitialState(config, { doctrineId: "tech" });
    state.facilities = {};

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.socialValueCurrent).toBe(0);
    expect(month.value.state.companyLevel).toBe(1);
  });

  it("M9 overwrites EXP downward while M10 keeps level and unlock floor", () => {
    const config = loadTestConfig();
    const state = createInitialState(config, { doctrineId: "tech" });
    state.companyLevel = 2;
    state.socialValueCurrent = 12;
    state.facilities = {};

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.socialValueCurrent).toBe(0);
    expect(month.value.state.companyLevel).toBe(2);
    const m9 = month.value.report.steps.find((step) => step.stepId === "M9_social_value_settlement");
    const m10 = month.value.report.steps.find((step) => step.stepId === "M10_company_level_check");
    expect(m9?.metrics).toMatchObject({
      social_value_before: 12,
      social_value: 0,
      social_value_delta: -12
    });
    expect(m10?.metrics).toMatchObject({
      company_level_before: 2,
      company_level: 2,
      levels_gained: 0
    });
  });

  it("M10 can upgrade normal run to level II after initial wind buildout", () => {
    const config = loadTestConfig();
    let state = createInitialState(config, { doctrineId: "tech" });

    const build1 = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;
    state = build1.value.state;

    const build2 = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(build2.ok).toBe(true);
    if (!build2.ok) return;
    state = build2.value.state;

    for (let i = 0; i < 4 && state.companyLevel < 2; i += 1) {
      const month = settleNextMonth(state, config, defaultPorts);
      expect(month.ok).toBe(true);
      if (!month.ok) return;
      state = month.value.state;
    }
    expect(state.companyLevel).toBe(2);
  });

  it("syncOperableCities materializes unlocked cities during settle", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-MAP01-02"]).toBeTruthy();
    expect(month.value.state.cities["CITY-MAP01-03"]).toBeTruthy();
  });

  it("syncOperableCities keeps outside-region cities inactive before trunk connection", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 3;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-MAP02-01"]).toBeUndefined();
  });

  it("syncOperableCities materializes outside-region cities after trunk finishes", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    state.companyLevel = 3;

    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP02-01",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    state = link.value.state;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP02-01::CITY-START"]?.status).toBe("finished");
    expect(month.value.state.cities["CITY-MAP02-01"]).toBeTruthy();
    expect(month.value.state.cities["CITY-MAP02-02"]).toBeTruthy();
  });

  it("M10 promotes to level III when MAP-01 social value meets v0 threshold", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    syncOperableCities(state, config);
    const windByCity = [
      { id: "f-start", cityId: "CITY-START", outputMw: 1500 },
      { id: "f-map02", cityId: "CITY-MAP01-02", outputMw: 600 },
      { id: "f-map03", cityId: "CITY-MAP01-03", outputMw: 100 }
    ];
    for (const fac of windByCity) {
      state.facilities[fac.id] = {
        id: fac.id,
        cityId: fac.cityId,
        facilityId: "wind",
        tier: 1,
        outputMw: fac.outputMw,
        monthlyOpex: 0,
        monthlyFuel: 0
      };
    }

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.socialValueCurrent).toBeGreaterThanOrEqual(28);
    expect(month.value.state.companyLevel).toBe(3);
  });

  it("M10 promotes to level V when level-IV network reaches expanded-demo threshold", () => {
    const config = loadTestConfig();
    const level5 = config.bundle.companyLevels.find((row) => row.level === 5);
    expect(level5?.sv_threshold).toBe(176);
    if (!level5) return;

    const state = createInitialState(config);
    state.companyLevel = 4;
    for (const trunkTarget of [
      "CITY-MAP02-01",
      "CITY-META-01",
      "CITY-MAP03-01",
      "CITY-MAP04-01",
      "CITY-MAP05-01"
    ]) {
      const linkId = ["CITY-START", trunkTarget].sort().join("::");
      state.gridLinks[linkId] = {
        linkId,
        fromCityId: "CITY-START",
        toCityId: trunkTarget,
        linkType: "trunk",
        status: "finished",
        monthsRemaining: 0,
        lossMw: 0
      };
    }
    syncOperableCities(state, config);
    for (const cityId of Object.keys(state.cities)) {
      state.facilities[`fac-${cityId}`] = {
        id: `fac-${cityId}`,
        cityId,
        facilityId: "wind",
        tier: 1,
        outputMw: state.cities[cityId].demandMw * 2,
        monthlyOpex: 0,
        monthlyFuel: 0
      };
    }

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.socialValueCurrent).toBeGreaterThanOrEqual(level5.sv_threshold);
    expect(month.value.state.companyLevel).toBe(5);
  });

});
