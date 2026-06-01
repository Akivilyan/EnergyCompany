import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  formatCityHudStatus,
  readCityHudViewModel
} from "../../src/app/cityHudController.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import {
  clearMountedGameClient,
  getMountedGameClient,
  onGameClientMounted,
  setMountedGameClient
} from "../../src/app/gameClientRegistry.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


describe("cityHudController", () => {
  it("reads view model from mounted bootstrap", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, sceneHost: new LoggingSceneHost(), autoResumeSlot: false });
    const view = readCityHudViewModel(boot);
    expect(view.month).toBe(1);
    expect(view.funds).toBeGreaterThan(0);
    expect(view.cityId).toBe("CITY-START");
    expect(view.screen).toBe("screen_city_detail");
    expect(formatCityHudStatus(view)).toContain("M1");
  });

  it("builds wind and advances month through play surface", () => {
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const build = cityHudBuildWind(boot);
    expect(build.ok).toBe(true);
    expect(build.view.funds).toBeLessThan(140);

    const advance = cityHudAdvanceMonth(boot);
    expect(advance.ok).toBe(true);
    expect(advance.monthFrom).toBe(1);
    expect(advance.monthTo).toBe(2);
    expect(advance.view.month).toBe(2);
  });
});

describe("gameClientRegistry", () => {
  it("notifies mount listeners and supports lookup", () => {
    clearMountedGameClient();
    const config = loadTestConfig();
    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false });
    const seen: number[] = [];
    const unbind = onGameClientMounted(() => {
      seen.push(1);
    });

    setMountedGameClient(boot);
    expect(getMountedGameClient()).toBe(boot);
    expect(seen).toEqual([1]);

    unbind();
    clearMountedGameClient();
    expect(getMountedGameClient()).toBeNull();
  });
});
