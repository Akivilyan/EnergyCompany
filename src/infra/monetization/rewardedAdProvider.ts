export type RewardedAdType = "cash" | "speedup" | "shield";

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
}

/**
 * 真实微信 SDK 对接占位：
 * 当前返回 failed，后续在独立对接分支替换为真实平台调用。
 */
export class WechatRewardedAdProvider implements RewardedAdProvider {
  showRewardedAd(_request: RewardedAdRequest): RewardedAdOutcome {
    return {
      status: "failed",
      provider: "wechat",
      providerCode: "not_implemented",
      message: "wechat rewarded ad sdk not wired yet"
    };
  }
}
