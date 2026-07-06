import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface TechScreenViewModel {
  active: boolean;
  title: string;
  detail: string;
  hasActiveResearch: boolean;
  canStartResearch: boolean;
  canCancelResearch: boolean;
  canSpeedupResearchByAd: boolean;
  canCycleResearchCandidate: boolean;
}

export function readTechScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): TechScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_tech_tree") {
    return {
      active: false,
      title: "",
      detail: "",
      hasActiveResearch: false,
      canStartResearch: false,
      canCancelResearch: false,
      canSpeedupResearchByAd: false,
      canCycleResearchCandidate: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  const hasActiveResearch = !!boot.app.screens.tech.getSnapshot().activeResearch;
  return {
    active: true,
    title: display.statusLines.join("    "),
    detail: display.detailLines.slice(0, 5).join("\n"),
    hasActiveResearch,
    canStartResearch: caps.canStartResearch,
    canCancelResearch: caps.canCancelResearch,
    canSpeedupResearchByAd: caps.canSpeedupResearchByAd,
    canCycleResearchCandidate: caps.canCycleResearchCandidate
  };
}
