import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo, createInitialState, dispatch, settleNextMonth, defaultPorts } from "../../src/sim/index.js";
import { syncOperableCities } from "../../src/sim/core/settleNextMonth.js";
import { getFacilityTierSpec } from "../../src/sim/core/technologyEffects.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import type { GameState } from "../../src/sim/index.js";

describe("run lifecycle and invariants", () => {
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

  it("enforces city build slots and keeps slot identity", () => {
    const config = loadTestConfig();
    const city = config.bundle.cities.find((row) => row.city_id === "CITY-START");
    if (!city) throw new Error("CITY-START missing");
    city.build_slot_count = 1;
    const state = createInitialState(config);

    const first = dispatch(
      state,
      {
        type: "queue_construction",
        cityId: "CITY-START",
        facilityId: "wind",
        tier: 1,
        slotId: "slot-1"
      },
      config,
      defaultPorts
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.state.constructionQueue[0].slotId).toBe("slot-1");

    const second = dispatch(
      first.value.state,
      { type: "queue_construction", cityId: "CITY-START", facilityId: "solar", tier: 1 },
      config,
      defaultPorts
    );
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.message).toContain("slots full");
  });

  it("lets a facility supply power in the month it completes", () => {
    const config = loadTestConfig();
    const initial = createInitialState(config);
    const build = dispatch(
      initial,
      {
        type: "queue_construction",
        cityId: "CITY-START",
        facilityId: "wind",
        tier: 1,
        slotId: "slot-3"
      },
      config,
      defaultPorts
    );
    expect(build.ok).toBe(true);
    if (!build.ok) return;

    const firstMonth = settleNextMonth(build.value.state, config, defaultPorts);
    expect(firstMonth.ok).toBe(true);
    if (!firstMonth.ok) return;
    expect(firstMonth.value.state.cities["CITY-START"].effectiveSupplyMw).toBe(0);

    const completionMonth = settleNextMonth(firstMonth.value.state, config, defaultPorts);
    expect(completionMonth.ok).toBe(true);
    if (!completionMonth.ok) return;
    expect(completionMonth.value.state.constructionQueue).toHaveLength(0);
    expect(completionMonth.value.state.facilities["fac-1"].slotId).toBe("slot-3");
    expect(completionMonth.value.state.cities["CITY-START"].effectiveSupplyMw).toBeGreaterThan(0);
  });
});
