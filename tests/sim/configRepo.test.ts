import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";

const sliceDir = path.join(repoRoot, "docs", "design", "data", "vertical-slice-v0");

describe("loadConfigRepoFromConfigDir", () => {
  it("matches vertical slice bundle when given the same directory", () => {
    const fromRepo = loadTestConfig();
    const fromDir = loadConfigRepoFromConfigDir(sliceDir);
    expect(fromDir.bundle.cities.length).toBe(fromRepo.bundle.cities.length);
    expect(fromDir.bundle.runConfig.campaign_run_target_months).toBe(
      fromRepo.bundle.runConfig.campaign_run_target_months
    );
  });
});
