import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { getClientHudCapabilities } from "../../src/app/clientHudCapabilities.js";

describe("getClientHudCapabilities", () => {
  it("hides locked region-link and tech actions at level 1", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    expect(boot.app.controller.state.companyLevel).toBe(1);
    expect(getClientHudCapabilities(boot)).toEqual({
      canQueueRegionLink: false,
      canOperateTech: false
    });
  });

  it("unlocks region-link and tech actions after company level 2", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot: process.cwd() });

    boot.play.buildInCurrentCity("wind", 1);
    boot.play.buildInCurrentCity("wind", 1);
    for (let i = 0; i < 2; i += 1) {
      boot.play.advanceMonthInCurrentCity();
    }

    expect(boot.app.controller.state.companyLevel).toBeGreaterThanOrEqual(2);
    expect(getClientHudCapabilities(boot)).toEqual({
      canQueueRegionLink: true,
      canOperateTech: true
    });
  });
});
