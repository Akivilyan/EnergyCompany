import { director } from "cc";
import type { SceneHost } from "../shared/src/ui/sceneHost";
import type { ScreenId } from "../shared/src/ui/types";

export class CocosSceneHost implements SceneHost {
  private current: string | null = null;

  getCurrentScene(): string | null {
    return this.current;
  }

  loadScene(sceneName: string, _screenId: ScreenId): void {
    this.current = sceneName;
    director.loadScene(sceneName);
  }
}
