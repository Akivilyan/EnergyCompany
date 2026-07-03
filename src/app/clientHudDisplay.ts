import type { GameBootstrap } from "./gameBootstrap.js";
import { getCityHudProfileSnapshot, readCityHudViewModel } from "./cityHudController.js";
import {
  formatSelectedBuildCandidate,
  getCityHudBuildSelectionSnapshot
} from "./cityHudController.js";
import {
  formatActiveEventRecoveryActionLine,
  formatActiveEventPressureLine,
  formatDisasterAxisProgressLine,
  formatEventsHudHint,
  formatPendingEventModalLines,
  formatUpcomingEventPrepActionLine,
  formatUpcomingEventRiskOpportunityLine,
  formatUpcomingEventRiskLine
} from "./eventsHudController.js";
import {
  formatActiveResearchCandidate,
  formatActiveResearchPressureReason,
  formatResearchableTechPressureSummary,
  formatResearchableTechBranchSummary,
  formatSelectedResearchPressureReason,
  formatSelectedResearchCandidate,
  formatTechProgressionSummary,
  getTechHudSelectionSnapshot
} from "./techHudController.js";
import { formatSelectedRegionLink, formatSelectedRegionLinkAction } from "./regionHudController.js";
import {
  formatCompanyCashflowOpportunityLine,
  formatCompanyConstructionTechLine,
  formatCompanyEcoOpportunityLine,
  formatCompanyEcoTechLine,
  formatCompanyGenerationOpportunityLine,
  formatCompanyGenerationTechLine,
  formatCompanyGridDispatchOpportunityLine,
  formatCompanyGreenBrandOpportunityLine,
  formatCompanyGridDispatchTechLine,
  formatCompanyGridOpportunityLine,
  formatCompanyGridTechLine,
  formatCompanyLevelGoalLine,
  formatCompanyLoanTierBonusLine,
  formatCompanyNuclearOpportunityLine,
  formatCompanyNuclearTechLine,
  formatCompanyOpexOpportunityLine,
  formatCompanyOpexTechLine,
  formatCompanyStorageOpportunityLine,
  formatCompanyStorageTechLine,
  formatCompanyStrategicOpportunityLine,
  formatCompanyStrategicTechLine,
  formatSelectedLoanCandidate,
  getCompanyHudSelectionSnapshot
} from "./companyHudController.js";
import {
  formatSelectedWorldCandidate,
  formatSelectedWorldSuperHydroSlot,
  formatSelectedWorldTrunkAction,
  formatSelectedWorldTrunkCandidate,
  formatWorldSuperHydroGridPressure,
  formatWorldSuperHydroStatus,
  getWorldHudSelectionSnapshot
} from "./worldHudController.js";
import { t, tScreenLabel } from "../i18n/index.js";
import type {
  OperatingPlanHint,
  OperatingPressureTag,
  RecommendedBuildKind,
  ResourceKind,
  WorldMapRegionItem
} from "../modules/screenWorldMap.js";

export function formatLoanTierLabel(loanId: string): string {
  const key = `loan.tier.${loanId}`;
  const label = t(key);
  return label === key ? loanId : label;
}

export interface ClientHudDisplay {
  /** 首行摘要，供 CLI/冒烟断言。 */
  statusLine: string;
  detailLine: string;
  /** 多行状态，供 Cocos 开发 HUD 展示。 */
  statusLines: string[];
  detailLines: string[];
}

function hudLines(...parts: Array<string | null | undefined>): string[] {
  return parts.filter((p): p is string => !!p && p.length > 0);
}

function firstLine(lines: string[], fallback = ""): string {
  return lines[0] ?? fallback;
}

function formatCityStatus(boot: GameBootstrap): string {
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

function formatRichResources(resources: ResourceKind[]): string {
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

function formatRecommendedBuilds(builds: RecommendedBuildKind[]): string {
  return builds.length > 0
    ? builds.map(formatRecommendedBuildKind).join("/")
    : t("facility.none");
}

function formatOperatingPressureTag(tag: OperatingPressureTag): string {
  const key = `pressure.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

function formatOperatingPressureTags(tags: OperatingPressureTag[]): string {
  return tags.length > 0
    ? tags.map(formatOperatingPressureTag).join("/")
    : t("pressure.none");
}

function formatOperatingPlanHint(hint: OperatingPlanHint): string {
  const key = `plan.${hint}`;
  const label = t(key);
  return label === key ? hint : label;
}

function formatOperatingPlanHints(hints: OperatingPlanHint[]): string {
  return hints.length > 0
    ? hints.map(formatOperatingPlanHint).join("/")
    : t("plan.none");
}

function formatOperatingPressureBreakdown(input: {
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

function formatOperatingPressureTechSolutions(
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

function formatRegionDesignRole(role: string | null): string {
  if (!role) return t("region.role.unknown");
  const key = `region.role.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

function formatCityPowerRole(role: string | null): string {
  if (!role) return t("city.role.unknown");
  const key = `city.role.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

function formatCityEcoStatus(profile: {
  cityFullyEcoSupply: boolean;
  ecoCapFactor: number;
  greenPrActive: boolean;
}): string {
  if (profile.greenPrActive) return t("hud.city.eco.green_pr");
  if (profile.cityFullyEcoSupply) return t("hud.city.eco.full");
  return t("hud.city.eco.partial", { cap: Math.round(profile.ecoCapFactor * 100) });
}

function formatCityBuildAction(profile: {
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

function nextCompanyLevelThreshold(boot: GameBootstrap, companyLevel: number): number | null {
  const row = boot.app.controller.config.bundle.companyLevels.find(
    (item) => item.level === companyLevel + 1
  );
  return row?.sv_threshold ?? null;
}

function formatLatestCompanyCashflow(boot: GameBootstrap): string | null {
  const latest = boot.app.screens.company.getRecentCashflows(1)[0];
  if (!latest) return null;
  return t("hud.status.company_cashflow", {
    month: latest.monthFrom,
    net: latest.netCashflow,
    income: latest.income,
    opex: latest.opex,
    fuel: latest.fuel,
    loan: latest.loanPaid
  });
}

function formatCompanyStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.company.getSnapshot();
  const selection = getCompanyHudSelectionSnapshot(boot);
  const selectedLoan = formatSelectedLoanCandidate(boot);
  const latestCashflow = formatLatestCompanyCashflow(boot);
  const nextThreshold = nextCompanyLevelThreshold(boot, s.companyLevel);
  const svLine =
    nextThreshold === null
      ? t("hud.line.social_value_max", { current: s.socialValue })
      : t("hud.line.social_value", { current: s.socialValue, next: nextThreshold });
  const statusLine = t("hud.status.company", {
    level: s.companyLevel,
    funds: s.funds,
    ads: s.adsRemaining
  });
  const statusLines = hudLines(
    t("hud.line.company_header", { level: s.companyLevel }),
    t("hud.line.funds", { funds: s.funds }),
    t("hud.line.ads_remaining", { ads: s.adsRemaining })
  );
  const loanPart = s.activeLoan
    ? t("hud.status.company_loan_detail", {
        loanName: formatLoanTierLabel(s.activeLoan.loanId),
        months: s.activeLoan.monthsRemaining
      })
    : t("hud.status.company_no_loan");
  const detailLines = s.activeLoan
    ? hudLines(
        svLine,
        formatCompanyLevelGoalLine(boot),
        latestCashflow,
        formatDisasterAxisProgressLine(boot),
        formatActiveEventPressureLine(boot),
        formatActiveEventRecoveryActionLine(boot),
        formatUpcomingEventPrepActionLine(boot),
        formatUpcomingEventRiskLine(boot),
        formatUpcomingEventRiskOpportunityLine(boot),
        formatCompanyCashflowOpportunityLine(boot),
        formatCompanyConstructionTechLine(boot),
        formatCompanyOpexTechLine(boot),
        formatCompanyOpexOpportunityLine(boot),
        formatCompanyGenerationTechLine(boot),
        formatCompanyGenerationOpportunityLine(boot),
        formatCompanyNuclearTechLine(boot),
        formatCompanyNuclearOpportunityLine(boot),
        formatCompanyStorageTechLine(boot),
        formatCompanyStorageOpportunityLine(boot),
        formatCompanyGridTechLine(boot),
        formatCompanyGridOpportunityLine(boot),
        formatCompanyGridDispatchTechLine(boot),
        formatCompanyGridDispatchOpportunityLine(boot),
        formatCompanyEcoTechLine(boot),
        formatCompanyEcoOpportunityLine(boot),
        formatCompanyGreenBrandOpportunityLine(boot),
        formatCompanyStrategicTechLine(boot),
        formatCompanyStrategicOpportunityLine(boot),
        loanPart
      )
    : hudLines(
        svLine,
        formatCompanyLevelGoalLine(boot),
        latestCashflow,
        formatDisasterAxisProgressLine(boot),
        formatActiveEventPressureLine(boot),
        formatActiveEventRecoveryActionLine(boot),
        formatUpcomingEventPrepActionLine(boot),
        formatUpcomingEventRiskLine(boot),
        formatUpcomingEventRiskOpportunityLine(boot),
        formatCompanyLoanTierBonusLine(boot),
        formatCompanyCashflowOpportunityLine(boot),
        formatCompanyConstructionTechLine(boot),
        formatCompanyOpexTechLine(boot),
        formatCompanyOpexOpportunityLine(boot),
        formatCompanyGenerationTechLine(boot),
        formatCompanyGenerationOpportunityLine(boot),
        formatCompanyNuclearTechLine(boot),
        formatCompanyNuclearOpportunityLine(boot),
        formatCompanyStorageTechLine(boot),
        formatCompanyStorageOpportunityLine(boot),
        formatCompanyGridTechLine(boot),
        formatCompanyGridOpportunityLine(boot),
        formatCompanyGridDispatchTechLine(boot),
        formatCompanyGridDispatchOpportunityLine(boot),
        formatCompanyEcoTechLine(boot),
        formatCompanyEcoOpportunityLine(boot),
        formatCompanyGreenBrandOpportunityLine(boot),
        formatCompanyStrategicTechLine(boot),
        formatCompanyStrategicOpportunityLine(boot),
        selectedLoan,
        selection.candidates.length > 1
          ? t("hud.status.company_loan_candidate_count", { count: selection.candidates.length })
          : loanPart
      );
  return { statusLine, detailLine: detailLines.join(" · "), statusLines, detailLines };
}

function formatRegionStatus(boot: GameBootstrap): ClientHudDisplay {
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const s = boot.app.screens.region(regionId).getSnapshot();
  const building = s.gridLinks.filter((l) => l.status === "building").length;
  const finished = s.gridLinks.filter((l) => l.status === "finished").length;
  const unlockedCities = s.cities.filter((c) => c.unlocked).length;
  const availableCandidates = s.linkCandidates.filter((candidate) => candidate.available).length;
  const selectedLink = formatSelectedRegionLink(boot);
  const selectedLinkAction = formatSelectedRegionLinkAction(boot);
  const statusLine = t("hud.status.region", {
    level: s.companyLevel,
    funds: s.funds,
    cities: unlockedCities
  });
  const detailLine = t("hud.status.region_links", {
    building,
    finished,
    month: s.month
  });
  const statusLines = hudLines(
    t("hud.line.region_header", { level: s.companyLevel, region: s.regionName }),
    t("hud.line.cities_unlocked", { cities: unlockedCities }),
    t("hud.line.region_candidates", { count: availableCandidates })
  );
  const detailLines = hudLines(
    t("hud.line.month", { month: s.month }),
    t("hud.line.region_profile", {
      demand: s.totalDemandMw,
      local: s.totalLocalSupplyMw,
      import: s.totalNetImportMw,
      gap: s.supplyGapMw,
      slots: s.totalBuildSlots,
      river: s.riverCityCount,
      nuclear: s.nuclearEligibleCityCount,
      sv: s.totalBaseSocialValue,
      resources: formatRichResources(s.richResources),
      builds: formatRecommendedBuilds(s.recommendedBuilds),
      pressure: formatOperatingPressureTags(s.operatingPressureTags)
    }),
    formatOperatingPressureBreakdown({
      supplyGapMw: s.supplyGapMw,
      totalDemandMw: s.totalDemandMw,
      totalBuildSlots: s.totalBuildSlots,
      operatingPressureTags: s.operatingPressureTags
    }),
    formatOperatingPressureTechSolutions(boot, s.operatingPressureTags),
    t("hud.line.region_plan", { plan: formatOperatingPlanHints(s.operatingPlanHints) }),
    t("hud.line.region_role", { role: formatRegionDesignRole(s.designRole) }),
    t("hud.line.region_links", { building, finished }),
    selectedLink,
    selectedLinkAction
  );
  return { statusLine, detailLine, statusLines, detailLines };
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

function formatWorldConnectionStatus(region: WorldMapRegionItem): string {
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

function formatWorldStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.world.getSnapshot();
  const selection = getWorldHudSelectionSnapshot(boot);
  const selectedTarget = formatSelectedWorldCandidate(boot);
  const selectedCandidate = selection.candidates.find(
    (candidate) => candidate.candidateId === selection.selectedCandidateId
  );
  const selectedRegion = selectedCandidate
    ? s.regions.find((region) => region.regionId === selectedCandidate.regionId)
    : null;
  const focusRegion =
    selectedRegion ??
    s.regions.find((region) => region.unlocked && region.connectionStatus !== "capital" && region.connectionStatus !== "planned") ??
    s.regions.find((region) => region.unlocked && region.connectionStatus === "planned") ??
    s.regions.find((region) => !region.unlocked) ??
    s.regions[0];
  const statusLine = t("hud.status.world", {
    level: s.companyLevel,
    funds: s.funds,
    unlocked: s.unlockedRegions,
    total: s.totalRegions
  });
  const statusLines = hudLines(
    t("hud.line.world_header", { level: s.companyLevel }),
    t("hud.line.world_regions", { unlocked: s.unlockedRegions, total: s.totalRegions }),
    t("hud.line.world_trunks", { connected: s.connectedTrunks, building: s.buildingTrunks })
  );
  const detailLines = hudLines(
    s.nextUnlockRegion
      ? t("hud.status.world_next_unlock", {
          region: s.nextUnlockRegion.displayName,
          level: s.nextUnlockRegion.unlockCompanyLevel
        })
      : t("hud.status.world_all_unlocked"),
    focusRegion
      ? t("hud.status.world_region_detail", {
          region: focusRegion.displayName,
          state: focusRegion.unlocked ? t("hud.world.region_state.unlocked") : t("hud.world.region_state.locked"),
          cities: focusRegion.unlockedCities,
          totalCities: focusRegion.totalCities,
          demand: focusRegion.totalDemandMw,
          local: focusRegion.totalLocalSupplyMw,
          import: focusRegion.totalNetImportMw,
          supply: focusRegion.totalEffectiveSupplyMw,
          gap: focusRegion.supplyGapMw,
          slots: focusRegion.totalBuildSlots,
          river: focusRegion.riverCityCount,
          nuclear: focusRegion.nuclearEligibleCityCount,
          ratio: Math.round(focusRegion.supplyRatio * 100),
          sv: focusRegion.totalBaseSocialValue,
          role: formatRegionDesignRole(focusRegion.designRole),
          resources: formatRichResources(focusRegion.richResources),
          builds: formatRecommendedBuilds(focusRegion.recommendedBuilds),
          pressure: formatOperatingPressureTags(focusRegion.operatingPressureTags),
          plan: formatOperatingPlanHints(focusRegion.operatingPlanHints),
          trunk: formatWorldConnectionStatus(focusRegion)
        })
      : null,
    focusRegion
      ? formatOperatingPressureBreakdown({
          supplyGapMw: focusRegion.supplyGapMw,
          totalDemandMw: focusRegion.totalDemandMw,
          totalBuildSlots: focusRegion.totalBuildSlots,
          operatingPressureTags: focusRegion.operatingPressureTags
        })
      : null,
    focusRegion ? formatOperatingPressureTechSolutions(boot, focusRegion.operatingPressureTags) : null,
    formatWorldSuperHydroStatus(boot),
    formatWorldSuperHydroGridPressure(boot),
    formatSelectedWorldSuperHydroSlot(boot),
    selectedTarget,
    formatSelectedWorldTrunkCandidate(boot),
    formatSelectedWorldTrunkAction(boot),
    selection.candidates.length > 1 ? t("hud.status.world_candidate_count", { count: selection.candidates.length }) : null
  );
  return {
    statusLine,
    detailLine: detailLines.join(" 路 "),
    statusLines,
    detailLines
  };
}

function formatTechStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.tech.getSnapshot();
  if (!s.canOpen) {
    const statusLine = t("hud.status.tech_locked", { level: s.companyLevel });
    const detailLine = t("hud.status.tech_locked_hint");
    return {
      statusLine,
      detailLine,
      statusLines: hudLines(statusLine),
      detailLines: hudLines(detailLine)
    };
  }
  const statusLine = t("hud.status.tech_header", { lit: s.litTechIds.length });
  const statusLines = hudLines(
    t("hud.line.tech_header", { lit: s.litTechIds.length }),
    t("hud.line.tech_researchable", { count: s.researchableTechIds.length })
  );
  if (s.activeResearch) {
    const activeLine = formatActiveResearchCandidate(boot);
    const detailLine = activeLine ?? t("hud.status.tech_active_hint", {
      techId: s.activeResearch.techId,
      months: s.activeResearch.monthsRemaining
    });
    const branchSummary = formatTechProgressionSummary(boot);
    const researchableBranchSummary = formatResearchableTechBranchSummary(boot);
    const pressureSummary = formatResearchableTechPressureSummary(boot);
    const pressureReason = formatActiveResearchPressureReason(boot);
    const detailLines = hudLines(
      activeLine,
      activeLine ? null : t("hud.line.research_active", {
        techId: s.activeResearch.techId,
        months: s.activeResearch.monthsRemaining
      }),
      branchSummary,
      researchableBranchSummary,
      pressureSummary,
      pressureReason
    );
    return { statusLine, detailLine, statusLines, detailLines };
  }
  const selection = getTechHudSelectionSnapshot(boot);
  const selectedLine = formatSelectedResearchCandidate(boot);
  const pressureReason = formatSelectedResearchPressureReason(boot);
  const branchSummary = formatTechProgressionSummary(boot);
  const researchableBranchSummary = formatResearchableTechBranchSummary(boot);
  const pressureSummary = formatResearchableTechPressureSummary(boot);
  const detailLine = selectedLine ?? t("hud.status.tech_no_candidate_hint");
  return {
    statusLine,
    detailLine,
    statusLines,
    detailLines: hudLines(
      selection.candidates.length > 0 ? t("hud.status.tech_idle_hint") : null,
      branchSummary,
      researchableBranchSummary,
      pressureSummary,
      pressureReason,
      detailLine
    )
  };
}

function formatRunResultStatus(boot: GameBootstrap): ClientHudDisplay {
  const snapshot = boot.app.screens.runResult.getSnapshot();
  if (!snapshot) {
    const fallback = formatNavHint(boot);
    return {
      statusLine: fallback,
      detailLine: fallback,
      statusLines: hudLines(fallback),
      detailLines: hudLines(fallback)
    };
  }
  const statusLine = t("hud.status.run_result", {
    result: t(`run_result.${snapshot.runResult}`),
    month: snapshot.month
  });
  const detailLines = hudLines(
    t("hud.status.run_result_core", {
      level: snapshot.companyLevel,
      funds: snapshot.funds,
      sv: snapshot.socialValue,
      disasters: snapshot.disastersTriggeredCount
    }),
    t("hud.status.run_result_terminal", {
      metb: snapshot.terminalRoute.metBConnected
        ? t("hud.result.state.connected")
        : snapshot.terminalRoute.metBUnlocked
          ? t("hud.result.state.unconnected")
          : t("hud.result.state.locked"),
      hydro: snapshot.terminalRoute.superHydroConnectedOutputMw,
      total: snapshot.terminalRoute.superHydroTotalOutputMw,
      gap: snapshot.terminalRoute.metBSupplyGapMw ?? 0
    }),
    t("hud.status.run_result_final_disaster", {
      state: snapshot.finalDisasterTriggered
        ? t("hud.result.state.triggered")
        : t("hud.result.state.pending")
    })
  );
  return {
    statusLine,
    detailLine: detailLines.join(" · "),
    statusLines: hudLines(statusLine),
    detailLines
  };
}

export function formatNavHint(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const stack = boot.play.getNavigation().stack.length;
  return t("hud.nav.hint", { screen: tScreenLabel(view.screen), stack });
}

/** 主副两行文案，避免单行过长顶出屏幕。 */
export function buildClientHudDisplay(
  boot: GameBootstrap,
  actionMessage: string | null = null
): ClientHudDisplay {
  const screen = boot.play.getNavigation().currentScreen;
  let display: ClientHudDisplay;
  if (screen === "screen_company") {
    display = formatCompanyStatus(boot);
  } else if (screen === "screen_region") {
    display = formatRegionStatus(boot);
  } else if (screen === "screen_world_map") {
    display = formatWorldStatus(boot);
  } else if (screen === "screen_tech_tree") {
    display = formatTechStatus(boot);
  } else if (screen === "screen_run_result") {
    display = formatRunResultStatus(boot);
  } else {
    const view = readCityHudViewModel(boot);
    const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
    const buildSelection = getCityHudBuildSelectionSnapshot(boot);
    const selectedBuild = formatSelectedBuildCandidate(boot);
    const profile = getCityHudProfileSnapshot(boot);
    const eventsHint = formatEventsHudHint(boot);
    const pending = formatPendingEventModalLines(boot);
    const statusLine = formatCityStatus(boot);
    const statusLines = hudLines(
      t("hud.line.month", { month: view.month }),
      t("hud.line.funds", { funds: view.funds }),
      t("hud.line.city", { city })
    );
    const detailLines = hudLines(
      profile
        ? t("hud.line.city_profile", {
            demand: profile.demandMw,
            local: profile.localSupplyMw,
            import: profile.effectiveSupplyMw - profile.localSupplyMw,
            supply: profile.effectiveSupplyMw,
            gap: profile.supplyGapMw,
            ratio: Math.round(profile.supplyRatio * 100),
            eco: formatCityEcoStatus(profile),
            slots: profile.buildSlots,
            river: profile.hasRiver ? 1 : 0,
            nuclear: profile.nuclearEligible ? 1 : 0,
            role: formatCityPowerRole(profile.powerRole),
            resources: formatRichResources(profile.richResources),
            pressure: formatOperatingPressureTags(profile.operatingPressureTags)
          })
        : null,
      selectedBuild,
      buildSelection.candidates.length > 1
        ? t("hud.status.city_build_candidate_count", { count: buildSelection.candidates.length })
        : null,
      profile
        ? formatOperatingPressureBreakdown({
            supplyGapMw: profile.supplyGapMw,
            totalDemandMw: profile.demandMw,
            totalBuildSlots: profile.buildSlots,
            operatingPressureTags: profile.operatingPressureTags
          })
        : null,
      profile ? formatOperatingPressureTechSolutions(boot, profile.operatingPressureTags) : null,
      profile ? formatCityBuildAction(profile) : null,
      t("hud.line.nav_screen", { screen: tScreenLabel(view.screen) }),
      t("hud.line.nav_stack", { stack: boot.play.getNavigation().stack.length }),
      formatDisasterAxisProgressLine(boot),
      eventsHint,
      formatActiveEventPressureLine(boot),
      formatActiveEventRecoveryActionLine(boot),
      formatUpcomingEventPrepActionLine(boot),
      formatUpcomingEventRiskLine(boot),
      formatUpcomingEventRiskOpportunityLine(boot),
      pending?.summary
    );
    display = {
      statusLine,
      detailLine: firstLine(detailLines, formatNavHint(boot)),
      statusLines,
      detailLines
    };
  }

  if (
    screen === "screen_company" ||
    screen === "screen_region" ||
    screen === "screen_world_map" ||
    screen === "screen_tech_tree" ||
    screen === "screen_run_result"
  ) {
    display.detailLines = hudLines(...display.detailLines, actionMessage);
    display.detailLine = display.detailLines.join(" · ");
  } else if (actionMessage) {
    display.detailLines = hudLines(...display.detailLines, actionMessage);
    display.detailLine = display.detailLines.join(" · ");
  }

  if (!display.statusLines?.length) {
    display.statusLines = hudLines(display.statusLine);
  }
  if (!display.detailLines?.length) {
    display.detailLines = hudLines(display.detailLine);
  }

  return display;
}
