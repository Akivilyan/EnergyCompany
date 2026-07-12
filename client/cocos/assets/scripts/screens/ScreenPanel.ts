import type { Node } from "cc";
import type { GameBootstrap } from "../../shared/game-client.mjs";

export interface ScreenPanelLayout {
  container: { width: number; height: number };
  rows: Array<{ x: number; y: number; width: number; height: number }>;
  buttonFont: number;
}

export interface ScreenPanelHost {
  requestRefresh(messageKey?: string | null): void;
}

export interface ScreenPanel {
  readonly root: Node;
  bindGameBoot(boot: GameBootstrap): void;
  refresh(): void;
  applyLayout(layout: ScreenPanelLayout): void;
  dispose(): void;
}
