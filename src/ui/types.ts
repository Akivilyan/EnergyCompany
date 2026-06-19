export type ScreenId =
  | "screen_main_menu"
  | "screen_city_detail"
  | "screen_region"
  | "screen_world_map"
  | "screen_company"
  | "screen_tech_tree"
  | "screen_run_result";

export interface NavigationState {
  currentScreen: ScreenId;
  stack: ScreenId[];
  cityId: string | null;
  regionId: string | null;
}
