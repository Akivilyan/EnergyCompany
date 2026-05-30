import { StubRewardedAdProvider } from "../infra/monetization/rewardedAdProvider.js";
import type { RewardedAdProvider } from "../infra/monetization/rewardedAdProvider.js";
import { InMemoryStateStorage, type StateStorage } from "../infra/storage/stateStorage.js";
import { createAdRewardService } from "../modules/adRewardService.js";
import type { GameAppContext, GameAppScreens } from "../modules/gameContext.js";
import { createRunPersistence } from "../modules/runPersistence.js";
import {
  createController,
  type ControllerInitOptions,
} from "../modules/runController.js";
import { createScreenCityDetail } from "../modules/screenCityDetail.js";
import { createScreenCodex } from "../modules/screenCodex.js";
import { createScreenCompany } from "../modules/screenCompany.js";
import { createScreenEventsPanel } from "../modules/screenEventsPanel.js";
import { createScreenOnboarding } from "../modules/screenOnboarding.js";
import { createScreenRegion } from "../modules/screenRegion.js";
import { createScreenRunResult } from "../modules/screenRunResult.js";
import { createScreenTechTree } from "../modules/screenTechTree.js";

export type { GameAppContext, GameAppScreens } from "../modules/gameContext.js";

export interface GameAppOptions extends ControllerInitOptions {
  repoRoot?: string;
  adProvider?: RewardedAdProvider;
  stateStorage?: StateStorage;
}

export function createGameApp(options: GameAppOptions = {}): GameAppContext {
  const controller = createController(options.repoRoot ?? process.cwd(), options);
  const storage = options.stateStorage ?? new InMemoryStateStorage();
  const persistence = createRunPersistence(controller, storage);
  const adProvider = options.adProvider ?? new StubRewardedAdProvider({ kind: "always_complete" });
  const adRewardService = createAdRewardService(controller, adProvider);

  const screens: GameAppScreens = {
    city: (cityId: string) => createScreenCityDetail(controller, cityId),
    company: createScreenCompany(controller, adProvider),
    tech: createScreenTechTree(controller, adProvider),
    region: createScreenRegion(controller),
    events: createScreenEventsPanel(controller),
    onboarding: createScreenOnboarding(controller),
    runResult: createScreenRunResult(controller),
    codex: createScreenCodex(controller)
  };

  return {
    controller,
    persistence,
    adRewardService,
    screens
  };
}
