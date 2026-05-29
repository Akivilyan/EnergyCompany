import type { GameState } from "../sim/index.js";
import type { RunController } from "./runController.js";

export interface RunResultSnapshot {
  month: number;
  runResult: Exclude<GameState["runResult"], null>;
  funds: number;
  companyLevel: number;
  socialValue: number;
  disastersTriggeredCount: number;
  finalDisasterTriggered: boolean;
  canRunPlayableCommands: false;
}

export class ScreenRunResult {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): RunResultSnapshot | null {
    const state = this.controller.state;
    if (state.runResult === null || state.phase !== "run_result") return null;
    const finalDisaster = this.controller.config.bundle.disasters.find((item) => item.is_final);
    const finalDisasterTriggered = finalDisaster
      ? state.disastersTriggered.includes(finalDisaster.seq)
      : false;
    return {
      month: state.currentMonth,
      runResult: state.runResult,
      funds: state.funds,
      companyLevel: state.companyLevel,
      socialValue: state.socialValueCurrent,
      disastersTriggeredCount: state.disastersTriggered.length,
      finalDisasterTriggered,
      canRunPlayableCommands: false
    };
  }
}

export function createScreenRunResult(controller: RunController): ScreenRunResult {
  return new ScreenRunResult(controller);
}
