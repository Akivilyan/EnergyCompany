import type { GameBootstrap } from "../gameBootstrap.js";
import { buildCityHudDisplay } from "./cityDisplay.js";
import { buildCompanyHudDisplay } from "./companyDisplay.js";
import { buildRegionHudDisplay } from "./regionDisplay.js";
import { buildRunResultHudDisplay } from "./runResultDisplay.js";
import { buildTechHudDisplay } from "./techDisplay.js";
import type { ClientHudDisplay } from "./types.js";
import { buildWorldHudDisplay } from "./worldDisplay.js";

type HudDisplayBuilder = (boot: GameBootstrap) => ClientHudDisplay;

const SCREEN_DISPLAY_BUILDERS: Record<string, HudDisplayBuilder> = {
  screen_city_detail: buildCityHudDisplay,
  screen_company: buildCompanyHudDisplay,
  screen_region: buildRegionHudDisplay,
  screen_world_map: buildWorldHudDisplay,
  screen_tech_tree: buildTechHudDisplay,
  screen_run_result: buildRunResultHudDisplay
};

export function buildScreenHudDisplay(boot: GameBootstrap): ClientHudDisplay {
  const screen = boot.play.getNavigation().currentScreen;
  return (SCREEN_DISPLAY_BUILDERS[screen] ?? buildCityHudDisplay)(boot);
}
