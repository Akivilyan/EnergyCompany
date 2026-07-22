import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import { err, ok, type SimResult } from "../types/result.js";
import type { DispatchCommandOutcome } from "./dispatchDomain.js";
import { completeConstructionQueueItem } from "./dispatchInfrastructure.js";
import { syncFacilityRuntimeTiers } from "./technologyEffects.js";

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

function nextOnboardingStep(
  currentStep: GameState["onboardingCurrentStepId"]
): GameState["onboardingCurrentStepId"] {
  const index = ONBOARDING_FLOW.indexOf(currentStep);
  if (index < 0 || index + 1 >= ONBOARDING_FLOW.length) return "onb_done";
  return ONBOARDING_FLOW[index + 1];
}

export function handleMetaCommand(
  state: GameState,
  command: Command,
  config: ConfigRepo
): SimResult<DispatchCommandOutcome> {
  switch (command.type) {
    case "advance_onboarding": {
      if (!state.isTutorialRun) return err("invalid_command_payload", "advance_onboarding is tutorial-only");
      if (state.onboardingCurrentStepId !== "onb_done") {
        if (!state.onboardingStepsDone.includes(state.onboardingCurrentStepId)) {
          state.onboardingStepsDone.push(state.onboardingCurrentStepId);
        }
        state.onboardingCurrentStepId = nextOnboardingStep(state.onboardingCurrentStepId);
      }
      if (state.onboardingCurrentStepId === "onb_done") {
        state.tutorialDoctrineCleared = true;
        state.playableSubPhase = "navigating";
      } else {
        state.playableSubPhase = "blocked";
      }
      return ok("handled_subphase");
    }
    case "skip_onboarding": {
      if (!state.isTutorialRun) return err("invalid_command_payload", "skip_onboarding is tutorial-only");
      state.onboardingSkipped = true;
      state.onboardingCurrentStepId = "onb_done";
      state.playableSubPhase = "navigating";
      return ok("handled_subphase");
    }
    case "claim_ad_reward": {
      if (state.adsRemaining <= 0) return err("conflict_in_progress", "no ads remaining");
      if (command.adType === "cash") {
        state.funds += config.getAdReward(state.companyLevel);
      } else if (command.adType === "instant_build") {
        if (!command.targetId) return err("invalid_command_payload", "instant build reward requires targetId");
        const completed = completeConstructionQueueItem(state, config, command.targetId);
        if (!completed.ok) return completed;
      } else if (command.adType === "instant_research" || command.adType === "speedup") {
        const activeResearch = Object.values(state.researches)[0];
        if (!activeResearch) return err("conflict_in_progress", "no active research");
        delete state.researches[activeResearch.techId];
        if (!state.litTechIds.includes(activeResearch.techId)) state.litTechIds.push(activeResearch.techId);
        syncFacilityRuntimeTiers(state, config);
      } else {
        return err("invalid_command_payload", "unsupported ad reward type");
      }
      state.adsRemaining -= 1;
      return ok("handled");
    }
    default:
      return ok("unhandled");
  }
}
