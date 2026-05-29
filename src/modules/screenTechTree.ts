import type { GameState, SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";

export type TechTreeUiErrorCode =
  | "tech_locked"
  | "insufficient_funds"
  | "research_queue_full"
  | "research_not_found"
  | "no_active_research"
  | "action_blocked"
  | "action_invalid"
  | "action_failed";

export interface TechTreeUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const TECH_TREE_UI_COPY: Record<TechTreeUiErrorCode, TechTreeUiCopySpec> = {
  tech_locked: {
    messageKey: "tech_tree.error.tech_locked",
    actionKey: "tech_tree.action.go_company_upgrade"
  },
  insufficient_funds: {
    messageKey: "tech_tree.error.insufficient_funds",
    actionKey: "tech_tree.action.go_finance"
  },
  research_queue_full: {
    messageKey: "tech_tree.error.research_queue_full",
    actionKey: "tech_tree.action.cancel_or_wait"
  },
  research_not_found: {
    messageKey: "tech_tree.error.research_not_found",
    actionKey: "tech_tree.action.refresh_list"
  },
  no_active_research: {
    messageKey: "tech_tree.error.no_active_research",
    actionKey: "tech_tree.action.start_research_first"
  },
  action_blocked: {
    messageKey: "tech_tree.error.action_blocked",
    actionKey: "tech_tree.action.follow_tutorial"
  },
  action_invalid: {
    messageKey: "tech_tree.error.action_invalid",
    actionKey: "tech_tree.action.retry_after_settle"
  },
  action_failed: {
    messageKey: "tech_tree.error.action_failed",
    actionKey: "tech_tree.action.retry"
  }
};

export function resolveTechTreeUiCopy(
  uiErrorCode: TechTreeUiErrorCode | null
): TechTreeUiCopySpec | null {
  if (!uiErrorCode) return null;
  return TECH_TREE_UI_COPY[uiErrorCode];
}

export interface TechTreeSnapshot {
  month: number;
  companyLevel: number;
  funds: number;
  canOpen: boolean;
  activeResearch: {
    techId: string;
    researchId: string;
    monthsRemaining: number;
  } | null;
  litTechIds: string[];
}

export interface TechTreeActionOutput {
  before: TechTreeSnapshot;
  after: TechTreeSnapshot;
  result: SimResult<{ state: GameState }>;
  uiErrorCode: TechTreeUiErrorCode | null;
  uiCopy: TechTreeUiCopySpec | null;
}

function mapUiError(result: TechTreeActionOutput["result"]): TechTreeUiErrorCode | null {
  if (result.ok) return null;
  if (result.error === "not_unlocked") return "tech_locked";
  if (result.error === "insufficient_funds") return "insufficient_funds";
  if (result.error === "not_found") return "research_not_found";
  if (result.error === "blocked_by_tutorial") return "action_blocked";
  if (result.error === "invalid_phase" || result.error === "invalid_command_payload") {
    return "action_invalid";
  }
  if (result.error === "conflict_in_progress") {
    if (result.message.includes("no active research")) return "no_active_research";
    return "research_queue_full";
  }
  return "action_failed";
}

export class ScreenTechTree {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): TechTreeSnapshot {
    const active = Object.values(this.controller.state.researches)[0];
    return {
      month: this.controller.state.currentMonth,
      companyLevel: this.controller.state.companyLevel,
      funds: this.controller.state.funds,
      canOpen: this.controller.state.companyLevel >= 2,
      activeResearch: active
        ? {
            techId: active.techId,
            researchId: active.researchId,
            monthsRemaining: active.monthsRemaining
          }
        : null,
      litTechIds: [...this.controller.state.litTechIds]
    };
  }

  startResearch(techId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "start_research", techId });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }

  cancelResearch(researchId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "cancel_research", researchId });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }

  speedupResearchByAd(): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({
      type: "claim_ad_reward",
      adType: "speedup"
    });
    const after = this.getSnapshot();
    const uiErrorCode = mapUiError(result);
    return { before, after, result, uiErrorCode, uiCopy: resolveTechTreeUiCopy(uiErrorCode) };
  }
}

export function createScreenTechTree(controller: RunController): ScreenTechTree {
  return new ScreenTechTree(controller);
}
