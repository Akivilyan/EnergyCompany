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
  const navigation = boot.play.openScreen("screen_region", undefined, boot.play.getNavigation().regionId ?? "MAP-01");
  return {
    ok: true,
    screen: navigation.currentScreen,
    navigation,
    view: readCityHudViewModel(boot)
  };
}

export function clientNavOpenWorldMap(boot: GameBootstrap): ClientNavResult {
  return clientNavOpenScreen(boot, "screen_world_map");
}

export function clientNavOpenCity(
  boot: GameBootstrap,
  cityId?: string,
  regionId?: string
): ClientNavResult {
  const navigation = boot.play.openScreen("screen_city_detail", cityId, regionId);
  return {
    ok: true,
    screen: navigation.currentScreen,
    navigation,
    view: readCityHudViewModel(boot)
  };
}

export function clientNavOpenRegionById(boot: GameBootstrap, regionId: string): ClientNavResult {
  const navigation = boot.play.openScreen("screen_region", undefined, regionId);
  return {
    ok: true,
    screen: navigation.currentScreen,
    navigation,
    view: readCityHudViewModel(boot)
  };
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
