import fs from "node:fs";
import path from "node:path";
import { resolveClientCocosRoot } from "./clientPaths.js";

export interface CocosHudCloseCheckItem {
  id: string;
  ok: boolean;
  detail: string;
}

const CITY_HUD_PANEL_MARKERS = [
  "onOpenCompany",
  "onOpenRegion",
  "onOpenTech",
  "onAckEvent",
  "onQueueRegionLink",
  "bindGameBoot"
] as const;

export interface CocosHudCloseStaticCheckOptions {
  withWechatBuildFreshness?: boolean;
}

function checkWechatBuildFreshness(repoRoot: string): CocosHudCloseCheckItem {
  const indexPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "build",
    "wechatgame",
    "assets",
    "main",
    "index.js"
  );
  if (!fs.existsSync(indexPath)) {
    return {
      id: "wechat-build:fresh-city-hud-panel",
      ok: true,
      detail: "wechat build not present; skipped"
    };
  }

  const source = fs.readFileSync(indexPath, "utf8");
  const staleBandOverflow =
    source.includes("overflow=d.RESIZE_HEIGHT") ||
    source.includes(".overflow=d.RESIZE_HEIGHT") ||
    source.includes("Overflow.RESIZE_HEIGHT");
  const hasCapabilityGate =
    source.includes("getClientHudCapabilities") ||
    source.includes("canQueueRegionLink") ||
    source.includes("canOperateTech");

  return {
    id: "wechat-build:fresh-city-hud-panel",
    ok: !staleBandOverflow && hasCapabilityGate,
    detail: staleBandOverflow
      ? "stale build output: CityHudPanel still uses RESIZE_HEIGHT; clear Cocos script cache and rebuild WeChat package"
      : hasCapabilityGate
        ? "wechat build includes current CityHudPanel"
        : "stale build output: CityHudPanel capability gate missing; clear Cocos script cache and rebuild WeChat package"
  };
}

/** 静态检查：Cocos 脚本是否包含 T50 开发 HUD 关键入口（无需打开编辑器）。 */
export function runCocosHudCloseStaticChecks(
  repoRoot: string,
  options: CocosHudCloseStaticCheckOptions = {}
): CocosHudCloseCheckItem[] {
  const panelPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "CityHudPanel.ts"
  );
  const checks: CocosHudCloseCheckItem[] = [];

  if (!fs.existsSync(panelPath)) {
    return [
      {
        id: "city-hud-panel",
        ok: false,
        detail: path.relative(repoRoot, panelPath)
      }
    ];
  }

  const source = fs.readFileSync(panelPath, "utf8");
  for (const marker of CITY_HUD_PANEL_MARKERS) {
    checks.push({
      id: `hud:${marker}`,
      ok: source.includes(marker),
      detail: marker
    });
  }
  if (options.withWechatBuildFreshness) {
    checks.push(checkWechatBuildFreshness(repoRoot));
  }

  return checks;
}
