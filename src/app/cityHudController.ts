import { t } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";

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
  buildCost: number;
  buildMonths: number;
}

export interface CityHudBuildSelectionSnapshot {
  candidates: CityBuildCandidate[];
  selectedFacilityId: string | null;
}

const DEFAULT_BUILD_FACILITY_ID = "wind";
const selectedFacilityByBoot = new WeakMap<GameBootstrap, string>();
const BUILD_CANDIDATE_ORDER = ["wind", "solar", "thermal", "hydro", "nuclear"] as const;

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
    .map((facility) => ({
      facilityId: facility.facility_id,
      displayName: facility.display_name ?? facility.facility_id,
      buildCost: facility.build_cost_total,
      buildMonths: facility.build_duration_months
    }))
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
  const selected = ensureSelectedCandidate(boot);
  const targetFacilityId = facilityId ?? selected?.facilityId ?? DEFAULT_BUILD_FACILITY_ID;
  const out = boot.play.buildInCurrentCity(targetFacilityId, 1);
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
    months: selected.buildMonths
  });
}

export function formatCityHudStatus(view: CityHudViewModel): string {
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  return t("hud.status.city", { month: view.month, funds: view.funds, city });
}
