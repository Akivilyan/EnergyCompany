import { isBuiltScene, resolveSceneName } from "./sceneMap.js";
import type { ScreenId } from "./types.js";

export interface SceneTransition {
  sceneName: string;
  screenId: ScreenId;
}

/** 引擎场景加载端口：Cocos 实机实现 `director.loadScene`，Node 侧用 stub 记录轨迹。 */
export interface SceneHost {
  getCurrentScene(): string | null;
  loadScene(sceneName: string, screenId: ScreenId): void;
}

export class LoggingSceneHost implements SceneHost {
  readonly history: SceneTransition[] = [];
  private current: string | null = null;

  getCurrentScene(): string | null {
    return this.current;
  }

  loadScene(sceneName: string, screenId: ScreenId): void {
    this.current = sceneName;
    this.history.push({ sceneName, screenId });
  }
}

export function syncSceneHost(host: SceneHost, screenId: ScreenId): void {
  const sceneName = resolveSceneName(screenId);
  if (!isBuiltScene(sceneName)) {
    return;
  }
  host.loadScene(sceneName, screenId);
}
