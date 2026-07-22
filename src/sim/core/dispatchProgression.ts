import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import { err, ok, type SimResult } from "../types/result.js";
import type { DispatchCommandOutcome } from "./dispatchDomain.js";
import {
  getLoanTierLevelBonus,
  getResearchCost,
  getResearchMonths
} from "./technologyEffects.js";

export function handleProgressionCommand(
  state: GameState,
  command: Command,
  config: ConfigRepo
): SimResult<DispatchCommandOutcome> {
  switch (command.type) {
    case "apply_loan": {
      const tier = config.bundle.loanTiers.find((row) => row.loan_id === command.loanId);
      if (!tier) return err("not_found", "loan tier not found");
      const unlockLevel = tier.unlock_level ?? 1;
      const effectiveLoanLevel = state.companyLevel + getLoanTierLevelBonus(state, config);
      if (effectiveLoanLevel < unlockLevel) {
        return err("not_unlocked", "loan tier not unlocked for current company level", {
          company_level: state.companyLevel,
          effective_loan_level: effectiveLoanLevel,
          required_company_level: unlockLevel,
          loan_id: tier.loan_id
        });
      }
      if (Object.keys(state.loans).length > 0) return err("conflict_in_progress", "only one active loan allowed");
      state.funds += tier.principal;
      state.loans[tier.loan_id] = {
        loanId: tier.loan_id,
        principalRemaining: tier.principal,
        monthlyPayment: tier.monthly_payment_approx,
        monthsRemaining: tier.terms
      };
      return ok("handled");
    }
    case "start_research": {
      const tech = config.getTechnology(command.techId);
      if (!tech) return err("not_found", "technology not found");
      if (state.companyLevel < 2) return err("not_unlocked", "research is unlocked from company level II");
      if (state.companyLevel < tech.company_level_min) {
        return err("not_unlocked", "technology not unlocked for current company level", {
          company_level: state.companyLevel,
          required_company_level: tech.company_level_min,
          tech_id: command.techId
        });
      }
      if (state.litTechIds.includes(command.techId)) return err("conflict_in_progress", "tech already researched");
      for (const requiredTechId of tech.requires_lit ?? []) {
        if (!state.litTechIds.includes(requiredTechId)) {
          return err("not_unlocked", "technology prerequisite not lit", {
            tech_id: command.techId,
            requires_lit: requiredTechId
          });
        }
      }
      if (Object.keys(state.researches).length > 0) return err("conflict_in_progress", "only one active research allowed");
      const researchCost = getResearchCost(state, config, tech.research_cost);
      if (state.funds < researchCost) return err("insufficient_funds", "not enough funds for research");
      state.funds -= researchCost;
      state.researches[command.techId] = {
        researchId: `rq-${state.currentMonth}-${command.techId}`,
        techId: command.techId,
        monthsRemaining: getResearchMonths(state, config, tech.research_months)
      };
      return ok("handled");
    }
    case "cancel_research": {
      let foundTechId: string | null = null;
      for (const [techId, research] of Object.entries(state.researches)) {
        if (research.researchId === command.researchId) {
          foundTechId = techId;
          break;
        }
      }
      if (!foundTechId) return err("not_found", "research item not found");
      const tech = config.getTechnology(foundTechId);
      if (!tech) {
        return err("state_invariant_broken", "technology missing for active research", {
          tech_id: foundTechId
        });
      }
      delete state.researches[foundTechId];
      state.funds += getResearchCost(state, config, tech.research_cost);
      return ok("handled");
    }
    default:
      return ok("unhandled");
  }
}
