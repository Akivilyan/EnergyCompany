#!/usr/bin/env node
/**
 * T50-CLOSE：开发 HUD 验收（静态 + 运行时冒烟，无需 Cocos 编辑器）。
 *
 * 用法：
 *   npm run sim:cocos-hud-close
 */
import { runCocosHudClose } from "./cocosHudCloseRunner.js";

const repoRoot = process.cwd();

console.log("=== Energy Company cocos HUD close (T50) ===");

let result;
try {
  result = runCocosHudClose(repoRoot, {
    withPersistence: false,
    withInitPreflight: true
  });
} catch (error) {
  console.log(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

for (const item of result.staticChecks) {
  console.log(`[${item.ok ? "OK" : "MISS"}] ${item.id} | ${item.detail}`);
}
for (const item of result.smokeSteps) {
  console.log(`[${item.ok ? "OK" : "FAIL"}] ${item.id} | ${item.detail}`);
}

const failedStatic = result.staticChecks.filter((item) => !item.ok);
const failedSmoke = result.smokeSteps.filter((item) => !item.ok);
console.log("---");
console.log(
  `T50 HUD close: static=${result.staticChecks.length - failedStatic.length}/${result.staticChecks.length}, smoke=${result.smokeSteps.length - failedSmoke.length}/${result.smokeSteps.length}`
);
if (failedStatic.length > 0 || failedSmoke.length > 0) {
  process.exit(1);
}
