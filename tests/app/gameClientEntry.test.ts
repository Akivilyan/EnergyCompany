import { createTestController, loadTestConfig, repoRoot } from "../helpers/testRepo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { ConfigRepo } from "../../src/sim/index.js";
import { loadConfigRepoFromVerticalSlice, loadConfigRepoFromConfigDir } from "../../src/sim/config/configRepo.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";
import type { WechatRewardedAdSdk } from "../../src/infra/monetization/rewardedAdProvider.js";


describe("mountGameClient", () => {
  it("bootstraps from injected config repo", () => {
    const config = loadTestConfig();
    const host = new LoggingSceneHost();
    const boot = mountGameClient({ configRepo: config, sceneHost: host });
    expect(boot.bridge).not.toBeNull();
    expect(boot.play.getNavigation().currentScreen).toBe("screen_city_detail");
    expect(host.getCurrentScene()).toBe("CityDetail");
  });

  it("falls back to stub when wx ad sdk is available without a real ad unit", async () => {
    const config = loadTestConfig();
    let createCalled = false;
    const wxAdSdk: WechatRewardedAdSdk = {
      createRewardedVideoAd: () => {
        createCalled = true;
        throw new Error("should not create wechat ad without adunit");
      }
    };

    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false, wxAdSdk });
    const out = await boot.app.adRewardService.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(true);
    expect(out.adOutcome.provider).toBe("stub");
    expect(createCalled).toBe(false);
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
  });

  it("uses injected wechat rewarded ad sdk when a real ad unit is configured", async () => {
    const config = loadTestConfig();
    let createdAdUnitId: string | null = null;
    const wxAdSdk: WechatRewardedAdSdk = {
      createRewardedVideoAd: ({ adUnitId }) => {
        createdAdUnitId = adUnitId;
        let closeListener: ((res?: { isEnded?: boolean }) => void) | null = null;
        return {
          load: () => Promise.resolve(),
          show: () => {
            queueMicrotask(() => closeListener?.({ isEnded: true }));
            return Promise.resolve();
          },
          onClose: (listener) => {
            closeListener = listener;
          },
          offClose: (listener) => {
            if (closeListener === listener) closeListener = null;
          },
          onError: () => undefined
        };
      }
    };

    const boot = mountGameClient({
      configRepo: config,
      autoResumeSlot: false,
      wxAdSdk,
      defaultRewardedAdUnitId: "adunit-test123"
    });
    const out = await boot.app.adRewardService.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(true);
    expect(out.adOutcome.provider).toBe("wechat");
    expect(createdAdUnitId).toBe("adunit-test123");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
  });
});
