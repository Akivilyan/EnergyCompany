import path from "node:path";
import { fileURLToPath } from "node:url";
import { createControllerFromRepoRoot } from "../../src/modules/runController.node.js";
import { loadConfigRepoFromVerticalSlice } from "../../src/sim/config/configRepo.node.js";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function loadTestConfig() {
  return loadConfigRepoFromVerticalSlice(repoRoot);
}

export function createTestController(
  ...args: Parameters<typeof createControllerFromRepoRoot>
) {
  return createControllerFromRepoRoot(...args);
}
