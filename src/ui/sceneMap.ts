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

/**
 * 已纳入 Cocos 构建的物理场景（与 `client/cocos/scene-registry.json` → `builtSceneNames` 同步）。
 * 未列入的场景只做逻辑屏切换，不触发 `director.loadScene`。
 */
export const BUILT_SCENE_NAMES: ReadonlySet<string> = new Set(["CityDetail"]);

export function isBuiltScene(sceneName: string): boolean {
  return BUILT_SCENE_NAMES.has(sceneName);
}

export function buildSceneRegistry(bundle = "main"): SceneRegistryEntry[] {
  return (Object.keys(SCREEN_SCENE_MAP) as ScreenId[]).map((screenId) => ({
    screenId,
    sceneName: SCREEN_SCENE_MAP[screenId],
    bundle
  }));
}
