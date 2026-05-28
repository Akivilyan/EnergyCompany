import path from "node:path";
import {
  ConfigRepo,
  createInitialState,
  dispatch,
  settleNextMonth,
  defaultPorts,
  type Command,
  type GameState,
  type SettlementReport,
  type SimResult
} from "../sim/index.js";

export class RunController {
  readonly config: ConfigRepo;
  readonly ports = defaultPorts;
  state: GameState;

  constructor(config: ConfigRepo, state: GameState) {
    this.config = config;
    this.state = state;
  }

  static fromRepoRoot(repoRoot: string): RunController {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config, { difficultyId: "simple", doctrineId: "tech" });
    return new RunController(config, state);
  }

  runCommand(command: Command): SimResult<{ state: GameState }> {
    const result = dispatch(this.state, command, this.config, this.ports);
    if (result.ok) {
      this.state = result.value.state;
    }
    return result;
  }

  runNextMonth(): SimResult<{ state: GameState; report: SettlementReport }> {
    const result = settleNextMonth(this.state, this.config, this.ports);
    if (result.ok) {
      this.state = result.value.state;
    }
    return result;
  }

  /** 主流程联调：自动补一座风电后连续推月直到终局或破产 */
  playSlice(maxMonths = 90): { state: GameState; reports: SettlementReport[] } {
    const build = this.runCommand({
      type: "queue_construction",
      cityId: "CITY-START",
      facilityId: "wind",
      tier: 1
    });
    if (!build.ok) {
      this.ports.logger.warn("playSlice: skip build", { error: build.error });
    }

    const reports: SettlementReport[] = [];
    while (this.state.runResult === null && this.state.currentMonth <= maxMonths) {
      const month = this.runNextMonth();
      if (!month.ok) break;
      reports.push(month.value.report);
    }
    return { state: this.state, reports };
  }
}

export function createController(repoRoot = process.cwd()): RunController {
  return RunController.fromRepoRoot(path.resolve(repoRoot));
}
