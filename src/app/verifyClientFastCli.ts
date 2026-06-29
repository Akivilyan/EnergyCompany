#!/usr/bin/env node
/**
 * Daily client check: Cocos project preflight + HUD smoke, without persistence
 * resume or WeChat package freshness checks.
 *
 * Usage:
 *   npm run verify:client:fast
 */
import { runCocosHudClose } from "./cocosHudCloseRunner.js";

const repoRoot = process.cwd();

console.log("=== Energy Company verify:client:fast ===");

let result;
try {
  result = runCocosHudClose(repoRoot, {
    withPersistence: false,
    withInitPreflight: true,
    withWechatBuildFreshness: false
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

const failed = result.staticChecks.some((item) => !item.ok) || result.smokeSteps.some((item) => !item.ok);
if (failed) {
  process.exit(1);
}
