import type { ConfigRepo } from "../config/configRepo.js";
import type { Command } from "../types/commands.js";
import type { GameState } from "../types/gameState.js";
import { err, ok, type SimResult } from "../types/result.js";
import type { DispatchCommandOutcome } from "./dispatchDomain.js";
import {
  getConstructionBuildCost,
  getFacilityBuildTierMax,
  getFacilityTierSpec,
  getGridLinkBuildCost,
  getGridLinkLossMw,
  syncFacilityRuntimeTiers
} from "./technologyEffects.js";

const GRID_LINK_COST = 8;
const GRID_LINK_BUILD_MONTHS = 1;
export const CONSTRUCTION_QUEUE_MAX = 3;

function assertCityUnlocked(companyLevel: number, unlockLevel: number): SimResult<true> {
  if (companyLevel < unlockLevel) {
    return err("not_unlocked", "city not unlocked for current company level", {
      company_level: companyLevel,
      unlock_level: unlockLevel
    });
  }
  return ok(true);
}

function countCityFacility(state: GameState, cityId: string, facilityId: string): number {
  let built = 0;
  for (const fac of Object.values(state.facilities)) {
    if (fac.cityId === cityId && fac.facilityId === facilityId) built += 1;
  }
  for (const item of state.constructionQueue) {
    if (item.cityId === cityId && item.facilityId === facilityId) built += 1;
  }
  return built;
}

function getOccupiedSlotIds(state: GameState, cityId: string): Set<string> {
  const occupied = new Set<string>();
  for (const facility of Object.values(state.facilities)) {
    if (facility.cityId === cityId && facility.slotId) occupied.add(facility.slotId);
  }
  for (const item of state.constructionQueue) {
    if (item.cityId === cityId && item.slotId) occupied.add(item.slotId);
  }
  return occupied;
}

function countOccupiedCitySlots(state: GameState, cityId: string): number {
  return (
    Object.values(state.facilities).filter((facility) => facility.cityId === cityId).length +
    state.constructionQueue.filter((item) => item.cityId === cityId).length
  );
}

function resolveConstructionSlotId(
  state: GameState,
  cityId: string,
  buildSlotCount: number,
  requestedSlotId?: string
): SimResult<string> {
  const occupied = getOccupiedSlotIds(state, cityId);
  if (requestedSlotId) {
    const match = /^slot-(\d+)$/.exec(requestedSlotId);
    const index = match ? Number(match[1]) : 0;
    if (index < 1 || index > buildSlotCount) {
      return err("invalid_command_payload", "construction slot is outside city slot range", {
        city_id: cityId,
        slot_id: requestedSlotId,
        build_slot_count: buildSlotCount
      });
    }
    if (occupied.has(requestedSlotId)) {
      return err("conflict_in_progress", "construction slot is occupied", {
        city_id: cityId,
        slot_id: requestedSlotId
      });
    }
    return ok(requestedSlotId);
  }
  for (let index = 1; index <= buildSlotCount; index += 1) {
    const slotId = `slot-${index}`;
    if (!occupied.has(slotId)) return ok(slotId);
  }
  return err("conflict_in_progress", "city build slots full", {
    city_id: cityId,
    build_slot_count: buildSlotCount
  });
}

export function completeConstructionQueueItem(
  state: GameState,
  config: ConfigRepo,
  queueItemId: string
): SimResult<true> {
  const index = state.constructionQueue.findIndex((item) => item.id === queueItemId);
  if (index < 0) {
    return err("not_found", "construction queue item not found", { queue_item_id: queueItemId });
  }
  const item = state.constructionQueue[index];
  const facilitySpec = getFacilityTierSpec(config, item.facilityId, item.tier);
  if (!facilitySpec) {
    return err("not_found", "facility tier config not found", {
      facility_id: item.facilityId,
      requested_tier: item.tier
    });
  }
  const id = `fac-${Object.keys(state.facilities).length + 1}`;
  state.facilities[id] = {
    id,
    cityId: item.cityId,
    facilityId: item.facilityId,
    tier: facilitySpec.tier,
    outputMw: facilitySpec.outputMw,
    monthlyOpex: facilitySpec.monthlyOpex,
    monthlyFuel: facilitySpec.monthlyFuel,
    slotId: item.slotId
  };
  state.constructionQueue.splice(index, 1);
  syncFacilityRuntimeTiers(state, config);
  return ok(true);
}

function makeUndirectedLinkKey(fromCityId: string, toCityId: string): string {
  return [fromCityId, toCityId].sort().join("::");
}

function getGridNodeRegion(config: ConfigRepo, state: GameState, nodeId: string): string | null {
  const city = config.getCity(nodeId);
  if (city) return city.region_id ?? null;
  const superHydro = Object.values(state.superHydros ?? {}).find((slot) => slot.nodeId === nodeId);
  return superHydro?.status === "finished" ? "SUPER-HYDRO" : null;
}

export function handleInfrastructureCommand(
  state: GameState,
  command: Command,
  config: ConfigRepo
): SimResult<DispatchCommandOutcome> {
  switch (command.type) {
    case "queue_construction": {
      const facility = config.getFacility(command.facilityId);
      const city = config.getCity(command.cityId);
      if (!facility || !city) return err("not_found", "facility or city not found");
      const unlocked = assertCityUnlocked(state.companyLevel, city.unlock_company_level);
      if (!unlocked.ok) return unlocked;
      if (!state.cities[command.cityId]) {
        return err("not_unlocked", "city is not operable before regional grid connection", {
          city_id: command.cityId,
          region_id: city.region_id ?? "unknown"
        });
      }
      if (countOccupiedCitySlots(state, command.cityId) >= city.build_slot_count) {
        return err("conflict_in_progress", "city build slots full", {
          city_id: command.cityId,
          build_slot_count: city.build_slot_count
        });
      }
      const slot = resolveConstructionSlotId(state, command.cityId, city.build_slot_count, command.slotId);
      if (!slot.ok) return slot;
      if (state.constructionQueue.length >= CONSTRUCTION_QUEUE_MAX) {
        return err("conflict_in_progress", "global construction queue full", {
          queue_active: state.constructionQueue.length,
          queue_max: CONSTRUCTION_QUEUE_MAX
        });
      }
      if (facility.unlock_tech_id && !state.litTechIds.includes(facility.unlock_tech_id)) {
        return err("not_unlocked", "facility tech not lit", {
          city_id: command.cityId,
          facility_id: command.facilityId,
          unlock_tech_id: facility.unlock_tech_id
        });
      }
      if (facility.requires_river && !city.has_river) {
        return err("invalid_command_payload", "facility requires river", {
          city_id: command.cityId,
          facility_id: command.facilityId
        });
      }
      if (command.facilityId === "nuclear" && !city.is_nuclear_eligible) {
        return err("invalid_command_payload", "facility requires nuclear eligible city", {
          city_id: command.cityId,
          facility_id: command.facilityId
        });
      }
      const maxPerCity = facility.max_per_city ?? Number.POSITIVE_INFINITY;
      if (countCityFacility(state, command.cityId, command.facilityId) >= maxPerCity) {
        return err("conflict_in_progress", "facility maxed in city", {
          city_id: command.cityId,
          facility_id: command.facilityId,
          max_per_city: maxPerCity
        });
      }
      const tierMax = getFacilityBuildTierMax(state, config, command.facilityId);
      if (command.tier < 1 || command.tier > tierMax) {
        return err("not_unlocked", "facility tier not lit", {
          city_id: command.cityId,
          facility_id: command.facilityId,
          requested_tier: command.tier,
          tier_max: tierMax
        });
      }
      const facilitySpec = getFacilityTierSpec(config, command.facilityId, command.tier);
      if (!facilitySpec) {
        return err("not_found", "facility tier config not found", {
          facility_id: command.facilityId,
          requested_tier: command.tier
        });
      }
      const buildCost = getConstructionBuildCost(state, config, facilitySpec.buildCost);
      if (state.funds < buildCost) return err("insufficient_funds", "not enough funds for construction");
      state.funds -= buildCost;
      state.constructionQueue.push({
        id: `cq-${state.constructionQueue.length + 1}`,
        cityId: command.cityId,
        facilityId: command.facilityId,
        tier: facilitySpec.tier,
        monthsRemaining: facilitySpec.buildMonths,
        installmentRemaining: 0,
        slotId: slot.value
      });
      return ok("handled");
    }
    case "queue_grid_link": {
      if (command.fromCityId === command.toCityId) return err("invalid_command_payload", "grid link endpoints must be different");
      if (command.linkType === "region") {
        if (state.companyLevel < 3) {
          return err("not_unlocked", "regional grid requires company level III", {
            company_level: state.companyLevel,
            required_company_level: 3,
            link_type: command.linkType
          });
        }
        if (!state.litTechIds.includes("grid_regional")) {
          return err("not_unlocked", "regional grid technology not lit", {
            required_tech_id: "grid_regional",
            link_type: command.linkType
          });
        }
      }
      const from = config.getCity(command.fromCityId);
      const to = config.getCity(command.toCityId);
      if (command.linkType === "region" && (!from || !to)) return err("not_found", "city not found for regional grid link");
      if (from) {
        const unlocked = assertCityUnlocked(state.companyLevel, from.unlock_company_level);
        if (!unlocked.ok) return unlocked;
      }
      if (to) {
        const unlocked = assertCityUnlocked(state.companyLevel, to.unlock_company_level);
        if (!unlocked.ok) return unlocked;
      }
      const fromRegionId = getGridNodeRegion(config, state, command.fromCityId) ?? "unknown";
      const toRegionId = getGridNodeRegion(config, state, command.toCityId) ?? "unknown";
      if (fromRegionId === "unknown" || toRegionId === "unknown") {
        return err("not_found", "grid endpoint not found or not operable", {
          from_city_id: command.fromCityId,
          to_city_id: command.toCityId
        });
      }
      if (command.linkType === "region" && fromRegionId !== toRegionId) {
        return err("invalid_command_payload", "region link must stay in same region", {
          from_city_id: command.fromCityId,
          to_city_id: command.toCityId,
          from_region_id: fromRegionId,
          to_region_id: toRegionId,
          expected_link_type: "trunk"
        });
      }
      if (command.linkType === "trunk" && fromRegionId === toRegionId) {
        return err("invalid_command_payload", "trunk link must connect different regions", {
          from_city_id: command.fromCityId,
          to_city_id: command.toCityId,
          from_region_id: fromRegionId,
          to_region_id: toRegionId,
          expected_link_type: "region"
        });
      }
      const linkKey = makeUndirectedLinkKey(command.fromCityId, command.toCityId);
      if (state.gridLinks[linkKey]) return err("conflict_in_progress", "grid link already exists");
      const cost = getGridLinkBuildCost(state, config, GRID_LINK_COST, command.linkType);
      if (state.funds < cost) return err("insufficient_funds", "not enough funds for grid link");
      state.funds -= cost;
      state.gridLinks[linkKey] = {
        linkId: linkKey,
        fromCityId: command.fromCityId,
        toCityId: command.toCityId,
        linkType: command.linkType,
        status: "building",
        monthsRemaining: GRID_LINK_BUILD_MONTHS,
        lossMw: getGridLinkLossMw(state, config, command.linkType),
        buildCost: cost
      };
      return ok("handled");
    }
    case "cancel_grid_link": {
      const link = state.gridLinks[command.linkId];
      if (!link) return err("not_found", "grid link item not found", { link_id: command.linkId });
      if (link.status !== "building") {
        return err("conflict_in_progress", "only building grid links can be cancelled", {
          link_id: command.linkId,
          status: link.status
        });
      }
      state.funds += link.buildCost ?? getGridLinkBuildCost(state, config, GRID_LINK_COST, link.linkType);
      delete state.gridLinks[command.linkId];
      return ok("handled");
    }
    case "queue_super_hydro": {
      const slot = config.getSuperHydroSlot(command.slotId);
      if (!slot) return err("not_found", "super hydro slot not found", { slot_id: command.slotId });
      if (!state.litTechIds.includes(slot.unlock_tech_id)) {
        return err("not_unlocked", "super hydro tech not lit", {
          slot_id: command.slotId,
          unlock_tech_id: slot.unlock_tech_id
        });
      }
      if (state.superHydros?.[slot.slot_id]) return err("conflict_in_progress", "super hydro slot already occupied", { slot_id: slot.slot_id });
      const buildCost = getConstructionBuildCost(state, config, slot.build_cost_total);
      if (state.funds < buildCost) return err("insufficient_funds", "not enough funds for super hydro");
      state.funds -= buildCost;
      state.superHydros ??= {};
      state.superHydros[slot.slot_id] = {
        slotId: slot.slot_id,
        nodeId: slot.node_id,
        displayName: slot.display_name,
        status: "building",
        monthsRemaining: slot.build_duration_months,
        outputMw: slot.output_capacity_mw
      };
      return ok("handled");
    }
    default:
      return ok("unhandled");
  }
}
