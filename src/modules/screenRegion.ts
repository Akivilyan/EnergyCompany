import type { GameState, SettlementReport, SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";

export interface RegionCityItem {
  cityId: string;
  unlockCompanyLevel: number;
  unlocked: boolean;
  demandMw: number;
  localSupplyMw: number;
  effectiveSupplyMw: number;
  supplyRatio: number;
}

export interface RegionGridLinkItem {
  linkId: string;
  fromCityId: string;
  toCityId: string;
  linkType: "region" | "trunk";
  status: "building" | "finished";
  monthsRemaining: number;
}

export interface ScreenRegionSnapshot {
  month: number;
  companyLevel: number;
  funds: number;
  cities: RegionCityItem[];
  gridLinks: RegionGridLinkItem[];
}

export interface RegionQueueGridLinkOutput {
  before: ScreenRegionSnapshot;
  after: ScreenRegionSnapshot;
  result: SimResult<{ state: GameState }>;
}

export interface RegionAdvanceMonthDetail {
  monthFrom: number;
  monthTo: number;
  before: ScreenRegionSnapshot;
  after: ScreenRegionSnapshot;
  settleResult: SettlementReport["result"];
}

export interface RegionAdvanceMonthsOutput {
  reports: RegionAdvanceMonthDetail[];
  failed: SimResult<RegionAdvanceMonthDetail> | null;
}

export class ScreenRegion {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): ScreenRegionSnapshot {
    const cities = this.controller.config.bundle.cities
      .map((city) => {
        const runtime = this.controller.state.cities[city.city_id];
        return {
          cityId: city.city_id,
          unlockCompanyLevel: city.unlock_company_level,
          unlocked: this.controller.state.companyLevel >= city.unlock_company_level,
          demandMw: runtime?.demandMw ?? city.base_demand_mw,
          localSupplyMw: runtime?.localSupplyMw ?? 0,
          effectiveSupplyMw: runtime?.effectiveSupplyMw ?? 0,
          supplyRatio: runtime?.supplyRatio ?? 0
        };
      })
      .sort((a, b) => a.cityId.localeCompare(b.cityId));

    const gridLinks = Object.values(this.controller.state.gridLinks)
      .map((link) => ({
        linkId: link.linkId,
        fromCityId: link.fromCityId,
        toCityId: link.toCityId,
        linkType: link.linkType,
        status: link.status,
        monthsRemaining: link.monthsRemaining
      }))
      .sort((a, b) => a.linkId.localeCompare(b.linkId));

    return {
      month: this.controller.state.currentMonth,
      companyLevel: this.controller.state.companyLevel,
      funds: this.controller.state.funds,
      cities,
      gridLinks
    };
  }

  queueGridLink(
    fromCityId: string,
    toCityId: string,
    linkType: "region" | "trunk"
  ): RegionQueueGridLinkOutput {
    const before = this.getSnapshot();
    const result = this.controller.runCommand({
      type: "queue_grid_link",
      fromCityId,
      toCityId,
      linkType
    });
    const after = this.getSnapshot();
    return { before, after, result };
  }

  advanceOneMonth(): SimResult<RegionAdvanceMonthDetail> {
    const before = this.getSnapshot();
    const settle = this.controller.runNextMonth();
    if (!settle.ok) return settle;
    const after = this.getSnapshot();
    return {
      ok: true,
      value: {
        monthFrom: before.month,
        monthTo: after.month,
        before,
        after,
        settleResult: settle.value.report.result
      }
    };
  }

  advanceMonths(maxMonths: number): RegionAdvanceMonthsOutput {
    const reports: RegionAdvanceMonthDetail[] = [];
    let failed: SimResult<RegionAdvanceMonthDetail> | null = null;
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

export function createScreenRegion(controller: RunController): ScreenRegion {
  return new ScreenRegion(controller);
}
