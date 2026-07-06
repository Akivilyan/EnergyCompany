import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface WorldScreenViewModel {
  active: boolean;
  title: string;
  detail: string;
  canOpenTarget: boolean;
  canCycleTarget: boolean;
  canQueueTrunk: boolean;
  canQueueSuperHydro: boolean;
  canQueueSuperHydroGrid: boolean;
}

export function readWorldScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): WorldScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_world_map") {
    return {
      active: false,
      title: "",
      detail: "",
      canOpenTarget: false,
      canCycleTarget: false,
      canQueueTrunk: false,
      canQueueSuperHydro: false,
      canQueueSuperHydroGrid: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  return {
    active: true,
    title: display.statusLines.join("    "),
    detail: display.detailLines.slice(0, 5).join("\n"),
    canOpenTarget: caps.canOpenWorldTarget,
    canCycleTarget: caps.canCycleWorldTarget,
    canQueueTrunk: caps.canQueueWorldTrunk,
    canQueueSuperHydro: caps.canQueueSuperHydro,
    canQueueSuperHydroGrid: caps.canQueueSuperHydroGridLink
  };
}
