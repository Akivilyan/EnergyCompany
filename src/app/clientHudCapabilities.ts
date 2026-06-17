import type { GameBootstrap } from "./gameBootstrap.js";

export interface ClientHudCapabilities {
  canQueueRegionLink: boolean;
  canOperateTech: boolean;
}

/**
 * 开发 HUD 的按钮能力必须和当前规则状态一致，避免真机上出现
 * “画面提示未解锁，但按钮仍可点”的误导性反馈。
 */
export function getClientHudCapabilities(boot: GameBootstrap): ClientHudCapabilities {
  const region = boot.app.screens.region.getSnapshot();
  const tech = boot.app.screens.tech.getSnapshot();
  const unlockedCities = region.cities.filter((city) => city.unlocked).length;
  return {
    canQueueRegionLink: unlockedCities >= 2,
    canOperateTech: tech.canOpen
  };
}
