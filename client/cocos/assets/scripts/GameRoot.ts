import { director, _decorator, Component } from "cc";
import { mountGameClient } from "../shared/src/app/gameClientEntry";
import { CocosSceneHost } from "./CocosSceneHost";
import { loadConfigFromResources } from "./loadConfigFromResources";

const { ccclass } = _decorator;

/** Cocos 主场景挂载点：从 resources 异步加载 config 后挂载 GameClient。 */
@ccclass("GameRoot")
export class GameRoot extends Component {
  private mounted = false;
  private unbindAutoSave: (() => void) | null = null;

  onLoad(): void {
    void this.mountGame();
  }

  onDestroy(): void {
    this.unbindAutoSave?.();
    this.unbindAutoSave = null;
  }

  private async mountGame(): Promise<void> {
    if (this.mounted) return;
    const sceneHost = new CocosSceneHost();
    try {
      const configRepo = await loadConfigFromResources();
      const boot = mountGameClient({ configRepo, sceneHost });
      this.mounted = true;
      this.unbindAutoSave = boot.clientAutoSave?.unbind ?? null;
      const resume = boot.clientResume;
      const autoSaveLabel = boot.clientAutoSave?.bound ? `autosave=${boot.clientAutoSave.slotId}` : "autosave=off";
      const resumeLabel = resume
        ? resume.resumed
          ? `resumed slot=${resume.slotId} month=${boot.app.controller.state.currentMonth}`
          : `fresh slot=${resume.slotId}`
        : "resume=off";
      console.log(
        `[GameRoot] mounted screen=${boot.play.getNavigation().currentScreen}, scene=${sceneHost.getCurrentScene()}, ${resumeLabel}, ${autoSaveLabel}`
      );
      director.addPersistRootNode(this.node);
    } catch (error) {
      console.error("[GameRoot] config load failed", error);
    }
  }
}
