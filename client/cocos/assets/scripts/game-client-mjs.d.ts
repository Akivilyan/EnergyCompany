declare module "*.mjs" {
  export interface GameBootstrap {
    app: any;
    play: any;
    clientAutoSave?: { bound: boolean; slotId: string; unbind: () => void };
    clientResume?: { resumed: boolean; slotId: string };
  }

  export interface WechatRewardedAdSdk {
    createRewardedVideoAd?: (options: { adUnitId: string }) => unknown;
  }

  export interface SceneHost {
    getCurrentScene(): string | null;
    loadScene(sceneName: string, screenId: ScreenId): void;
  }

  export type ScreenId = string;
  export type ConfigBundleInput = any;

  export class ConfigRepo {
    static fromBundle(input: unknown): ConfigRepo;
  }

  export const V0_CONFIG_JSON_FILES: Record<string, string>;
  export const V0_CONFIG_RESOURCE_BASE: string;

  export function mountGameClient(options: any): GameBootstrap;
  export function clearMountedGameClient(): void;
  export function ensureChineseDefaultForDev(): void;
  export function setMountedGameClient(boot: GameBootstrap): void;
  export function isBuiltScene(sceneName: string): boolean;
  export function buildConfigBundle(input: ConfigBundleInput): unknown;

  export function buildClientHudDisplay(...args: any[]): any;
  export function cityHudAdvanceMonth(...args: any[]): any;
  export function cityHudBuildSelected(...args: any[]): any;
  export function cityHudBuildWind(...args: any[]): any;
  export function cityHudCycleBuildCandidate(...args: any[]): any;
  export function clientNavBack(...args: any[]): any;
  export function clientNavOpenCompany(...args: any[]): any;
  export function clientNavOpenRegion(...args: any[]): any;
  export function clientNavOpenWorldMap(...args: any[]): any;
  export function clientNavOpenTechTree(...args: any[]): any;
  export function regionCycleLinkCandidate(...args: any[]): any;
  export function regionCancelSelectedLink(...args: any[]): any;
  export function regionQueueDefaultLink(...args: any[]): any;
  export function companyApplySelectedLoan(...args: any[]): any;
  export function companyClaimCashByAd(...args: any[]): any;
  export function companyClaimCashByAdAsync(...args: any[]): Promise<any>;
  export function companyCycleLoanCandidate(...args: any[]): any;
  export function worldCycleTargetCandidate(...args: any[]): any;
  export function worldQueueSelectedTrunk(...args: any[]): any;
  export function worldQueueSuperHydro(...args: any[]): any;
  export function worldQueueSuperHydroGridLink(...args: any[]): any;
  export function worldOpenSelectedTarget(...args: any[]): any;
  export function getClientHudCapabilities(...args: any[]): any;
  export function getCityHudProfileSnapshot(...args: any[]): any;
  export function readCityHudViewModel(...args: any[]): any;
  export function techCancelActiveResearch(...args: any[]): any;
  export function techSpeedupResearchByAd(...args: any[]): any;
  export function techSpeedupResearchByAdAsync(...args: any[]): Promise<any>;
  export function techStartDefaultResearch(...args: any[]): any;
  export function eventsAcknowledgeNextPending(...args: any[]): any;
  export function t(messageKey: string, args?: Record<string, unknown>): string;
  export function techCycleResearchCandidate(...args: any[]): any;
}
