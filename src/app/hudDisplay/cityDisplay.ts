import type { GameBootstrap } from "../gameBootstrap.js";
import { readCityHudViewModel } from "../cityHudController.js";
import {
  formatSelectedBuildCandidate,
  getCityHudBuildSelectionSnapshot
} from "../cityHudController.js";
import {
  formatActiveEventRecoveryActionLine,
  formatActiveEventPressureLine,
  formatDisasterAxisProgressLine,
  formatEventsHudHint,
  formatPendingEventModalLines,
  formatUpcomingEventPrepActionLine,
  formatUpcomingEventRiskOpportunityLine,
  formatUpcomingEventRiskLine
} from "../eventsHudController.js";
import { t, tScreenLabel } from "../../i18n/index.js";
import type { ClientHudDisplay } from "./types.js";
import {
  firstLine,
  formatCityBuildAction,
  formatCityEcoStatus,
  formatCityPowerRole,
  formatCityStatus,
  formatNavHint,
  formatOperatingPressureBreakdown,
  formatOperatingPressureTags,
  formatOperatingPressureTechSolutions,
  formatRichResources,
  hudLines,
  readCityProfile
} from "./shared.js";

export function buildCityHudDisplay(boot: GameBootstrap): ClientHudDisplay {
  const view = readCityHudViewModel(boot);
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  const buildSelection = getCityHudBuildSelectionSnapshot(boot);
  const selectedBuild = formatSelectedBuildCandidate(boot);
  const profile = readCityProfile(boot);
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
  return {
    statusLine,
    detailLine: firstLine(detailLines, formatNavHint(boot)),
    statusLines,
    detailLines
  };
}
