/**
 * Cocos Creator 侧 SceneHost 实现示例。
 * 复制到 Cocos 工程的 assets/scripts，将 loadScene 替换为 director.loadScene。
 * screenId 枚举与场景名映射见仓库根目录 client/cocos/scene-registry.json。
 */
export type ScreenId = string;

export interface SceneHost {
  getCurrentScene(): string | null;
  loadScene(sceneName: string, screenId: ScreenId): void;
}

export class CocosSceneHost implements SceneHost {
  private current: string | null = null;

  getCurrentScene(): string | null {
    return this.current;
  }

  loadScene(sceneName: string, _screenId: ScreenId): void {
    this.current = sceneName;
    // Cocos: director.loadScene(sceneName);
  }
}
