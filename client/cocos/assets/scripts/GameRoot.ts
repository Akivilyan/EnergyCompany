import { director, _decorator, Component } from "cc";
import { mountGameClient } from "../shared/src/app/gameClientEntry";
import { ConfigRepo } from "../shared/src/sim/config/configRepo";
import { CocosSceneHost } from "./CocosSceneHost";

const { ccclass } = _decorator;

/**
 * Cocos 主场景挂载点：加载 config 资源后挂载 GameClient。
 * v0 占位：config 仍由 build:client 同步到 resources/config/v0，实机读资源待 T49-02。
 */
@ccclass("GameRoot")
export class GameRoot extends Component {
  onLoad(): void {
    const sceneHost = new CocosSceneHost();
    // TODO(T49-02): 从 resources 异步加载 JSON 后 ConfigRepo.fromBundle
    const config = ConfigRepo.loadFromConfigDir("assets/resources/config/v0");
    const boot = mountGameClient({ configRepo: config, sceneHost });
    console.log(
      `[GameRoot] mounted screen=${boot.play.getNavigation().currentScreen}, scene=${sceneHost.getCurrentScene()}`
    );
    director.addPersistRootNode(this.node);
  }
}
