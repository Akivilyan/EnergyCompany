import { createGameSceneBridge, type GameSceneBridge } from "../ui/gameSceneBridge.js";
import { createGameShell, type GameShell } from "../ui/gameShell.js";
import type { SceneHost } from "../ui/sceneHost.js";
import type { ClientResumeResult } from "./clientPersistence.js";
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
}

export function createGameBootstrap(options: GameBootstrapOptions = {}): GameBootstrap {
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
