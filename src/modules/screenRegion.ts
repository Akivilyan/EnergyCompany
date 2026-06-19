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

export interface RegionLinkCandidate {
  candidateId: string;
  fromCityId: string;
  toCityId: string;
  linkType: "region" | "trunk";
  unlocked: boolean;
  available: boolean;
  regionId: string | null;
  regionName: string;
  fromCityName: string;
  toCityName: string;
}

export interface ScreenRegionSnapshot {
  month: number;
  companyLevel: number;
  funds: number;
  cities: RegionCityItem[];
  gridLinks: RegionGridLinkItem[];
  linkCandidates: RegionLinkCandidate[];
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
    const cityNameMap = new Map(
      this.controller.config.bundle.cities.map((city) => [city.city_id, city.display_name ?? city.city_id])
    );
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

    const linkCandidates = this.buildLinkCandidates(cityNameMap);

    return {
      month: this.controller.state.currentMonth,
      companyLevel: this.controller.state.companyLevel,
      funds: this.controller.state.funds,
      cities,
      gridLinks,
      linkCandidates
    };
  }

  private buildLinkCandidates(cityNameMap: Map<string, string>): RegionLinkCandidate[] {
    const candidates: RegionLinkCandidate[] = [];
    const level = this.controller.state.companyLevel;
    const unlockedCities = this.controller.config.bundle.cities.filter(
      (city) => level >= city.unlock_company_level
    );
    const linkExists = (fromCityId: string, toCityId: string): boolean => {
      const key = [fromCityId, toCityId].sort().join("::");
      return !!this.controller.state.gridLinks[key];
    };

    for (const region of this.controller.config.bundle.regions) {
      const regionCities = unlockedCities.filter((city) => city.region_id === region.region_id);
      if (regionCities.length < 2) continue;
      const hubCity =
        regionCities.find((city) => city.city_type === "central") ?? regionCities[0];
      for (const city of regionCities) {
        if (city.city_id === hubCity.city_id) continue;
        candidates.push({
          candidateId: `${hubCity.city_id}->${city.city_id}:region`,
          fromCityId: hubCity.city_id,
          toCityId: city.city_id,
          linkType: "region",
          unlocked: true,
          available: !linkExists(hubCity.city_id, city.city_id),
          regionId: region.region_id,
          regionName: region.display_name ?? region.region_id,
          fromCityName: cityNameMap.get(hubCity.city_id) ?? hubCity.city_id,
          toCityName: cityNameMap.get(city.city_id) ?? city.city_id
        });
      }
    }

    const crossRegionHubs = this.controller.config.bundle.regions
      .map((region) => {
        const unlocked = level >= region.unlock_company_level;
        const hubCity = this.controller.config.bundle.cities.find(
          (city) => city.region_id === region.region_id && city.city_type === "central"
        );
        return unlocked && hubCity
          ? {
              regionId: region.region_id,
              regionName: region.display_name ?? region.region_id,
              cityId: hubCity.city_id,
              cityName: cityNameMap.get(hubCity.city_id) ?? hubCity.city_id
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.regionId.localeCompare(b.regionId));

    const startHub = crossRegionHubs[0] ?? null;
    if (startHub) {
      for (const hub of crossRegionHubs.slice(1)) {
        candidates.push({
          candidateId: `${startHub.cityId}->${hub.cityId}:trunk`,
          fromCityId: startHub.cityId,
          toCityId: hub.cityId,
          linkType: "trunk",
          unlocked: true,
          available: !linkExists(startHub.cityId, hub.cityId),
          regionId: null,
          regionName: `${startHub.regionName} x ${hub.regionName}`,
          fromCityName: startHub.cityName,
          toCityName: hub.cityName
        });
      }
    }

    return candidates.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
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
