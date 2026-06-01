#!/usr/bin/env node
/**
 * 教学局最小闭�?CLI 冒烟�? * 教学开局（blocked�?> 连续 advance �?onb_done -> 再跑 skip 分支�? *
 * 用法�? *   npm run sim:tutorial-loop
 */
import { createControllerFromRepoRoot } from "../modules/runController.node.js";
import { createScreenOnboarding } from "../modules/screenOnboarding.js";

console.log("=== Energy Company tutorial loop smoke ===");

const tutorial = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tutorial" });
const screen = createScreenOnboarding(tutorial);
console.log(
  `start: tutorial=${screen.getSnapshot().isTutorialRun}, step=${screen.getSnapshot().currentStepId}, sub=${screen.getSnapshot().playableSubPhase}`
);
for (let i = 0; i < 7; i += 1) {
  const out = screen.advanceStep();
  if (!out.result.ok) {
    console.log(`advance failed at step=${out.before.currentStepId}: ${out.result.error}`);
    process.exit(1);
  }
}
const done = screen.getSnapshot();
console.log(
  `advance-path: step=${done.currentStepId}, cleared=${done.cleared}, skipped=${done.skipped}, sub=${done.playableSubPhase}`
);

const tutorialSkip = createControllerFromRepoRoot(process.cwd(), { doctrineId: "tutorial" });
const skipScreen = createScreenOnboarding(tutorialSkip);
const skip = skipScreen.skipAll();
if (!skip.result.ok) {
  console.log(`skip failed: ${skip.result.error} - ${skip.result.message}`);
  process.exit(1);
}
const skipped = skipScreen.getSnapshot();
console.log(
  `skip-path: step=${skipped.currentStepId}, cleared=${skipped.cleared}, skipped=${skipped.skipped}, sub=${skipped.playableSubPhase}`
);
