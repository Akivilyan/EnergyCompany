import type { GameBootstrap } from "./gameBootstrap.js";

export interface ClientHudCapabilities {
  canQueueRegionLink: boolean;
  canCycleRegionLink: boolean;
  canOperateTech: boolean;
  canBuildInCity: boolean;
  canCycleBuildCandidate: boolean;
}

/**
 * 开发 HUD 的按钮能力必须和当前规则状态一致，避免真机上出现
 * “画面提示未解锁，但按钮仍可点”的误导性反馈。
 */
export function getClientHudCapabilities(boot: GameBootstrap): ClientHudCapabilities {
  const region = boot.app.screens.region.getSnapshot();
  const tech = boot.app.screens.tech.getSnapshot();
  const cityId = boot.play.getNavigation().cityId ?? "CITY-START";
  const city = boot.app.screens.city(cityId).getSnapshot();
  const availableRegionCandidates = region.linkCandidates.filter((candidate) => candidate.unlocked);
  return {
    canQueueRegionLink: availableRegionCandidates.some((candidate) => candidate.available),
    canCycleRegionLink: availableRegionCandidates.length > 0,
    canOperateTech: tech.canOpen,
    canBuildInCity: city !== null && boot.app.controller.state.constructionQueue.length < 3,
    canCycleBuildCandidate: city !== null
  };
}
