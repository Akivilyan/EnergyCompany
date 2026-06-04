#!/usr/bin/env node
/**
 * 日常客户端验收（build + 预检 + T50 HUD + T49 存档恢复），无需打开 Cocos。
 *
 * 用法：
 *   npm run verify:client
 */
import { runCocosHudClose } from "./cocosHudCloseRunner.js";

const repoRoot = process.cwd();

console.log("=== Energy Company verify:client ===");

let result;
try {
  result = runCocosHudClose(repoRoot, {
    withPersistence: true,
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
console.log(
  `[${result.persistenceOk ? "OK" : "FAIL"}] t49-persistence | ${result.persistenceDetail}`
);

const failed =
  result.staticChecks.some((item) => !item.ok) ||
  result.smokeSteps.some((item) => !item.ok) ||
  !result.persistenceOk;
if (failed) {
  process.exit(1);
}
