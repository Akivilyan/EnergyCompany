import type { GameBootstrap } from "../gameBootstrap.js";
import { getCityHudProfileSnapshot, readCityHudViewModel } from "../cityHudController.js";
import { t, tScreenLabel } from "../../i18n/index.js";
import type {
  OperatingPlanHint,
  OperatingPressureTag,
  RecommendedBuildKind,
  ResourceKind,
  WorldMapRegionItem
} from "../../modules/screenWorldMap.js";

export function formatLoanTierLabel(loanId: string): string {
  const key = `loan.tier.${loanId}`;
  const label = t(key);
  return label === key ? loanId : label;
}

export function hudLines(...parts: Array<string | null | undefined>): string[] {
  return parts.filter((p): p is string => !!p && p.length > 0);
}

export function firstLine(lines: string[], fallback = ""): string {
  return lines[0] ?? fallback;
}

export function formatCityStatus(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  return t("hud.status.city", { month: view.month, funds: view.funds, city });
}

function formatResourceKind(kind: ResourceKind): string {
  switch (kind) {
    case "wind":
      return t("resource.wind");
    case "solar":
      return t("resource.solar");
    case "hydro":
      return t("resource.hydro");
    case "fossil":
      return t("resource.fossil");
  }
}

export function formatRichResources(resources: ResourceKind[]): string {
  return resources.length > 0
    ? resources.map(formatResourceKind).join("/")
    : t("resource.none");
}

function formatRecommendedBuildKind(kind: RecommendedBuildKind): string {
  switch (kind) {
    case "wind":
      return t("facility.wind");
    case "solar":
      return t("facility.solar");
    case "hydro":
      return t("facility.hydro");
    case "thermal":
      return t("facility.thermal");
    case "nuclear":
      return t("facility.nuclear");
  }
}

export function formatRecommendedBuilds(builds: RecommendedBuildKind[]): string {
  return builds.length > 0
    ? builds.map(formatRecommendedBuildKind).join("/")
    : t("facility.none");
}

function formatOperatingPressureTag(tag: OperatingPressureTag): string {
  const key = `pressure.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

export function formatOperatingPressureTags(tags: OperatingPressureTag[]): string {
  return tags.length > 0
    ? tags.map(formatOperatingPressureTag).join("/")
    : t("pressure.none");
}

function formatOperatingPlanHint(hint: OperatingPlanHint): string {
  const key = `plan.${hint}`;
  const label = t(key);
  return label === key ? hint : label;
}

export function formatOperatingPlanHints(hints: OperatingPlanHint[]): string {
  return hints.length > 0
    ? hints.map(formatOperatingPlanHint).join("/")
    : t("plan.none");
}

export function formatOperatingPressureBreakdown(input: {
  supplyGapMw: number;
  totalDemandMw: number;
  totalBuildSlots: number;
  operatingPressureTags: OperatingPressureTag[];
}): string | null {
  const tags = new Set(input.operatingPressureTags);
  const parts: string[] = [];
  if (input.supplyGapMw > 0) {
    parts.push(t("hud.operating_pressure.gap", { gap: input.supplyGapMw }));
  }
  if (tags.has("high_demand")) {
    parts.push(t("hud.operating_pressure.high_demand", { demand: input.totalDemandMw }));
  }
  if (tags.has("trunk_first")) parts.push(t("hud.operating_pressure.trunk_first"));
  if (tags.has("low_slot_density")) {
    parts.push(t("hud.operating_pressure.slots", { slots: input.totalBuildSlots }));
  }
  if (tags.has("no_hydro")) parts.push(t("hud.operating_pressure.no_hydro"));
  if (tags.has("fossil_transition")) parts.push(t("hud.operating_pressure.fossil_transition"));
  if (tags.has("nuclear_siting")) parts.push(t("hud.operating_pressure.nuclear_siting"));
  if (tags.has("hydro_site_bound")) parts.push(t("hud.operating_pressure.hydro_site_bound"));
  if (tags.has("mixed_dispatch")) parts.push(t("hud.operating_pressure.mixed_dispatch"));
  if (tags.has("terminal_load")) {
    parts.push(t("hud.operating_pressure.terminal_load", { demand: input.totalDemandMw }));
  }
  return parts.length > 0
    ? t("hud.line.operating_pressure_breakdown", { items: parts.join(" · ") })
    : null;
}

function hasOperatingPressureTechSolution(boot: GameBootstrap, tag: OperatingPressureTag): boolean {
  const lit = new Set(boot.app.controller.state.litTechIds);
  switch (tag) {
    case "terminal_load":
      return lit.has("super_hydro");
    case "trunk_first":
      return lit.has("grid_backbone") || lit.has("uhv_transmission");
    case "nuclear_siting":
      return ["nuclear_1", "nuclear_2", "nuclear_3"].some((techId) => lit.has(techId));
    case "hydro_site_bound":
      return ["hydro_2", "hydro_3", "hydro_4", "hydro_5"].some((techId) => lit.has(techId));
    case "mixed_dispatch":
      return lit.has("eng_grid_dispatch");
    case "low_slot_density":
      return [
        "wind_2",
        "wind_3",
        "wind_4",
        "wind_5",
        "solar_2",
        "solar_3",
        "solar_4",
        "solar_5",
        "thermal_2",
        "thermal_3",
        "thermal_4",
        "thermal_5",
        "hydro_2",
        "hydro_3",
        "hydro_4",
        "hydro_5"
      ].some((techId) => lit.has(techId));
    case "supply_gap":
      return [
        "storage_system_1",
        "storage_system_2",
        "storage_system_3",
        "wind_2",
        "wind_3",
        "wind_4",
        "wind_5",
        "solar_2",
        "solar_3",
        "solar_4",
        "solar_5",
        "thermal_2",
        "thermal_3",
        "thermal_4",
        "thermal_5",
        "hydro_2",
        "hydro_3",
        "hydro_4",
        "hydro_5"
      ].some((techId) => lit.has(techId));
    case "fossil_transition":
      return ["eco_thermal", "eng_ops_contract"].some((techId) => lit.has(techId));
    default:
      return false;
  }
}

function formatTechSolutionStatus(boot: GameBootstrap, tag: OperatingPressureTag): string {
  if (tag === "terminal_load") {
    const superHydro = boot.app.screens.world.getSnapshot().superHydro;
    if (!superHydro.unlocked) return t("hud.tech_solution.status.pending");
    if (superHydro.connectedOutputMw > 0) return t("hud.tech_solution.status.connected");
    if (superHydro.totalOutputMw > 0) return t("hud.tech_solution.status.needs_grid");
    if (superHydro.buildingSlots > 0) return t("hud.tech_solution.status.building");
    return t("hud.tech_solution.status.ready");
  }
  return hasOperatingPressureTechSolution(boot, tag)
    ? t("hud.tech_solution.status.lit")
    : t("hud.tech_solution.status.pending");
}

export function formatOperatingPressureTechSolutions(
  boot: GameBootstrap,
  tags: OperatingPressureTag[]
): string | null {
  const tagSet = new Set(tags);
  const parts: string[] = [];
  const pushSolution = (tag: OperatingPressureTag, key: string): void => {
    if (!tagSet.has(tag)) return;
    parts.push(t("hud.tech_solution.item", {
      solution: t(key),
      status: formatTechSolutionStatus(boot, tag)
    }));
  };
  pushSolution("terminal_load", "hud.tech_solution.terminal_load");
  pushSolution("trunk_first", "hud.tech_solution.trunk_first");
  pushSolution("nuclear_siting", "hud.tech_solution.nuclear_siting");
  pushSolution("hydro_site_bound", "hud.tech_solution.hydro_site_bound");
  pushSolution("mixed_dispatch", "hud.tech_solution.mixed_dispatch");
  pushSolution("low_slot_density", "hud.tech_solution.low_slot_density");
  pushSolution("supply_gap", "hud.tech_solution.supply_gap");
  pushSolution("fossil_transition", "hud.tech_solution.fossil_transition");
  return parts.length > 0 ? t("hud.line.tech_solution", { items: parts.join("/") }) : null;
}

export function formatRegionDesignRole(role: string | null): string {
  if (!role) return t("region.role.unknown");
  const key = `region.role.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

export function formatCityPowerRole(role: string | null): string {
  if (!role) return t("city.role.unknown");
  const key = `city.role.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

export function formatCityEcoStatus(profile: {
  cityFullyEcoSupply: boolean;
  ecoCapFactor: number;
  greenPrActive: boolean;
}): string {
  if (profile.greenPrActive) return t("hud.city.eco.green_pr");
  if (profile.cityFullyEcoSupply) return t("hud.city.eco.full");
  return t("hud.city.eco.partial", { cap: Math.round(profile.ecoCapFactor * 100) });
}

export function formatCityBuildAction(profile: {
  supplyGapMw: number;
  richResources: ResourceKind[];
  operatingPressureTags: OperatingPressureTag[];
  hasRiver: boolean;
  nuclearEligible: boolean;
}): string | null {
  if (profile.supplyGapMw <= 0) return null;
  const tags = new Set(profile.operatingPressureTags);
  const parts: string[] = [];
  if (profile.richResources.includes("wind") || profile.richResources.includes("solar")) {
    parts.push(t("hud.city.action.local_renewables"));
  }
  if (profile.hasRiver) parts.push(t("hud.city.action.hydro"));
  if (tags.has("fossil_transition")) parts.push(t("hud.city.action.thermal_bridge"));
  if (profile.nuclearEligible) parts.push(t("hud.city.action.nuclear"));
  if (tags.has("low_slot_density") || tags.has("terminal_load")) {
    parts.push(t("hud.city.action.slot_efficiency"));
  }
  if (tags.has("mixed_dispatch")) parts.push(t("hud.city.action.mixed_dispatch"));
  return parts.length > 0 ? t("hud.line.city_action", { items: parts.join("/") }) : null;
}

function formatWorldConnectionLabel(status: string): string {
  switch (status) {
    case "capital":
      return t("hud.world.connection.capital");
    case "locked":
      return t("hud.world.connection.locked");
    case "planned":
      return t("hud.world.connection.planned");
    case "available":
      return t("hud.world.connection.available");
    case "building":
      return t("hud.world.connection.building");
    case "connected":
      return t("hud.world.connection.connected");
    default:
      return status;
  }
}

export function formatWorldConnectionStatus(region: WorldMapRegionItem): string {
  const status = formatWorldConnectionLabel(region.connectionStatus);
  if (region.trunkLinkId && region.trunkLossMw !== null) {
    return t("hud.world.connection.detail", {
      status,
      months: region.trunkMonthsRemaining ?? 0,
      loss: region.trunkLossMw
    });
  }
  return status;
}

export function formatNavHint(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const stack = boot.play.getNavigation().stack.length;
  return t("hud.nav.hint", { screen: tScreenLabel(view.screen), stack });
}

export function readCityProfile(boot: GameBootstrap): ReturnType<typeof getCityHudProfileSnapshot> {
  return getCityHudProfileSnapshot(boot);
}
