import { director } from "cc";
import { isBuiltScene, type SceneHost, type ScreenId } from "../shared/game-client.mjs";

export class CocosSceneHost implements SceneHost {
  getCurrentScene(): string | null {
    return director.getScene()?.name ?? null;
  }

  loadScene(sceneName: string, _screenId: ScreenId): void {
    if (!isBuiltScene(sceneName)) {
      return;
    }
    const activeSceneName = director.getScene()?.name;
    if (activeSceneName === sceneName) {
      return;
    }
    director.loadScene(sceneName, (err) => {
      if (err) {
        console.warn(`[CocosSceneHost] loadScene failed: ${sceneName}`, err);
      }
    });
  }
}
