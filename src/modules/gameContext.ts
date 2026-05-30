import type { AdRewardService } from "./adRewardService.js";
import type { RunPersistence } from "./runPersistence.js";
import type { RunController } from "./runController.js";
import type { ScreenCityDetail } from "./screenCityDetail.js";
import type { ScreenCodex } from "./screenCodex.js";
import type { ScreenCompany } from "./screenCompany.js";
import type { ScreenEventsPanel } from "./screenEventsPanel.js";
import type { ScreenOnboarding } from "./screenOnboarding.js";
import type { ScreenRegion } from "./screenRegion.js";
import type { ScreenRunResult } from "./screenRunResult.js";
import type { ScreenTechTree } from "./screenTechTree.js";

export interface GameAppScreens {
  city(cityId: string): ScreenCityDetail;
  company: ScreenCompany;
  tech: ScreenTechTree;
  region: ScreenRegion;
  events: ScreenEventsPanel;
  onboarding: ScreenOnboarding;
  runResult: ScreenRunResult;
  codex: ScreenCodex;
}

export interface GameAppContext {
  controller: RunController;
  persistence: RunPersistence;
  adRewardService: AdRewardService;
  screens: GameAppScreens;
}
