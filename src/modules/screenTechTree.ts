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
    return { before, after, result, uiErrorCode: mapUiError(result) };
  }

  cancelResearch(researchId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "cancel_research", researchId });
    const after = this.getSnapshot();
    return { before, after, result, uiErrorCode: mapUiError(result) };
  }

  speedupResearchByAd(): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({
      type: "claim_ad_reward",
      adType: "speedup"
    });
    const after = this.getSnapshot();
    return { before, after, result, uiErrorCode: mapUiError(result) };
  }
}

export function createScreenTechTree(controller: RunController): ScreenTechTree {
  return new ScreenTechTree(controller);
}
