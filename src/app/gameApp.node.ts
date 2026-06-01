import path from "node:path";
import { loadConfigRepoFromVerticalSlice } from "../sim/config/configRepo.node.js";
import { createGameApp, type GameAppContext, type GameAppOptions } from "./gameApp.js";

/** Node / CLI：从仓库根目录加载配置后创建 GameApp。 */
export function createGameAppFromRepo(options: GameAppOptions = {}): GameAppContext {
  const configRepo =
    options.configRepo ??
    loadConfigRepoFromVerticalSlice(path.resolve(options.repoRoot ?? process.cwd()));
  return createGameApp({ ...options, configRepo });
}
