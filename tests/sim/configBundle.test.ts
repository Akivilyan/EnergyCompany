import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadConfigRepoFromJsonDir } from "../../src/app/loadConfigRecords.js";
import { buildConfigBundle, configRepoFromBundle } from "../../src/sim/config/configBundle.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";

const sliceDir = path.join(repoRoot, "docs", "design", "data", "vertical-slice-v0");

describe("buildConfigBundle", () => {
  it("fromBundle matches loadFromConfigDir for vertical slice", () => {
    const fromDir = loadConfigRepoFromConfigDir(sliceDir);
    const fromBundle = configRepoFromBundle(buildConfigBundle(fromDir.bundle));
    expect(fromBundle.bundle.regions.length).toBe(fromDir.bundle.regions.length);
    expect(fromBundle.bundle.cities.length).toBe(fromDir.bundle.cities.length);
    expect(fromBundle.bundle.runConfig.campaign_run_target_months).toBe(
      fromDir.bundle.runConfig.campaign_run_target_months
    );
  });

  it("loadConfigRepoFromJsonDir matches vertical slice records", () => {
    const fromRecords = loadConfigRepoFromJsonDir(sliceDir);
    const fromSlice = loadTestConfig();
    expect(fromRecords.bundle.facilities.length).toBe(fromSlice.bundle.facilities.length);
    expect(fromRecords.bundle.technologies.length).toBe(fromSlice.bundle.technologies.length);
  });

  it("keeps storage tech effects aligned with design docs", () => {
    const config = loadTestConfig();
    const storage1 = config.getTechnology("storage_system_1");
    const storage2 = config.getTechnology("storage_system_2");
    const storage3 = config.getTechnology("storage_system_3");

    expect(storage1?.effect_type).toBe("storage_buff");
    expect(storage1?.effect_value.storage_mult).toBe(2);
    expect(storage2?.effect_type).toBe("storage_gate");
    expect(storage2?.effect_value.storage_mult).toBeUndefined();
    expect(storage3?.effect_type).toBe("storage_gate");
    expect(storage3?.effect_value.storage_mult).toBeUndefined();
  });
});
