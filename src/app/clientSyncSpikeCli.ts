#!/usr/bin/env node
/**
 * Cocos client 资源同步与挂载冒烟（T49）：
 * build:client -> 校验 config/shared -> mountGameClient 跑最小动作
 *
 * 用法：
 *   npm run sim:client-sync-spike
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { resolveClientConfigDir, resolveClientSharedDir } from "./clientPaths.js";
import { mountGameClient } from "./gameClientEntry.js";
import { ConfigRepo } from "../sim/index.js";
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

const config = ConfigRepo.loadFromConfigDir(configDir);
const host = new LoggingSceneHost();
const { app, play } = mountGameClient({ configRepo: config, sceneHost: host });

console.log("=== Energy Company client sync spike ===");
console.log(`config: cities=${config.bundle.cities.length}, shared=${path.relative(repoRoot, sharedDir)}`);

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

console.log(
  `play: month=${app.controller.state.currentMonth}, funds=${app.controller.state.funds}, scene=${host.getCurrentScene()}`
);
console.log(`manifest: ${path.relative(repoRoot, manifestPath)}`);
console.log(`shared entry: ${path.relative(repoRoot, sharedEntry)}`);
