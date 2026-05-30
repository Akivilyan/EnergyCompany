import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { StubRewardedAdProvider, WechatRewardedAdProvider } from "../../src/infra/monetization/rewardedAdProvider.js";
import { createAdRewardService } from "../../src/modules/adRewardService.js";
import { RunController } from "../../src/modules/runController.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("AdRewardService", () => {
  it("claims reward when ad provider completes", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
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
    const controller = RunController.fromRepoRoot(repoRoot);
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
    const controller = RunController.fromRepoRoot(repoRoot);
    const service = createAdRewardService(controller, new WechatRewardedAdProvider());
    const out = service.claimRewardByAd("speedup", "screen_tech.speedup");
    expect(out.rewarded).toBe(false);
    expect(out.claimResult).toBeNull();
    expect(out.uiErrorCode).toBe("ad_provider_failed");
    expect(out.adOutcome.providerCode).toBe("not_implemented");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining);
  });
});
