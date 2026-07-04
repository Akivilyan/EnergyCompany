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
  "onQueueSuperHydroGrid",
  "worldQueueSuperHydroGridLink",
  "drawCityBackground",
  "drawCityFacilities",
  "drawCityGrid",
  "drawCityState",
  "drawGridLine",
  "bindGameBoot"
] as const;

const CITY_HUD_STAGE_SPEC_MARKERS = [
  "CITY_HUD_STAGE_LAYER_NAMES",
  "CITY_HUD_STAGE_SHELL_ORDER",
  "CITY_HUD_STAGE_VISUAL_ORDER",
  "CITY_HUD_STAGE_ASSET_SLOTS",
  "CITY_HUD_STAGE_STATE_TOKENS",
  "CityVisualLayer",
  "CityBackgroundLayer",
  "CityFacilityLayer",
  "CityGridLayer",
  "CityStateLayer",
  "CityUiLayer",
  "CityIconLayer",
  "StageAssetWindTurbine",
  "StageAssetSolarField",
  "StageAssetHydroPlant",
  "CITY_HUD_STAGE_UI_SLOTS",
  "CITY_HUD_STAGE_ACTION_SLOTS",
  "CITY_HUD_STAGE_INTERACTION_TOKENS",
  "CITY_HUD_STAGE_ICON_SLOTS",
  "StageUiResourceBar",
  "StageUiCityStateCard",
  "StageUiPrimaryBuildButton",
  "StageActionCycleBuild",
  "StageActionAdvanceMonth",
  "StageActionQueueRegionLink",
  "StageActionQueueSuperHydroGrid",
  "StageNavCompany",
  "StageNavBack",
  "city-stage:action-primary",
  "city-stage:action-reward",
  "StageIconCash",
  "StageIconSocialValue",
  "StageIconCleanliness",
  "city-stage:low-cleanliness"
] as const;

const CITY_HUD_LAYOUT_BUTTON_MARKERS = [
  "queueSuperHydroGridBtn"
] as const;

export interface CocosHudCloseStaticCheckOptions {
  withWechatBuildFreshness?: boolean;
}

function resolveWechatRequirePath(buildRoot: string, request: string): string | null {
  if (request.startsWith("./") || request.startsWith("../")) {
    const resolved = path.resolve(buildRoot, request);
    return path.extname(resolved) ? resolved : `${resolved}.js`;
  }
  if (request.startsWith("src/")) {
    return path.join(buildRoot, request);
  }
  return null;
}

function checkWechatBuildStartupModules(repoRoot: string): CocosHudCloseCheckItem {
  const buildRoot = path.join(resolveClientCocosRoot(repoRoot), "build", "wechatgame");
  const gamePath = path.join(buildRoot, "game.js");
  if (!fs.existsSync(gamePath)) {
    return {
      id: "wechat-build:startup-modules",
      ok: true,
      detail: "wechat build not present; skipped"
    };
  }

  const source = fs.readFileSync(gamePath, "utf8");
  const requireRequests: string[] = [];
  for (const match of source.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    requireRequests.push(match[1] ?? "");
  }
  const requiredPaths = requireRequests
    .filter((request) => request.length > 0)
    .map((request) => ({
      request,
      filePath: resolveWechatRequirePath(buildRoot, request)
    }))
    .filter((item): item is { request: string; filePath: string } => item.filePath !== null);

  const missing = requiredPaths.filter((item) => !fs.existsSync(item.filePath));
  return {
    id: "wechat-build:startup-modules",
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? `wechat startup modules present (${requiredPaths.length} require calls)`
        : `missing startup module(s): ${missing
            .map((item) => item.request)
            .join(", ")}; Cocos reported a half-built WeChat package, clear build/wechatgame and rebuild after script compilation finishes`
  };
}

function checkLatestWechatBuildLog(repoRoot: string): CocosHudCloseCheckItem {
  const cocosRoot = resolveClientCocosRoot(repoRoot);
  const gamePath = path.join(cocosRoot, "build", "wechatgame", "game.js");
  if (!fs.existsSync(gamePath)) {
    return {
      id: "wechat-build:last-build-log",
      ok: true,
      detail: "wechat build not present; skipped"
    };
  }

  const logDir = path.join(cocosRoot, "temp", "builder", "log");
  if (!fs.existsSync(logDir)) {
    return {
      id: "wechat-build:last-build-log",
      ok: true,
      detail: "Cocos builder log not present; skipped"
    };
  }

  const logNames: string[] = fs
    .readdirSync(logDir)
    .filter((name: string) => /^wechatgame.*\.log$/i.test(name));
  const logs: Array<{ name: string; filePath: string; modifiedMs: number }> = logNames
    .map((name: string) => {
      const filePath = path.join(logDir, name);
      return { name, filePath, modifiedMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.modifiedMs - a.modifiedMs);
  const latest = logs[0];
  if (!latest) {
    return {
      id: "wechat-build:last-build-log",
      ok: true,
      detail: "wechat build log not present; skipped"
    };
  }

  const source = fs.readFileSync(latest.filePath, "utf8");
  const terminatedBuildScript =
    source.includes("SIGTERM in task build-script") ||
    source.includes("Exit process with code:null, signal:SIGTERM in task build-script");
  const startupModules = checkWechatBuildStartupModules(repoRoot);
  return {
    id: "wechat-build:last-build-log",
    ok: !terminatedBuildScript || startupModules.ok,
    detail: !terminatedBuildScript
      ? `${latest.name}: no build-script SIGTERM found`
      : startupModules.ok
        ? `${latest.name}: build-script SIGTERM found, but startup modules are present; non-blocking`
        : `${latest.name}: build-script was terminated by SIGTERM and startup modules are missing; Cocos may still report success while leaving a half-built WeChat package`
  };
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
  const stageSpecPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "cityHudStageSpec.ts"
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
  checks.push({
    id: "hud:city-stage-spec-file",
    ok: fs.existsSync(stageSpecPath),
    detail: path.relative(repoRoot, stageSpecPath)
  });
  const stageSpecSource = fs.existsSync(stageSpecPath)
    ? fs.readFileSync(stageSpecPath, "utf8")
    : "";
  for (const marker of CITY_HUD_STAGE_SPEC_MARKERS) {
    checks.push({
      id: `hud:stage-spec:${marker}`,
      ok: stageSpecSource.includes(marker),
      detail: marker
    });
  }
  checks.push({
    id: "hud:city-stage-spec-import",
    ok:
      source.includes("./cityHudStageSpec") &&
      source.includes("CITY_HUD_STAGE_ASSET_SLOTS") &&
      source.includes("CITY_HUD_STAGE_UI_SLOTS") &&
      source.includes("CITY_HUD_STAGE_ACTION_SLOTS") &&
      source.includes("CITY_HUD_STAGE_ICON_SLOTS") &&
      source.includes("CITY_HUD_STAGE_INTERACTION_TOKENS"),
    detail: "CityHudPanel imports city stage spec"
  });
  checks.push({
    id: "hud:city-stage-interaction-tokens",
    ok:
      source.includes("syncButtonStateTokens") &&
      source.includes("resolveButtonRoleToken") &&
      source.includes("resolveButtonFill") &&
      source.includes("CITY_HUD_STAGE_INTERACTION_TOKENS.active") &&
      source.includes("CITY_HUD_STAGE_INTERACTION_TOKENS.hidden"),
    detail: "CityHudPanel applies interaction state and role tokens"
  });
  checks.push({
    id: "hud:city-stage-layer-order",
    ok:
      source.includes("applyStageLayerOrder") &&
      source.includes("CITY_HUD_STAGE_SHELL_ORDER") &&
      source.includes("CITY_HUD_STAGE_VISUAL_ORDER") &&
      source.includes("setSiblingIndex"),
    detail: "CityHudPanel applies city stage layer order"
  });
  const layoutCalls: string[] = [];
  const layoutCallPattern = /this\.placeRowButtons\([\s\S]*?\);/g;
  let layoutCallMatch: RegExpExecArray | null = layoutCallPattern.exec(source);
  while (layoutCallMatch) {
    layoutCalls.push(layoutCallMatch[0]);
    layoutCallMatch = layoutCallPattern.exec(source);
  }
  for (const marker of CITY_HUD_LAYOUT_BUTTON_MARKERS) {
    checks.push({
      id: `hud:${marker}-layout`,
      ok: layoutCalls.some((call) => call.includes(`this.${marker}`)),
      detail: `${marker} in placeRowButtons`
    });
  }
  if (options.withWechatBuildFreshness) {
    checks.push(checkLatestWechatBuildLog(repoRoot));
    checks.push(checkWechatBuildStartupModules(repoRoot));
    checks.push(checkWechatBuildFreshness(repoRoot));
  }

  return checks;
}
