#!/usr/bin/env node
/**
 * Cocos 场景占位接入预研冒烟（T48-05）：
 * GameShell 导航 -> SceneHost 场景名映射 -> 轨迹输出
 *
 * 用法：
 *   npm run sim:cocos-scene-spike
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createGameBootstrap } from "./gameBootstrap.js";
import { buildSceneRegistry } from "../ui/sceneMap.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "client", "cocos", "scene-registry.json");

const host = new LoggingSceneHost();
const { play } = createGameBootstrap({ repoRoot, sceneHost: host });

console.log("=== Energy Company cocos scene spike ===");
console.log(`start: scene=${host.getCurrentScene()}, screen=${play.getNavigation().currentScreen}`);

play.buildInCurrentCity("wind", 1);
play.advanceMonthInCurrentCity();
play.openScreen("screen_company");
play.back();
play.openScreen("screen_tech_tree");
play.back();

const history = host.history.map((item) => `${item.screenId}->${item.sceneName}`).join(", ");
console.log(`transitions: ${history}`);
console.log(`final: scene=${host.getCurrentScene()}, stack=${play.getNavigation().stack.length}`);

mkdirSync(path.dirname(registryPath), { recursive: true });
writeFileSync(registryPath, `${JSON.stringify({ version: 1, scenes: buildSceneRegistry() }, null, 2)}\n`, "utf8");
console.log(`registry: wrote ${path.relative(repoRoot, registryPath)}`);
