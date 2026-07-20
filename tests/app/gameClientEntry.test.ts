import { describe, expect, it } from "vitest";
import type { WechatRewardedAdSdk } from "../../src/infra/monetization/rewardedAdProvider.js";
import { mountGameClient } from "../../src/app/gameClientEntry.js";
import { loadTestConfig } from "../helpers/testRepo.js";

describe("mountGameClient", () => {
  it("creates the application from an injected config repo", () => {
    const client = mountGameClient({
      configRepo: loadTestConfig(),
      autoResumeSlot: false,
      autoSaveOnHide: false
    });

    expect(client.app.controller.state.currentMonth).toBe(1);
    expect(client.app.screens.city("CITY-START").getSnapshot()?.cityId).toBe("CITY-START");
  });

  it("falls back to stub when wx ad sdk is available without a real ad unit", async () => {
    let createCalled = false;
    const wxAdSdk: WechatRewardedAdSdk = {
      createRewardedVideoAd: () => {
        createCalled = true;
        throw new Error("should not create wechat ad without adunit");
      }
    };

    const client = mountGameClient({
      configRepo: loadTestConfig(),
      autoResumeSlot: false,
      autoSaveOnHide: false,
      wxAdSdk
    });
    const out = await client.app.adRewardService.claimRewardByAdAsync(
      "cash",
      "screen_company.cash"
    );

    expect(out.rewarded).toBe(true);
    expect(out.adOutcome.provider).toBe("stub");
    expect(createCalled).toBe(false);
  });

  it("uses injected wechat rewarded ad sdk when a real ad unit is configured", async () => {
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

    const client = mountGameClient({
      configRepo: loadTestConfig(),
      autoResumeSlot: false,
      autoSaveOnHide: false,
      wxAdSdk,
      defaultRewardedAdUnitId: "adunit-test123"
    });
    const out = await client.app.adRewardService.claimRewardByAdAsync(
      "cash",
      "screen_company.cash"
    );

    expect(out.rewarded).toBe(true);
    expect(out.adOutcome.provider).toBe("wechat");
    expect(createdAdUnitId).toBe("adunit-test123");
  });
});
