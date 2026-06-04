import { t, tScreenLabel } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel, type CityHudViewModel } from "./cityHudController.js";
import type { NavigationState, ScreenId } from "../ui/types.js";

export interface ClientNavResult {
  ok: boolean;
  screen: ScreenId;
  navigation: NavigationState;
  view: CityHudViewModel;
}

export function clientNavOpenScreen(boot: GameBootstrap, screenId: ScreenId): ClientNavResult {
  const navigation = boot.play.openScreen(screenId);
  return {
    ok: true,
    screen: navigation.currentScreen,
    navigation,
    view: readCityHudViewModel(boot)
  };
}

export function clientNavOpenCompany(boot: GameBootstrap): ClientNavResult {
  return clientNavOpenScreen(boot, "screen_company");
}

export function clientNavOpenTechTree(boot: GameBootstrap): ClientNavResult {
  return clientNavOpenScreen(boot, "screen_tech_tree");
}

export function clientNavOpenRegion(boot: GameBootstrap): ClientNavResult {
  return clientNavOpenScreen(boot, "screen_region");
}

export function clientNavOpenCity(boot: GameBootstrap): ClientNavResult {
  return clientNavOpenScreen(boot, "screen_city_detail");
}

export function clientNavBack(boot: GameBootstrap): ClientNavResult {
  const navigation = boot.play.back();
  return {
    ok: true,
    screen: navigation.currentScreen,
    navigation,
    view: readCityHudViewModel(boot)
  };
}

export function formatClientNavHint(view: CityHudViewModel, stackDepth: number): string {
  return t("hud.nav.hint", { screen: tScreenLabel(view.screen), stack: stackDepth });
}
