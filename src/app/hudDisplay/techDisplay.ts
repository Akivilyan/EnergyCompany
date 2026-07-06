import type { GameBootstrap } from "../gameBootstrap.js";
import {
  formatActiveResearchCandidate,
  formatActiveResearchPressureReason,
  formatResearchableTechPressureSummary,
  formatResearchableTechBranchSummary,
  formatSelectedResearchPressureReason,
  formatSelectedResearchCandidate,
  formatTechProgressionSummary,
  getTechHudSelectionSnapshot
} from "../techHudController.js";
import { t } from "../../i18n/index.js";
import type { ClientHudDisplay } from "./types.js";
import { hudLines } from "./shared.js";

export function buildTechHudDisplay(boot: GameBootstrap): ClientHudDisplay {
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
