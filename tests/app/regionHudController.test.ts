import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { clientNavOpenRegion } from "../../src/app/screenNavController.js";
import { regionQueueDefaultLink } from "../../src/app/regionHudController.js";
import { techEnsureLevelIIForDev } from "../../src/app/techHudController.js";

describe("regionHudController", () => {
  it("blocks default link at company level I", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenRegion(boot);
    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(false);
    expect(out.errorCode).toBe("not_unlocked");
    expect(out.messageKey).toBe("region.error.not_unlocked");
  });

  it("queues default region link at company level II", () => {
    const boot = createGameBootstrapFromRepo();
    const level = techEnsureLevelIIForDev(boot);
    expect(level.ok).toBe(true);
    clientNavOpenRegion(boot);
    const out = regionQueueDefaultLink(boot);
    expect(out.ok).toBe(true);
    const links = boot.app.screens.region.getSnapshot().gridLinks;
    expect(links.some((l) => l.fromCityId === "CITY-START" && l.toCityId === "CITY-MAP01-02")).toBe(
      true
    );
  });
});
