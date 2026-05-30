import { director, _decorator, Component } from "cc";
import { mountGameClient } from "../shared/src/app/gameClientEntry";
import { CocosSceneHost } from "./CocosSceneHost";
import { loadConfigFromResources } from "./loadConfigFromResources";

const { ccclass } = _decorator;

/** Cocos 主场景挂载点：从 resources 异步加载 config 后挂载 GameClient。 */
@ccclass("GameRoot")
export class GameRoot extends Component {
  private mounted = false;

  onLoad(): void {
    void this.mountGame();
  }

  private async mountGame(): Promise<void> {
    if (this.mounted) return;
    const sceneHost = new CocosSceneHost();
    try {
      const configRepo = await loadConfigFromResources();
      const boot = mountGameClient({ configRepo, sceneHost });
      this.mounted = true;
      console.log(
        `[GameRoot] mounted screen=${boot.play.getNavigation().currentScreen}, scene=${sceneHost.getCurrentScene()}`
      );
      director.addPersistRootNode(this.node);
    } catch (error) {
      console.error("[GameRoot] config load failed", error);
    }
  }
}
