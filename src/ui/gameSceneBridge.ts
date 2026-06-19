import type {
  CityAdvanceActionResult,
  CityBuildActionResult,
  GameShell,
  PersistenceActionResult
} from "./gameShell.js";
import type { SceneHost } from "./sceneHost.js";
import { syncSceneHost } from "./sceneHost.js";
import type { NavigationState, ScreenId } from "./types.js";

export class GameSceneBridge {
  constructor(
    readonly shell: GameShell,
    private readonly host: SceneHost
  ) {
    this.syncScene();
  }

  private syncScene(): void {
    const nav = this.shell.getNavigation();
    syncSceneHost(this.host, nav.currentScreen);
  }

  private run<T>(action: () => T): T {
    const result = action();
    this.syncScene();
    return result;
  }

  getNavigation(): NavigationState {
    return this.shell.getNavigation();
  }

  openScreen(screenId: ScreenId, cityId?: string, regionId?: string): NavigationState {
    return this.run(() => this.shell.openScreen(screenId, cityId, regionId));
  }

  back(): NavigationState {
    return this.run(() => this.shell.back());
  }

  buildInCurrentCity(facilityId: string, tier = 1): CityBuildActionResult {
    return this.run(() => this.shell.buildInCurrentCity(facilityId, tier));
  }

  advanceMonthInCurrentCity(): CityAdvanceActionResult {
    return this.run(() => this.shell.advanceMonthInCurrentCity());
  }

  saveSlot(slotId: string): PersistenceActionResult {
    return this.shell.saveSlot(slotId);
  }

  loadSlot(slotId: string): PersistenceActionResult {
    return this.run(() => this.shell.loadSlot(slotId));
  }
}

export function createGameSceneBridge(shell: GameShell, host: SceneHost): GameSceneBridge {
  return new GameSceneBridge(shell, host);
}
