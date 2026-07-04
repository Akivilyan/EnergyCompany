#!/usr/bin/env node
/**
 * Rewarded ad SDK spike smoke.
 *
 * Verifies the current monetization adapter surface:
 * - stub completed: runs the real claim_ad_reward command
 * - stub cancelled: does not consume ads
 * - wechat sync placeholder: keeps old sync callers on a safe failure path
 * - wechat async fake: exercises completed/cancelled/error SDK callbacks
 *
 * Usage:
 *   npm run sim:ad-sdk-spike
 */
import {
  StubRewardedAdProvider,
  WechatRewardedAdProvider,
  type WechatRewardedAdSdk
} from "../infra/monetization/rewardedAdProvider.js";
import { createAdRewardService } from "../modules/adRewardService.js";
import { createControllerFromRepoRoot } from "../modules/runController.node.js";

function createFakeWechatSdk(
  mode: "completed" | "cancelled" | "error"
): WechatRewardedAdSdk {
  return {
    createRewardedVideoAd: () => {
      let closeListener: ((res?: { isEnded?: boolean }) => void) | null = null;
      let errorListener: ((error?: { errCode?: number; errMsg?: string }) => void) | null = null;
      return {
        load: () => Promise.resolve(),
        show: () => {
          queueMicrotask(() => {
            if (mode === "error") {
              errorListener?.({ errCode: 1002, errMsg: "network unavailable" });
            } else {
              closeListener?.({ isEnded: mode === "completed" });
            }
          });
          return Promise.resolve();
        },
        onClose: (listener) => {
          closeListener = listener;
        },
        offClose: (listener) => {
          if (closeListener === listener) closeListener = null;
        },
        onError: (listener) => {
          errorListener = listener;
        },
        offError: (listener) => {
          if (errorListener === listener) errorListener = null;
        }
      };
    }
  };
}

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

function runWechatSyncPlaceholder(): void {
  const controller = createControllerFromRepoRoot();
  const service = createAdRewardService(controller, new WechatRewardedAdProvider());
  const out = service.claimRewardByAd("speedup", "screen_tech.speedup");
  console.log(
    `wechat-sync-placeholder: rewarded=${out.rewarded}, ui=${out.uiErrorCode}, provider=${out.adOutcome.providerCode}`
  );
}

async function runWechatAsyncFake(): Promise<void> {
  for (const mode of ["completed", "cancelled", "error"] as const) {
    const controller = createControllerFromRepoRoot();
    const service = createAdRewardService(
      controller,
      new WechatRewardedAdProvider({ wx: createFakeWechatSdk(mode) })
    );
    const out = await service.claimRewardByAdAsync("cash", `screen_company.${mode}`);
    console.log(
      `wechat-${mode}: rewarded=${out.rewarded}, ui=${out.uiErrorCode}, provider=${out.adOutcome.providerCode}, ads ${out.before.adsRemaining}->${out.after.adsRemaining}`
    );
  }
}

console.log("=== Energy Company ad-sdk spike ===");
runStubCompleted();
runStubCancel();
runWechatSyncPlaceholder();
await runWechatAsyncFake();
