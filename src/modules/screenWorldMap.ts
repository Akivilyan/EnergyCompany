import type { RunController } from "./runController.js";

export type WorldMapConnectionStatus =
  | "capital"
  | "locked"
  | "planned"
  | "available"
  | "building"
  | "connected";

export interface WorldMapRegionItem {
  regionId: string;
  displayName: string;
  regionType: string;
  unlockCompanyLevel: number;
  unlocked: boolean;
  totalCities: number;
  unlockedCities: number;
  centralCityId: string | null;
  centralCityUnlocked: boolean;
  connectionStatus: WorldMapConnectionStatus;
}

export interface WorldMapSnapshot {
  month: number;
  funds: number;
  companyLevel: number;
  totalRegions: number;
  unlockedRegions: number;
  connectedTrunks: number;
  buildingTrunks: number;
  nextUnlockRegion: {
    regionId: string;
    displayName: string;
    unlockCompanyLevel: number;
  } | null;
  regions: WorldMapRegionItem[];
}

function linkKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export class ScreenWorldMap {
  constructor(private readonly controller: RunController) {}

  getSnapshot(): WorldMapSnapshot {
    const { state, config } = this.controller;
    const regions = config.bundle.regions
      .map((region) => {
        const regionCities = config.bundle.cities.filter((city) => city.region_id === region.region_id);
        const centralCity =
          regionCities.find((city) => city.city_type === "central") ?? regionCities[0] ?? null;
        const unlocked = state.companyLevel >= region.unlock_company_level;
        const unlockedCities = regionCities.filter(
          (city) => state.companyLevel >= city.unlock_company_level
        ).length;

        let connectionStatus: WorldMapConnectionStatus;
        if (region.region_id === "MAP-01") {
          connectionStatus = "capital";
        } else if (!unlocked) {
          connectionStatus = "locked";
        } else if (!centralCity) {
          connectionStatus = "planned";
        } else {
          const trunk = state.gridLinks[linkKey("CITY-START", centralCity.city_id)];
          if (!trunk || trunk.linkType !== "trunk") {
            connectionStatus = "available";
          } else if (trunk.status === "finished") {
            connectionStatus = "connected";
          } else {
            connectionStatus = "building";
          }
        }

        return {
          regionId: region.region_id,
          displayName: region.display_name ?? region.region_id,
          regionType: region.region_type ?? "unknown",
          unlockCompanyLevel: region.unlock_company_level,
          unlocked,
          totalCities: regionCities.length,
          unlockedCities,
          centralCityId: centralCity?.city_id ?? null,
          centralCityUnlocked: centralCity ? state.companyLevel >= centralCity.unlock_company_level : false,
          connectionStatus
        };
      })
      .sort(
        (a, b) =>
          a.unlockCompanyLevel - b.unlockCompanyLevel ||
          a.regionId.localeCompare(b.regionId)
      );

    const nextUnlockRegion = regions.find((region) => !region.unlocked) ?? null;

    return {
      month: state.currentMonth,
      funds: state.funds,
      companyLevel: state.companyLevel,
      totalRegions: regions.length,
      unlockedRegions: regions.filter((region) => region.unlocked).length,
      connectedTrunks: regions.filter((region) => region.connectionStatus === "connected").length,
      buildingTrunks: regions.filter((region) => region.connectionStatus === "building").length,
      nextUnlockRegion: nextUnlockRegion
        ? {
            regionId: nextUnlockRegion.regionId,
            displayName: nextUnlockRegion.displayName,
            unlockCompanyLevel: nextUnlockRegion.unlockCompanyLevel
          }
        : null,
      regions
    };
  }
}

export function createScreenWorldMap(controller: RunController): ScreenWorldMap {
  return new ScreenWorldMap(controller);
}
