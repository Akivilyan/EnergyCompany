import { describe, expect, it } from "vitest";
import { repoRoot } from "../helpers/testRepo.js";
import { runCocosHudCloseStaticChecks } from "../../src/app/cocosHudCloseCheck.js";

describe("cocosHudCloseCheck", () => {
  it("CityHudPanel contains T50 handler markers", () => {
    const checks = runCocosHudCloseStaticChecks(repoRoot);
    expect(checks.every((item) => item.ok)).toBe(true);
  });
});
