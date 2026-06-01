import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { LoggingSceneHost } from "../../src/ui/sceneHost.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("createGameBootstrap", () => {
  it("returns shell as play surface without scene host", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot });
    expect(boot.bridge).toBeNull();
    expect(boot.play).toBe(boot.shell);
    expect(boot.play.getNavigation().currentScreen).toBe("screen_city_detail");
  });

  it("wires bridge when scene host is provided", () => {
    const host = new LoggingSceneHost();
    const boot = createGameBootstrapFromRepo({ repoRoot, sceneHost: host });
    expect(boot.bridge).not.toBeNull();
    expect(boot.play).toBe(boot.bridge);
    expect(host.getCurrentScene()).toBe("CityDetail");
  });

  it("shares one controller between app and play surface", () => {
    const boot = createGameBootstrapFromRepo({ repoRoot });
    boot.play.buildInCurrentCity("wind", 1);
    expect(boot.app.controller.state.funds).toBeLessThan(140);
  });
});
