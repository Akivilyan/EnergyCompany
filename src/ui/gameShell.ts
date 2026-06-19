import type { GameAppContext } from "../modules/gameContext.js";
import type { NavigationState, ScreenId } from "./types.js";

const DEFAULT_CITY_ID = "CITY-START";

/** 底部平级导航：切换时不压栈，仅「返回」走层级栈。 */
export const PRIMARY_TAB_SCREENS: ReadonlySet<ScreenId> = new Set([
  "screen_city_detail",
  "screen_company",
  "screen_tech_tree",
  "screen_region",
  "screen_world_map"
]);

function isPrimaryTab(screen: ScreenId): boolean {
  return PRIMARY_TAB_SCREENS.has(screen);
}

export interface CityBuildActionResult {
  navigation: NavigationState;
  ok: boolean;
  errorCode: string | null;
}

export interface CityAdvanceActionResult {
  navigation: NavigationState;
  ok: boolean;
  monthFrom: number | null;
  monthTo: number | null;
  errorCode: string | null;
}

export interface PersistenceActionResult {
  navigation: NavigationState;
  ok: boolean;
  errorCode: string | null;
  savedAtUnixMs?: number;
}

function cloneNavigation(state: NavigationState): NavigationState {
  return {
    currentScreen: state.currentScreen,
    stack: [...state.stack],
    cityId: state.cityId
  };
}

export class GameShell {
  private navigation: NavigationState = {
    currentScreen: "screen_city_detail",
    stack: [],
    cityId: DEFAULT_CITY_ID
  };

  constructor(private readonly app: GameAppContext) {}

  getNavigation(): NavigationState {
    return cloneNavigation(this.navigation);
  }

  openScreen(screenId: ScreenId, cityId?: string): NavigationState {
    const from = this.navigation.currentScreen;
    if (from !== screenId) {
      const tabSwitch = isPrimaryTab(from) && isPrimaryTab(screenId);
      if (!tabSwitch) {
        this.navigation.stack.push(from);
      }
      this.navigation.currentScreen = screenId;
    }
    if (cityId) {
      this.navigation.cityId = cityId;
    }
    if (screenId === "screen_city_detail" && !this.navigation.cityId) {
      this.navigation.cityId = DEFAULT_CITY_ID;
    }
    return this.getNavigation();
  }

  back(): NavigationState {
    if (
      isPrimaryTab(this.navigation.currentScreen) &&
      this.navigation.currentScreen !== "screen_city_detail"
    ) {
      this.navigation.currentScreen = "screen_city_detail";
      return this.getNavigation();
    }
    const previous = this.navigation.stack.pop();
    if (previous) {
      this.navigation.currentScreen = previous;
    }
    return this.getNavigation();
  }

  buildInCurrentCity(facilityId: string, tier = 1): CityBuildActionResult {
    const cityId = this.navigation.cityId ?? DEFAULT_CITY_ID;
    const screen = this.app.screens.city(cityId);
    const out = screen.queueConstruction(facilityId, tier);
    return {
      navigation: this.getNavigation(),
      ok: out.ok && out.value.result.ok,
      errorCode: out.ok && !out.value.result.ok ? out.value.result.error : out.ok ? null : out.error
    };
  }

  advanceMonthInCurrentCity(): CityAdvanceActionResult {
    const cityId = this.navigation.cityId ?? DEFAULT_CITY_ID;
    const screen = this.app.screens.city(cityId);
    const out = screen.advanceOneMonth();
    if (!out.ok) {
      return {
        navigation: this.getNavigation(),
        ok: false,
        monthFrom: null,
        monthTo: null,
        errorCode: out.error
      };
    }
    if (this.app.controller.state.runResult !== null) {
      this.navigation.currentScreen = "screen_run_result";
    }
    return {
      navigation: this.getNavigation(),
      ok: true,
      monthFrom: out.value.monthFrom,
      monthTo: out.value.monthTo,
      errorCode: null
    };
  }

  saveSlot(slotId: string): PersistenceActionResult {
    const out = this.app.persistence.save(slotId);
    return {
      navigation: this.getNavigation(),
      ok: out.ok,
      errorCode: out.ok ? null : out.error,
      savedAtUnixMs: out.ok ? out.value.envelope.savedAtUnixMs : undefined
    };
  }

  loadSlot(slotId: string): PersistenceActionResult {
    const out = this.app.persistence.load(slotId);
    if (out.ok && this.app.controller.state.runResult !== null) {
      this.navigation.currentScreen = "screen_run_result";
    }
    return {
      navigation: this.getNavigation(),
      ok: out.ok,
      errorCode: out.ok ? null : out.error,
      savedAtUnixMs: out.ok ? out.value.envelope.savedAtUnixMs : undefined
    };
  }
}

export function createGameShell(app: GameAppContext): GameShell {
  return new GameShell(app);
}
