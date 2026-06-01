#!/usr/bin/env node
/**
 * Cocos client 资源同步与挂载冒烟（T49）：
 * build:client -> 校验 config/shared -> 经 JSON 记录挂载 mountGameClient
 *
 * 用法：
 *   npm run sim:client-sync-spike
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { resolveClientConfigDir, resolveClientSharedDir } from "./clientPaths.js";
import {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  formatCityHudStatus,
  readCityHudViewModel
} from "./cityHudController.js";
import { clientNavBack, clientNavOpenCompany, formatClientNavHint } from "./screenNavController.js";
import { mountGameClient } from "./gameClientEntry.js";
import { loadConfigRepoFromJsonDir } from "./loadConfigRecords.js";
import type { WxHideLifecyclePort } from "../infra/lifecycle/wxLifecycle.js";
import { InMemoryStateStorage } from "../infra/storage/stateStorage.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

class FakeWxHideLifecycle implements WxHideLifecyclePort {
  private listeners: Array<() => void> = [];

  onHide(listener: () => void): void {
    this.listeners.push(listener);
  }

  offHide(listener: () => void): void {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  triggerHide(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const repoRoot = process.cwd();
const sharedDir = resolveClientSharedDir(repoRoot);
const configDir = resolveClientConfigDir(repoRoot);
const manifestPath = path.join(repoRoot, "client", "cocos", "sync-manifest.json");
const sharedEntry = path.join(sharedDir, "src", "app", "gameClientEntry.ts");

if (!fs.existsSync(manifestPath) || !fs.existsSync(sharedEntry)) {
  console.log("client assets missing, running build:client...");
  execSync("npm run build:client", { stdio: "inherit", cwd: repoRoot });
}

if (!fs.existsSync(configDir)) {
  console.log(`config dir missing: ${configDir}`);
  process.exit(1);
}

const config = loadConfigRepoFromJsonDir(configDir);
const storage = new InMemoryStateStorage();
const host = new LoggingSceneHost();
const lifecycle = new FakeWxHideLifecycle();
const boot1 = mountGameClient({
  configRepo: config,
  sceneHost: host,
  stateStorage: storage,
  autoResumeSlot: false,
  wxLifecycle: lifecycle
});
const { app } = boot1;

console.log("=== Energy Company client sync spike ===");
console.log(`config: cities=${config.bundle.cities.length}, source=json-records, shared=${path.relative(repoRoot, sharedDir)}`);
console.log(`hud: ${formatCityHudStatus(readCityHudViewModel(boot1))}`);

const build = cityHudBuildWind(boot1);
if (!build.ok) {
  console.log(`build failed: ${build.errorCode ?? "unknown"}`);
  process.exit(1);
}
const month = cityHudAdvanceMonth(boot1);
if (!month.ok) {
  console.log(`advance failed: ${month.errorCode ?? "unknown"}`);
  process.exit(1);
}
console.log(`hud-after-play: ${formatCityHudStatus(month.view)}`);

const company = clientNavOpenCompany(boot1);
console.log(`nav-company: ${formatClientNavHint(company.view, company.navigation.stack.length)}`);
const back = clientNavBack(boot1);
console.log(`nav-back: ${formatClientNavHint(back.view, back.navigation.stack.length)}`);

const savedMonth = app.controller.state.currentMonth;
const savedFunds = app.controller.state.funds;
if (!boot1.clientAutoSave?.bound) {
  console.log("auto-save on hide was not bound");
  process.exit(1);
}
lifecycle.triggerHide();
boot1.clientAutoSave.unbind();

const boot2 = mountGameClient({
  configRepo: config,
  sceneHost: host,
  stateStorage: storage,
  wxLifecycle: lifecycle
});
if (!boot2.clientResume?.resumed) {
  console.log("auto-resume failed on remount");
  process.exit(1);
}
if (
  boot2.app.controller.state.currentMonth !== savedMonth ||
  boot2.app.controller.state.funds !== savedFunds
) {
  console.log("auto-resume did not restore saved run state");
  process.exit(1);
}

console.log(
  `play: month=${boot2.app.controller.state.currentMonth}, funds=${boot2.app.controller.state.funds}, scene=${host.getCurrentScene()}, resume=${boot2.clientResume.slotId}, hide-save=${boot1.clientAutoSave.slotId}`
);
console.log(`manifest: ${path.relative(repoRoot, manifestPath)}`);
