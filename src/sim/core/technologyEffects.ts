import type { ConfigRepo, FacilityConfig, TechnologyConfig } from "../config/configRepo.js";
import type { GameState } from "../types/gameState.js";

function getLitTechnologies(state: GameState, config: ConfigRepo): TechnologyConfig[] {
  return state.litTechIds
    .map((techId) => config.getTechnology(techId))
    .filter((tech): tech is TechnologyConfig => !!tech);
}

function readNumericEffectValue(tech: TechnologyConfig, key: string): number {
  const value = tech.effect_value[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sumModifierPercent(
  state: GameState,
  config: ConfigRepo,
  key: string,
  effectTarget?: string
): number {
  let total = 0;
  for (const tech of getLitTechnologies(state, config)) {
    if (tech.effect_type !== "modifier") continue;
    if (effectTarget && tech.effect_target !== effectTarget) continue;
    total += readNumericEffectValue(tech, key);
  }
  return total;
}

function sumGridPercent(
  state: GameState,
  config: ConfigRepo,
  key: string,
  effectTarget?: string
): number {
  let total = 0;
  for (const tech of getLitTechnologies(state, config)) {
    if (tech.effect_type !== "grid") continue;
    if (effectTarget && tech.effect_target !== effectTarget) continue;
    total += readNumericEffectValue(tech, key);
  }
  return total;
}

function applyPercent(baseValue: number, percentDelta: number, minValue = 0): number {
  return Math.max(minValue, Math.floor((baseValue * (100 + percentDelta)) / 100));
}

function technologyTargets(tech: TechnologyConfig): Set<string> {
  return new Set(
    tech.effect_target
      .split(",")
      .map((target) => target.trim())
      .filter((target) => target.length > 0)
  );
}

export function getStorageOutputMultiplier(
  state: GameState,
  config: ConfigRepo,
  facilityId: string
): number {
  let multiplier = 1;
  for (const tech of getLitTechnologies(state, config)) {
    if (tech.effect_type !== "storage_buff") continue;
    if (!technologyTargets(tech).has(facilityId)) continue;
    multiplier = Math.max(multiplier, readNumericEffectValue(tech, "storage_mult"));
  }
  return multiplier;
}

function getFacilityTierTechMax(
  state: GameState,
  config: ConfigRepo,
  facilityId: string
): number {
  let tierMax = 1;
  for (const tech of getLitTechnologies(state, config)) {
    if (tech.effect_type !== "facility_tier") continue;
    if (tech.effect_target !== facilityId) continue;
    tierMax = Math.max(tierMax, readNumericEffectValue(tech, "tier_max"));
  }
  return tierMax;
}

export function getFacilityBuildTierMax(
  state: GameState,
  config: ConfigRepo,
  facilityId: string
): number {
  const facility = config.getFacility(facilityId);
  if (!facility) return 0;
  return Math.max(facility.tier ?? 1, getFacilityTierTechMax(state, config, facilityId));
}

export interface FacilityTierSpec {
  tier: number;
  buildCost: number;
  buildMonths: number;
  outputMw: number;
  monthlyOpex: number;
  monthlyFuel: number;
}

function normalizeFacilityTier(baseFacility: FacilityConfig, requestedTier: number): number {
  const baseTier = Math.max(1, baseFacility.tier ?? 1);
  if (!Number.isFinite(requestedTier)) return baseTier;
  return Math.max(baseTier, Math.floor(requestedTier));
}

export function getFacilityTierSpec(
  config: ConfigRepo,
  facilityId: string,
  requestedTier: number
): FacilityTierSpec | null {
  const facility = config.getFacility(facilityId);
  if (!facility) return null;
  const tier = normalizeFacilityTier(facility, requestedTier);
  return {
    tier,
    buildCost: Math.max(1, facility.build_cost_total * tier),
    buildMonths: Math.max(1, facility.build_duration_months + tier - 1),
    outputMw: Math.max(1, facility.output_capacity_mw * tier),
    monthlyOpex: Math.max(0, facility.monthly_operating_cost * tier),
    monthlyFuel: facility.facility_id === "thermal" ? 3 * tier : 0
  };
}

export function syncFacilityRuntimeTiers(state: GameState, config: ConfigRepo): void {
  for (const facility of Object.values(state.facilities)) {
    const maxTier = getFacilityBuildTierMax(state, config, facility.facilityId);
    if (maxTier <= facility.tier) continue;
    const spec = getFacilityTierSpec(config, facility.facilityId, maxTier);
    if (!spec) continue;
    facility.tier = spec.tier;
    facility.outputMw = spec.outputMw;
    facility.monthlyOpex = spec.monthlyOpex;
    facility.monthlyFuel = spec.monthlyFuel;
  }
}

export function getConstructionBuildCost(
  state: GameState,
  config: ConfigRepo,
  baseCost: number
): number {
  return applyPercent(baseCost, sumModifierPercent(state, config, "build_cost_pct"));
}

export function getGridLinkBuildCost(
  state: GameState,
  config: ConfigRepo,
  baseCost: number,
  linkType: "region" | "trunk" = "region"
): number {
  const percentDelta =
    linkType === "trunk"
      ? sumGridPercent(state, config, "trunk_link_cost_pct", "trunk")
      : sumGridPercent(state, config, "grid_link_cost_pct", "region");
  return applyPercent(baseCost, percentDelta, 1);
}

export function getMonthlyOperatingCost(
  state: GameState,
  config: ConfigRepo,
  baseOpex: number,
  facilityId?: string
): number {
  let percentDelta = sumModifierPercent(state, config, "opex_pct", "operations");
  if (facilityId) {
    percentDelta += sumModifierPercent(state, config, "opex_pct", facilityId);
  }
  return applyPercent(baseOpex, percentDelta);
}

export function getDisasterPenalty(
  state: GameState,
  config: ConfigRepo,
  basePenalty: number
): number {
  return applyPercent(basePenalty, sumModifierPercent(state, config, "disaster_cash_pct"));
}

export function getEcoCitySocialValue(
  state: GameState,
  config: ConfigRepo,
  cityBaseSocialValue: number,
  cityFullyEcoSupply: boolean
): number {
  if (!cityFullyEcoSupply) return cityBaseSocialValue;
  return applyPercent(
    cityBaseSocialValue,
    sumModifierPercent(state, config, "eco_city_sv_pct")
  );
}
