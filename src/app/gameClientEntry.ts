import { createClientStateStorage } from "../infra/storage/wxStateStorage.js";
import type { StateStorage } from "../infra/storage/stateStorage.js";
import type { WxHideLifecyclePort } from "../infra/lifecycle/wxLifecycle.js";
import {
  StubRewardedAdProvider,
  WechatRewardedAdProvider,
  type RewardedAdProvider,
  type RewardedAdType,
  type WechatRewardedAdSdk
} from "../infra/monetization/rewardedAdProvider.js";
import type { ConfigRepo } from "../sim/index.js";
import type { SceneHost } from "../ui/sceneHost.js";
import { bindClientAutoSaveOnHide } from "./clientLifecycle.js";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  tryResumeClientRun,
  type ClientResumeResult
} from "./clientPersistence.js";
import { createGameBootstrap, type GameBootstrap } from "./gameBootstrap.js";

export type { ClientResumeResult } from "./clientPersistence.js";
export type { ClientAutoSaveBinding } from "./clientLifecycle.js";
export { bindClientAutoSaveOnHide } from "./clientLifecycle.js";
export { DEFAULT_CLIENT_RUN_SLOT, persistClientRun, tryResumeClientRun } from "./clientPersistence.js";

export interface GameClientMountOptions {
  configRepo: ConfigRepo;
  sceneHost?: SceneHost;
  /** 默认微信 wx 本地存储；Node 冒烟无 wx 时回退内存。 */
  stateStorage?: StateStorage;
  /** 挂载后自动读档；默认 `slot-main`；传 `false` 关闭。 */
  autoResumeSlot?: string | false;
  /** 绑定 wx.onHide 自动存档；默认 `slot-main`；传 `false` 关闭。 */
  autoSaveOnHide?: string | false;
  /** 单测/冒烟可注入 fake wx 生命周期。 */
  wxLifecycle?: WxHideLifecyclePort | null;
  /** 单测/冒烟可注入广告 provider；未传时按 wx 能力自动选择。 */
  adProvider?: RewardedAdProvider;
  /** Cocos/微信运行时注入全局 wx；无广告能力时回退 stub。 */
  wxAdSdk?: WechatRewardedAdSdk | null;
  /** 真实微信激励广告位；未配置真实 adunit 时回退 stub，避免真机冒烟被占位 ID 卡住。 */
  rewardedAdUnitIds?: Partial<Record<RewardedAdType, string>>;
  defaultRewardedAdUnitId?: string;
}

function isWechatAdUnitId(value: string | undefined): value is string {
  return typeof value === "string" && /^adunit-[A-Za-z0-9_-]+$/.test(value);
}

function hasWechatAdUnitConfig(options: GameClientMountOptions): boolean {
  if (isWechatAdUnitId(options.defaultRewardedAdUnitId)) return true;
  return Object.values(options.rewardedAdUnitIds ?? {}).some(isWechatAdUnitId);
}

function resolveClientAdProvider(options: GameClientMountOptions): RewardedAdProvider {
  if (options.adProvider) return options.adProvider;
  const adUnitConfig = hasWechatAdUnitConfig(options)
    ? {
        adUnitIds: options.rewardedAdUnitIds,
        defaultAdUnitId: options.defaultRewardedAdUnitId
      }
    : null;
  if (options.wxAdSdk?.createRewardedVideoAd && adUnitConfig) {
    return new WechatRewardedAdProvider({ wx: options.wxAdSdk, ...adUnitConfig });
  }
  const globalWx = (globalThis as { wx?: WechatRewardedAdSdk }).wx;
  if (globalWx?.createRewardedVideoAd && adUnitConfig) {
    return new WechatRewardedAdProvider({ wx: globalWx, ...adUnitConfig });
  }
  return new StubRewardedAdProvider({ kind: "always_complete" });
}

/** Cocos / 小游戏侧挂载入口：注入已加载的 ConfigRepo，避免引擎环境读盘。 */
export function mountGameClient(options: GameClientMountOptions): GameBootstrap {
  const boot = createGameBootstrap({
    configRepo: options.configRepo,
    sceneHost: options.sceneHost,
    stateStorage: createClientStateStorage(options.stateStorage),
    adProvider: resolveClientAdProvider(options)
  });
  const resumeSlot =
    options.autoResumeSlot === false
      ? null
      : (options.autoResumeSlot ?? DEFAULT_CLIENT_RUN_SLOT);
  if (resumeSlot) {
    boot.clientResume = tryResumeClientRun(boot.play, resumeSlot);
  }
  const saveSlot =
    options.autoSaveOnHide === false
      ? null
      : (options.autoSaveOnHide ?? DEFAULT_CLIENT_RUN_SLOT);
  if (saveSlot) {
    boot.clientAutoSave = bindClientAutoSaveOnHide(boot.play, {
      slotId: saveSlot,
      lifecycle: options.wxLifecycle
    });
  }
  return boot;
}
