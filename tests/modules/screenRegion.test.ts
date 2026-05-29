import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RunController } from "../../src/modules/runController.js";
import { createScreenRegion } from "../../src/modules/screenRegion.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("ScreenRegion", () => {
  it("shows city unlock status by company level", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenRegion(controller);

    const before = screen.getSnapshot();
    const cityLv2 = before.cities.find((city) => city.cityId === "CITY-MAP01-02");
    expect(cityLv2?.unlocked).toBe(false);

    controller.state.companyLevel = 2;
    const after = screen.getSnapshot();
    const cityLv2After = after.cities.find((city) => city.cityId === "CITY-MAP01-02");
    expect(cityLv2After?.unlocked).toBe(true);
  });

  it("blocks grid link into locked city at level I", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    const screen = createScreenRegion(controller);

    const action = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(action.result.ok).toBe(false);
    if (!action.result.ok) {
      expect(action.result.error).toBe("not_unlocked");
    }
  });

  it("allows grid link into level II city when unlocked", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);

    const action = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(action.result.ok).toBe(true);
    const linkId = "CITY-MAP01-02::CITY-START";
    expect(action.after.gridLinks.some((link) => link.linkId === linkId)).toBe(true);
  });

  it("advances month and finishes queued region link", () => {
    const controller = RunController.fromRepoRoot(repoRoot);
    controller.state.companyLevel = 2;
    const screen = createScreenRegion(controller);

    const queue = screen.queueGridLink("CITY-START", "CITY-MAP01-02", "region");
    expect(queue.result.ok).toBe(true);

    const advance = screen.advanceMonths(1);
    expect(advance.failed).toBeNull();
    expect(advance.reports).toHaveLength(1);
    const linkId = "CITY-MAP01-02::CITY-START";
    const link = advance.reports[0].after.gridLinks.find((item) => item.linkId === linkId);
    expect(link?.status).toBe("finished");
    expect(link?.monthsRemaining).toBe(0);
  });
});
