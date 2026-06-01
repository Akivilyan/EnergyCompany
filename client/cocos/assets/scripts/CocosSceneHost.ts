import { director } from "cc";
import type { SceneHost, ScreenId } from "../shared/game-client.mjs";

export class CocosSceneHost implements SceneHost {
  private current: string | null = null;

  getCurrentScene(): string | null {
    return this.current;
  }

  loadScene(sceneName: string, _screenId: ScreenId): void {
    this.current = sceneName;
    const activeSceneName = director.getScene()?.name;
    if (activeSceneName === sceneName) {
      return;
    }
    director.loadScene(sceneName, (err) => {
      if (err) {
        console.warn(
          `[CocosSceneHost] scene asset missing: ${sceneName}; keeping current view (logical screen still updated)`
        );
      }
    });
  }
}
