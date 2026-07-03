#!/usr/bin/env node
/**
 * Cocos scene spike smoke (T48-05):
 * GameShell navigation -> SceneHost scene mapping -> registry output.
 *
 * Usage:
 *   npm run sim:cocos-scene-spike
 */
import fs from "node:fs";
import path from "node:path";
import { createGameBootstrapFromRepo } from "./gameBootstrap.node.js";
import { buildSceneRegistry } from "../ui/sceneMap.js";
import { LoggingSceneHost } from "../ui/sceneHost.js";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "client", "cocos", "scene-registry.json");

function readBuiltSceneNames(): string[] {
  if (!fs.existsSync(registryPath)) return [];
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as {
      builtSceneNames?: unknown;
    };
    return Array.isArray(registry.builtSceneNames)
      ? registry.builtSceneNames.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

const host = new LoggingSceneHost();
const { play } = createGameBootstrapFromRepo({ repoRoot, sceneHost: host });

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

fs.mkdirSync(path.dirname(registryPath), { recursive: true });
fs.writeFileSync(
  registryPath,
  `${JSON.stringify(
    { version: 1, builtSceneNames: readBuiltSceneNames(), scenes: buildSceneRegistry() },
    null,
    2
  )}\n`,
  "utf8"
);
console.log(`registry: wrote ${path.relative(repoRoot, registryPath)}`);
