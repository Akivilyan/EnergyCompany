/** Cocos Creator 共享逻辑包的最小入口。 */
export {
  mountGameClient,
  type GameClient,
  type GameClientMountOptions
} from "./gameClientEntry.js";
export {
  clearMountedGameClient,
  getMountedGameClient,
  onGameClientMounted,
  requireMountedGameClient,
  setMountedGameClient
} from "./gameClientRegistry.js";
export {
  buildConfigBundle,
  configRepoFromBundle,
  V0_CONFIG_JSON_FILES,
  V0_CONFIG_RESOURCE_BASE,
  type ConfigBundleInput
} from "../sim/config/configBundle.js";
export { ConfigRepo } from "../sim/config/configRepo.js";
export type { WechatRewardedAdSdk } from "../infra/monetization/rewardedAdProvider.js";
export {
  DEFAULT_LOCALE,
  getLocale,
  setLocale,
  persistLocale,
  parseLocale,
  initLocaleFromEnvironment,
  initLocaleForPreview,
  ensureChineseDefaultForDev,
  t,
  type LocaleId
} from "../i18n/index.js";
