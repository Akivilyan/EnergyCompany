import type { GameBootstrap } from "../gameBootstrap.js";
import { t } from "../../i18n/index.js";
import type { RunResultRouteSummaryToken } from "../../modules/screenRunResult.js";
import type { ClientHudDisplay } from "./types.js";
import { formatNavHint, hudLines } from "./shared.js";

function formatRunResultRouteSummaryLines(tokens: RunResultRouteSummaryToken[]): string[] {
  return tokens.map((token) => t(`hud.result.summary.${token}`));
}

export function buildRunResultHudDisplay(boot: GameBootstrap): ClientHudDisplay {
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
  const routeSummaryLines = formatRunResultRouteSummaryLines(snapshot.routeSummaryTokens);
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
    }),
    ...routeSummaryLines
  );
  return {
    statusLine,
    detailLine: detailLines.join(" · "),
    statusLines: hudLines(statusLine),
    detailLines
  };
}
