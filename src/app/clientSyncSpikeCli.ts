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
import { loadConfigRepoFromJsonDir } from "./loadConfigRecords.js";
import { mountGameClient } from "./gameClientEntry.js";
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
const host = new LoggingSceneHost();
const { app, play } = mountGameClient({ configRepo: config, sceneHost: host });

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

const fundsBeforeSave = app.controller.state.funds;
const save = app.persistence.save("client-spike");
if (!save.ok) {
  console.log(`save failed: ${save.error}`);
  process.exit(1);
}
app.controller.state.funds = -1;
const load = app.persistence.load("client-spike");
if (!load.ok) {
  console.log(`load failed: ${load.error}`);
  process.exit(1);
}
if (app.controller.state.funds !== fundsBeforeSave) {
  console.log("load did not restore saved funds");
  process.exit(1);
}

console.log(
  `play: month=${app.controller.state.currentMonth}, funds=${app.controller.state.funds}, scene=${host.getCurrentScene()}`
);
console.log(`manifest: ${path.relative(repoRoot, manifestPath)}`);
