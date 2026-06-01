import { describe, expect, it } from "vitest";
import { createGameBootstrapFromRepo } from "../../src/app/gameBootstrap.node.js";
import { formatClientHudStatus } from "../../src/app/clientHudController.js";
import { clientNavOpenCompany, clientNavOpenTechTree } from "../../src/app/screenNavController.js";

describe("clientHudController", () => {
  it("formats city status by default", () => {
    const boot = createGameBootstrapFromRepo();
    expect(formatClientHudStatus(boot)).toMatch(/^M\d+ · \d+ · CITY-START$/);
  });

  it("formats company snapshot when on screen_company", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenCompany(boot);
    expect(formatClientHudStatus(boot)).toMatch(/^Company · Lv\d+ · \d+ · ads=/);
  });

  it("formats tech tree when on screen_tech_tree", () => {
    const boot = createGameBootstrapFromRepo();
    clientNavOpenTechTree(boot);
    const line = formatClientHudStatus(boot);
    expect(line.startsWith("Tech ·")).toBe(true);
  });
});
