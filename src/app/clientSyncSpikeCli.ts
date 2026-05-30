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
import { persistClientRun, mountGameClient } from "./gameClientEntry.js";
import { loadConfigRepoFromJsonDir } from "./loadConfigRecords.js";
import { InMemoryStateStorage } from "../infra/storage/stateStorage.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

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
const boot1 = mountGameClient({
  configRepo: config,
  sceneHost: host,
  stateStorage: storage,
  autoResumeSlot: false
});
const { app, play } = boot1;

console.log("=== Energy Company client sync spike ===");
console.log(`config: cities=${config.bundle.cities.length}, source=json-records, shared=${path.relative(repoRoot, sharedDir)}`);

const build = play.buildInCurrentCity("wind", 1);
if (!build.ok) {
  console.log(`build failed: ${build.errorCode ?? "unknown"}`);
  process.exit(1);
}
const month = play.advanceMonthInCurrentCity();
if (!month.ok) {
  console.log(`advance failed: ${month.errorCode ?? "unknown"}`);
  process.exit(1);
}

const savedMonth = app.controller.state.currentMonth;
const savedFunds = app.controller.state.funds;
const save = persistClientRun(play);
if (!save.ok) {
  console.log(`save failed: ${save.errorCode ?? "unknown"}`);
  process.exit(1);
}

const boot2 = mountGameClient({
  configRepo: config,
  sceneHost: host,
  stateStorage: storage
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
  `play: month=${boot2.app.controller.state.currentMonth}, funds=${boot2.app.controller.state.funds}, scene=${host.getCurrentScene()}, resume=${boot2.clientResume.slotId}`
);
console.log(`manifest: ${path.relative(repoRoot, manifestPath)}`);
