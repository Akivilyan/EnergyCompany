import { getLocale, t } from "../i18n/index.js";
import {
  getConstructionBuildCost,
  getFacilityBuildTierMax,
  getFacilityTierSpec,
  hasStorageOutputBoost
} from "../sim/core/technologyEffects.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import type { OperatingPressureTag } from "../modules/screenWorldMap.js";

export interface CityHudViewModel {
  month: number;
  funds: number;
  cityId: string;
  screen: string;
}

export interface CityHudActionResult {
  ok: boolean;
  view: CityHudViewModel;
  errorCode: string | null;
  messageKey: string | null;
}

export interface CityHudAdvanceResult extends CityHudActionResult {
  monthFrom: number | null;
  monthTo: number | null;
}

export interface CityBuildCandidate {
  facilityId: string;
  displayName: string;
  tier: number;
  buildCost: number;
  buildMonths: number;
  outputMw: number;
  effectiveOutputMw: number;
  resourceMultiplier: number;
  storageMultiplier: number;
}

export interface CityHudBuildSelectionSnapshot {
  candidates: CityBuildCandidate[];
  selectedFacilityId: string | null;
}

export interface CityHudProfileSnapshot {
  demandMw: number;
  localSupplyMw: number;
  effectiveSupplyMw: number;
  supplyGapMw: number;
  supplyRatio: number;
  cityFullyEcoSupply: boolean;
  ecoCapFactor: number;
  greenPrActive: boolean;
  buildSlots: number;
  hasRiver: boolean;
  nuclearEligible: boolean;
  richResources: Array<"wind" | "solar" | "hydro" | "fossil">;
  operatingPressureTags: OperatingPressureTag[];
  powerRole: string | null;
}

const DEFAULT_BUILD_FACILITY_ID = "wind";
const selectedFacilityByBoot = new WeakMap<GameBootstrap, string>();
const BUILD_CANDIDATE_ORDER = ["wind", "solar", "thermal", "hydro", "nuclear"] as const;
const FACILITY_LABELS = {
  "zh-CN": {
    wind: "风电",
    solar: "光伏",
    thermal: "火电",
    hydro: "水电",
    nuclear: "核电"
  },
  en: {
    wind: "Wind",
    solar: "Solar",
    thermal: "Thermal",
    hydro: "Hydro",
    nuclear: "Nuclear"
  }
} as const;
const TIER_LABELS = ["I", "II", "III", "IV", "V"] as const;

export function readCityHudViewModel(boot: GameBootstrap): CityHudViewModel {
  const nav = boot.play.getNavigation();
  const state = boot.app.controller.state;
  return {
    month: state.currentMonth,
    funds: state.funds,
    cityId: nav.cityId ?? "CITY-START",
    screen: nav.currentScreen
  };
}

function toActionResult(
  boot: GameBootstrap,
  ok: boolean,
  errorCode: string | null,
  messageKey: string | null
): CityHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    errorCode,
    messageKey
  };
}

function countCityFacility(boot: GameBootstrap, cityId: string, facilityId: string): number {
  let count = 0;
  for (const fac of Object.values(boot.app.controller.state.facilities)) {
    if (fac.cityId === cityId && fac.facilityId === facilityId) {
      count += 1;
    }
  }
  for (const item of boot.app.controller.state.constructionQueue) {
    if (item.cityId === cityId && item.facilityId === facilityId) {
      count += 1;
    }
  }
  return count;
}

function getCurrentCityId(boot: GameBootstrap): string {
  return boot.play.getNavigation().cityId ?? "CITY-START";
}

function formatFacilityTierDisplayName(facilityId: string, tier: number): string {
  const locale = getLocale();
  const labels = FACILITY_LABELS[locale];
  const baseLabel = labels[facilityId as keyof typeof labels] ?? facilityId;
  const tierLabel = TIER_LABELS[Math.max(0, tier - 1)] ?? String(tier);
  return locale === "zh-CN" ? `${baseLabel}·${tierLabel}` : `${baseLabel} ${tierLabel}`;
}

function getCityResourceMultiplier(boot: GameBootstrap, cityId: string, facilityId: string): number {
  const city = boot.app.controller.config.getCity(cityId);
  if (!city) return 1;
  const resource =
    facilityId === "wind"
      ? city.wind_resource
      : facilityId === "solar"
        ? city.solar_resource
        : facilityId === "hydro"
          ? city.hydro_resource
          : undefined;
  return resource === "rich" ? 2 : 1;
}

function getStorageMultiplier(boot: GameBootstrap, facilityId: string): number {
  return hasStorageOutputBoost(boot.app.controller.state) &&
    (facilityId === "wind" || facilityId === "solar" || facilityId === "hydro")
    ? 2
    : 1;
}

function appendCityRolePressureTags(
  tags: OperatingPressureTag[],
  powerRole: string | undefined
): void {
  if (
    powerRole === "plateau_hydro_hub" ||
    powerRole === "cascade_hydro_solar_node" ||
    powerRole === "valley_hydro_outpost"
  ) {
    tags.push("hydro_site_bound");
  }
  if (
    powerRole === "frontier_balancing_hub" ||
    powerRole === "desert_hybrid_generation_node"
  ) {
    tags.push("mixed_dispatch");
  }
  if (powerRole === "terminal_metropolis_hub") {
    tags.push("terminal_load");
  }
}

export function getCityHudProfileSnapshot(boot: GameBootstrap): CityHudProfileSnapshot | null {
  const cityId = getCurrentCityId(boot);
  const city = boot.app.controller.config.getCity(cityId);
  if (!city) return null;
  const runtime = boot.app.controller.state.cities[cityId];
  const region = city.region_id ? boot.app.controller.config.getRegion(city.region_id) : undefined;
  const richResources: CityHudProfileSnapshot["richResources"] = [];
  if (city.wind_resource === "rich") richResources.push("wind");
  if (city.solar_resource === "rich") richResources.push("solar");
  if (city.hydro_resource === "rich") richResources.push("hydro");
  if (city.fossil_energy || region?.fossil_energy) richResources.push("fossil");
  const demandMw = runtime?.demandMw ?? city.base_demand_mw;
  const effectiveSupplyMw = runtime?.effectiveSupplyMw ?? 0;
  const supplyGapMw = Math.max(0, demandMw - effectiveSupplyMw);
  const fossilEnergy = !!city.fossil_energy || !!region?.fossil_energy;
  const operatingPressureTags: OperatingPressureTag[] = [];
  if (demandMw >= 1200) operatingPressureTags.push("high_demand");
  if (supplyGapMw > 0) operatingPressureTags.push("supply_gap");
  if (demandMw > 0 && city.build_slot_count * 180 < demandMw) {
    operatingPressureTags.push("low_slot_density");
  }
  if (!city.has_river) operatingPressureTags.push("no_hydro");
  if (fossilEnergy) operatingPressureTags.push("fossil_transition");
  if (city.is_nuclear_eligible) operatingPressureTags.push("nuclear_siting");
  appendCityRolePressureTags(operatingPressureTags, city.power_role);
  return {
    demandMw,
    localSupplyMw: runtime?.localSupplyMw ?? 0,
    effectiveSupplyMw,
    supplyGapMw,
    supplyRatio: runtime?.supplyRatio ?? 0,
    cityFullyEcoSupply: runtime?.cityFullyEcoSupply ?? true,
    ecoCapFactor: runtime?.ecoCapFactor ?? 1,
    greenPrActive:
      !!runtime?.cityFullyEcoSupply && boot.app.controller.state.litTechIds.includes("eng_green_pr"),
    buildSlots: city.build_slot_count,
    hasRiver: city.has_river,
    nuclearEligible: !!city.is_nuclear_eligible,
    richResources,
    operatingPressureTags,
    powerRole: city.power_role ?? null
  };
}

function getBuildCandidates(boot: GameBootstrap): CityBuildCandidate[] {
  const cityId = getCurrentCityId(boot);
  if (!boot.app.controller.state.cities[cityId]) return [];
  const city = boot.app.controller.config.getCity(cityId);
  if (!city) return [];
  const litTechIds = new Set(boot.app.controller.state.litTechIds);
  return boot.app.controller.config.bundle.facilities
    .filter((facility) => {
      if (facility.unlock_tech_id && !litTechIds.has(facility.unlock_tech_id)) {
        return false;
      }
      if (facility.requires_river && !city.has_river) {
        return false;
      }
      if (facility.facility_id === "nuclear" && !city.is_nuclear_eligible) {
        return false;
      }
      const maxPerCity = facility.max_per_city ?? Number.POSITIVE_INFINITY;
      return countCityFacility(boot, city.city_id, facility.facility_id) < maxPerCity;
    })
    .map((facility) => {
      const tier = getFacilityBuildTierMax(
        boot.app.controller.state,
        boot.app.controller.config,
        facility.facility_id
      );
      const spec = getFacilityTierSpec(boot.app.controller.config, facility.facility_id, tier);
      if (!spec) return null;
      const resourceMultiplier = getCityResourceMultiplier(boot, city.city_id, facility.facility_id);
      const storageMultiplier = getStorageMultiplier(boot, facility.facility_id);
      return {
        facilityId: facility.facility_id,
        displayName: formatFacilityTierDisplayName(facility.facility_id, spec.tier),
        tier: spec.tier,
        buildCost: getConstructionBuildCost(
          boot.app.controller.state,
          boot.app.controller.config,
          spec.buildCost
        ),
        buildMonths: spec.buildMonths,
        outputMw: spec.outputMw,
        effectiveOutputMw: spec.outputMw * resourceMultiplier * storageMultiplier,
        resourceMultiplier,
        storageMultiplier
      };
    })
    .filter((candidate): candidate is CityBuildCandidate => !!candidate)
    .sort((a, b) => {
      const aIndex = BUILD_CANDIDATE_ORDER.indexOf(a.facilityId as (typeof BUILD_CANDIDATE_ORDER)[number]);
      const bIndex = BUILD_CANDIDATE_ORDER.indexOf(b.facilityId as (typeof BUILD_CANDIDATE_ORDER)[number]);
      const aRank = aIndex >= 0 ? aIndex : Number.MAX_SAFE_INTEGER;
      const bRank = bIndex >= 0 ? bIndex : Number.MAX_SAFE_INTEGER;
      return aRank - bRank || a.facilityId.localeCompare(b.facilityId);
    });
}

function ensureSelectedCandidate(boot: GameBootstrap): CityBuildCandidate | null {
  const candidates = getBuildCandidates(boot);
  if (candidates.length === 0) {
    selectedFacilityByBoot.delete(boot);
    return null;
  }
  const remembered = selectedFacilityByBoot.get(boot);
  const selected =
    candidates.find((candidate) => candidate.facilityId === remembered) ??
    candidates.find((candidate) => candidate.facilityId === DEFAULT_BUILD_FACILITY_ID) ??
    candidates[0];
  selectedFacilityByBoot.set(boot, selected.facilityId);
  return selected;
}

export function getCityHudBuildSelectionSnapshot(
  boot: GameBootstrap
): CityHudBuildSelectionSnapshot {
  const candidates = getBuildCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  return {
    candidates,
    selectedFacilityId: selected?.facilityId ?? null
  };
}

export function cityHudBuildSelected(
  boot: GameBootstrap,
  facilityId?: string
): CityHudActionResult {
  const candidates = getBuildCandidates(boot);
  const selected = ensureSelectedCandidate(boot);
  const target =
    (facilityId
      ? candidates.find((candidate) => candidate.facilityId === facilityId)
      : null) ??
    selected;
  const targetFacilityId = target?.facilityId ?? facilityId ?? DEFAULT_BUILD_FACILITY_ID;
  const out = boot.play.buildInCurrentCity(targetFacilityId, target?.tier ?? 1);
  return {
    ok: out.ok,
    view: readCityHudViewModel(boot),
    errorCode: out.errorCode,
    messageKey: out.ok ? null : "city.error.build_failed"
  };
}

export function cityHudBuildWind(boot: GameBootstrap): CityHudActionResult {
  return cityHudBuildSelected(boot, "wind");
}

export function cityHudCycleBuildCandidate(boot: GameBootstrap): CityHudActionResult {
  const candidates = getBuildCandidates(boot);
  if (candidates.length === 0) {
    return toActionResult(boot, false, "not_found", "city.action.no_build_candidate");
  }
  const current = ensureSelectedCandidate(boot);
  const currentIndex = current
    ? candidates.findIndex((candidate) => candidate.facilityId === current.facilityId)
    : -1;
  const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
  selectedFacilityByBoot.set(boot, next.facilityId);
  return toActionResult(
    boot,
    true,
    null,
    candidates.length > 1
      ? "city.action.selected_next_candidate"
      : "city.action.selected_only_candidate"
  );
}

export function cityHudAdvanceMonth(boot: GameBootstrap): CityHudAdvanceResult {
  const out = boot.play.advanceMonthInCurrentCity();
  return {
    ok: out.ok,
    view: readCityHudViewModel(boot),
    errorCode: out.errorCode,
    messageKey: out.ok ? null : "city.error.advance_failed",
    monthFrom: out.monthFrom,
    monthTo: out.monthTo
  };
}

export function formatSelectedBuildCandidate(boot: GameBootstrap): string | null {
  const selected = ensureSelectedCandidate(boot);
  if (!selected) return null;
  return t("hud.status.city_selected_build", {
    facility: selected.displayName,
    cost: selected.buildCost,
    months: selected.buildMonths,
    output: selected.effectiveOutputMw,
    resource: selected.resourceMultiplier,
    storage: selected.storageMultiplier
  });
}

export function formatCityHudStatus(view: CityHudViewModel): string {
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  return t("hud.status.city", { month: view.month, funds: view.funds, city });
}
