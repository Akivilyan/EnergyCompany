import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGameApp } from "../../src/app/gameApp.js";
import { createGameSceneBridge } from "../../src/ui/gameSceneBridge.js";
import { createGameShell } from "../../src/ui/gameShell.js";
import { SCREEN_SCENE_MAP } from "../../src/ui/sceneMap.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("GameSceneBridge", () => {
  it("loads CityDetail on startup", () => {
    const host = new LoggingSceneHost();
    createGameSceneBridge(createGameShell(createGameApp({ repoRoot })), host);
    expect(host.getCurrentScene()).toBe(SCREEN_SCENE_MAP.screen_city_detail);
    expect(host.history).toHaveLength(1);
  });

  it("maps navigation to cocos scene names", () => {
    const host = new LoggingSceneHost();
    const bridge = createGameSceneBridge(createGameShell(createGameApp({ repoRoot })), host);
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
