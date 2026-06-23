import { getGridLinkBuildCost, type GameState, type SettlementReport, type SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";
import type { ResourceKind } from "./screenWorldMap.js";

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
  cost: number;
  lossMw: number;
  unlocked: boolean;
  available: boolean;
  regionId: string | null;
  regionName: string;
  fromCityName: string;
  toCityName: string;
}

export interface ScreenRegionSnapshot {
  regionId: string;
  regionName: string;
  totalDemandMw: number;
  totalLocalSupplyMw: number;
  totalNetImportMw: number;
  totalEffectiveSupplyMw: number;
  supplyGapMw: number;
  totalBaseSocialValue: number;
  richResources: ResourceKind[];
  month: number;
  companyLevel: number;
  funds: number;
  gridLinkCost: number;
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
  constructor(
    private readonly controller: RunController,
    private readonly regionId: string
  ) {}

  getSnapshot(): ScreenRegionSnapshot {
    const regionConfig = this.controller.config.bundle.regions.find(
      (region) => region.region_id === this.regionId
    );
    const cityNameMap = new Map(
      this.controller.config.bundle.cities.map((city) => [city.city_id, city.display_name ?? city.city_id])
    );
    const cities = this.controller.config.bundle.cities
      .filter((city) => city.region_id === this.regionId)
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
    const regionCities = this.controller.config.bundle.cities.filter(
      (city) => city.region_id === this.regionId
    );
    const richResources: ResourceKind[] = [];
    if (regionCities.some((city) => city.wind_resource === "rich")) richResources.push("wind");
    if (regionCities.some((city) => city.solar_resource === "rich")) richResources.push("solar");
    if (regionCities.some((city) => city.hydro_resource === "rich")) richResources.push("hydro");
    const totalDemandMw = cities.reduce((sum, city) => sum + city.demandMw, 0);
    const totalEffectiveSupplyMw = cities.reduce((sum, city) => sum + city.effectiveSupplyMw, 0);

    const gridLinks = Object.values(this.controller.state.gridLinks)
      .filter((link) => cities.some((city) => city.cityId === link.fromCityId || city.cityId === link.toCityId))
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
      regionId: this.regionId,
      regionName: regionConfig?.display_name ?? this.regionId,
      totalDemandMw,
      totalLocalSupplyMw: cities.reduce((sum, city) => sum + city.localSupplyMw, 0),
      totalNetImportMw: cities.reduce((sum, city) => {
        const runtime = this.controller.state.cities[city.cityId];
        return sum + (runtime?.netImportMw ?? 0);
      }, 0),
      totalEffectiveSupplyMw,
      supplyGapMw: Math.max(0, totalDemandMw - totalEffectiveSupplyMw),
      totalBaseSocialValue: regionCities.reduce((sum, city) => sum + city.city_base_social_value, 0),
      richResources,
      month: this.controller.state.currentMonth,
      companyLevel: this.controller.state.companyLevel,
      funds: this.controller.state.funds,
      gridLinkCost: getGridLinkBuildCost(this.controller.state, this.controller.config, 8),
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
    const cityIdsInRegion = new Set(
      this.controller.config.bundle.cities
        .filter((city) => city.region_id === this.regionId)
        .map((city) => city.city_id)
    );
    const linkExists = (fromCityId: string, toCityId: string): boolean => {
      const key = [fromCityId, toCityId].sort().join("::");
      return !!this.controller.state.gridLinks[key];
    };
    const regionOperable =
      this.regionId === "MAP-01" ||
      Object.values(this.controller.state.gridLinks).some((link) => {
        if (link.status !== "finished" || link.linkType !== "trunk") return false;
        const fromInRegion = cityIdsInRegion.has(link.fromCityId);
        const toInRegion = cityIdsInRegion.has(link.toCityId);
        return (
          (fromInRegion && !!this.controller.state.cities[link.toCityId]) ||
          (toInRegion && !!this.controller.state.cities[link.fromCityId])
        );
      });

    const region = this.controller.config.bundle.regions.find((item) => item.region_id === this.regionId);
    const regionCities = unlockedCities.filter((city) => city.region_id === this.regionId);
    if (regionOperable && regionCities.length >= 2 && region) {
      const hubCity =
        regionCities.find((city) => city.city_type === "central") ?? regionCities[0];
      for (const city of regionCities) {
        if (city.city_id === hubCity.city_id) continue;
        candidates.push({
          candidateId: `${hubCity.city_id}->${city.city_id}:region`,
          fromCityId: hubCity.city_id,
          toCityId: city.city_id,
          linkType: "region",
          cost: getGridLinkBuildCost(this.controller.state, this.controller.config, 8, "region"),
          lossMw: this.controller.config.bundle.gridLoss.loss_regional_mw,
          unlocked: true,
          available: !linkExists(hubCity.city_id, city.city_id),
          regionId: region.region_id,
          regionName: region.display_name ?? region.region_id,
          fromCityName: cityNameMap.get(hubCity.city_id) ?? hubCity.city_id,
          toCityName: cityNameMap.get(city.city_id) ?? city.city_id
        });
      }
    }

    const currentHub =
      this.controller.config.bundle.cities.find(
        (city) => city.region_id === this.regionId && city.city_type === "central" && level >= city.unlock_company_level
      ) ?? null;
    if (currentHub) {
      const otherUnlockedHubs = this.controller.config.bundle.regions
        .filter((item) => item.region_id !== this.regionId && level >= item.unlock_company_level)
        .map((item) => {
          const hubCity = this.controller.config.bundle.cities.find(
            (city) => city.region_id === item.region_id && city.city_type === "central"
          );
          return hubCity
            ? {
                regionId: item.region_id,
                regionName: item.display_name ?? item.region_id,
                cityId: hubCity.city_id,
                cityName: cityNameMap.get(hubCity.city_id) ?? hubCity.city_id
              }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.regionId.localeCompare(b.regionId));

      for (const hub of otherUnlockedHubs) {
        candidates.push({
          candidateId: `${currentHub.city_id}->${hub.cityId}:trunk`,
          fromCityId: currentHub.city_id,
          toCityId: hub.cityId,
          linkType: "trunk",
          cost: getGridLinkBuildCost(this.controller.state, this.controller.config, 8, "trunk"),
          lossMw: this.controller.state.litTechIds.includes("uhv_transmission")
            ? this.controller.config.bundle.gridLoss.loss_backbone_uhv_mw
            : this.controller.config.bundle.gridLoss.loss_backbone_pre_uhv_mw,
          unlocked: true,
          available: !linkExists(currentHub.city_id, hub.cityId),
          regionId: null,
          regionName: `${region?.display_name ?? this.regionId} x ${hub.regionName}`,
          fromCityName: cityNameMap.get(currentHub.city_id) ?? currentHub.city_id,
          toCityName: hub.cityName
        });
      }

      const finishedSuperHydroNodes = Object.values(this.controller.state.superHydros ?? {})
        .filter((slot) => slot.status === "finished")
        .sort((a, b) => a.nodeId.localeCompare(b.nodeId));
      for (const slot of finishedSuperHydroNodes) {
        candidates.push({
          candidateId: `${currentHub.city_id}->${slot.nodeId}:trunk`,
          fromCityId: currentHub.city_id,
          toCityId: slot.nodeId,
          linkType: "trunk",
          cost: getGridLinkBuildCost(this.controller.state, this.controller.config, 8, "trunk"),
          lossMw: this.controller.state.litTechIds.includes("uhv_transmission")
            ? this.controller.config.bundle.gridLoss.loss_backbone_uhv_mw
            : this.controller.config.bundle.gridLoss.loss_backbone_pre_uhv_mw,
          unlocked: true,
          available: !linkExists(currentHub.city_id, slot.nodeId),
          regionId: null,
          regionName: `${region?.display_name ?? this.regionId} x ${slot.displayName}`,
          fromCityName: cityNameMap.get(currentHub.city_id) ?? currentHub.city_id,
          toCityName: slot.displayName
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
  return new ScreenRegion(controller, "MAP-01");
}

export function createScreenRegionForRegion(
  controller: RunController,
  regionId: string
): ScreenRegion {
  return new ScreenRegion(controller, regionId);
}
