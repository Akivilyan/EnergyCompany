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

function step(
  stepId: SettlementStepReport["stepId"],
  summary: string,
  metrics: Record<string, number> = {}
): SettlementStepReport {
  return { stepId, ok: true, summary, metrics };
}

function recalcSupply(state: GameState): void {
  for (const cityId of Object.keys(state.cities)) {
    const city = state.cities[cityId];
    let supply = 0;
    for (const fac of Object.values(state.facilities)) {
      if (fac.cityId === cityId) {
        supply += fac.outputMw;
      }
    }
    city.localSupplyMw = supply;
    city.supplyRatio =
      city.demandMw <= 0 ? 1 : Math.min(1, Math.floor((supply * 100) / city.demandMw) / 100);
  }
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

export function settleNextMonth(
  state: GameState,
  config: ConfigRepo,
  _ports: SimPorts
): SimResult<SettleOutput> {
  if (state.phase !== "run_playable" && state.phase !== "month_settling") {
    return err("invalid_phase", "settle only from run_playable");
  }
  if (state.runResult !== null) {
    return err("invalid_phase", "run already finished");
  }

  const next: GameState = structuredClone(state);
  next.phase = "month_settling";
  const monthFrom = next.currentMonth;
  const steps: SettlementStepReport[] = [];

  steps.push(step("M2_grid_progress", "v0 stub: no grid queue"));
  steps.push(step("M3_research_progress", "v0 stub: no research queue"));

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
    sv += Math.floor(city.cityBaseSocialValue * city.supplyRatio);
  }
  next.socialValueCurrent = sv;
  steps.push(step("M9_social_value_settlement", `sv=${sv}`, { social_value: sv }));

  let newLevel = next.companyLevel;
  for (const row of config.bundle.companyLevels) {
    if (next.socialValueCurrent >= row.sv_threshold && row.level > newLevel) {
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
