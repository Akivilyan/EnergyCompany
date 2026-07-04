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

  it("uses injected wechat rewarded ad sdk when available", async () => {
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

    const boot = mountGameClient({ configRepo: config, autoResumeSlot: false, wxAdSdk });
    const out = await boot.app.adRewardService.claimRewardByAdAsync("cash", "screen_company.cash");

    expect(out.rewarded).toBe(true);
    expect(out.adOutcome.provider).toBe("wechat");
    expect(createdAdUnitId).toBe("screen_company.cash");
    expect(out.after.adsRemaining).toBe(out.before.adsRemaining - 1);
  });
});
