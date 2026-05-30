import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadConfigRepoFromJsonDir } from "../../src/app/loadConfigRecords.js";
import { buildConfigBundle, configRepoFromBundle } from "../../src/sim/config/configBundle.js";
import { ConfigRepo } from "../../src/sim/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sliceDir = path.join(repoRoot, "docs", "design", "data", "vertical-slice-v0");

describe("buildConfigBundle", () => {
  it("fromBundle matches loadFromConfigDir for vertical slice", () => {
    const fromDir = ConfigRepo.loadFromConfigDir(sliceDir);
    const fromBundle = configRepoFromBundle(buildConfigBundle(fromDir.bundle));
    expect(fromBundle.bundle.cities.length).toBe(fromDir.bundle.cities.length);
    expect(fromBundle.bundle.runConfig.campaign_run_target_months).toBe(
      fromDir.bundle.runConfig.campaign_run_target_months
    );
  });

  it("loadConfigRepoFromJsonDir matches vertical slice records", () => {
    const fromRecords = loadConfigRepoFromJsonDir(sliceDir);
    const fromSlice = ConfigRepo.loadFromVerticalSlice(repoRoot);
    expect(fromRecords.bundle.facilities.length).toBe(fromSlice.bundle.facilities.length);
  });
});
