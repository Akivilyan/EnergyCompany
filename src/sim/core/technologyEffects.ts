import type { ConfigRepo, FacilityConfig, TechnologyConfig } from "../config/configRepo.js";
import type { CityRuntime, GameState } from "../types/gameState.js";

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

export function hasStorageOutputBoost(state: GameState): boolean {
  return state.litTechIds.includes("storage_system_1");
}

export function getFacilityEcoStatus(
  state: GameState,
  config: ConfigRepo,
  facilityId: string
): boolean {
  const facility = config.getFacility(facilityId);
  const ecoDefault = facility?.is_eco_default ?? true;
  if (ecoDefault) return true;

  const effectTarget =
    facilityId === "thermal" ? "all_thermal" : facilityId === "nuclear" ? "all_nuclear" : null;
  if (!effectTarget) return ecoDefault;

  return getLitTechnologies(state, config).some(
    (tech) => tech.effect_type === "eco_sync" && tech.effect_target === effectTarget
  );
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
    facility.isEco = getFacilityEcoStatus(state, config, facility.facilityId);
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

export function getGridLinkLossMw(
  state: GameState,
  config: ConfigRepo,
  linkType: "region" | "trunk"
): number {
  if (linkType === "trunk") {
    return state.litTechIds.includes("uhv_transmission")
      ? config.bundle.gridLoss.loss_backbone_uhv_mw
      : config.bundle.gridLoss.loss_backbone_pre_uhv_mw;
  }
  return applyPercent(
    config.bundle.gridLoss.loss_regional_mw,
    sumModifierPercent(state, config, "regional_loss_pct", "grid_loss")
  );
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

export function getLoanTierLevelBonus(state: GameState, config: ConfigRepo): number {
  return Math.max(0, sumModifierPercent(state, config, "loan_tier_bonus", "loan"));
}

export function getResearchCost(
  state: GameState,
  config: ConfigRepo,
  baseCost: number
): number {
  if (state.doctrineId !== "tech") return baseCost;
  return applyPercent(baseCost, config.bundle.doctrineMetaTechL1.research_cost_pct - 100);
}

export function getResearchMonths(
  state: GameState,
  config: ConfigRepo,
  baseMonths: number
): number {
  if (state.doctrineId !== "tech") return baseMonths;
  return Math.max(1, baseMonths - config.bundle.doctrineMetaTechL1.research_months_reduction);
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

export function getCitySocialValue(
  state: GameState,
  config: ConfigRepo,
  city: CityRuntime
): number {
  const cityBaseSocialValue = getEcoCitySocialValue(
    state,
    config,
    city.cityBaseSocialValue,
    city.cityFullyEcoSupply
  );
  return Math.floor(cityBaseSocialValue * city.supplyRatio * city.ecoCapFactor);
}
