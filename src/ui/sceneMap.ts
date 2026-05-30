import type { ScreenId } from "./types.js";

/** Cocos Creator 场景资源名（与 screen ID 一一对应，供引擎侧占位接入）。 */
export const SCREEN_SCENE_MAP: Record<ScreenId, string> = {
  screen_main_menu: "MainMenu",
  screen_city_detail: "CityDetail",
  screen_region: "RegionMap",
  screen_world_map: "WorldMap",
  screen_company: "Company",
  screen_tech_tree: "TechTree",
  screen_run_result: "RunResult"
};

export interface SceneRegistryEntry {
  screenId: ScreenId;
  sceneName: string;
  bundle: string;
}

export function resolveSceneName(screenId: ScreenId): string {
  return SCREEN_SCENE_MAP[screenId];
}

export function buildSceneRegistry(bundle = "main"): SceneRegistryEntry[] {
  return (Object.keys(SCREEN_SCENE_MAP) as ScreenId[]).map((screenId) => ({
    screenId,
    sceneName: SCREEN_SCENE_MAP[screenId],
    bundle
  }));
}
