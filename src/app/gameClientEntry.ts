import type { ConfigRepo } from "../sim/index.js";
import type { SceneHost } from "../ui/sceneHost.js";
import { createGameBootstrap, type GameBootstrap } from "./gameBootstrap.js";

export interface GameClientMountOptions {
  configRepo: ConfigRepo;
  sceneHost?: SceneHost;
}

/** Cocos / 小游戏侧挂载入口：注入已加载的 ConfigRepo，避免引擎环境读盘。 */
export function mountGameClient(options: GameClientMountOptions): GameBootstrap {
  return createGameBootstrap({
    configRepo: options.configRepo,
    sceneHost: options.sceneHost
  });
}
