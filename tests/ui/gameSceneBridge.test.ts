import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGameAppFromRepo } from "../../src/app/gameApp.node.js";
import { createGameSceneBridge } from "../../src/ui/gameSceneBridge.js";
import { createGameShell } from "../../src/ui/gameShell.js";
import { SCREEN_SCENE_MAP } from "../../src/ui/sceneMap.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";


describe("GameSceneBridge", () => {
  it("loads CityDetail on startup", () => {
    const host = new LoggingSceneHost();
    createGameSceneBridge(createGameShell(createGameAppFromRepo({ repoRoot })), host);
    expect(host.getCurrentScene()).toBe(SCREEN_SCENE_MAP.screen_city_detail);
    expect(host.history).toHaveLength(1);
  });

  it("maps navigation to cocos scene names", () => {
    const host = new LoggingSceneHost();
    const bridge = createGameSceneBridge(createGameShell(createGameAppFromRepo({ repoRoot })), host);
    bridge.openScreen("screen_company");
    expect(host.getCurrentScene()).toBe(SCREEN_SCENE_MAP.screen_company);
    bridge.back();
    expect(host.getCurrentScene()).toBe(SCREEN_SCENE_MAP.screen_city_detail);
  });

  it("covers every screen id in scene map", () => {
    expect(Object.keys(SCREEN_SCENE_MAP)).toEqual([
      "screen_main_menu",
      "screen_city_detail",
      "screen_region",
      "screen_world_map",
      "screen_company",
      "screen_tech_tree",
      "screen_run_result"
    ]);
  });
});
