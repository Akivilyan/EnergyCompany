import { log, error as logError, _decorator, Component } from "cc";
import {
  clearMountedGameClient,
  ensureChineseDefaultForDev,
  mountGameClient,
  setMountedGameClient,
  type GameBootstrap
} from "../shared/game-client.mjs";
import { CocosSceneHost } from "./CocosSceneHost";
import { CityHudPanel } from "./CityHudPanel";
import { loadConfigFromResources } from "./loadConfigFromResources";

const { ccclass } = _decorator;

/** 浏览器 F12 可见；`cc.log` 默认只进 Cocos 编辑器 Console。 */
function trace(tag: string, detail?: string): void {
  const line = detail ? `[${tag}] ${detail}` : `[${tag}]`;
  log(line);
  console.warn(line);
}

/** Cocos 主场景挂载点：从 resources 异步加载 config 后挂载 GameClient。 */
@ccclass("GameRoot")
export class GameRoot extends Component {
  /** 供 CityHudPanel 读取；避免 Cocos 预览里 game-client.mjs 被重复实例化导致 registry 失联。 */
  gameBoot: GameBootstrap | null = null;
  private mounted = false;
  private unbindAutoSave: (() => void) | null = null;

  onLoad(): void {
    ensureChineseDefaultForDev();
    trace("GameRoot", `onLoad node=${this.node.name}, parent=${this.node.parent?.name ?? "none"}`);
    // 先挂上 HUD（占位文案），配置异步加载完后再 refresh
    if (!this.getComponent(CityHudPanel)) {
      this.node.addComponent(CityHudPanel);
    }
    void this.mountGame();
  }

  onDestroy(): void {
    this.unbindAutoSave?.();
    this.unbindAutoSave = null;
    this.gameBoot = null;
    clearMountedGameClient();
  }

  private async mountGame(): Promise<void> {
    if (this.mounted) return;
    const sceneHost = new CocosSceneHost();
    try {
      const configRepo = await loadConfigFromResources();
      const boot = mountGameClient({ configRepo, sceneHost });
      this.gameBoot = boot;
      setMountedGameClient(boot);
      this.getComponent(CityHudPanel)?.bindGameBoot(boot);
      this.mounted = true;
      this.unbindAutoSave = boot.clientAutoSave?.unbind ?? null;
      const resume = boot.clientResume;
      const autoSaveLabel = boot.clientAutoSave?.bound ? `autosave=${boot.clientAutoSave.slotId}` : "autosave=off";
      const resumeLabel = resume
        ? resume.resumed
          ? `resumed slot=${resume.slotId} month=${boot.app.controller.state.currentMonth}`
          : `fresh slot=${resume.slotId}`
        : "resume=off";
      trace(
        "GameRoot",
        `mounted screen=${boot.play.getNavigation().currentScreen}, scene=${sceneHost.getCurrentScene()}, ${resumeLabel}, ${autoSaveLabel}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError("[GameRoot] config load failed", err);
      console.error("[GameRoot] config load failed", err);
      this.getComponent(CityHudPanel)?.showMountError(message);
    }
  }
}
