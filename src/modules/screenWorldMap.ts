import type { RunController } from "./runController.js";

export type ResourceKind = "wind" | "solar" | "hydro" | "fossil";
export type RecommendedBuildKind = "wind" | "solar" | "hydro" | "thermal" | "nuclear";
export type OperatingPlanHint =
  | "secure_trunk"
  | "close_supply_gap"
  | "hydro_wind_export"
  | "local_renewables"
  | "thermal_bridge"
  | "nuclear_anchor"
  | "hydro_anchor"
  | "super_hydro_import"
  | "slot_efficiency"
  | "hybrid_balancing";
export type OperatingPressureTag =
  | "high_demand"
  | "supply_gap"
  | "trunk_first"
  | "low_slot_density"
  | "no_hydro"
  | "fossil_transition"
  | "nuclear_siting"
  | "hydro_site_bound"
  | "mixed_dispatch"
  | "terminal_load";

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
  designRole: string | null;
  unlockCompanyLevel: number;
  unlocked: boolean;
  totalCities: number;
  unlockedCities: number;
  totalDemandMw: number;
  totalLocalSupplyMw: number;
  totalNetImportMw: number;
  totalEffectiveSupplyMw: number;
  supplyGapMw: number;
  totalBuildSlots: number;
  riverCityCount: number;
  nuclearEligibleCityCount: number;
  supplyRatio: number;
  totalBaseSocialValue: number;
  richResources: ResourceKind[];
  recommendedBuilds: RecommendedBuildKind[];
  operatingPressureTags: OperatingPressureTag[];
  operatingPlanHints: OperatingPlanHint[];
  centralCityId: string | null;
  centralCityUnlocked: boolean;
  connectionStatus: WorldMapConnectionStatus;
  trunkLinkId: string | null;
  trunkMonthsRemaining: number | null;
  trunkLossMw: number | null;
}

export interface WorldMapSuperHydroSlotItem {
  slotId: string;
  nodeId: string;
  displayName: string;
  unlocked: boolean;
  status: "available" | "building" | "finished";
  gridConnectionStatus: "not_built" | "isolated" | "building_link" | "connected";
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
    connectedOutputMw: number;
    slots: WorldMapSuperHydroSlotItem[];
  };
  regions: WorldMapRegionItem[];
}

function linkKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function getRichResources(
  region: { fossil_energy?: boolean },
  regionCities: Array<{
    wind_resource?: string;
    solar_resource?: string;
    hydro_resource?: string;
    fossil_energy?: boolean;
  }>
): ResourceKind[] {
  const richResources: ResourceKind[] = [];
  if (regionCities.some((city) => city.wind_resource === "rich")) richResources.push("wind");
  if (regionCities.some((city) => city.solar_resource === "rich")) richResources.push("solar");
  if (regionCities.some((city) => city.hydro_resource === "rich")) richResources.push("hydro");
  if (region.fossil_energy || regionCities.some((city) => city.fossil_energy)) {
    richResources.push("fossil");
  }
  return richResources;
}

export function getRecommendedBuilds(
  region: { fossil_energy?: boolean },
  regionCities: Array<{
    wind_resource?: string;
    solar_resource?: string;
    hydro_resource?: string;
    fossil_energy?: boolean;
    has_river?: boolean;
    is_nuclear_eligible?: boolean;
  }>
): RecommendedBuildKind[] {
  const recommended: RecommendedBuildKind[] = [];
  if (regionCities.some((city) => city.wind_resource === "rich")) recommended.push("wind");
  if (regionCities.some((city) => city.solar_resource === "rich")) recommended.push("solar");
  if (
    regionCities.some(
      (city) => city.has_river && (city.hydro_resource === "rich" || regionCities.length === 1)
    )
  ) {
    recommended.push("hydro");
  }
  if (region.fossil_energy || regionCities.some((city) => city.fossil_energy)) {
    recommended.push("thermal");
  }
  if (regionCities.some((city) => city.is_nuclear_eligible)) recommended.push("nuclear");
  return recommended;
}

export function getOperatingPressureTags(input: {
  regionId: string;
  designRole?: string | null;
  totalDemandMw: number;
  supplyGapMw: number;
  totalBuildSlots: number;
  riverCityCount: number;
  fossilEnergy: boolean;
  nuclearEligibleCityCount: number;
  connectionStatus?: WorldMapConnectionStatus;
}): OperatingPressureTag[] {
  const tags: OperatingPressureTag[] = [];
  if (input.totalDemandMw >= 1800) tags.push("high_demand");
  if (input.supplyGapMw > 0) tags.push("supply_gap");
  if (
    input.regionId !== "MAP-01" &&
    (!input.connectionStatus ||
      input.connectionStatus === "available" ||
      input.connectionStatus === "building")
  ) {
    tags.push("trunk_first");
  }
  if (input.totalDemandMw > 0 && input.totalBuildSlots * 180 < input.totalDemandMw) {
    tags.push("low_slot_density");
  }
  if (input.riverCityCount === 0) tags.push("no_hydro");
  if (input.fossilEnergy) tags.push("fossil_transition");
  if (input.nuclearEligibleCityCount > 0) tags.push("nuclear_siting");
  if (input.designRole === "plateau_hydro_wind_province") tags.push("hydro_site_bound");
  if (input.designRole === "frontier_hybrid_balancing_province") tags.push("mixed_dispatch");
  if (input.designRole === "terminal_metropolis_load_hub") tags.push("terminal_load");
  return tags;
}

export function getOperatingPlanHints(input: {
  recommendedBuilds: RecommendedBuildKind[];
  operatingPressureTags: OperatingPressureTag[];
  connectionStatus?: WorldMapConnectionStatus;
  supplyGapMw: number;
  regionType?: string;
  designRole?: string | null;
  totalBuildSlots: number;
  totalDemandMw: number;
}): OperatingPlanHint[] {
  const hints: OperatingPlanHint[] = [];
  const hasBuild = (kind: RecommendedBuildKind) => input.recommendedBuilds.includes(kind);
  const hasPressure = (tag: OperatingPressureTag) => input.operatingPressureTags.includes(tag);

  if (
    input.connectionStatus === "available" ||
    input.connectionStatus === "building" ||
    hasPressure("trunk_first")
  ) {
    hints.push("secure_trunk");
  }
  if (input.supplyGapMw > 0 || hasPressure("supply_gap")) {
    hints.push("close_supply_gap");
  }
  if (input.designRole === "plateau_hydro_wind_province") {
    hints.push("hydro_wind_export");
  }
  if (hasBuild("wind") || hasBuild("solar")) {
    hints.push("local_renewables");
  }
  if (hasBuild("hydro")) {
    hints.push(input.regionType === "metropolis" ? "super_hydro_import" : "hydro_anchor");
  }
  if (hasBuild("thermal")) {
    hints.push("thermal_bridge");
  }
  if (hasBuild("nuclear")) {
    hints.push("nuclear_anchor");
  }
  if (hasPressure("low_slot_density") || input.totalBuildSlots * 180 < input.totalDemandMw) {
    hints.push("slot_efficiency");
  }
  if (input.designRole === "frontier_hybrid_balancing_province") {
    hints.push("hybrid_balancing");
  }

  return hints;
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
        const totalDemandMw = regionCities.reduce((sum, city) => {
          const runtime = state.cities[city.city_id];
          return sum + (runtime?.demandMw ?? city.base_demand_mw);
        }, 0);
        const totalLocalSupplyMw = regionCities.reduce((sum, city) => {
          const runtime = state.cities[city.city_id];
          return sum + (runtime?.localSupplyMw ?? 0);
        }, 0);
        const totalNetImportMw = regionCities.reduce((sum, city) => {
          const runtime = state.cities[city.city_id];
          return sum + (runtime?.netImportMw ?? 0);
        }, 0);
        const totalEffectiveSupplyMw = regionCities.reduce((sum, city) => {
          const runtime = state.cities[city.city_id];
          return sum + (runtime?.effectiveSupplyMw ?? 0);
        }, 0);
        const supplyGapMw = Math.max(0, totalDemandMw - totalEffectiveSupplyMw);
        const totalBuildSlots = regionCities.reduce((sum, city) => sum + city.build_slot_count, 0);
        const riverCityCount = regionCities.filter((city) => city.has_river).length;
        const nuclearEligibleCityCount = regionCities.filter((city) => city.is_nuclear_eligible).length;

        let connectionStatus: WorldMapConnectionStatus;
        let trunkLinkId: string | null = null;
        let trunkMonthsRemaining: number | null = null;
        let trunkLossMw: number | null = null;
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
            trunkLinkId = trunk.linkId;
            trunkMonthsRemaining = trunk.monthsRemaining;
            trunkLossMw = trunk.lossMw;
          } else {
            connectionStatus = "building";
            trunkLinkId = trunk.linkId;
            trunkMonthsRemaining = trunk.monthsRemaining;
            trunkLossMw = trunk.lossMw;
          }
        }

        const recommendedBuilds = getRecommendedBuilds(region, regionCities);
        const richResources = getRichResources(region, regionCities);
        const operatingPressureTags = getOperatingPressureTags({
          regionId: region.region_id,
          designRole: region.design_role,
          totalDemandMw,
          supplyGapMw,
          totalBuildSlots,
          riverCityCount,
          fossilEnergy: !!region.fossil_energy || regionCities.some((city) => !!city.fossil_energy),
          nuclearEligibleCityCount,
          connectionStatus
        });

        return {
          regionId: region.region_id,
          displayName: region.display_name ?? region.region_id,
          regionType: region.region_type ?? "unknown",
          designRole: region.design_role ?? null,
          unlockCompanyLevel: region.unlock_company_level,
          unlocked,
          totalCities: regionCities.length,
          unlockedCities,
          totalDemandMw,
          totalLocalSupplyMw,
          totalNetImportMw,
          totalEffectiveSupplyMw,
          supplyGapMw,
          totalBuildSlots,
          riverCityCount,
          nuclearEligibleCityCount,
          supplyRatio: totalDemandMw > 0 ? totalEffectiveSupplyMw / totalDemandMw : 0,
          totalBaseSocialValue: regionCities.reduce(
            (sum, city) => sum + city.city_base_social_value,
            0
          ),
          richResources,
          recommendedBuilds,
          operatingPressureTags,
          operatingPlanHints: getOperatingPlanHints({
            recommendedBuilds,
            operatingPressureTags,
            connectionStatus,
            supplyGapMw,
            regionType: region.region_type,
            designRole: region.design_role,
            totalBuildSlots,
            totalDemandMw
          }),
          centralCityId: centralCity?.city_id ?? null,
          centralCityUnlocked: centralCity ? state.companyLevel >= centralCity.unlock_company_level : false,
          connectionStatus,
          trunkLinkId,
          trunkMonthsRemaining,
          trunkLossMw
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
      const connectedLink = Object.values(state.gridLinks).some(
        (link) =>
          link.status === "finished" &&
          link.linkType === "trunk" &&
          (link.fromCityId === slot.node_id || link.toCityId === slot.node_id)
      );
      const buildingLink = Object.values(state.gridLinks).some(
        (link) =>
          link.status === "building" &&
          link.linkType === "trunk" &&
          (link.fromCityId === slot.node_id || link.toCityId === slot.node_id)
      );
      const gridConnectionStatus: WorldMapSuperHydroSlotItem["gridConnectionStatus"] =
        status !== "finished"
          ? "not_built"
          : connectedLink
            ? "connected"
            : buildingLink
              ? "building_link"
              : "isolated";
      return {
        slotId: slot.slot_id,
        nodeId: slot.node_id,
        displayName: slot.display_name,
        unlocked: superHydroUnlocked,
        status,
        gridConnectionStatus,
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
        connectedOutputMw: superHydroSlots
          .filter((slot) => slot.gridConnectionStatus === "connected")
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
