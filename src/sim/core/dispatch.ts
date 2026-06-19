import type { ConfigRepo } from "../config/configRepo.js";
import { deepClone } from "./deepClone.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import type { SimPorts } from "../types/ports.js";
import { err, ok, type SimResult } from "../types/result.js";

export interface DispatchOutput {
  state: GameState;
}

const GRID_LINK_COST = 8;
const GRID_LINK_BUILD_MONTHS = 1;
const ONBOARDING_FLOW: GameState["onboardingCurrentStepId"][] = [
  "onb_01_welcome",
  "onb_02_build",
  "onb_03_next_month",
  "onb_04_read_dashboard",
  "onb_05_push_to_finish",
  "onb_06_company",
  "onb_07_tech_ii",
  "onb_done"
];

function cloneState(state: GameState): GameState {
  return deepClone(state);
}

function makeUndirectedLinkKey(fromCityId: string, toCityId: string): string {
  return [fromCityId, toCityId].sort().join("::");
}

function assertCityUnlocked(companyLevel: number, unlockLevel: number): SimResult<true> {
  if (companyLevel < unlockLevel) {
    return err("not_unlocked", "city not unlocked for current company level", {
      company_level: companyLevel,
      unlock_level: unlockLevel
    });
  }
  return ok(true);
}

function countCityFacility(
  state: GameState,
  cityId: string,
  facilityId: string
): number {
  let built = 0;
  for (const fac of Object.values(state.facilities)) {
    if (fac.cityId === cityId && fac.facilityId === facilityId) {
      built += 1;
    }
  }
  for (const item of state.constructionQueue) {
    if (item.cityId === cityId && item.facilityId === facilityId) {
      built += 1;
    }
  }
  return built;
}

function isBlockedAllowedCommand(command: Command): boolean {
  return command.type === "advance_onboarding" || command.type === "skip_onboarding";
}

function nextOnboardingStep(
  currentStep: GameState["onboardingCurrentStepId"]
): GameState["onboardingCurrentStepId"] {
  const idx = ONBOARDING_FLOW.indexOf(currentStep);
  if (idx < 0 || idx + 1 >= ONBOARDING_FLOW.length) return "onb_done";
  return ONBOARDING_FLOW[idx + 1];
}

export function dispatch(
  state: GameState,
  command: Command,
  config: ConfigRepo,
  _ports: SimPorts
): SimResult<DispatchOutput> {
  if (state.phase !== "run_playable" || state.runResult !== null) {
    return err("invalid_phase", "commands only allowed in run_playable without result", {
      phase: state.phase,
      run_result: state.runResult ?? "null",
      playable_sub_phase: state.playableSubPhase ?? "null",
      command_type: command.type
    });
  }
  if (state.playableSubPhase === null) {
    return err("state_invariant_broken", "playableSubPhase must not be null in run_playable");
  }
  if (state.playableSubPhase === "blocked" && !isBlockedAllowedCommand(command)) {
    return err("blocked_by_tutorial", "commands are blocked by tutorial gate", {
      playable_sub_phase: state.playableSubPhase,
      blocked_command: command.type,
      allowed_commands_csv: "advance_onboarding,skip_onboarding"
    });
  }
  if (state.adsRemaining < 0) {
    return err("state_invariant_broken", "adsRemaining must be >= 0", {
      ads_remaining: state.adsRemaining
    });
  }

  const next = cloneState(state);

  switch (command.type) {
    case "queue_construction": {
      const facility = config.getFacility(command.facilityId);
      const city = config.getCity(command.cityId);
      if (!facility || !city) {
        return err("not_found", "facility or city not found");
      }
      const unlocked = assertCityUnlocked(next.companyLevel, city.unlock_company_level);
      if (!unlocked.ok) {
        return unlocked;
      }
      if (next.constructionQueue.length >= 3) {
        return err("conflict_in_progress", "global construction queue full");
      }
      if (facility.unlock_tech_id && !next.litTechIds.includes(facility.unlock_tech_id)) {
        return err("not_unlocked", "facility tech not lit", {
          city_id: command.cityId,
          facility_id: command.facilityId,
          unlock_tech_id: facility.unlock_tech_id
        });
      }
      if (facility.requires_river && !city.has_river) {
        return err("invalid_command_payload", "facility requires river", {
          city_id: command.cityId,
          facility_id: command.facilityId
        });
      }
      if (command.facilityId === "nuclear" && !city.is_nuclear_eligible) {
        return err("invalid_command_payload", "facility requires nuclear eligible city", {
          city_id: command.cityId,
          facility_id: command.facilityId
        });
      }
      const maxPerCity = facility.max_per_city ?? Number.POSITIVE_INFINITY;
      if (countCityFacility(next, command.cityId, command.facilityId) >= maxPerCity) {
        return err("conflict_in_progress", "facility maxed in city", {
          city_id: command.cityId,
          facility_id: command.facilityId,
          max_per_city: maxPerCity
        });
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
    case "queue_grid_link": {
      if (command.fromCityId === command.toCityId) {
        return err("invalid_command_payload", "grid link endpoints must be different");
      }
      const from = config.getCity(command.fromCityId);
      const to = config.getCity(command.toCityId);
      if (!from || !to) {
        return err("not_found", "city not found for grid link");
      }
      const fromUnlocked = assertCityUnlocked(next.companyLevel, from.unlock_company_level);
      if (!fromUnlocked.ok) {
        return fromUnlocked;
      }
      const toUnlocked = assertCityUnlocked(next.companyLevel, to.unlock_company_level);
      if (!toUnlocked.ok) {
        return toUnlocked;
      }
      const fromRegionId = from.region_id ?? "unknown";
      const toRegionId = to.region_id ?? "unknown";
      if (command.linkType === "region" && fromRegionId !== toRegionId) {
        return err("invalid_command_payload", "region link must stay in same region", {
          from_city_id: command.fromCityId,
          to_city_id: command.toCityId,
          from_region_id: fromRegionId,
          to_region_id: toRegionId,
          expected_link_type: "trunk"
        });
      }
      if (command.linkType === "trunk" && fromRegionId === toRegionId) {
        return err("invalid_command_payload", "trunk link must connect different regions", {
          from_city_id: command.fromCityId,
          to_city_id: command.toCityId,
          from_region_id: fromRegionId,
          to_region_id: toRegionId,
          expected_link_type: "region"
        });
      }
      const linkKey = makeUndirectedLinkKey(command.fromCityId, command.toCityId);
      if (next.gridLinks[linkKey]) {
        return err("conflict_in_progress", "grid link already exists");
      }
      if (next.funds < GRID_LINK_COST) {
        return err("insufficient_funds", "not enough funds for grid link");
      }
      next.funds -= GRID_LINK_COST;
      next.gridLinks[linkKey] = {
        linkId: linkKey,
        fromCityId: command.fromCityId,
        toCityId: command.toCityId,
        linkType: command.linkType,
        status: "building",
        monthsRemaining: GRID_LINK_BUILD_MONTHS,
        lossMw: 0
      };
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
      const tech = config.getTechnology(command.techId);
      if (!tech) {
        return err("not_found", "technology not found");
      }
      if (next.companyLevel < 2) {
        return err("not_unlocked", "research is unlocked from company level II");
      }
      if (next.companyLevel < tech.company_level_min) {
        return err("not_unlocked", "technology not unlocked for current company level", {
          company_level: next.companyLevel,
          required_company_level: tech.company_level_min,
          tech_id: command.techId
        });
      }
      if (next.litTechIds.includes(command.techId)) {
        return err("conflict_in_progress", "tech already researched");
      }
      for (const requiredTechId of tech.requires_lit ?? []) {
        if (!next.litTechIds.includes(requiredTechId)) {
          return err("not_unlocked", "technology prerequisite not lit", {
            tech_id: command.techId,
            requires_lit: requiredTechId
          });
        }
      }
      if (Object.keys(next.researches).length > 0) {
        return err("conflict_in_progress", "only one active research allowed");
      }
      if (next.funds < tech.research_cost) {
        return err("insufficient_funds", "not enough funds for research");
      }
      next.funds -= tech.research_cost;
      next.researches[command.techId] = {
        researchId: `rq-${next.currentMonth}-${command.techId}`,
        techId: command.techId,
        monthsRemaining: tech.research_months
      };
      break;
    }
    case "cancel_research": {
      let foundTechId: string | null = null;
      for (const [techId, research] of Object.entries(next.researches)) {
        if (research.researchId === command.researchId) {
          foundTechId = techId;
          break;
        }
      }
      if (!foundTechId) {
        return err("not_found", "research item not found");
      }
      const tech = config.getTechnology(foundTechId);
      if (!tech) {
        return err("state_invariant_broken", "technology missing for active research", {
          tech_id: foundTechId
        });
      }
      delete next.researches[foundTechId];
      next.funds += tech.research_cost;
      break;
    }
    case "advance_onboarding": {
      if (!next.isTutorialRun) {
        return err("invalid_command_payload", "advance_onboarding is tutorial-only");
      }
      if (next.onboardingCurrentStepId !== "onb_done") {
        if (!next.onboardingStepsDone.includes(next.onboardingCurrentStepId)) {
          next.onboardingStepsDone.push(next.onboardingCurrentStepId);
        }
        next.onboardingCurrentStepId = nextOnboardingStep(next.onboardingCurrentStepId);
      }
      if (next.onboardingCurrentStepId === "onb_done") {
        next.tutorialDoctrineCleared = true;
        next.playableSubPhase = "navigating";
      } else {
        next.playableSubPhase = "blocked";
      }
      return ok({ state: next });
    }
    case "skip_onboarding": {
      if (!next.isTutorialRun) {
        return err("invalid_command_payload", "skip_onboarding is tutorial-only");
      }
      next.onboardingSkipped = true;
      next.onboardingCurrentStepId = "onb_done";
      next.playableSubPhase = "navigating";
      return ok({ state: next });
    }
    case "claim_ad_reward": {
      if (next.adsRemaining <= 0) {
        return err("conflict_in_progress", "no ads remaining");
      }
      if (command.adType === "cash") {
        next.funds += config.getAdReward(next.companyLevel);
      } else if (command.adType === "speedup") {
        const activeResearch = Object.values(next.researches)[0];
        if (!activeResearch) {
          return err("conflict_in_progress", "no active research");
        }
        delete next.researches[activeResearch.techId];
        if (!next.litTechIds.includes(activeResearch.techId)) {
          next.litTechIds.push(activeResearch.techId);
        }
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
