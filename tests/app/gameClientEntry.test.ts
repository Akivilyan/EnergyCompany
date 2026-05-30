import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("mountGameClient", () => {
  it("bootstraps from injected config repo", () => {
    const config = ConfigRepo.loadFromVerticalSlice(repoRoot);
    const host = new LoggingSceneHost();
    const boot = mountGameClient({ configRepo: config, sceneHost: host });
    expect(boot.bridge).not.toBeNull();
    expect(boot.play.getNavigation().currentScreen).toBe("screen_city_detail");
    expect(host.getCurrentScene()).toBe("CityDetail");
  });
});
