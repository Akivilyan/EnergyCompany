import { createGameSceneBridge, type GameSceneBridge } from "../ui/gameSceneBridge.js";
import { createGameShell, type GameShell } from "../ui/gameShell.js";
import type { SceneHost } from "../ui/sceneHost.js";
import type { ClientResumeResult } from "./clientPersistence.js";
import type { ClientAutoSaveBinding } from "./clientLifecycle.js";
import { createGameApp, type GameAppContext, type GameAppOptions } from "./gameApp.js";

export type { GameAppContext, GameAppOptions } from "./gameApp.js";

export interface GameBootstrapOptions extends GameAppOptions {
  sceneHost?: SceneHost;
}

export interface GameBootstrap {
  app: GameAppContext;
  shell: GameShell;
  bridge: GameSceneBridge | null;
  /** 无 SceneHost 时为 shell；接入 Cocos 时为 bridge。 */
  play: GameShell | GameSceneBridge;
  /** 客户端挂载时尝试读档的结果；未启用 autoResume 时为 undefined。 */
  clientResume?: ClientResumeResult;
  /** wx.onHide 自动存档绑定；未启用 autoSaveOnHide 时为 undefined。 */
  clientAutoSave?: ClientAutoSaveBinding;
}

export function createGameBootstrap(options: GameBootstrapOptions = {}): GameBootstrap {
  if (!options.configRepo) {
    throw new Error(
      "createGameBootstrap requires configRepo (use createGameBootstrapFromRepo in Node CLIs)"
    );
  }
  const app = createGameApp(options);
  const shell = createGameShell(app);
  const bridge = options.sceneHost ? createGameSceneBridge(shell, options.sceneHost) : null;
  return {
    app,
    shell,
    bridge,
    play: bridge ?? shell
  };
}
