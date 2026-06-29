import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import { syncOperableCities } from "../../src/sim/core/settleNextMonth.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import type { GameState } from "../../src/sim/index.js";


describe("settleNextMonth", () => {
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

  it("runs M1-M14 in order", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    const result = settleNextMonth(state, config, defaultPorts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.steps).toHaveLength(14);
    expect(result.value.report.steps.map((s) => s.stepId)).toEqual([
      "M2_grid_progress",
      "M3_research_progress",
      "M1_construction_progress",
      "M4_supply_recalc",
      "M5_income_settlement",
      "M6_opex_settlement",
      "M7_fuel_settlement",
      "M8_loan_settlement",
      "M9_social_value_settlement",
      "M10_company_level_check",
      "M11_events_apply",
      "M12_milestones_emit",
      "M13_bankrupt_check",
      "M14_victory_check"
    ]);
  });

  it("applies disaster at M22 with locked debuff duration from config", () => {
    const config = loadTestConfig();
    const d22 = config.bundle.disasters.find((d) => d.trigger_month === 22);
    expect(d22?.debuff_duration_months).toBe(8);

    let state = createInitialState(config);
    state.funds = 800;
    while (state.currentMonth < 22 && state.runResult === null) {
      const month = settleNextMonth(state, config, defaultPorts);
      expect(month.ok).toBe(true);
      if (!month.ok) return;
      state = month.value.state;
      state.funds = Math.max(state.funds, 100);
    }
    expect(state.currentMonth).toBe(22);
    const month22 = settleNextMonth(state, config, defaultPorts);
    expect(month22.ok).toBe(true);
    if (!month22.ok) return;
    state = month22.value.state;
    expect(state.disastersTriggered).toContain(1);
    expect(state.activeDebuffs.some((d) => d.disasterSeq === 1 && d.monthsRemaining === 8)).toBe(true);
  });

  it("dispatch fails atomically on insufficient funds", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.funds = 0;
    const before = structuredClone(state);
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "nuclear", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    expect(state.funds).toBe(before.funds);
  });

  it("dispatch supports start_research and enforces single queue", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    state.companyLevel = 2;
    const initialFunds = state.funds;
    const start = dispatch(
      state,
      { type: "start_research", techId: "wind_2" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;
    expect(state.funds).toBe(initialFunds - 40);
    expect(Object.keys(state.researches)).toContain("wind_2");

    const second = dispatch(
      state,
      { type: "start_research", techId: "solar_2" },
      config,
      defaultPorts
    );
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toBe("conflict_in_progress");
  });

  it("dispatch supports cancel_research with full refund", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    state.companyLevel = 2;
    const initialFunds = state.funds;
    const start = dispatch(
      state,
      { type: "start_research", techId: "wind_2" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;
    const research = state.researches["wind_2"];
    expect(research).toBeTruthy();

    const cancel = dispatch(
      state,
      { type: "cancel_research", researchId: research.researchId },
      config,
      defaultPorts
    );
    expect(cancel.ok).toBe(true);
    if (!cancel.ok) return;
    expect(cancel.value.state.funds).toBe(initialFunds);
    expect(Object.keys(cancel.value.state.researches)).toHaveLength(0);
  });

  it("dispatch cancel_research returns not_found for unknown id", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    const result = dispatch(
      state,
      { type: "cancel_research", researchId: "rq-missing" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_found");
  });

  it("dispatch claim_ad_reward speedup lights active research", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    state.companyLevel = 2;
    const start = dispatch(
      state,
      { type: "start_research", techId: "wind_2" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;
    const beforeAds = state.adsRemaining;

    const speedup = dispatch(
      state,
      { type: "claim_ad_reward", adType: "speedup" },
      config,
      defaultPorts
    );
    expect(speedup.ok).toBe(true);
    if (!speedup.ok) return;
    expect(speedup.value.state.litTechIds).toContain("wind_2");
    expect(Object.keys(speedup.value.state.researches)).toHaveLength(0);
    expect(speedup.value.state.adsRemaining).toBe(beforeAds - 1);
  });

  it("dispatch claim_ad_reward speedup fails without active research", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const speedup = dispatch(
      state,
      { type: "claim_ad_reward", adType: "speedup" },
      config,
      defaultPorts
    );
    expect(speedup.ok).toBe(false);
    if (speedup.ok) return;
    expect(speedup.error).toBe("conflict_in_progress");
  });

  it("M3 progresses research and lights tech on completion", () => {
    const config = loadTestConfig();
    let state = createInitialState(config);
    state.companyLevel = 2;
    const start = dispatch(
      state,
      { type: "start_research", techId: "wind_2" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;

    for (let i = 0; i < 3; i += 1) {
      const month = settleNextMonth(state, config, defaultPorts);
      expect(month.ok).toBe(true);
      if (!month.ok) return;
      state = month.value.state;
    }

    expect(state.litTechIds).toContain("wind_2");
    expect(Object.keys(state.researches)).toHaveLength(0);
  });

  it("dispatch blocks higher-level tech before company level reaches requirement", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    const result = dispatch(
      state,
      { type: "start_research", techId: "storage_system_1" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
  });

  it("applies eng_bulk_procure build discount to construction dispatch", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    state.litTechIds.push("eng_bulk_procure");

    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.funds).toBe(129);
  });

  it("dispatch rejects construction tier above lit max", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;

    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 2 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
    expect(result.context?.tier_max).toBe(1);
  });

  it("dispatch supports tier-2 construction after matching tech is lit", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    state.litTechIds.push("wind_2");

    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 2 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.funds).toBe(116);
    expect(result.value.state.constructionQueue[0]?.tier).toBe(2);
    expect(result.value.state.constructionQueue[0]?.monthsRemaining).toBe(3);
  });

  it("applies grid_regional link cost discount to grid link dispatch", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");

    const result = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.funds).toBe(134);
    expect(result.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(
      config.bundle.gridLoss.loss_regional_mw
    );
    expect(result.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.buildCost).toBe(6);
  });

  it("dispatch supports cancel_grid_link with full refund while building", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("grid_regional");
    const initialFunds = state.funds;

    const queued = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    state = queued.value.state;
    expect(state.funds).toBe(initialFunds - 6);

    const cancelled = dispatch(
      state,
      { type: "cancel_grid_link", linkId: "CITY-MAP01-02::CITY-START" },
      config,
      defaultPorts
    );
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.state.funds).toBe(initialFunds);
    expect(cancelled.value.state.gridLinks["CITY-MAP01-02::CITY-START"]).toBeUndefined();
  });

  it("dispatch blocks cancel_grid_link after link is finished", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    state.gridLinks["CITY-MAP01-02::CITY-START"] = {
      linkId: "CITY-MAP01-02::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP01-02",
      linkType: "region",
      status: "finished",
      monthsRemaining: 0,
      lossMw: config.bundle.gridLoss.loss_regional_mw,
      buildCost: 8
    };

    const cancelled = dispatch(
      state,
      { type: "cancel_grid_link", linkId: "CITY-MAP01-02::CITY-START" },
      config,
      defaultPorts
    );
    expect(cancelled.ok).toBe(false);
    if (cancelled.ok) return;
    expect(cancelled.error).toBe("conflict_in_progress");
  });

  it("applies eng_grid_dispatch regional loss reduction when queueing region links", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("eng_grid_dispatch");

    const result = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(112);
  });

  it("applies grid_backbone trunk cost discount to grid link dispatch", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP03-01");
    state.companyLevel = 4;
    state.litTechIds.push("grid_backbone");

    const result = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP03-01",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.funds).toBe(134);
    expect(result.value.state.gridLinks["CITY-MAP03-01::CITY-START"]?.lossMw).toBe(
      config.bundle.gridLoss.loss_backbone_pre_uhv_mw
    );
  });

  it("applies UHV loss profile when queueing trunk links after uhv_transmission is lit", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP06-01");
    state.companyLevel = 5;
    state.litTechIds.push("grid_backbone", "uhv_transmission");

    const result = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP06-01",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.gridLinks["CITY-MAP06-01::CITY-START"]?.lossMw).toBe(
      config.bundle.gridLoss.loss_backbone_uhv_mw
    );
  });

  it("refreshes existing trunk links to UHV loss profile during settle", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP06-01");
    state.companyLevel = 5;
    state.litTechIds.push("grid_backbone", "uhv_transmission");
    state.gridLinks["CITY-MAP06-01::CITY-START"] = {
      linkId: "CITY-MAP06-01::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP06-01",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: config.bundle.gridLoss.loss_backbone_pre_uhv_mw
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP06-01::CITY-START"]?.lossMw).toBe(
      config.bundle.gridLoss.loss_backbone_uhv_mw
    );
  });

  it("M4 uses unified island rate when two cities are connected in v0", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
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
    const next = month.value.state;
    expect(next.cities["CITY-START"].supplyRatio).toBe(0.43);
    expect(next.cities["CITY-MAP01-02"].supplyRatio).toBe(0.43);
    expect(next.cities["CITY-MAP01-02"].netImportMw).toBeGreaterThan(0);
  });

  it("M4 subtracts finished grid link losses from island supply", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    state = link.value.state;
    state.gridLinks["CITY-MAP01-02::CITY-START"].lossMw = 0;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(125);
    expect(month.value.state.cities["CITY-START"].effectiveSupplyMw).toBe(570);
    expect(month.value.state.cities["CITY-MAP01-02"].effectiveSupplyMw).toBe(224);
  });

  it("refreshes existing region links with smart dispatch loss reduction during settle", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 3;
    state.litTechIds.push("eng_grid_dispatch");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.gridLinks["CITY-MAP01-02::CITY-START"] = {
      linkId: "CITY-MAP01-02::CITY-START",
      fromCityId: "CITY-START",
      toCityId: "CITY-MAP01-02",
      linkType: "region",
      status: "finished",
      monthsRemaining: 0,
      lossMw: config.bundle.gridLoss.loss_regional_mw
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.gridLinks["CITY-MAP01-02::CITY-START"]?.lossMw).toBe(112);
    expect(month.value.state.cities["CITY-START"].effectiveSupplyMw).toBe(579);
    expect(month.value.state.cities["CITY-MAP01-02"].effectiveSupplyMw).toBe(228);
  });

  it("M4 keeps cities isolated when no finished link exists", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 920,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const next = month.value.state;
    expect(next.cities["CITY-START"].supplyRatio).toBe(0.69);
    expect(next.cities["CITY-MAP01-02"].supplyRatio).toBe(0);
    expect(next.cities["CITY-MAP01-02"].netImportMw).toBe(0);
  });

  it("M4 only grants storage output boost from storage_system_1", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.litTechIds.push("storage_system_2");
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-START"].localSupplyMw).toBe(420);
  });

  it("M4 applies rich city resource multipliers to wind solar and hydro only", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    withCity(state, config, "CITY-METB-01");
    withCity(state, config, "CITY-MAP07-01");
    withCity(state, config, "CITY-MAP07-03");
    state.facilities["fac-metb-solar"] = {
      id: "fac-metb-solar",
      cityId: "CITY-METB-01",
      facilityId: "solar",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-metb-nuclear"] = {
      id: "fac-metb-nuclear",
      cityId: "CITY-METB-01",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-map07-hydro"] = {
      id: "fac-map07-hydro",
      cityId: "CITY-MAP07-01",
      facilityId: "hydro",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-map07-wind"] = {
      id: "fac-map07-wind",
      cityId: "CITY-MAP07-03",
      facilityId: "wind",
      tier: 1,
      outputMw: 100,
      monthlyOpex: 0,
      monthlyFuel: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-METB-01"].localSupplyMw).toBe(300);
    expect(month.value.state.cities["CITY-MAP07-01"].localSupplyMw).toBe(200);
    expect(month.value.state.cities["CITY-MAP07-03"].localSupplyMw).toBe(200);
  });

  it("M3 upgrades existing wind facilities to tier 2 when wind_2 lights", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    state.facilities["fac-a"] = {
      id: "fac-a",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1,
      outputMw: 42,
      monthlyOpex: 1,
      monthlyFuel: 0
    };
    state.researches["wind_2"] = {
      researchId: "rq-1-wind_2",
      techId: "wind_2",
      monthsRemaining: 1
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("wind_2");
    expect(month.value.state.facilities["fac-a"]?.tier).toBe(2);
    expect(month.value.state.facilities["fac-a"]?.outputMw).toBe(84);
    expect(month.value.state.facilities["fac-a"]?.monthlyOpex).toBe(2);
  });

  it("dispatch rejects region link across different regions", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP02-01");
    state.companyLevel = 3;
    const out = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP02-01",
        linkType: "region"
      },
      config,
      defaultPorts
    );
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toBe("invalid_command_payload");
    expect(out.message).toContain("same region");
  });

  it("dispatch allows trunk link across different regions", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP02-01");
    state.companyLevel = 3;
    const out = dispatch(
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
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const key = "CITY-MAP02-01::CITY-START";
    expect(out.value.state.gridLinks[key]?.linkType).toBe("trunk");
  });

  it("dispatch rejects trunk link inside same region", () => {
    const config = loadTestConfig();
    const state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    const out = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "trunk"
      },
      config,
      defaultPorts
    );
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toBe("invalid_command_payload");
    expect(out.message).toContain("different regions");
  });

  it("M4 marks city non-eco even with net import", () => {
    const config = loadTestConfig();
    let state = withSecondCity(createInitialState(config), config);
    state.companyLevel = 2;
    state.facilities["fac-thermal"] = {
      id: "fac-thermal",
      cityId: "CITY-START",
      facilityId: "thermal",
      tier: 1,
      outputMw: 220,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    state.facilities["fac-wind"] = {
      id: "fac-wind",
      cityId: "CITY-MAP01-02",
      facilityId: "wind",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 0,
      monthlyFuel: 0
    };
    const link = dispatch(
      state,
      {
        type: "queue_grid_link",
        fromCityId: "CITY-START",
        toCityId: "CITY-MAP01-02",
        linkType: "region"
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
    const next = month.value.state;
    expect(next.cities["CITY-START"].netImportMw).toBeGreaterThan(0);
    expect(next.cities["CITY-START"].cityFullyEcoSupply).toBe(false);
    expect(next.cities["CITY-START"].ecoCapFactor).toBe(0.8);
  });

  it("M3 eco_thermal completion immediately eco-syncs existing thermal facilities", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 4;
    state.facilities["fac-thermal"] = {
      id: "fac-thermal",
      cityId: "CITY-START",
      facilityId: "thermal",
      tier: 1,
      outputMw: 220,
      monthlyOpex: 6,
      monthlyFuel: 3
    };
    state.researches["eco_thermal"] = {
      researchId: "rq-eco-thermal",
      techId: "eco_thermal",
      monthsRemaining: 1
    };

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.litTechIds).toContain("eco_thermal");
    expect(month.value.state.facilities["fac-thermal"]?.isEco).toBe(true);
    expect(month.value.state.cities["CITY-START"].cityFullyEcoSupply).toBe(true);
    expect(month.value.state.cities["CITY-START"].ecoCapFactor).toBe(1);
  });

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

  it("M13 resets bankrupt streak when funds recover", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.bankruptConsecutiveMonths = 1;
    state.funds = 200;
    state.cities["CITY-START"].demandMw = 0;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.bankruptConsecutiveMonths).toBe(0);
    expect(month.value.state.runResult).toBe(null);
  });

  it("M14 enters victory when target month reached and final disaster already triggered", () => {
    const config = loadTestConfig();
    const finalDisaster = config.bundle.disasters.find((d) => d.is_final);
    expect(finalDisaster).toBeTruthy();
    if (!finalDisaster) return;

    const state = createInitialState(config);
    state.currentMonth = config.bundle.runConfig.campaign_run_target_months;
    state.disastersTriggered.push(finalDisaster.seq);
    state.funds = 10;
    state.cities["CITY-START"].demandMw = 0;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.runResult).toBe("victory");
    expect(month.value.state.phase).toBe("run_result");
    expect(month.value.report.result).toBe("victory");
  });

  it("M11 applies eng_risk_reserve disaster cash reduction", () => {
    const config = loadTestConfig();
    const disaster = config.bundle.disasters.find((item) => item.trigger_month === 22);
    expect(disaster).toBeTruthy();
    if (!disaster) return;

    let state = createInitialState(config);
    state.litTechIds.push("eng_risk_reserve");
    state.companyLevel = 4;
    state.funds = 800;
    while (state.currentMonth < 22 && state.runResult === null) {
      const month = settleNextMonth(state, config, defaultPorts);
      expect(month.ok).toBe(true);
      if (!month.ok) return;
      state = month.value.state;
      state.funds = Math.max(state.funds, 100);
    }

    const month22 = settleNextMonth(state, config, defaultPorts);
    expect(month22.ok).toBe(true);
    if (!month22.ok) return;
    const disasterCashMult =
      config.bundle.difficulties.find((item) => item.difficulty_id === state.difficultyId)?.disaster_cash_mult ?? 1;
    const expectedPenalty = Math.floor(
      Math.floor(disaster.immediate_cash_penalty * disasterCashMult) * 0.85
    );
    expect(
      month22.value.report.steps.find((step) => step.stepId === "M11_events_apply")?.metrics.disaster_penalty
    ).toBe(expectedPenalty);
  });

  it("returns config_missing when final disaster is absent", () => {
    const config = loadTestConfig();
    config.bundle.disasters = config.bundle.disasters.filter((d) => !d.is_final);
    const state = createInitialState(config);

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("config_missing");
  });

  it("returns config_missing when bankrupt threshold is invalid", () => {
    const config = loadTestConfig();
    config.bundle.runConfig.bankrupt_consecutive_months = 0;
    const state = createInitialState(config);

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("config_missing");
  });

  it("dispatch blocks construction on locked city", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-MAP01-02", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
  });

  it("dispatch blocks construction in unlocked but inactive outside-region city", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 3;
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-MAP02-01", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
    expect(result.message).toContain("not operable");
  });

  it("dispatch blocks hydro construction in city without river", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 2;
    syncOperableCities(state, config);
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-MAP01-02", facilityId: "hydro", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_command_payload");
  });

  it("dispatch allows strategic super hydro only after its level-V tech is lit", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.funds = 500;

    const locked = dispatch(
      state,
      { type: "queue_super_hydro", slotId: "super_hydro_1" },
      config,
      defaultPorts
    );
    expect(locked.ok).toBe(false);
    if (locked.ok) return;
    expect(locked.error).toBe("not_unlocked");

    state.litTechIds.push("super_hydro");
    const unlocked = dispatch(
      state,
      { type: "queue_super_hydro", slotId: "super_hydro_1" },
      config,
      defaultPorts
    );
    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    expect(unlocked.value.state.superHydros["super_hydro_1"]?.nodeId).toBe("SUPER-HYDRO-1");
    expect(unlocked.value.state.superHydros["super_hydro_1"]?.status).toBe("building");
  });

  it("dispatch enforces one project per super hydro slot", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.funds = 500;
    state.litTechIds.push("super_hydro");
    state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "building",
      monthsRemaining: 2,
      outputMw: 4200
    };

    const result = dispatch(
      state,
      { type: "queue_super_hydro", slotId: "super_hydro_1" },
      config,
      defaultPorts
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("conflict_in_progress");
  });

  it("M4 adds finished super hydro as an independent grid hub supply node", () => {
    const config = loadTestConfig();
    const state = withCity(createInitialState(config), config, "CITY-MAP07-01");
    state.litTechIds.push("storage_system_1", "super_hydro");
    state.superHydros["super_hydro_1"] = {
      slotId: "super_hydro_1",
      nodeId: "SUPER-HYDRO-1",
      displayName: "超级水电一号槽",
      status: "finished",
      monthsRemaining: 0,
      outputMw: 4200
    };
    state.gridLinks["CITY-MAP07-01::SUPER-HYDRO-1"] = {
      linkId: "CITY-MAP07-01::SUPER-HYDRO-1",
      fromCityId: "SUPER-HYDRO-1",
      toCityId: "CITY-MAP07-01",
      linkType: "trunk",
      status: "finished",
      monthsRemaining: 0,
      lossMw: 0
    };

    const month = settleNextMonth(state, config, defaultPorts);

    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.cities["CITY-MAP07-01"].localSupplyMw).toBe(0);
    expect(month.value.state.cities["CITY-MAP07-01"].netImportMw).toBeGreaterThan(0);
    expect(month.value.state.cities["CITY-MAP07-01"].supplyRatio).toBe(1);
  });

  it("dispatch blocks nuclear construction before tech is lit", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "nuclear", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
  });

  it("dispatch blocks second nuclear construction in same city after tech unlock", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 3;
    state.litTechIds.push("nuclear_1");
    state.facilities["fac-nuclear-1"] = {
      id: "fac-nuclear-1",
      cityId: "CITY-START",
      facilityId: "nuclear",
      tier: 1,
      outputMw: 420,
      monthlyOpex: 12,
      monthlyFuel: 0
    };
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "nuclear", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("conflict_in_progress");
  });

  it("dispatch blocks research before company level II", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    const result = dispatch(
      state,
      { type: "start_research", techId: "wind_2" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not_unlocked");
  });

  it("settle returns state_invariant_broken for invalid runtime state", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.adsRemaining = -1;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("state_invariant_broken");
  });

  it("dispatch rejects commands when playable subphase is blocked", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.playableSubPhase = "blocked";
    const result = dispatch(
      state,
      { type: "claim_ad_reward", adType: "cash" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("blocked_by_tutorial");
    expect(result.context?.blocked_command).toBe("claim_ad_reward");
    expect(result.context?.allowed_commands_csv).toBe("advance_onboarding,skip_onboarding");
  });

  it("dispatch allows onboarding advance command when blocked", () => {
    const config = loadTestConfig();
    const state = createInitialState(config, { doctrineId: "tutorial" });
    state.playableSubPhase = "blocked";
    const result = dispatch(
      state,
      { type: "advance_onboarding" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.onboardingCurrentStepId).toBe("onb_02_build");
    expect(result.value.state.tutorialDoctrineCleared).toBe(false);
    expect(result.value.state.playableSubPhase).toBe("blocked");
  });

  it("tutorial run starts in blocked step and can advance to done", () => {
    const config = loadTestConfig();
    let state = createInitialState(config, { doctrineId: "tutorial" });
    expect(state.isTutorialRun).toBe(true);
    expect(state.onboardingCurrentStepId).toBe("onb_01_welcome");
    expect(state.playableSubPhase).toBe("blocked");

    for (let i = 0; i < 7; i += 1) {
      const step = dispatch(state, { type: "advance_onboarding" }, config, defaultPorts);
      expect(step.ok).toBe(true);
      if (!step.ok) return;
      state = step.value.state;
    }
    expect(state.onboardingCurrentStepId).toBe("onb_done");
    expect(state.tutorialDoctrineCleared).toBe(true);
    expect(state.playableSubPhase).toBe("navigating");
    expect(state.onboardingStepsDone).toContain("onb_07_tech_ii");
  });

  it("skip_onboarding marks tutorial skipped without cleared flag", () => {
    const config = loadTestConfig();
    const state = createInitialState(config, { doctrineId: "tutorial" });
    const skip = dispatch(state, { type: "skip_onboarding" }, config, defaultPorts);
    expect(skip.ok).toBe(true);
    if (!skip.ok) return;
    expect(skip.value.state.onboardingSkipped).toBe(true);
    expect(skip.value.state.onboardingCurrentStepId).toBe("onb_done");
    expect(skip.value.state.tutorialDoctrineCleared).toBe(false);
    expect(skip.value.state.playableSubPhase).toBe("navigating");
  });

  it("rejects onboarding commands for non-tutorial runs", () => {
    const config = loadTestConfig();
    const state = createInitialState(config, { doctrineId: "tech" });
    const advance = dispatch(state, { type: "advance_onboarding" }, config, defaultPorts);
    expect(advance.ok).toBe(false);
    if (advance.ok) return;
    expect(advance.error).toBe("invalid_command_payload");
  });

  it("dispatch rejects run_result phase", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.phase = "run_result";
    state.runResult = "victory";
    const result = dispatch(
      state,
      { type: "claim_ad_reward", adType: "cash" },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_phase");
    expect(result.context?.phase).toBe("run_result");
    expect(result.context?.command_type).toBe("claim_ad_reward");
    expect(result.context?.run_result).toBe("victory");
  });

  it("dispatch rejects commands after bankrupt result", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.phase = "run_result";
    state.runResult = "bankrupt";
    const result = dispatch(
      state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "wind", tier: 1 },
      config,
      defaultPorts
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_phase");
    expect(result.context?.phase).toBe("run_result");
    expect(result.context?.command_type).toBe("queue_construction");
    expect(result.context?.run_result).toBe("bankrupt");
  });

  it("settle invalid_phase includes context when called from wrong phase", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.phase = "main_menu";
    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("invalid_phase");
    expect(month.context?.phase).toBe("main_menu");
    expect(month.context?.run_result).toBe("null");
  });

  it("settle invalid_phase includes run result when run already finished", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.runResult = "bankrupt";
    state.phase = "run_result";

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("invalid_phase");
    expect(month.context?.phase).toBe("run_result");
    expect(month.context?.run_result).toBe("bankrupt");
  });
});
