import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ConfigRepo } from "../../src/sim/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sliceDir = path.join(repoRoot, "docs", "design", "data", "vertical-slice-v0");

describe("ConfigRepo.loadFromConfigDir", () => {
  it("matches vertical slice bundle when given the same directory", () => {
    const fromRepo = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const fromDir = ConfigRepo.loadFromConfigDir(sliceDir);
    expect(fromDir.bundle.cities.length).toBe(fromRepo.bundle.cities.length);
    expect(fromDir.bundle.runConfig.campaign_run_target_months).toBe(
      fromRepo.bundle.runConfig.campaign_run_target_months
    );
  });
});
