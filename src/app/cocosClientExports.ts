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
  cityHudBuildSelected,
  cityHudBuildWind,
  cityHudCycleBuildCandidate,
  formatSelectedBuildCandidate,
  formatCityHudStatus,
  getCityHudBuildSelectionSnapshot,
  readCityHudViewModel
} from "./cityHudController.js";
export { formatClientHudStatus } from "./clientHudController.js";
export { buildClientHudDisplay, formatLoanTierLabel } from "./clientHudDisplay.js";
export { getClientHudCapabilities } from "./clientHudCapabilities.js";
export {
  companyApplySelectedLoan,
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd,
  companyClaimCashByAdAsync,
  companyCycleLoanCandidate,
  formatSelectedLoanCandidate,
  getCompanyHudSelectionSnapshot
} from "./companyHudController.js";
export {
  DEFAULT_DEV_TECH_ID,
  getTechHudSelectionSnapshot,
  techCycleResearchCandidate,
  techCancelActiveResearch,
  techEnsureLevelIIForDev,
  formatSelectedResearchCandidate,
  techSpeedupResearchByAd,
  techSpeedupResearchByAdAsync,
  techStartDefaultResearch
} from "./techHudController.js";
export {
  eventsAcknowledgeNextPending,
  formatEventsHudHint,
  formatPendingEventModalLines
} from "./eventsHudController.js";
export {
  DEFAULT_REGION_LINK,
  formatSelectedRegionLink,
  getRegionHudSelectionSnapshot,
  regionCancelSelectedLink,
  regionCycleLinkCandidate,
  regionQueueDefaultLink
} from "./regionHudController.js";
export {
  formatSelectedWorldCandidate,
  formatSelectedWorldSuperHydroSlot,
  formatSelectedWorldTrunkCandidate,
  getSelectedWorldTrunkCandidate,
  getWorldHudSelectionSnapshot,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro,
  worldQueueSuperHydroGridLink,
  worldCycleTargetCandidate,
  worldOpenSelectedTarget
} from "./worldHudController.js";
export {
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenCity,
  clientNavOpenRegionById,
  clientNavOpenRegion,
  clientNavOpenWorldMap,
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
export type { WechatRewardedAdSdk } from "../infra/monetization/rewardedAdProvider.js";
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
