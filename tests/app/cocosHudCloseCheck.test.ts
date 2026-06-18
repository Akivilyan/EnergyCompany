import { describe, expect, it } from "vitest";
import { repoRoot } from "../helpers/testRepo.js";
import { runCocosHudCloseStaticChecks } from "../../src/app/cocosHudCloseCheck.js";
import { runCocosHudClose } from "../../src/app/cocosHudCloseRunner.js";

describe("cocosHudCloseCheck", () => {
  it("CityHudPanel contains T50 handler markers", () => {
    const checks = runCocosHudCloseStaticChecks(repoRoot);
    expect(checks.every((item) => item.ok)).toBe(true);
  });

  it("keeps pending disaster modal across hide and remount", () => {
    const result = runCocosHudClose(repoRoot, {
      withPersistence: true,
      withInitPreflight: true
    });

    expect(result.staticChecks.every((item) => item.ok)).toBe(true);
    expect(result.smokeSteps.every((item) => item.ok)).toBe(true);
    expect(result.persistenceOk).toBe(true);
    expect(result.eventResumeOk).toBe(true);
    expect(result.eventResumeDetail).toContain("seq=1");
  });
});
