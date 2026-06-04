import { t } from "../i18n/index.js";
import type { GameBootstrap } from "./gameBootstrap.js";

export interface CityHudViewModel {
  month: number;
  funds: number;
  cityId: string;
  screen: string;
}

export interface CityHudActionResult {
  ok: boolean;
  view: CityHudViewModel;
  errorCode: string | null;
}

export interface CityHudAdvanceResult extends CityHudActionResult {
  monthFrom: number | null;
  monthTo: number | null;
}

export function readCityHudViewModel(boot: GameBootstrap): CityHudViewModel {
  const nav = boot.play.getNavigation();
  const state = boot.app.controller.state;
  return {
    month: state.currentMonth,
    funds: state.funds,
    cityId: nav.cityId ?? "CITY-START",
    screen: nav.currentScreen
  };
}

export function cityHudBuildWind(boot: GameBootstrap): CityHudActionResult {
  const out = boot.play.buildInCurrentCity("wind", 1);
  return {
    ok: out.ok,
    view: readCityHudViewModel(boot),
    errorCode: out.errorCode
  };
}

export function cityHudAdvanceMonth(boot: GameBootstrap): CityHudAdvanceResult {
  const out = boot.play.advanceMonthInCurrentCity();
  return {
    ok: out.ok,
    view: readCityHudViewModel(boot),
    errorCode: out.errorCode,
    monthFrom: out.monthFrom,
    monthTo: out.monthTo
  };
}

export function formatCityHudStatus(view: CityHudViewModel): string {
  const city = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  return t("hud.status.city", { month: view.month, funds: view.funds, city });
}
