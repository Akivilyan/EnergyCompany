import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCocosHudCloseStaticChecks } from "../../src/app/cocosHudCloseCheck.js";

describe("cocos HUD structural checks", () => {
  it("accepts the focused portrait playable shell", () => {
    const root = makeFixture();
    const checks = runCocosHudCloseStaticChecks(root);
    expect(checks.filter((item) => !item.ok)).toEqual([]);
    expect(checks).toHaveLength(8);
  });

  it("rejects the old landscape scene", () => {
    const root = makeFixture();
    fs.writeFileSync(
      path.join(root, "client", "cocos", "assets", "CityDetail.scene"),
      '{"width":1280,"height":720,"_orthoHeight":360}',
      "utf8"
    );
    const check = runCocosHudCloseStaticChecks(root).find(
      (item) => item.id === "client-scene:portrait-reference"
    );
    expect(check?.ok).toBe(false);
  });

  it("rejects reintroduced placeholder shell specs", () => {
    const root = makeFixture();
    fs.writeFileSync(
      path.join(root, "client", "cocos", "assets", "scripts", "cityHudStageSpec.ts"),
      "export const legacy = true;",
      "utf8"
    );
    const check = runCocosHudCloseStaticChecks(root).find(
      (item) => item.id === "client-architecture:no-placeholder-shell"
    );
    expect(check?.ok).toBe(false);
  });
});

function makeFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "energy-playable-hud-"));
  const cocosRoot = path.join(root, "client", "cocos");
  const scriptsRoot = path.join(cocosRoot, "assets", "scripts");
  const files: Record<string, string> = {
    "GameRoot.ts": "CityHudPanel defaultRewardedAdUnitId bindGameBoot",
    "CityHudPanel.ts": "PlayableHudShell CityScreenPanel EventModalPanel RunResultScreenPanel",
    "screens/city/CityScreenPanel.ts": "CityBuildPickerSheet buildSelectedCityFacility advanceCityMonth 月结完成",
    "screens/city/cityViewModel.ts": "readCityScreenViewModel 建设第一座电源 buildPickerItems",
    "screens/city/cityActions.ts": "buildSelectedCityFacility advanceCityMonth",
    "hudLayout.ts": "竖屏原生布局 actionH marginX"
  };
  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(scriptsRoot, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source, "utf8");
  }
  fs.mkdirSync(path.join(cocosRoot, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(cocosRoot, "assets", "CityDetail.scene"),
    '{"width":720,"height":1280,"_orthoHeight":640}',
    "utf8"
  );
  return root;
}
