import type { GameBootstrap } from "../../shared/game-client.mjs";
import type { ScreenPanel, ScreenPanelLayout } from "./ScreenPanel";

export type CocosScreenId =
  | "screen_company"
  | "screen_tech_tree"
  | "screen_run_result"
  | "screen_events"
  | "screen_world_map"
  | "screen_region"
  | "screen_city_detail";

export class ScreenHost {
  private boot: GameBootstrap | null = null;
  private readonly panels = new Map<CocosScreenId, ScreenPanel>();

  register(screenId: CocosScreenId, panel: ScreenPanel): this {
    this.panels.set(screenId, panel);
    if (this.boot) panel.bindGameBoot(this.boot);
    return this;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    for (const panel of this.panels.values()) {
      panel.bindGameBoot(boot);
    }
  }

  refresh(): void {
    for (const panel of this.panels.values()) {
      panel.refresh();
    }
  }

  applyLayout(layout: ScreenPanelLayout): void {
    for (const panel of this.panels.values()) {
      panel.applyLayout(layout);
    }
  }

  dispose(): void {
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
    this.boot = null;
  }
}
