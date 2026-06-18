import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { repoRoot } from "../helpers/testRepo.js";
import { runCocosHudCloseStaticChecks } from "../../src/app/cocosHudCloseCheck.js";
import { runCocosHudClose } from "../../src/app/cocosHudCloseRunner.js";

describe("cocosHudCloseCheck", () => {
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
    fs.writeFileSync(
      path.join(scriptsDir, "CityHudPanel.ts"),
      "onOpenCompany onOpenRegion onOpenTech onAckEvent onQueueRegionLink bindGameBoot",
      "utf8"
    );
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
