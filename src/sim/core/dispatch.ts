import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import type { SimPorts } from "../types/ports.js";
import { err, ok, type SimResult } from "../types/result.js";

export interface DispatchOutput {
  state: GameState;
}

const RESEARCH_COST = 60;
const RESEARCH_MONTHS = 3;

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function dispatch(
  state: GameState,
  command: Command,
  config: ConfigRepo,
  _ports: SimPorts
): SimResult<DispatchOutput> {
  if (state.phase !== "run_playable" || state.runResult !== null) {
    return err("invalid_phase", "commands only allowed in run_playable without result");
  }

  const next = cloneState(state);

  switch (command.type) {
    case "queue_construction": {
      const facility = config.getFacility(command.facilityId);
      const city = config.getCity(command.cityId);
      if (!facility || !city) {
        return err("not_found", "facility or city not found");
      }
      if (next.constructionQueue.length >= 3) {
        return err("conflict_in_progress", "global construction queue full");
      }
      if (next.funds < facility.build_cost_total) {
        return err("insufficient_funds", "not enough funds for construction");
      }
      next.funds -= facility.build_cost_total;
      next.constructionQueue.push({
        id: `cq-${next.constructionQueue.length + 1}`,
        cityId: command.cityId,
        facilityId: command.facilityId,
        tier: command.tier,
        monthsRemaining: facility.build_duration_months,
        installmentRemaining: 0
      });
      break;
    }
    case "apply_loan": {
      const tier = config.bundle.loanTiers.find((l) => l.loan_id === command.loanId);
      if (!tier) {
        return err("not_found", "loan tier not found");
      }
      if (Object.keys(next.loans).length > 0) {
        return err("conflict_in_progress", "only one active loan allowed");
      }
      next.funds += tier.principal;
      next.loans[tier.loan_id] = {
        loanId: tier.loan_id,
        principalRemaining: tier.principal,
        monthlyPayment: tier.monthly_payment_approx,
        monthsRemaining: tier.terms
      };
      break;
    }
    case "start_research": {
      if (next.litTechIds.includes(command.techId)) {
        return err("conflict_in_progress", "tech already researched");
      }
      if (Object.keys(next.researches).length > 0) {
        return err("conflict_in_progress", "only one active research allowed");
      }
      if (next.funds < RESEARCH_COST) {
        return err("insufficient_funds", "not enough funds for research");
      }
      next.funds -= RESEARCH_COST;
      next.researches[command.techId] = {
        researchId: `rq-${next.currentMonth}-${command.techId}`,
        techId: command.techId,
        monthsRemaining: RESEARCH_MONTHS
      };
      break;
    }
    case "claim_ad_reward": {
      if (next.adsRemaining <= 0) {
        return err("conflict_in_progress", "no ads remaining");
      }
      if (command.adType === "cash") {
        next.funds += config.getAdReward(next.companyLevel);
      }
      next.adsRemaining -= 1;
      break;
    }
    default:
      return err("invalid_command_payload", "unknown command");
  }

  next.playableSubPhase = "navigating";
  return ok({ state: next });
}
