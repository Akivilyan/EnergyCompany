/**
 * Cocos Creator 浏览器包入口（由 build:client / esbuild 打包为 game-client.mjs）。
 */
export { mountGameClient, type GameClientMountOptions } from "./gameClientEntry.js";
export {
  clearMountedGameClient,
  getMountedGameClient,
  onGameClientMounted,
  setMountedGameClient
} from "./gameClientRegistry.js";
export type { GameBootstrap } from "./gameBootstrap.js";
export {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  formatCityHudStatus,
  readCityHudViewModel
} from "./cityHudController.js";
export { formatClientHudStatus } from "./clientHudController.js";
export { buildClientHudDisplay, formatLoanTierLabel } from "./clientHudDisplay.js";
export { getClientHudCapabilities } from "./clientHudCapabilities.js";
export {
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd
} from "./companyHudController.js";
export {
  DEFAULT_DEV_TECH_ID,
  techCancelActiveResearch,
  techEnsureLevelIIForDev,
  techSpeedupResearchByAd,
  techStartDefaultResearch
} from "./techHudController.js";
export {
  eventsAcknowledgeNextPending,
  formatEventsHudHint,
  formatPendingEventModalLines
} from "./eventsHudController.js";
export { regionQueueDefaultLink, DEFAULT_REGION_LINK } from "./regionHudController.js";
export {
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenRegion,
  clientNavOpenTechTree,
  formatClientNavHint
} from "./screenNavController.js";
export {
  buildConfigBundle,
  configRepoFromBundle,
  V0_CONFIG_JSON_FILES,
  V0_CONFIG_RESOURCE_BASE,
  type ConfigBundleInput
} from "../sim/config/configBundle.js";
export { ConfigRepo } from "../sim/config/configRepo.js";
export type { SceneHost } from "../ui/sceneHost.js";
export { BUILT_SCENE_NAMES, isBuiltScene } from "../ui/sceneMap.js";
export type { ScreenId } from "../ui/types.js";
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
  tScreenLabel,
  type LocaleId
} from "../i18n/index.js";
