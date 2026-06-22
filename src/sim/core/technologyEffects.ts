import type { ConfigRepo, TechnologyConfig } from "../config/configRepo.js";
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

function sumModifierPercent(state: GameState, config: ConfigRepo, key: string): number {
  let total = 0;
  for (const tech of getLitTechnologies(state, config)) {
    if (tech.effect_type !== "modifier") continue;
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
  baseOpex: number
): number {
  return applyPercent(baseOpex, sumModifierPercent(state, config, "opex_pct"));
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
