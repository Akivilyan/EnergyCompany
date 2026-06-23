import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import {
  formatSelectedBuildCandidate,
  getCityHudBuildSelectionSnapshot
} from "./cityHudController.js";
import { formatEventsHudHint, formatPendingEventModalLines } from "./eventsHudController.js";
import { formatSelectedResearchCandidate, getTechHudSelectionSnapshot } from "./techHudController.js";
import { formatSelectedRegionLink } from "./regionHudController.js";
import { formatSelectedLoanCandidate, getCompanyHudSelectionSnapshot } from "./companyHudController.js";
import {
  formatSelectedWorldCandidate,
  formatWorldSuperHydroStatus,
  getWorldHudSelectionSnapshot
} from "./worldHudController.js";
import { t, tScreenLabel } from "../i18n/index.js";
import type { ResourceKind } from "../modules/screenWorldMap.js";

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
  }
}

function formatRichResources(resources: ResourceKind[]): string {
  return resources.length > 0
    ? resources.map(formatResourceKind).join("/")
    : t("resource.none");
}

function nextCompanyLevelThreshold(boot: GameBootstrap, companyLevel: number): number | null {
  const row = boot.app.controller.config.bundle.companyLevels.find(
    (item) => item.level === companyLevel + 1
  );
  return row?.sv_threshold ?? null;
}

function formatCompanyStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.company.getSnapshot();
  const selection = getCompanyHudSelectionSnapshot(boot);
  const selectedLoan = formatSelectedLoanCandidate(boot);
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
    ? hudLines(svLine, loanPart)
    : hudLines(
        svLine,
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
      sv: s.totalBaseSocialValue,
      resources: formatRichResources(s.richResources)
    }),
    t("hud.line.region_links", { building, finished }),
    selectedLink
  );
  return { statusLine, detailLine, statusLines, detailLines };
}

function formatWorldConnectionStatus(status: string): string {
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

function formatWorldStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.world.getSnapshot();
  const selection = getWorldHudSelectionSnapshot(boot);
  const selectedTarget = formatSelectedWorldCandidate(boot);
  const focusRegion =
    s.regions.find(
      (region) => region.unlocked && region.connectionStatus !== "capital" && region.connectionStatus !== "planned"
    ) ??
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
          sv: focusRegion.totalBaseSocialValue,
          resources: formatRichResources(focusRegion.richResources),
          trunk: formatWorldConnectionStatus(focusRegion.connectionStatus)
        })
      : null,
    formatWorldSuperHydroStatus(boot),
    selectedTarget,
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
    const detailLine = t("hud.status.tech_active_hint", {
      techId: s.activeResearch.techId,
      months: s.activeResearch.monthsRemaining
    });
    const detailLines = hudLines(
      t("hud.line.research_active", {
        techId: s.activeResearch.techId,
        months: s.activeResearch.monthsRemaining
      })
    );
    return { statusLine, detailLine, statusLines, detailLines };
  }
  const selection = getTechHudSelectionSnapshot(boot);
  const selectedLine = formatSelectedResearchCandidate(boot);
  const detailLine = selectedLine ?? t("hud.status.tech_no_candidate_hint");
  return {
    statusLine,
    detailLine,
    statusLines,
    detailLines: hudLines(
      selection.candidates.length > 0 ? t("hud.status.tech_idle_hint") : null,
      detailLine
    )
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
  } else {
    const view = readCityHudViewModel(boot);
    const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
    const buildSelection = getCityHudBuildSelectionSnapshot(boot);
    const selectedBuild = formatSelectedBuildCandidate(boot);
    const eventsHint = formatEventsHudHint(boot);
    const pending = formatPendingEventModalLines(boot);
    const statusLine = formatCityStatus(boot);
    const statusLines = hudLines(
      t("hud.line.month", { month: view.month }),
      t("hud.line.funds", { funds: view.funds }),
      t("hud.line.city", { city })
    );
    const detailLines = hudLines(
      selectedBuild,
      buildSelection.candidates.length > 1
        ? t("hud.status.city_build_candidate_count", { count: buildSelection.candidates.length })
        : null,
      t("hud.line.nav_screen", { screen: tScreenLabel(view.screen) }),
      t("hud.line.nav_stack", { stack: boot.play.getNavigation().stack.length }),
      eventsHint,
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
    screen === "screen_tech_tree"
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
