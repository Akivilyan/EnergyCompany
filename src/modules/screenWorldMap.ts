import type { RunController } from "./runController.js";

export type ResourceKind = "wind" | "solar" | "hydro";

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
  totalDemandMw: number;
  totalBaseSocialValue: number;
  richResources: ResourceKind[];
  centralCityId: string | null;
  centralCityUnlocked: boolean;
  connectionStatus: WorldMapConnectionStatus;
}

export interface WorldMapSuperHydroSlotItem {
  slotId: string;
  nodeId: string;
  displayName: string;
  unlocked: boolean;
  status: "available" | "building" | "finished";
  monthsRemaining: number;
  outputMw: number;
  buildCost: number;
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
  superHydro: {
    unlocked: boolean;
    totalSlots: number;
    availableSlots: number;
    buildingSlots: number;
    finishedSlots: number;
    totalOutputMw: number;
    slots: WorldMapSuperHydroSlotItem[];
  };
  regions: WorldMapRegionItem[];
}

function linkKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function getRichResources(regionCities: Array<{ wind_resource?: string; solar_resource?: string; hydro_resource?: string }>): ResourceKind[] {
  const richResources: ResourceKind[] = [];
  if (regionCities.some((city) => city.wind_resource === "rich")) richResources.push("wind");
  if (regionCities.some((city) => city.solar_resource === "rich")) richResources.push("solar");
  if (regionCities.some((city) => city.hydro_resource === "rich")) richResources.push("hydro");
  return richResources;
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
          totalDemandMw: regionCities.reduce((sum, city) => sum + city.base_demand_mw, 0),
          totalBaseSocialValue: regionCities.reduce(
            (sum, city) => sum + city.city_base_social_value,
            0
          ),
          richResources: getRichResources(regionCities),
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
    const superHydroUnlocked = state.companyLevel >= 5 && state.litTechIds.includes("super_hydro");
    const superHydroSlots: WorldMapSuperHydroSlotItem[] = config.bundle.superHydroSlots.map((slot) => {
      const runtime = state.superHydros?.[slot.slot_id];
      const status: WorldMapSuperHydroSlotItem["status"] = runtime?.status ?? "available";
      return {
        slotId: slot.slot_id,
        nodeId: slot.node_id,
        displayName: slot.display_name,
        unlocked: superHydroUnlocked,
        status,
        monthsRemaining: runtime?.monthsRemaining ?? slot.build_duration_months,
        outputMw: runtime?.outputMw ?? slot.output_capacity_mw,
        buildCost: slot.build_cost_total
      };
    });

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
      superHydro: {
        unlocked: superHydroUnlocked,
        totalSlots: superHydroSlots.length,
        availableSlots: superHydroSlots.filter((slot) => slot.status === "available").length,
        buildingSlots: superHydroSlots.filter((slot) => slot.status === "building").length,
        finishedSlots: superHydroSlots.filter((slot) => slot.status === "finished").length,
        totalOutputMw: superHydroSlots
          .filter((slot) => slot.status === "finished")
          .reduce((sum, slot) => sum + slot.outputMw, 0),
        slots: superHydroSlots
      },
      regions
    };
  }
}

export function createScreenWorldMap(controller: RunController): ScreenWorldMap {
  return new ScreenWorldMap(controller);
}
