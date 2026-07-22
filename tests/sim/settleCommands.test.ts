import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import { syncOperableCities } from "../../src/sim/core/settleNextMonth.js";
import { getFacilityTierSpec } from "../../src/sim/core/technologyEffects.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import type { GameState } from "../../src/sim/index.js";

describe("dispatch commands and technology setup", () => {
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
    expect(state.funds).toBe(initialFunds - 32);
    expect(Object.keys(state.researches)).toContain("wind_2");
    expect(state.researches["wind_2"]?.monthsRemaining).toBe(1);

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

  it("keeps research table cost and months for non-tech doctrine", () => {
    const config = loadTestConfig();
    let state = createInitialState(config, { doctrineId: "renewable" });
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
    expect(state.researches["wind_2"]?.monthsRemaining).toBe(2);
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

  it("dispatch enforces storage II and III prerequisites for late renewable tiers", () => {
    const config = loadTestConfig();
    const state = createInitialState(config);
    state.companyLevel = 5;
    state.funds = 1000;
    state.litTechIds.push("wind_2", "wind_3", "storage_system_1");

    const blockedByStorage2 = dispatch(
      state,
      { type: "start_research", techId: "wind_4" },
      config,
      defaultPorts
    );
    expect(blockedByStorage2.ok).toBe(false);
    if (blockedByStorage2.ok) return;
    expect(blockedByStorage2.error).toBe("not_unlocked");
    expect(blockedByStorage2.context?.requires_lit).toBe("storage_system_2");

    state.litTechIds.push("storage_system_2");
    const wind4 = dispatch(
      state,
      { type: "start_research", techId: "wind_4" },
      config,
      defaultPorts
    );
    expect(wind4.ok).toBe(true);
    if (!wind4.ok) return;
    delete wind4.value.state.researches.wind_4;
    wind4.value.state.litTechIds.push("wind_4");

    const blockedByStorage3 = dispatch(
      wind4.value.state,
      { type: "start_research", techId: "wind_5" },
      config,
      defaultPorts
    );
    expect(blockedByStorage3.ok).toBe(false);
    if (blockedByStorage3.ok) return;
    expect(blockedByStorage3.error).toBe("not_unlocked");
    expect(blockedByStorage3.context?.requires_lit).toBe("storage_system_3");

    wind4.value.state.litTechIds.push("storage_system_3");
    const wind5 = dispatch(
      wind4.value.state,
      { type: "start_research", techId: "wind_5" },
      config,
      defaultPorts
    );
    expect(wind5.ok).toBe(true);
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
    expect(result.value.state.funds).toBe(192);
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
    expect(result.value.state.funds).toBe(179);
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
    expect(result.value.state.funds).toBe(197);
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
    state.litTechIds.push("grid_regional", "eng_grid_dispatch");

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
    expect(result.value.state.funds).toBe(197);
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

  it("dispatch applies eng_cashflow loan tier bonus when checking loan unlocks", () => {
    const config = loadTestConfig();
    const lockedState = createInitialState(config);
    lockedState.companyLevel = 4;

    const locked = dispatch(
      lockedState,
      { type: "apply_loan", loanId: "loan_5" },
      config,
      defaultPorts
    );
    expect(locked.ok).toBe(false);
    if (locked.ok) return;
    expect(locked.error).toBe("not_unlocked");
    expect(locked.context?.effective_loan_level).toBe(4);

    const unlockedState = createInitialState(config);
    unlockedState.companyLevel = 4;
    unlockedState.litTechIds.push("eng_cashflow");
    const unlocked = dispatch(
      unlockedState,
      { type: "apply_loan", loanId: "loan_5" },
      config,
      defaultPorts
    );

    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    expect(unlocked.value.state.loans.loan_5?.principalRemaining).toBe(1200);
    expect(unlocked.value.state.funds).toBe(unlockedState.funds + 1200);
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

});
