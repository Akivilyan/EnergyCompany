import type { GameBootstrap } from "../gameBootstrap.js";
import {
  formatSelectedWorldCandidate,
  formatSelectedWorldSuperHydroSlot,
  formatSelectedWorldTrunkAction,
  formatSelectedWorldTrunkCandidate,
  formatWorldSuperHydroGridPressure,
  formatWorldSuperHydroStatus,
  getWorldHudSelectionSnapshot
} from "../worldHudController.js";
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
  formatWorldConnectionStatus,
  hudLines
} from "./shared.js";

export function buildWorldHudDisplay(boot: GameBootstrap): ClientHudDisplay {
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
