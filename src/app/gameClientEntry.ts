import { createClientStateStorage } from "../infra/storage/wxStateStorage.js";
import type { StateStorage } from "../infra/storage/stateStorage.js";
import type { ConfigRepo } from "../sim/index.js";
import type { SceneHost } from "../ui/sceneHost.js";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  tryResumeClientRun,
  type ClientResumeResult
} from "./clientPersistence.js";
import { createGameBootstrap, type GameBootstrap } from "./gameBootstrap.js";

export type { ClientResumeResult } from "./clientPersistence.js";
export { DEFAULT_CLIENT_RUN_SLOT, persistClientRun, tryResumeClientRun } from "./clientPersistence.js";

export interface GameClientMountOptions {
  configRepo: ConfigRepo;
  sceneHost?: SceneHost;
  /** 默认微信 wx 本地存储；Node 冒烟无 wx 时回退内存。 */
  stateStorage?: StateStorage;
  /** 挂载后自动读档；默认 `slot-main`；传 `false` 关闭。 */
  autoResumeSlot?: string | false;
}

/** Cocos / 小游戏侧挂载入口：注入已加载的 ConfigRepo，避免引擎环境读盘。 */
export function mountGameClient(options: GameClientMountOptions): GameBootstrap {
  const boot = createGameBootstrap({
    configRepo: options.configRepo,
    sceneHost: options.sceneHost,
    stateStorage: createClientStateStorage(options.stateStorage)
  });
  const resumeSlot =
    options.autoResumeSlot === false
      ? null
      : (options.autoResumeSlot ?? DEFAULT_CLIENT_RUN_SLOT);
  if (resumeSlot) {
    boot.clientResume = tryResumeClientRun(boot.play, resumeSlot);
  }
  return boot;
}
