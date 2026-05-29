import type { GameState, SettlementReport, SimResult } from "../sim/index.js";
import type { CitySnapshot, RunController } from "./runController.js";

export interface CityResourceDelta {
  funds: number;
  socialValue: number;
  localSupplyMw: number;
  effectiveSupplyMw: number;
  supplyRatio: number;
}

export interface CityMonthlyAdvanceDetail {
  monthFrom: number;
  monthTo: number;
  before: CitySnapshot;
  after: CitySnapshot;
  delta: CityResourceDelta;
  settleResult: SettlementReport["result"];
}

export interface CityConstructionAction {
  before: CitySnapshot;
  after: CitySnapshot;
  result: SimResult<{ state: GameState }>;
}

export interface AdvanceMonthsDetailOutput {
  reports: CityMonthlyAdvanceDetail[];
  failed: SimResult<CityMonthlyAdvanceDetail> | null;
}

function notFoundCity(cityId: string): SimResult<never> {
  return {
    ok: false,
    error: "not_found",
    message: `city not found: ${cityId}`,
    context: { city_id: cityId }
  };
}

function calcDelta(before: CitySnapshot, after: CitySnapshot): CityResourceDelta {
  return {
    funds: after.funds - before.funds,
    socialValue: after.socialValue - before.socialValue,
    localSupplyMw: after.localSupplyMw - before.localSupplyMw,
    effectiveSupplyMw: after.effectiveSupplyMw - before.effectiveSupplyMw,
    supplyRatio: after.supplyRatio - before.supplyRatio
  };
}

export class ScreenCityDetail {
  constructor(
    private readonly controller: RunController,
    private readonly cityId: string
  ) {}

  getSnapshot(): CitySnapshot | null {
    return this.controller.getCitySnapshot(this.cityId);
  }

  queueConstruction(
    facilityId: string,
    tier: number
  ): SimResult<CityConstructionAction> {
    const before = this.getSnapshot();
    if (!before) return notFoundCity(this.cityId);
    const result = this.controller.runCommand({
      type: "queue_construction",
      cityId: this.cityId,
      facilityId,
      tier
    });
    const after = this.getSnapshot();
    if (!after) return notFoundCity(this.cityId);
    return { ok: true, value: { before, after, result } };
  }

  advanceOneMonth(): SimResult<CityMonthlyAdvanceDetail> {
    const before = this.getSnapshot();
    if (!before) return notFoundCity(this.cityId);
    const settle = this.controller.runNextMonth();
    if (!settle.ok) return settle;
    const after = this.getSnapshot();
    if (!after) return notFoundCity(this.cityId);
    return {
      ok: true,
      value: {
        monthFrom: before.month,
        monthTo: after.month,
        before,
        after,
        delta: calcDelta(before, after),
        settleResult: settle.value.report.result
      }
    };
  }

  advanceMonths(maxMonths: number): AdvanceMonthsDetailOutput {
    const reports: CityMonthlyAdvanceDetail[] = [];
    let failed: SimResult<CityMonthlyAdvanceDetail> | null = null;
    for (let i = 0; i < maxMonths; i += 1) {
      const month = this.advanceOneMonth();
      if (!month.ok) {
        failed = month;
        break;
      }
      reports.push(month.value);
      if (month.value.settleResult !== "continue") {
        break;
      }
    }
    return { reports, failed };
  }
}

export function createScreenCityDetail(
  controller: RunController,
  cityId: string
): ScreenCityDetail {
  return new ScreenCityDetail(controller, cityId);
}
