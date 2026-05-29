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

export type ControllerTraceEntry =
  | {
      kind: "command";
      month: number;
      commandType: Command["type"];
      ok: boolean;
      error?: string;
    }
  | {
      kind: "settle";
      month: number;
      ok: boolean;
      result?: SettlementReport["result"];
      error?: string;
    };

export interface CitySnapshot {
  cityId: string;
  month: number;
  funds: number;
  socialValue: number;
  runResult: GameState["runResult"];
  localSupplyMw: number;
  effectiveSupplyMw: number;
  netImportMw: number;
  supplyRatio: number;
  facilityCountInCity: number;
  constructionQueueInCity: number;
}

export interface BuildAndAdvanceOutput {
  before: CitySnapshot | null;
  afterBuild: CitySnapshot | null;
  afterSettle: CitySnapshot | null;
  buildResult: SimResult<{ state: GameState }>;
  settleResult: SimResult<{ state: GameState; report: SettlementReport }> | null;
}

export interface AdvanceMonthsOutput {
  reports: SettlementReport[];
  failed: SimResult<{ state: GameState; report: SettlementReport }> | null;
}

export interface ControllerInitOptions {
  doctrineId?: GameState["doctrineId"];
  difficultyId?: GameState["difficultyId"];
  campaignId?: string;
}

export class RunController {
  readonly config: ConfigRepo;
  readonly ports = defaultPorts;
  state: GameState;
  private readonly trace: ControllerTraceEntry[] = [];
  private readonly settleHistory: SettlementReport[] = [];

  constructor(config: ConfigRepo, state: GameState) {
    this.config = config;
    this.state = state;
  }

  static fromRepoRoot(repoRoot: string, options: ControllerInitOptions = {}): RunController {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const state = createInitialState(config, {
      difficultyId: options.difficultyId ?? "simple",
      doctrineId: options.doctrineId ?? "tech",
      campaignId: options.campaignId
    });
    return new RunController(config, state);
  }

  runCommand(command: Command): SimResult<{ state: GameState }> {
    const result = dispatch(this.state, command, this.config, this.ports);
    this.trace.push({
      kind: "command",
      month: this.state.currentMonth,
      commandType: command.type,
      ok: result.ok,
      error: result.ok ? undefined : result.error
    });
    if (result.ok) {
      this.state = result.value.state;
    }
    return result;
  }

  runNextMonth(): SimResult<{ state: GameState; report: SettlementReport }> {
    const result = settleNextMonth(this.state, this.config, this.ports);
    this.trace.push({
      kind: "settle",
      month: this.state.currentMonth,
      ok: result.ok,
      result: result.ok ? result.value.report.result : undefined,
      error: result.ok ? undefined : result.error
    });
    if (result.ok) {
      this.state = result.value.state;
      this.settleHistory.push(result.value.report);
    }
    return result;
  }

  getTrace(): readonly ControllerTraceEntry[] {
    return this.trace;
  }

  clearTrace(): void {
    this.trace.length = 0;
  }

  getRecentSettlementReports(limit = 6): readonly SettlementReport[] {
    if (limit <= 0) return [];
    return this.settleHistory.slice(-limit);
  }

  getSettlementHistory(): readonly SettlementReport[] {
    return this.settleHistory;
  }

  clearSettlementHistory(): void {
    this.settleHistory.length = 0;
  }

  getCitySnapshot(cityId: string): CitySnapshot | null {
    const city = this.state.cities[cityId];
    if (!city) return null;
    let facilityCountInCity = 0;
    for (const fac of Object.values(this.state.facilities)) {
      if (fac.cityId === cityId) {
        facilityCountInCity += 1;
      }
    }
    let constructionQueueInCity = 0;
    for (const item of this.state.constructionQueue) {
      if (item.cityId === cityId) {
        constructionQueueInCity += 1;
      }
    }
    return {
      cityId,
      month: this.state.currentMonth,
      funds: this.state.funds,
      socialValue: this.state.socialValueCurrent,
      runResult: this.state.runResult,
      localSupplyMw: city.localSupplyMw,
      effectiveSupplyMw: city.effectiveSupplyMw,
      netImportMw: city.netImportMw,
      supplyRatio: city.supplyRatio,
      facilityCountInCity,
      constructionQueueInCity
    };
  }

  buildAndAdvance(
    cityId: string,
    facilityId: string,
    tier = 1,
    autoAdvance = true
  ): BuildAndAdvanceOutput {
    const before = this.getCitySnapshot(cityId);
    const buildResult = this.runCommand({
      type: "queue_construction",
      cityId,
      facilityId,
      tier
    });
    const afterBuild = this.getCitySnapshot(cityId);
    let settleResult: BuildAndAdvanceOutput["settleResult"] = null;
    let afterSettle: CitySnapshot | null = afterBuild;
    if (autoAdvance && buildResult.ok) {
      settleResult = this.runNextMonth();
      afterSettle = this.getCitySnapshot(cityId);
    }
    return {
      before,
      afterBuild,
      afterSettle,
      buildResult,
      settleResult
    };
  }

  advanceMonths(maxMonths: number): AdvanceMonthsOutput {
    const reports: SettlementReport[] = [];
    let failed: SimResult<{ state: GameState; report: SettlementReport }> | null = null;
    for (let i = 0; i < maxMonths; i += 1) {
      if (this.state.runResult !== null) break;
      const month = this.runNextMonth();
      if (!month.ok) {
        failed = month;
        break;
      }
      reports.push(month.value.report);
    }
    return { reports, failed };
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

export function createController(
  repoRoot = process.cwd(),
  options: ControllerInitOptions = {}
): RunController {
  return RunController.fromRepoRoot(path.resolve(repoRoot), options);
}
