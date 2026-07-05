export type RewardedAdType = "cash" | "instant_build" | "instant_research" | "speedup" | "shield";

export interface RewardedAdRequest {
  adType: RewardedAdType;
  placementId: string;
}

export interface RewardedAdOutcome {
  status: "completed" | "cancelled" | "failed";
  provider: "stub" | "wechat";
  providerCode?: string;
  message?: string;
}

export interface RewardedAdProvider {
  showRewardedAd(request: RewardedAdRequest): RewardedAdOutcome;
  showRewardedAdAsync?(request: RewardedAdRequest): Promise<RewardedAdOutcome>;
}

interface WechatRewardedVideoAd {
  load?: () => Promise<unknown>;
  show: () => Promise<unknown>;
  onClose: (listener: (res?: { isEnded?: boolean }) => void) => void;
  offClose?: (listener: (res?: { isEnded?: boolean }) => void) => void;
  onError: (listener: (error?: { errCode?: number; errMsg?: string }) => void) => void;
  offError?: (listener: (error?: { errCode?: number; errMsg?: string }) => void) => void;
}

export interface WechatRewardedAdSdk {
  createRewardedVideoAd?: (options: { adUnitId: string }) => WechatRewardedVideoAd;
}

export class StubRewardedAdProvider implements RewardedAdProvider {
  constructor(
    private readonly mode:
      | { kind: "always_complete" }
      | { kind: "always_cancel" }
      | { kind: "always_fail"; code?: string } = { kind: "always_complete" }
  ) {}

  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    if (this.mode.kind === "always_cancel") {
      return {
        status: "cancelled",
        provider: "stub",
        providerCode: "cancelled_by_user",
        message: "stub user closed rewarded ad before completion"
      };
    }
    if (this.mode.kind === "always_fail") {
      return {
        status: "failed",
        provider: "stub",
        providerCode: this.mode.code ?? "stub_network_error",
        message: "stub rewarded ad failed"
      };
    }
    return {
      status: "completed",
      provider: "stub",
      providerCode: "stub_completed",
      message: "stub rewarded ad completed"
    };
  }

  showRewardedAdAsync(request: RewardedAdRequest): Promise<RewardedAdOutcome> {
    return Promise.resolve(this.showRewardedAd(request));
  }
}

function getGlobalWechatSdk(): WechatRewardedAdSdk | undefined {
  const value = (globalThis as { wx?: WechatRewardedAdSdk }).wx;
  return value && typeof value === "object" ? value : undefined;
}

export class WechatRewardedAdProvider implements RewardedAdProvider {
  constructor(
    private readonly options: {
      wx?: WechatRewardedAdSdk;
      adUnitIds?: Partial<Record<RewardedAdType, string>>;
      defaultAdUnitId?: string;
    } = {}
  ) {}

  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    return {
      status: "failed",
      provider: "wechat",
      providerCode: "not_implemented",
      message: "wechat rewarded ad requires async playback"
    };
  }

  async showRewardedAdAsync(request: RewardedAdRequest): Promise<RewardedAdOutcome> {
    const wx = this.options.wx ?? getGlobalWechatSdk();
    if (!wx?.createRewardedVideoAd) {
      return {
        status: "failed",
        provider: "wechat",
        providerCode: "wx_unavailable",
        message: "wechat rewarded ad sdk unavailable"
      };
    }
    const adUnitId =
      this.options.adUnitIds?.[request.adType] ??
      this.options.defaultAdUnitId ??
      request.placementId;
    let ad: WechatRewardedVideoAd;
    try {
      ad = wx.createRewardedVideoAd({ adUnitId });
    } catch (error) {
      return {
        status: "failed",
        provider: "wechat",
        providerCode: "create_failed",
        message: error instanceof Error ? error.message : String(error)
      };
    }

    return new Promise<RewardedAdOutcome>((resolve) => {
      let settled = false;
      const finish = (outcome: RewardedAdOutcome): void => {
        if (settled) return;
        settled = true;
        ad.offClose?.(onClose);
        ad.offError?.(onError);
        resolve(outcome);
      };
      const onClose = (res?: { isEnded?: boolean }): void => {
        finish({
          status: res?.isEnded ? "completed" : "cancelled",
          provider: "wechat",
          providerCode: res?.isEnded ? "wechat_completed" : "wechat_cancelled",
          message: res?.isEnded ? "wechat rewarded ad completed" : "wechat rewarded ad closed early"
        });
      };
      const onError = (error?: { errCode?: number; errMsg?: string }): void => {
        finish({
          status: "failed",
          provider: "wechat",
          providerCode: error?.errCode === undefined ? "wechat_error" : `wechat_${error.errCode}`,
          message: error?.errMsg ?? "wechat rewarded ad failed"
        });
      };
      ad.onClose(onClose);
      ad.onError(onError);
      Promise.resolve(ad.load?.())
        .then(() => ad.show())
        .catch((error) => {
          finish({
            status: "failed",
            provider: "wechat",
            providerCode: "show_failed",
            message: error instanceof Error ? error.message : String(error)
          });
        });
    });
  }
}
