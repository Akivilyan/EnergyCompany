import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import type { GameState } from "../../src/sim/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("settleNextMonth", () => {
  function withSecondCity(state: GameState, config: ConfigRepo): GameState {
    const city = config.getCity("CITY-MAP01-02");
    if (!city) {
      throw new Error("missing CITY-MAP01-02");
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

  it("runs M1-M14 in order", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    let state = createInitialState(config);
    state.companyLevel = 2;
    const initialFunds = state.funds;
    const start = dispatch(
      state,
      { type: "start_research", techId: "storage_system_1" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;
    expect(state.funds).toBe(initialFunds - 60);
    expect(Object.keys(state.researches)).toContain("storage_system_1");

    const second = dispatch(
      state,
      { type: "start_research", techId: "storage_system_2" },
      config,
      defaultPorts
    );
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toBe("conflict_in_progress");
  });

  it("dispatch supports cancel_research with full refund", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    let state = createInitialState(config);
    state.companyLevel = 2;
    const initialFunds = state.funds;
    const start = dispatch(
      state,
      { type: "start_research", techId: "storage_system_1" },
      config,
      defaultPorts
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    state = start.value.state;
    const research = state.researches["storage_system_1"];
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    let state = createInitialState(config);
    state.companyLevel = 2;
    const start = dispatch(
      state,
      { type: "start_research", techId: "storage_system_1" },
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
    expect(speedup.value.state.litTechIds).toContain("storage_system_1");
    expect(Object.keys(speedup.value.state.researches)).toHaveLength(0);
    expect(speedup.value.state.adsRemaining).toBe(beforeAds - 1);
  });

  it("dispatch claim_ad_reward speedup fails without active research", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    let state = createInitialState(config);
    state.companyLevel = 2;
    const start = dispatch(
      state,
      { type: "start_research", techId: "storage_system_1" },
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

    expect(state.litTechIds).toContain("storage_system_1");
    expect(Object.keys(state.researches)).toHaveLength(0);
  });

  it("M4 uses unified island rate when two cities are connected in v0", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    expect(next.cities["CITY-START"].supplyRatio).toBe(0.5);
    expect(next.cities["CITY-MAP01-02"].supplyRatio).toBe(0.5);
    expect(next.cities["CITY-MAP01-02"].netImportMw).toBeGreaterThan(0);
  });

  it("M4 keeps cities isolated when no finished link exists", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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

  it("M4 marks city non-eco even with net import", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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

  it("M10 does not downgrade company level when SV drops", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config);
    state.companyLevel = 3;
    state.facilities = {};

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(3);
  });

  it("M10 promotes tutorial run to level II with lowered threshold", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config, { doctrineId: "tutorial" });
    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(2);
  });

  it("M10 tutorial level-II threshold reads from run config", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    config.bundle.runConfig.tutorial_level2_sv_threshold = 5;
    const state = createInitialState(config, { doctrineId: "tutorial" });
    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    expect(month.value.state.companyLevel).toBe(1);
  });

  it("M10 normal level-II threshold reads from company level config", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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

  it("M13 resets bankrupt streak when funds recover", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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

  it("returns config_missing when final disaster is absent", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    config.bundle.disasters = config.bundle.disasters.filter((d) => !d.is_final);
    const state = createInitialState(config);

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("config_missing");
  });

  it("returns config_missing when bankrupt threshold is invalid", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    config.bundle.runConfig.bankrupt_consecutive_months = 0;
    const state = createInitialState(config);

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("config_missing");
  });

  it("dispatch blocks construction on locked city", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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

  it("dispatch blocks research before company level II", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config);
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

  it("settle returns state_invariant_broken for invalid runtime state", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config);
    state.adsRemaining = -1;

    const month = settleNextMonth(state, config, defaultPorts);
    expect(month.ok).toBe(false);
    if (month.ok) return;
    expect(month.error).toBe("state_invariant_broken");
  });

  it("dispatch rejects commands when playable subphase is blocked", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config, { doctrineId: "tech" });
    const advance = dispatch(state, { type: "advance_onboarding" }, config, defaultPorts);
    expect(advance.ok).toBe(false);
    if (advance.ok) return;
    expect(advance.error).toBe("invalid_command_payload");
  });

  it("dispatch rejects run_result phase", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
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
