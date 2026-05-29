import type { ConfigRepo } from "../config/configRepo.js";
import {
  aggregateIncomeMult,
  applyDisasterTrigger,
  tickDebuffs
} from "../systems/debuff.js";
import type { GameState } from "../types/gameState.js";
import type { SimPorts } from "../types/ports.js";
import { err, ok, type SimResult } from "../types/result.js";
import type { SettlementReport, SettlementStepReport } from "../types/settlement.js";

export interface SettleOutput {
  state: GameState;
  report: SettlementReport;
}

function validateSettlementConfig(config: ConfigRepo): SimResult<true> {
  if (config.bundle.companyLevels.length === 0) {
    return err("config_missing", "company level config is empty", {
      company_levels_len: config.bundle.companyLevels.length
    });
  }
  if (config.bundle.runConfig.bankrupt_consecutive_months < 1) {
    return err("config_missing", "bankrupt_consecutive_months must be >= 1", {
      bankrupt_consecutive_months: config.bundle.runConfig.bankrupt_consecutive_months
    });
  }
  if (config.bundle.runConfig.campaign_run_target_months < 1) {
    return err("config_missing", "campaign_run_target_months must be >= 1", {
      campaign_run_target_months: config.bundle.runConfig.campaign_run_target_months
    });
  }
  const hasFinalDisaster = config.bundle.disasters.some((d) => d.is_final);
  if (!hasFinalDisaster) {
    return err("config_missing", "missing final disaster for victory check", {
      disasters_len: config.bundle.disasters.length
    });
  }
  return ok(true);
}

function validateSettlementState(state: GameState): SimResult<true> {
  if (state.companyLevel < 1) {
    return err("state_invariant_broken", "companyLevel must be >= 1", {
      company_level: state.companyLevel
    });
  }
  if (state.bankruptConsecutiveMonths < 0) {
    return err("state_invariant_broken", "bankruptConsecutiveMonths must be >= 0", {
      bankrupt_consecutive_months: state.bankruptConsecutiveMonths
    });
  }
  if (state.adsRemaining < 0) {
    return err("state_invariant_broken", "adsRemaining must be >= 0", {
      ads_remaining: state.adsRemaining
    });
  }
  return ok(true);
}

function step(
  stepId: SettlementStepReport["stepId"],
  summary: string,
  metrics: Record<string, number> = {}
): SettlementStepReport {
  return { stepId, ok: true, summary, metrics };
}

function getEffectiveSvThreshold(state: GameState, level: number, baseThreshold: number): number {
  // 教学局最小闭环：降低升 II 门槛，便于引导阶段快速解锁 region 操作。
  if (state.doctrineId === "tutorial" && level === 2) {
    return 0;
  }
  return baseThreshold;
}

function buildIslands(state: GameState): string[][] {
  const cityIds = Object.keys(state.cities);
  const adj = new Map<string, Set<string>>();
  for (const cityId of cityIds) {
    adj.set(cityId, new Set());
  }
  for (const link of Object.values(state.gridLinks)) {
    if (link.status !== "finished") continue;
    if (!adj.has(link.fromCityId) || !adj.has(link.toCityId)) continue;
    adj.get(link.fromCityId)?.add(link.toCityId);
    adj.get(link.toCityId)?.add(link.fromCityId);
  }
  const visited = new Set<string>();
  const islands: string[][] = [];
  for (const cityId of cityIds) {
    if (visited.has(cityId)) continue;
    const island: string[] = [];
    const stack = [cityId];
    visited.add(cityId);
    while (stack.length > 0) {
      const cur = stack.pop();
      if (!cur) continue;
      island.push(cur);
      for (const next of adj.get(cur) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
    islands.push(island);
  }
  return islands;
}

function recalcSupply(state: GameState): void {
  const hasStorageBoost = state.litTechIds.some((id) => id.startsWith("storage_system_"));
  const storageBoostTypes = new Set(["wind", "solar", "hydro"]);
  const localSupplyByCity = new Map<string, number>();
  const localFullyEcoByCity = new Map<string, boolean>();

  for (const cityId of Object.keys(state.cities)) {
    localSupplyByCity.set(cityId, 0);
    localFullyEcoByCity.set(cityId, true);
  }

  for (const fac of Object.values(state.facilities)) {
    const current = localSupplyByCity.get(fac.cityId) ?? 0;
    const boost =
      hasStorageBoost && storageBoostTypes.has(fac.facilityId) ? 2 : 1;
    localSupplyByCity.set(fac.cityId, current + fac.outputMw * boost);
    if (fac.facilityId === "thermal" || fac.facilityId === "nuclear") {
      localFullyEcoByCity.set(fac.cityId, false);
    }
  }

  const islands = buildIslands(state);
  for (const island of islands) {
    let islandDemand = 0;
    let islandSupply = 0;
    for (const cityId of island) {
      const city = state.cities[cityId];
      islandDemand += city.demandMw;
      islandSupply += localSupplyByCity.get(cityId) ?? 0;
    }
    const islandRate =
      islandDemand <= 0 ? 0 : Math.min(1, Math.max(0, islandSupply) / islandDemand);
    for (const cityId of island) {
      const city = state.cities[cityId];
      const localSupply = localSupplyByCity.get(cityId) ?? 0;
      const effectiveSupply = Math.floor(city.demandMw * islandRate);
      city.localSupplyMw = localSupply;
      city.effectiveSupplyMw = effectiveSupply;
      city.netImportMw = effectiveSupply - localSupply;
      city.supplyRatio =
        city.demandMw <= 0
          ? 0
          : Math.min(1, Math.floor((effectiveSupply * 100) / city.demandMw) / 100);
      city.cityFullyEcoSupply = localFullyEcoByCity.get(cityId) ?? true;
      city.ecoCapFactor = city.cityFullyEcoSupply ? 1 : 0.8;
    }
  }
}

function runM2(state: GameState): SettlementStepReport {
  let completed = 0;
  for (const link of Object.values(state.gridLinks)) {
    if (link.status !== "building") continue;
    if (link.monthsRemaining > 0) {
      link.monthsRemaining -= 1;
    }
    if (link.monthsRemaining <= 0) {
      link.status = "finished";
      link.monthsRemaining = 0;
      completed += 1;
    }
  }
  return step("M2_grid_progress", `completed=${completed}`, {
    grid_links_total: Object.keys(state.gridLinks).length
  });
}

function runM1(state: GameState, config: ConfigRepo): SettlementStepReport {
  const completed: string[] = [];
  for (const item of state.constructionQueue) {
    if (item.monthsRemaining > 0) {
      item.monthsRemaining -= 1;
    }
    if (item.monthsRemaining <= 0) {
      const facCfg = config.getFacility(item.facilityId);
      if (!facCfg) continue;
      const id = `fac-${Object.keys(state.facilities).length + 1}`;
      state.facilities[id] = {
        id,
        cityId: item.cityId,
        facilityId: item.facilityId,
        tier: item.tier,
        outputMw: facCfg.output_capacity_mw,
        monthlyOpex: facCfg.monthly_operating_cost,
        monthlyFuel: item.facilityId === "thermal" ? 3 : 0
      };
      completed.push(id);
    }
  }
  state.constructionQueue = state.constructionQueue.filter((q) => q.monthsRemaining > 0);
  return step("M1_construction_progress", `completed=${completed.length}`, {
    queue_len: state.constructionQueue.length
  });
}

function runM3(state: GameState): SettlementStepReport {
  const completed: string[] = [];
  for (const item of Object.values(state.researches)) {
    if (item.monthsRemaining > 0) {
      item.monthsRemaining -= 1;
    }
    if (item.monthsRemaining <= 0) {
      if (!state.litTechIds.includes(item.techId)) {
        state.litTechIds.push(item.techId);
      }
      completed.push(item.techId);
      delete state.researches[item.techId];
    }
  }
  return step("M3_research_progress", `completed=${completed.length}`, {
    research_queue_len: Object.keys(state.researches).length
  });
}

export function settleNextMonth(
  state: GameState,
  config: ConfigRepo,
  _ports: SimPorts
): SimResult<SettleOutput> {
  if (state.phase !== "run_playable" && state.phase !== "month_settling") {
    return err("invalid_phase", "settle only from run_playable", {
      phase: state.phase,
      run_result: state.runResult ?? "null"
    });
  }
  if (state.runResult !== null) {
    return err("invalid_phase", "run already finished", {
      phase: state.phase,
      run_result: state.runResult
    });
  }
  const configCheck = validateSettlementConfig(config);
  if (!configCheck.ok) {
    return configCheck;
  }
  const stateCheck = validateSettlementState(state);
  if (!stateCheck.ok) {
    return stateCheck;
  }

  const next: GameState = structuredClone(state);
  next.phase = "month_settling";
  const monthFrom = next.currentMonth;
  const steps: SettlementStepReport[] = [];

  steps.push(runM2(next));
  steps.push(runM3(next));

  steps.push(runM1(next, config));
  recalcSupply(next);
  steps.push(
    step("M4_supply_recalc", "supply ratios updated", {
      supply_ratio: next.cities["CITY-START"]?.supplyRatio ?? 0
    })
  );

  const incomeMult = aggregateIncomeMult(next);
  let grossIncome = 0;
  for (const city of Object.values(next.cities)) {
    grossIncome += Math.floor(city.demandMw * city.supplyRatio * next.incomePricePerMw);
  }
  const netIncome = Math.floor((grossIncome * incomeMult.num) / incomeMult.den);
  next.funds += netIncome;
  steps.push(
    step("M5_income_settlement", `income=${netIncome}`, {
      gross_income: grossIncome,
      income_mult_num: incomeMult.num,
      income_mult_den: incomeMult.den
    })
  );

  let opex = 0;
  let fuel = 0;
  for (const fac of Object.values(next.facilities)) {
    opex += fac.monthlyOpex;
    fuel += fac.monthlyFuel;
  }
  next.funds -= opex + fuel;
  steps.push(step("M6_opex_settlement", `opex=${opex}`, { opex }));
  steps.push(step("M7_fuel_settlement", `fuel=${fuel}`, { fuel }));

  let loanPaid = 0;
  for (const loan of Object.values(next.loans)) {
    if (loan.monthsRemaining <= 0) continue;
    next.funds -= loan.monthlyPayment;
    loanPaid += loan.monthlyPayment;
    loan.principalRemaining = Math.max(0, loan.principalRemaining - loan.monthlyPayment);
    loan.monthsRemaining -= 1;
    if (loan.monthsRemaining <= 0) {
      delete next.loans[loan.loanId];
    }
  }
  steps.push(step("M8_loan_settlement", `paid=${loanPaid}`, { loan_paid: loanPaid }));

  let sv = 0;
  for (const city of Object.values(next.cities)) {
    sv += Math.floor(city.cityBaseSocialValue * city.supplyRatio * city.ecoCapFactor);
  }
  next.socialValueCurrent = sv;
  steps.push(step("M9_social_value_settlement", `sv=${sv}`, { social_value: sv }));

  let newLevel = next.companyLevel;
  for (const row of config.bundle.companyLevels) {
    const threshold = getEffectiveSvThreshold(next, row.level, row.sv_threshold);
    if (next.socialValueCurrent >= threshold && row.level > newLevel) {
      newLevel = row.level;
    }
  }
  next.companyLevel = newLevel;
  steps.push(step("M10_company_level_check", `level=${newLevel}`, { company_level: newLevel }));

  const diff = config.bundle.difficulties.find((d) => d.difficulty_id === next.difficultyId);
  const disasterCashMult = diff?.disaster_cash_mult ?? 1;
  tickDebuffs(next);
  const disaster = config.getDisasterForMonth(next.currentMonth);
  let disasterPenalty = 0;
  if (disaster && !next.disastersTriggered.includes(disaster.seq)) {
    disasterPenalty = applyDisasterTrigger(next, disaster, disasterCashMult);
  }
  steps.push(
    step("M11_events_apply", `disaster_penalty=${disasterPenalty}`, {
      disaster_penalty: disasterPenalty,
      active_debuffs: next.activeDebuffs.length
    })
  );

  steps.push(step("M12_milestones_emit", "v0 stub"));

  if (next.funds < 0) {
    next.bankruptConsecutiveMonths += 1;
  } else {
    next.bankruptConsecutiveMonths = 0;
  }
  const bankruptThreshold = config.bundle.runConfig.bankrupt_consecutive_months;
  let result: SettlementReport["result"] = "continue";
  if (next.bankruptConsecutiveMonths >= bankruptThreshold) {
    next.runResult = "bankrupt";
    next.phase = "run_result";
    result = "bankrupt";
  }
  steps.push(
    step("M13_bankrupt_check", `consecutive=${next.bankruptConsecutiveMonths}`, {
      funds: next.funds,
      bankrupt_consecutive: next.bankruptConsecutiveMonths
    })
  );

  const targetMonths = config.bundle.runConfig.campaign_run_target_months;
  const finalDisaster = config.bundle.disasters.find((d) => d.is_final);
  const finalTriggered =
    finalDisaster && next.disastersTriggered.includes(finalDisaster.seq);
  if (
    next.runResult === null &&
    next.currentMonth >= targetMonths &&
    finalTriggered &&
    next.funds >= 0
  ) {
    next.runResult = "victory";
    next.phase = "run_result";
    result = "victory";
  }
  steps.push(step("M14_victory_check", `result=${result}`, { month: next.currentMonth }));

  if (next.runResult === null) {
    next.currentMonth += 1;
    next.phase = "run_playable";
    next.playableSubPhase = "navigating";
  }

  const report: SettlementReport = {
    runId: next.runId,
    monthFrom,
    monthTo: next.currentMonth,
    steps,
    result
  };

  return ok({ state: next, report });
}
