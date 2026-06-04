#!/usr/bin/env node
/**
 * Cocos client hide 存档与 remount 恢复（T49-05），在 T50 HUD 冒烟之后执行。
 *
 * 用法：
 *   npm run sim:client-sync-spike
 */
import { runCocosHudClose } from "./cocosHudCloseRunner.js";

const repoRoot = process.cwd();

console.log("=== Energy Company client sync spike (persistence) ===");

const result = runCocosHudClose(repoRoot, {
  withPersistence: true,
  withInitPreflight: false
});

for (const item of result.smokeSteps) {
  if (!item.ok) {
    console.log(`hud smoke failed: ${item.id} ${item.detail}`);
    process.exit(1);
  }
}

console.log(
  `[${result.persistenceOk ? "OK" : "FAIL"}] t49-persistence | ${result.persistenceDetail}`
);
if (!result.persistenceOk) {
  process.exit(1);
}
