import type { GameState, SimResult } from "../sim/index.js";
import type { Command } from "../sim/types/commands.js";
import {
  StubRewardedAdProvider,
  type RewardedAdOutcome,
  type RewardedAdProvider,
  type RewardedAdType
} from "../infra/monetization/rewardedAdProvider.js";
import type { RunController } from "./runController.js";

export type AdRewardUiErrorCode =
  | "ad_not_completed"
  | "ad_provider_failed"
  | "reward_rejected";

export interface AdRewardActionOutput {
  adOutcome: RewardedAdOutcome;
  rewarded: boolean;
  claimResult: SimResult<{ state: GameState }> | null;
  uiErrorCode: AdRewardUiErrorCode | null;
  before: {
    adsRemaining: number;
    funds: number;
  };
  after: {
    adsRemaining: number;
    funds: number;
  };
}

function toClaimCommand(adType: RewardedAdType, targetId?: string): Command {
  return {
    type: "claim_ad_reward",
    adType,
    targetId
  };
}

export class AdRewardService {
  constructor(
    private readonly controller: RunController,
    private readonly adProvider: RewardedAdProvider
  ) {}

  claimRewardByAd(
    adType: RewardedAdType,
    placementId: string,
    targetId?: string
  ): AdRewardActionOutput {
    const before = {
      adsRemaining: this.controller.state.adsRemaining,
      funds: this.controller.state.funds
    };
    const adOutcome = this.adProvider.showRewardedAd({ adType, placementId });
    if (adOutcome.status === "cancelled") {
      return {
        adOutcome,
        rewarded: false,
        claimResult: null,
        uiErrorCode: "ad_not_completed",
        before,
        after: {
          adsRemaining: this.controller.state.adsRemaining,
          funds: this.controller.state.funds
        }
      };
    }
    if (adOutcome.status === "failed") {
      return {
        adOutcome,
        rewarded: false,
        claimResult: null,
        uiErrorCode: "ad_provider_failed",
        before,
        after: {
          adsRemaining: this.controller.state.adsRemaining,
          funds: this.controller.state.funds
        }
      };
    }

    const claimResult = this.controller.runCommand(toClaimCommand(adType, targetId));
    return {
      adOutcome,
      rewarded: claimResult.ok,
      claimResult,
      uiErrorCode: claimResult.ok ? null : "reward_rejected",
      before,
      after: {
        adsRemaining: this.controller.state.adsRemaining,
        funds: this.controller.state.funds
      }
    };
  }

  async claimRewardByAdAsync(
    adType: RewardedAdType,
    placementId: string,
    targetId?: string
  ): Promise<AdRewardActionOutput> {
    const before = {
      adsRemaining: this.controller.state.adsRemaining,
      funds: this.controller.state.funds
    };
    const adOutcome = this.adProvider.showRewardedAdAsync
      ? await this.adProvider.showRewardedAdAsync({ adType, placementId })
      : this.adProvider.showRewardedAd({ adType, placementId });
    if (adOutcome.status === "cancelled") {
      return {
        adOutcome,
        rewarded: false,
        claimResult: null,
        uiErrorCode: "ad_not_completed",
        before,
        after: {
          adsRemaining: this.controller.state.adsRemaining,
          funds: this.controller.state.funds
        }
      };
    }
    if (adOutcome.status === "failed") {
      return {
        adOutcome,
        rewarded: false,
        claimResult: null,
        uiErrorCode: "ad_provider_failed",
        before,
        after: {
          adsRemaining: this.controller.state.adsRemaining,
          funds: this.controller.state.funds
        }
      };
    }

    const claimResult = this.controller.runCommand(toClaimCommand(adType, targetId));
    return {
      adOutcome,
      rewarded: claimResult.ok,
      claimResult,
      uiErrorCode: claimResult.ok ? null : "reward_rejected",
      before,
      after: {
        adsRemaining: this.controller.state.adsRemaining,
        funds: this.controller.state.funds
      }
    };
  }
}

export function createAdRewardService(
  controller: RunController,
  adProvider: RewardedAdProvider
): AdRewardService {
  return new AdRewardService(controller, adProvider);
}

export function createDefaultAdRewardService(controller: RunController): AdRewardService {
  return createAdRewardService(
    controller,
    new StubRewardedAdProvider({ kind: "always_complete" })
  );
}
