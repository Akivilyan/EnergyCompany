import type { GameState, SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";

export type OnboardingUiErrorCode =
  | "not_tutorial_run"
  | "action_blocked"
  | "action_invalid"
  | "action_failed";

export interface OnboardingUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const ONBOARDING_UI_COPY: Record<OnboardingUiErrorCode, OnboardingUiCopySpec> = {
  not_tutorial_run: {
    messageKey: "onboarding.error.not_tutorial_run",
    actionKey: "onboarding.action.start_tutorial_run"
  },
  action_blocked: {
    messageKey: "onboarding.error.action_blocked",
    actionKey: "onboarding.action.follow_current_step"
  },
  action_invalid: {
    messageKey: "onboarding.error.action_invalid",
    actionKey: "onboarding.action.retry"
  },
  action_failed: {
    messageKey: "onboarding.error.action_failed",
    actionKey: "onboarding.action.retry"
  }
};

export interface OnboardingSnapshot {
  isTutorialRun: boolean;
  currentStepId: GameState["onboardingCurrentStepId"];
  stepsDone: GameState["onboardingStepsDone"];
  skipped: boolean;
  cleared: boolean;
  playableSubPhase: GameState["playableSubPhase"];
}

export interface OnboardingActionOutput {
  before: OnboardingSnapshot;
  after: OnboardingSnapshot;
  result: SimResult<{ state: GameState }>;
  uiErrorCode: OnboardingUiErrorCode | null;
  uiCopy: OnboardingUiCopySpec | null;
}

function resolveUiCopy(code: OnboardingUiErrorCode | null): OnboardingUiCopySpec | null {
  if (!code) return null;
  return ONBOARDING_UI_COPY[code];
}

function mapUiError(
  result: SimResult<{ state: GameState }>,
  isTutorialRun: boolean
): OnboardingUiErrorCode | null {
  if (result.ok) return null;
  if (!isTutorialRun) return "not_tutorial_run";
  if (result.error === "blocked_by_tutorial") return "action_blocked";
  if (result.error === "invalid_phase" || result.error === "invalid_command_payload") {
    return "action_invalid";
  }
  return "action_failed";
}

export class ScreenOnboarding {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): OnboardingSnapshot {
    const state = this.controller.state;
    return {
      isTutorialRun: state.isTutorialRun,
      currentStepId: state.onboardingCurrentStepId,
      stepsDone: [...state.onboardingStepsDone],
      skipped: state.onboardingSkipped,
      cleared: state.tutorialDoctrineCleared,
      playableSubPhase: state.playableSubPhase
    };
  }

  advanceStep(): OnboardingActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "advance_onboarding" });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result, before.isTutorialRun);
    return {
      before,
      after,
      result,
      uiErrorCode,
      uiCopy: resolveUiCopy(uiErrorCode)
    };
  }

  skipAll(): OnboardingActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "skip_onboarding" });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result, before.isTutorialRun);
    return {
      before,
      after,
      result,
      uiErrorCode,
      uiCopy: resolveUiCopy(uiErrorCode)
    };
  }
}

export function createScreenOnboarding(controller: RunController): ScreenOnboarding {
  return new ScreenOnboarding(controller);
}
