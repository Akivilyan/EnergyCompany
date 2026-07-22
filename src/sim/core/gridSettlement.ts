import type { ConfigRepo } from "../config/configRepo.js";
import type { GameState } from "../types/gameState.js";
import { getCityResourceMultiplier } from "./cityEconomy.js";
import {
  getFacilityEcoStatus,
  getGridLinkLossMw,
  hasStorageOutputBoost
} from "./technologyEffects.js";

function getStartRegionId(config: ConfigRepo): string | null {
  return config.getCity("CITY-START")?.region_id ?? null;
}

function isRegionOperable(state: GameState, config: ConfigRepo, regionId: string | undefined): boolean {
  if (!regionId) return true;
  const startRegionId = getStartRegionId(config);
  if (regionId === startRegionId) return true;

  const regionCityIds = new Set(
    config.bundle.cities
      .filter((cityConfig) => cityConfig.region_id === regionId)
      .map((cityConfig) => cityConfig.city_id)
  );
  for (const link of Object.values(state.gridLinks)) {
    if (link.status !== "finished" || link.linkType !== "trunk") continue;
    const fromInRegion = regionCityIds.has(link.fromCityId);
    const toInRegion = regionCityIds.has(link.toCityId);
    if (fromInRegion && state.cities[link.toCityId]) return true;
    if (toInRegion && state.cities[link.fromCityId]) return true;
  }
  return false;
}

/** 将已解锁城市写入运行态，供 M4/M9 按城结算社会价值。 */
export function syncOperableCities(state: GameState, config: ConfigRepo): void {
  for (const cityConfig of config.bundle.cities) {
    if (state.companyLevel < cityConfig.unlock_company_level) continue;
    if (!isRegionOperable(state, config, cityConfig.region_id)) continue;
    if (state.cities[cityConfig.city_id]) continue;
    state.cities[cityConfig.city_id] = {
      cityId: cityConfig.city_id,
      demandMw: cityConfig.base_demand_mw,
      localSupplyMw: 0,
      effectiveSupplyMw: 0,
      netImportMw: 0,
      supplyRatio: 0,
      cityFullyEcoSupply: true,
      ecoCapFactor: 1,
      cityBaseSocialValue: cityConfig.city_base_social_value
    };
  }
}

function buildIslands(state: GameState): string[][] {
  const cityIds = Object.keys(state.cities);
  const superHydroNodeIds = Object.values(state.superHydros ?? {})
    .filter((slot) => slot.status === "finished")
    .map((slot) => slot.nodeId);
  const nodeIds = [...cityIds, ...superHydroNodeIds];
  const adjacency = new Map<string, Set<string>>();
  for (const nodeId of nodeIds) adjacency.set(nodeId, new Set());
  for (const link of Object.values(state.gridLinks)) {
    if (link.status !== "finished") continue;
    if (!adjacency.has(link.fromCityId) || !adjacency.has(link.toCityId)) continue;
    adjacency.get(link.fromCityId)?.add(link.toCityId);
    adjacency.get(link.toCityId)?.add(link.fromCityId);
  }

  const visited = new Set<string>();
  const islands: string[][] = [];
  for (const nodeId of nodeIds) {
    if (visited.has(nodeId)) continue;
    const island: string[] = [];
    const stack = [nodeId];
    visited.add(nodeId);
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      island.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
    islands.push(island);
  }
  return islands;
}

export function syncGridLinkLosses(state: GameState, config: ConfigRepo): void {
  for (const link of Object.values(state.gridLinks)) {
    link.lossMw = getGridLinkLossMw(state, config, link.linkType);
  }
}

export function recalcGridSupply(state: GameState, config: ConfigRepo): void {
  const hasStorageBoost = hasStorageOutputBoost(state);
  const storageBoostTypes = new Set(["wind", "solar", "hydro"]);
  const localSupplyByCity = new Map<string, number>();
  const localFullyEcoByCity = new Map<string, boolean>();

  for (const cityId of Object.keys(state.cities)) {
    localSupplyByCity.set(cityId, 0);
    localFullyEcoByCity.set(cityId, true);
  }
  for (const facility of Object.values(state.facilities)) {
    const current = localSupplyByCity.get(facility.cityId) ?? 0;
    const resourceBoost = getCityResourceMultiplier(config, facility.cityId, facility.facilityId);
    const storageBoost = hasStorageBoost && storageBoostTypes.has(facility.facilityId) ? 2 : 1;
    localSupplyByCity.set(
      facility.cityId,
      current + facility.outputMw * resourceBoost * storageBoost
    );
    if (!(facility.isEco ?? getFacilityEcoStatus(state, config, facility.facilityId))) {
      localFullyEcoByCity.set(facility.cityId, false);
    }
  }
  for (const slot of Object.values(state.superHydros ?? {})) {
    if (slot.status !== "finished") continue;
    localSupplyByCity.set(slot.nodeId, (localSupplyByCity.get(slot.nodeId) ?? 0) + slot.outputMw);
    localFullyEcoByCity.set(slot.nodeId, true);
  }

  for (const island of buildIslands(state)) {
    let islandDemand = 0;
    let islandSupply = 0;
    let islandLoss = 0;
    const islandNodeIds = new Set(island);
    for (const cityId of island) {
      if (!state.cities[cityId]) {
        islandSupply += localSupplyByCity.get(cityId) ?? 0;
        continue;
      }
      islandDemand += state.cities[cityId].demandMw;
      islandSupply += localSupplyByCity.get(cityId) ?? 0;
    }
    for (const link of Object.values(state.gridLinks)) {
      if (link.status !== "finished") continue;
      if (islandNodeIds.has(link.fromCityId) && islandNodeIds.has(link.toCityId)) {
        islandLoss += link.lossMw;
      }
    }
    const availableSupply = Math.max(0, islandSupply - islandLoss);
    const islandRate = islandDemand <= 0 ? 0 : Math.min(1, availableSupply / islandDemand);
    for (const cityId of island) {
      const city = state.cities[cityId];
      if (!city) continue;
      const localSupply = localSupplyByCity.get(cityId) ?? 0;
      const effectiveSupply = Math.floor(city.demandMw * islandRate);
      city.localSupplyMw = localSupply;
      city.effectiveSupplyMw = effectiveSupply;
      city.netImportMw = effectiveSupply - localSupply;
      city.supplyRatio = city.demandMw <= 0
        ? 0
        : Math.min(1, Math.floor((effectiveSupply * 100) / city.demandMw) / 100);
      city.cityFullyEcoSupply = localFullyEcoByCity.get(cityId) ?? true;
      city.ecoCapFactor = city.cityFullyEcoSupply ? 1 : 0.8;
    }
  }
}
