import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  StubRewardedAdProvider,
  WechatRewardedAdProvider,
  type RewardedAdOutcome,
  type RewardedAdProvider,
  type RewardedAdRequest,
  type WechatRewardedAdSdk
} from "../../src/infra/monetization/rewardedAdProvider.js";
import { createAdRewardService } from "../../src/modules/adRewardService.js";
import { RunController } from "../../src/modules/runController.js";

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

class DeferredRewardedAdProvider implements RewardedAdProvider {
  private resolveOutcome: ((outcome: RewardedAdOutcome) => void) | null = null;

  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    return {
      status: "failed",
      provider: "stub",
      providerCode: "sync_not_supported"
    };
  }

  showRewardedAdAsync(_request: RewardedAdRequest): Promise<RewardedAdOutcome> {
    return new Promise((resolve) => {
      this.resolveOutcome = resolve;
    });
  }

  complete(): void {
    this.resolveOutcome?.({
      status: "completed",
      provider: "stub",
      providerCode: "deferred_completed"
    });
  }
}


describe("AdRewardService", () => {
  it("claims reward when ad provider completes", () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(
      controller,
      new StubRewardedAdProvider({ kind: "always_complete" })
    );
    const out = service.claimRewardByAd("cash", "screen_company.cash");
    expect(out.rewarded).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.claimResult?.ok).toBe(true);
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.funds).toBeGreaterThan(out.before.funds);
  });

  it("does not consume ads on cancelled ad playback", () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(
      controller,
      new StubRewardedAdProvider({ kind: "always_cancel" })
    );
    const out = service.claimRewardByAd("cash", "screen_company.cash");
    expect(out.rewarded).toBe(false);
    expect(out.claimResult).toBeNull();
    expect(out.uiErrorCode).toBe("ad_not_completed");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
    expect(out.after.funds).toBe(out.before.funds);
  });

  it("surfaces provider failure before sim command", () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(controller, new WechatRewardedAdProvider());
    const out = service.claimRewardByAd("speedup", "screen_tech.speedup");
    expect(out.rewarded).toBe(false);
    expect(out.claimResult).toBeNull();
    expect(out.uiErrorCode).toBe("ad_provider_failed");
    expect(out.adOutcome.providerCode).toBe("not_implemented");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
  });

  it("claims reward through async wechat completed callback", async () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(
      controller,
      new WechatRewardedAdProvider({ wx: createFakeWechatSdk("completed") })
    );

    const out = await service.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(true);
    expect(out.uiErrorCode).toBeNull();
    expect(out.adOutcome.provider).toBe("wechat");
    expect(out.adOutcome.providerCode).toBe("wechat_completed");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
    expect(out.after.funds).toBeGreaterThan(out.before.funds);
  });

  it("does not consume ads when async wechat callback is cancelled", async () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(
      controller,
      new WechatRewardedAdProvider({ wx: createFakeWechatSdk("cancelled") })
    );

    const out = await service.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(false);
    expect(out.claimResult).toBeNull();
    expect(out.uiErrorCode).toBe("ad_not_completed");
    expect(out.adOutcome.providerCode).toBe("wechat_cancelled");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
    expect(out.after.funds).toBe(out.before.funds);
  });

  it("surfaces async wechat sdk error before sim command", async () => {
    const controller = createTestController(repoRoot);
    const service = createAdRewardService(
      controller,
      new WechatRewardedAdProvider({ wx: createFakeWechatSdk("error") })
    );

    const out = await service.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(false);
    expect(out.claimResult).toBeNull();
    expect(out.uiErrorCode).toBe("ad_provider_failed");
    expect(out.adOutcome.providerCode).toBe("wechat_1002");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
  });

  it("rejects duplicate async reward requests while one is pending", async () => {
    const controller = createTestController(repoRoot);
    const provider = new DeferredRewardedAdProvider();
    const service = createAdRewardService(controller, provider);

    const first = service.claimRewardByAdAsync("cash", "screen_company.cash");
    const duplicate = await service.claimRewardByAdAsync("cash", "screen_company.cash");
    provider.complete();
    const completed = await first;

    expect(duplicate.rewarded).toBe(false);
    expect(duplicate.uiErrorCode).toBe("ad_in_progress");
    expect(duplicate.after.adsRemaining).toBe(duplicate.before.adsRemaining);
    expect(completed.rewarded).toBe(true);
    expect(completed.after.adsRemaining).toBe(completed.before.adsRemaining - 1);
  });
});
