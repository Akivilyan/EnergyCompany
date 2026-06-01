import { loadConfigRepoFromVerticalSlice } from "../sim/config/configRepo.node.js";
import type { ConfigRepo } from "../sim/config/configRepo.js";
import {
  createController,
  type ControllerInitOptions,
  type RunController
} from "./runController.js";

/** Node / CLI：从仓库根目录加载配置并创建控制器。 */
export function createControllerFromRepoRoot(
  repoRoot = process.cwd(),
  options: ControllerInitOptions = {}
): RunController {
  const config: ConfigRepo =
    options.configRepo ?? loadConfigRepoFromVerticalSlice(repoRoot);
  return createController(config, options);
}
