import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface RegionScreenViewModel {
  active: boolean;
  title: string;
  detail: string;
  canQueueLink: boolean;
  canCancelLink: boolean;
  canCycleLink: boolean;
}

export function readRegionScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): RegionScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_region") {
    return {
      active: false,
      title: "",
      detail: "",
      canQueueLink: false,
      canCancelLink: false,
      canCycleLink: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  return {
    active: true,
    title: display.statusLines.join("    "),
    detail: display.detailLines.slice(0, 5).join("\n"),
    canQueueLink: caps.canQueueRegionLink,
    canCancelLink: caps.canCancelRegionLink,
    canCycleLink: caps.canCycleRegionLink
  };
}
