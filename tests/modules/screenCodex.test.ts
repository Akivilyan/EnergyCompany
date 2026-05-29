import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenCodex } from "../../src/modules/screenCodex.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("ScreenCodex", () => {
  it("returns a minimal 2-page codex snapshot", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCodex(controller);
    const snapshot = screen.getSnapshot();
    expect(snapshot.activePageId).toBe("codex_core");
    expect(snapshot.pages.map((item) => item.pageId)).toEqual(["codex_core", "codex_ads"]);
  });

  it("includes ad reward and remaining info on codex_ads page", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.companyLevel = 2;
    controller.state.adsRemaining = 7;
    const screen = createScreenCodex(controller);
    const out = screen.openPage("codex_ads");
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.page?.pageId).toBe("codex_ads");
    expect(out.value.page?.bulletKeys.some((item) => item.includes("cash_reward_"))).toBe(true);
    expect(out.value.page?.bulletKeys).toContain("codex.ads.bullet.remaining_7");
  });

  it("maps not-found codex page to UI copy", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenCodex(controller);
    const out = screen.tryOpenPage("codex_unknown");
    expect(out.page).toBeNull();
    expect(out.uiErrorCode).toBe("page_not_found");
    expect(out.uiCopy).toEqual({
      messageKey: "codex.error.page_not_found",
      actionKey: "codex.action.go_core"
    });
    expect(out.snapshot.activePageId).toBe("codex_core");
  });
});
