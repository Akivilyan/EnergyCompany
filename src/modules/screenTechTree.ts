import type { GameState, SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";

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
    return { before, after, result };
  }

  cancelResearch(researchId: string): TechTreeActionOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({ type: "cancel_research", researchId });
    const after = this.getSnapshot();
    return { before, after, result };
  }
}

export function createScreenTechTree(controller: RunController): ScreenTechTree {
  return new ScreenTechTree(controller);
}
