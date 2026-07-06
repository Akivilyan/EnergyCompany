import type { GameBootstrap } from "../gameBootstrap.js";
import { formatSelectedRegionLink, formatSelectedRegionLinkAction } from "../regionHudController.js";
import { t } from "../../i18n/index.js";
import type { ClientHudDisplay } from "./types.js";
import {
  formatOperatingPlanHints,
  formatOperatingPressureBreakdown,
  formatOperatingPressureTags,
  formatOperatingPressureTechSolutions,
  formatRecommendedBuilds,
  formatRegionDesignRole,
  formatRichResources,
  hudLines
} from "./shared.js";

export function buildRegionHudDisplay(boot: GameBootstrap): ClientHudDisplay {
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
