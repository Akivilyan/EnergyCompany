import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { repoRoot } from "../helpers/testRepo.js";
import { runCocosHudCloseStaticChecks } from "../../src/app/cocosHudCloseCheck.js";
import { runCocosHudClose } from "../../src/app/cocosHudCloseRunner.js";

describe("cocosHudCloseCheck", () => {
  const panelMarkers =
    "onOpenCompany onOpenRegion onOpenTech onAckEvent onQueueRegionLink onQueueSuperHydroGrid worldQueueSuperHydroGridLink drawCityBackground drawCityFacilities drawCityGrid drawCityState drawGridLine bindGameBoot";
  const stageSpecMarkers =
    "CITY_HUD_STAGE_LAYER_NAMES CITY_HUD_STAGE_SHELL_ORDER CITY_HUD_STAGE_VISUAL_ORDER CITY_HUD_STAGE_ASSET_SLOTS CITY_HUD_STAGE_STATE_TOKENS CityVisualLayer CityBackgroundLayer CityFacilityLayer CityGridLayer CityStateLayer CityUiLayer CityIconLayer StageAssetWindTurbine StageAssetSolarField StageAssetHydroPlant CITY_HUD_STAGE_UI_SLOTS CITY_HUD_STAGE_ACTION_SLOTS CITY_HUD_STAGE_INTERACTION_TOKENS CITY_HUD_STAGE_ICON_SLOTS StageUiResourceBar StageUiCityStateCard StageUiPrimaryBuildButton StageActionCycleBuild StageActionAdvanceMonth StageActionQueueRegionLink StageActionQueueSuperHydroGrid StageNavCompany StageNavBack city-stage:action-primary city-stage:action-reward StageIconCash StageIconSocialValue StageIconCleanliness city-stage:low-cleanliness";

  function writeStaticHudFixtures(scriptsDir: string): void {
    fs.writeFileSync(
      path.join(scriptsDir, "CityHudPanel.ts"),
      `${panelMarkers} ./cityHudStageSpec CITY_HUD_STAGE_ASSET_SLOTS CITY_HUD_STAGE_UI_SLOTS CITY_HUD_STAGE_ACTION_SLOTS CITY_HUD_STAGE_ICON_SLOTS CITY_HUD_STAGE_INTERACTION_TOKENS syncButtonStateTokens resolveButtonRoleToken resolveButtonFill CITY_HUD_STAGE_INTERACTION_TOKENS.active CITY_HUD_STAGE_INTERACTION_TOKENS.hidden applyStageLayerOrder CITY_HUD_STAGE_SHELL_ORDER CITY_HUD_STAGE_VISUAL_ORDER setSiblingIndex`,
      "utf8"
    );
    fs.writeFileSync(path.join(scriptsDir, "cityHudStageSpec.ts"), stageSpecMarkers, "utf8");
  }

  it("CityHudPanel contains T50 handler markers", () => {
    const checks = runCocosHudCloseStaticChecks(repoRoot);
    expect(checks.every((item) => item.ok)).toBe(true);
  });

  it("reports half-built WeChat packages with missing startup modules", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "energy-company-wechat-build-"));
    const scriptsDir = path.join(tempRoot, "client", "cocos", "assets", "scripts");
    const buildRoot = path.join(tempRoot, "client", "cocos", "build", "wechatgame");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(path.join(buildRoot, "src"), { recursive: true });
    writeStaticHudFixtures(scriptsDir);
    fs.writeFileSync(
      path.join(buildRoot, "game.js"),
      "require('./web-adapter'); require('src/polyfills.bundle.js'); require(\"src/import-map.js\");",
      "utf8"
    );
    fs.writeFileSync(path.join(buildRoot, "web-adapter.js"), "", "utf8");
    fs.writeFileSync(path.join(buildRoot, "src", "import-map.js"), "", "utf8");

    const missing = runCocosHudCloseStaticChecks(tempRoot, {
      withWechatBuildFreshness: true
    }).find((item) => item.id === "wechat-build:startup-modules");
    expect(missing?.ok).toBe(false);
    expect(missing?.detail).toContain("src/polyfills.bundle.js");

    fs.writeFileSync(path.join(buildRoot, "src", "polyfills.bundle.js"), "", "utf8");
    const complete = runCocosHudCloseStaticChecks(tempRoot, {
      withWechatBuildFreshness: true
    }).find((item) => item.id === "wechat-build:startup-modules");
    expect(complete?.ok).toBe(true);
  });

  it("reports terminated Cocos build-script from the latest WeChat build log", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "energy-company-wechat-log-"));
    const scriptsDir = path.join(tempRoot, "client", "cocos", "assets", "scripts");
    const buildRoot = path.join(tempRoot, "client", "cocos", "build", "wechatgame");
    const logDir = path.join(tempRoot, "client", "cocos", "temp", "builder", "log");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(buildRoot, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    writeStaticHudFixtures(scriptsDir);
    fs.writeFileSync(path.join(buildRoot, "game.js"), "require('./web-adapter');", "utf8");

    const failedLog = path.join(logDir, "wechatgame2026-6-18 13-11.log");
    fs.writeFileSync(
      failedLog,
      "Error: Exit process with code:null, signal:SIGTERM in task build-script",
      "utf8"
    );
    const failed = runCocosHudCloseStaticChecks(tempRoot, {
      withWechatBuildFreshness: true
    }).find((item) => item.id === "wechat-build:last-build-log");
    expect(failed?.ok).toBe(false);
    expect(failed?.detail).toContain("SIGTERM");

    const okLog = path.join(logDir, "wechatgame2026-6-18 13-20.log");
    fs.writeFileSync(okLog, "build success", "utf8");
    const now = new Date(Date.now() + 1000);
    fs.utimesSync(okLog, now, now);
    const passed = runCocosHudCloseStaticChecks(tempRoot, {
      withWechatBuildFreshness: true
    }).find((item) => item.id === "wechat-build:last-build-log");
    expect(passed?.ok).toBe(true);
  });

  it("ignores stale terminated build logs when the WeChat package was deleted", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "energy-company-stale-log-"));
    const scriptsDir = path.join(tempRoot, "client", "cocos", "assets", "scripts");
    const logDir = path.join(tempRoot, "client", "cocos", "temp", "builder", "log");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    writeStaticHudFixtures(scriptsDir);
    fs.writeFileSync(
      path.join(logDir, "wechatgame2026-6-18 13-11.log"),
      "Error: Exit process with code:null, signal:SIGTERM in task build-script",
      "utf8"
    );

    const check = runCocosHudCloseStaticChecks(tempRoot, {
      withWechatBuildFreshness: true
    }).find((item) => item.id === "wechat-build:last-build-log");
    expect(check?.ok).toBe(true);
    expect(check?.detail).toContain("wechat build not present");
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
