import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { runClientHudSmoke } from "../../src/app/clientHudSmoke.js";

describe("clientHudSmoke", () => {
  it("runs full T50 HUD step chain", () => {
    const boot = createGameBootstrapFromRepo();
    const steps = runClientHudSmoke(boot);
    expect(steps.length).toBeGreaterThanOrEqual(10);
    expect(steps.every((item) => item.ok)).toBe(true);
    expect(steps.some((item) => item.id === "t50-06-ack")).toBe(true);
  });
});
