import fs from "node:fs";
import path from "node:path";
import { resolveClientCocosRoot } from "./clientPaths.js";

export interface CocosHudCloseCheckItem {
  id: string;
  ok: boolean;
  detail: string;
}

export interface CocosHudCloseStaticCheckOptions {
  withWechatBuildFreshness?: boolean;
}

interface RequiredFile {
  relativePath: string;
  markers: string[];
}

const REQUIRED_FILES: RequiredFile[] = [
  {
    relativePath: "assets/scripts/GameRoot.ts",
    markers: ["CityHudPanel", "defaultRewardedAdUnitId", "bindGameBoot"]
  },
  {
    relativePath: "assets/scripts/CityHudPanel.ts",
    markers: ["PlayableHudShell", "CityScreenPanel", "EventModalPanel", "RunResultScreenPanel"]
  },
  {
    relativePath: "assets/scripts/screens/city/CityScreenPanel.ts",
    markers: ["CityBuildPickerSheet", "buildSelectedCityFacility", "advanceCityMonth", "月结完成"]
  },
  {
    relativePath: "assets/scripts/screens/city/cityViewModel.ts",
    markers: ["readCityScreenViewModel", "建设第一座电源", "buildPickerItems"]
  },
  {
    relativePath: "assets/scripts/screens/city/cityActions.ts",
    markers: ["buildSelectedCityFacility", "advanceCityMonth"]
  },
  {
    relativePath: "assets/scripts/hudLayout.ts",
    markers: ["竖屏原生布局", "actionH", "marginX"]
  }
];

function readIfPresent(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function checkRequiredFile(cocosRoot: string, item: RequiredFile): CocosHudCloseCheckItem {
  const filePath = path.join(cocosRoot, ...item.relativePath.split("/"));
  const source = readIfPresent(filePath);
  const missingMarkers = item.markers.filter((marker) => !source.includes(marker));
  return {
    id: `client-file:${item.relativePath}`,
    ok: fs.existsSync(filePath) && missingMarkers.length === 0,
    detail: !fs.existsSync(filePath)
      ? "missing"
      : missingMarkers.length > 0
        ? `missing behavior marker(s): ${missingMarkers.join(", ")}`
        : "present"
  };
}

function checkPortraitScene(cocosRoot: string): CocosHudCloseCheckItem {
  const scenePath = path.join(cocosRoot, "assets", "CityDetail.scene");
  const source = readIfPresent(scenePath);
  const portraitSize = /"width"\s*:\s*720[\s\S]*?"height"\s*:\s*1280/.test(source);
  const portraitCamera = /"_orthoHeight"\s*:\s*640/.test(source);
  return {
    id: "client-scene:portrait-reference",
    ok: portraitSize && portraitCamera,
    detail: portraitSize && portraitCamera ? "720x1280, camera 640" : "CityDetail must use portrait reference geometry"
  };
}

function checkLegacyShellRemoved(cocosRoot: string): CocosHudCloseCheckItem {
  const scripts = path.join(cocosRoot, "assets", "scripts");
  const panelSource = readIfPresent(path.join(scripts, "CityHudPanel.ts"));
  const legacyFiles = ["cityHudStageSpec.ts", "uiShellStageSpec.ts"].filter((name) =>
    fs.existsSync(path.join(scripts, name))
  );
  const legacyImports = ["cityHudStageSpec", "uiShellStageSpec", "UI_SHELL_ALL_SLOTS"].filter((marker) =>
    panelSource.includes(marker)
  );
  return {
    id: "client-architecture:no-placeholder-shell",
    ok: legacyFiles.length === 0 && legacyImports.length === 0,
    detail:
      legacyFiles.length === 0 && legacyImports.length === 0
        ? "legacy placeholder shell removed"
        : `legacy artifacts remain: ${[...legacyFiles, ...legacyImports].join(", ")}`
  };
}

function resolveWechatRequirePath(buildRoot: string, request: string): string | null {
  if (request.startsWith("./") || request.startsWith("../")) {
    const resolved = path.resolve(buildRoot, request);
    return path.extname(resolved) ? resolved : `${resolved}.js`;
  }
  if (request.startsWith("src/")) return path.join(buildRoot, request);
  return null;
}

function checkWechatBuildStartupModules(cocosRoot: string): CocosHudCloseCheckItem {
  const buildRoot = path.join(cocosRoot, "build", "wechatgame");
  const gamePath = path.join(buildRoot, "game.js");
  if (!fs.existsSync(gamePath)) {
    return { id: "wechat-build:startup-modules", ok: true, detail: "wechat build not present; skipped" };
  }
  const source = fs.readFileSync(gamePath, "utf8");
  const requiredPaths = [...source.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)]
    .map((match) => match[1] ?? "")
    .map((request) => ({ request, filePath: resolveWechatRequirePath(buildRoot, request) }))
    .filter((item): item is { request: string; filePath: string } => item.filePath !== null);
  const missing = requiredPaths.filter((item) => !fs.existsSync(item.filePath));
  return {
    id: "wechat-build:startup-modules",
    ok: missing.length === 0,
    detail: missing.length === 0
      ? `startup modules present (${requiredPaths.length})`
      : `missing: ${missing.map((item) => item.request).join(", ")}`
  };
}

function checkWechatBuildFreshness(cocosRoot: string): CocosHudCloseCheckItem {
  const buildEntry = path.join(cocosRoot, "build", "wechatgame", "assets", "main", "index.js");
  if (!fs.existsSync(buildEntry)) {
    return { id: "wechat-build:freshness", ok: true, detail: "wechat build not present; skipped" };
  }
  const sourceFiles = REQUIRED_FILES.map((item) =>
    path.join(cocosRoot, ...item.relativePath.split("/"))
  ).filter((filePath) => fs.existsSync(filePath));
  const newestSource = Math.max(...sourceFiles.map((filePath) => fs.statSync(filePath).mtimeMs));
  const buildTime = fs.statSync(buildEntry).mtimeMs;
  return {
    id: "wechat-build:freshness",
    ok: buildTime >= newestSource,
    detail: buildTime >= newestSource ? "wechat build is newer than client sources" : "wechat build predates current client sources"
  };
}

/** 少量结构护栏；真实完成度由 Cocos 预览点击和目标尺寸截图判断。 */
export function runCocosHudCloseStaticChecks(
  repoRoot: string,
  options: CocosHudCloseStaticCheckOptions = {}
): CocosHudCloseCheckItem[] {
  const cocosRoot = resolveClientCocosRoot(repoRoot);
  const checks = REQUIRED_FILES.map((item) => checkRequiredFile(cocosRoot, item));
  checks.push(checkPortraitScene(cocosRoot));
  checks.push(checkLegacyShellRemoved(cocosRoot));
  if (options.withWechatBuildFreshness) {
    checks.push(checkWechatBuildStartupModules(cocosRoot));
    checks.push(checkWechatBuildFreshness(cocosRoot));
  }
  return checks;
}
