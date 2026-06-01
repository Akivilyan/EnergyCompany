import path from "node:path";
import { loadConfigRepoFromVerticalSlice } from "../sim/config/configRepo.node.js";
import { createGameBootstrap, type GameBootstrap, type GameBootstrapOptions } from "./gameBootstrap.js";

/** Node / CLI：从仓库根目录加载配置后创建 GameBootstrap。 */
export function createGameBootstrapFromRepo(
  options: GameBootstrapOptions = {}
): GameBootstrap {
  const configRepo =
    options.configRepo ??
    loadConfigRepoFromVerticalSlice(path.resolve(options.repoRoot ?? process.cwd()));
  return createGameBootstrap({ ...options, configRepo });
}
