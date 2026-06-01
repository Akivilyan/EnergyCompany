#!/usr/bin/env node
/**
 * 真实广告 SDK 对接预研冒烟（T45-P1-04）：
 * - stub completed: 触发真实 claim_ad_reward
 * - stub cancel: 不扣次数不发�? * - wechat placeholder: 预留失败路径
 *
 * 用法�? *   npm run sim:ad-sdk-spike
 */
import {
  StubRewardedAdProvider,
  WechatRewardedAdProvider
} from "../infra/monetization/rewardedAdProvider.js";
import { createAdRewardService } from "../modules/adRewardService.js";
import { createControllerFromRepoRoot } from "../modules/runController.node.js";

function runStubCompleted(): void {
  const controller = createControllerFromRepoRoot();
  const service = createAdRewardService(
    controller,
    new StubRewardedAdProvider({ kind: "always_complete" })
  );
  const out = service.claimRewardByAd("cash", "screen_company.cash");
  console.log(
    `stub-complete: rewarded=${out.rewarded}, ads ${out.before.adsRemaining}->${out.after.adsRemaining}, funds ${out.before.funds}->${out.after.funds}`
  );
}

function runStubCancel(): void {
  const controller = createControllerFromRepoRoot();
  const service = createAdRewardService(
    controller,
    new StubRewardedAdProvider({ kind: "always_cancel" })
  );
  const out = service.claimRewardByAd("cash", "screen_company.cash");
  console.log(
    `stub-cancel: rewarded=${out.rewarded}, ui=${out.uiErrorCode}, ads ${out.before.adsRemaining}->${out.after.adsRemaining}`
  );
}

function runWechatPlaceholder(): void {
  const controller = createControllerFromRepoRoot();
  const service = createAdRewardService(controller, new WechatRewardedAdProvider());
  const out = service.claimRewardByAd("speedup", "screen_tech.speedup");
  console.log(
    `wechat-placeholder: rewarded=${out.rewarded}, ui=${out.uiErrorCode}, provider=${out.adOutcome.providerCode}`
  );
}

console.log("=== Energy Company ad-sdk spike ===");
runStubCompleted();
runStubCancel();
runWechatPlaceholder();
