import { buildClientHudDisplay, type GameBootstrap } from "../../shared/game-client.mjs";

export interface RunResultScreenViewModel {
  active: boolean;
  title: string;
  detail: string;
}

export function readRunResultScreenViewModel(boot: GameBootstrap | null): RunResultScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_run_result") {
    return { active: false, title: "", detail: "" };
  }

  const display = buildClientHudDisplay(boot);
  return {
    active: true,
    title: display.statusLine,
    detail: display.detailLines.join("\n")
  };
}
