import type { GameBootstrap } from "./gameBootstrap.js";
import { buildScreenHudDisplay } from "./hudDisplay/registry.js";
import type { ClientHudDisplay } from "./hudDisplay/types.js";
import { hudLines } from "./hudDisplay/shared.js";

export type { ClientHudDisplay } from "./hudDisplay/types.js";
export { formatLoanTierLabel } from "./hudDisplay/shared.js";

/** 主副两行文案，避免单行过长顶出屏幕。 */
export function buildClientHudDisplay(
  boot: GameBootstrap,
  actionMessage: string | null = null
): ClientHudDisplay {
  const display = buildScreenHudDisplay(boot);

  if (actionMessage) {
    display.detailLines = hudLines(...display.detailLines, actionMessage);
    display.detailLine = display.detailLines.join(" · ");
  }
  if (!display.statusLines?.length) {
    display.statusLines = hudLines(display.statusLine);
  }
  if (!display.detailLines?.length) {
    display.detailLines = hudLines(display.detailLine);
  }

  return display;
}
