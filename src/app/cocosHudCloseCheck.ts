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
  "ScreenHost",
  "CompanyScreenPanel",
  "TechScreenPanel",
  "RegionScreenPanel",
  "WorldScreenPanel",
  "EventModalPanel",
  "RunResultScreenPanel",
  "drawCityBackground",
  "drawCityFacilities",
  "drawCityGrid",
  "drawCityState",
  "drawGridLine",
  "createStageGridSlot",
  "placeStageGridSlot",
  "createStageEffectSlot",
  "placeStageEffectSlot",
  "createStageFeedbackSlot",
  "placeStageFeedbackSlot",
  "createStageAssetSlot",
  "placeStageAssetSlot",
  "syncPanelStateTokens",
  "syncScreenStateToken",
  "syncFacilityAssetStateTokens",
  "EventRailStack",
  "placeEventRail",
  "formatCityShellStatus",
  "formatCityShellDetail",
  "formatPageShellStatus",
  "formatPageShellDetail",
  "syncProductUiShellSlotLabel",
  "resolveProductUiShellSlotText",
  "isCurrentCityScreen",
  "resolveIconRoleToken",
  "CITY_HUD_STAGE_SCREEN_TOKENS.city",
  "CITY_HUD_STAGE_ASSET_TOKENS.resourceRich",
  "CITY_HUD_STAGE_GRID_TOKENS.connected",
  "CITY_HUD_STAGE_EFFECT_TOKENS.construction",
  "CITY_HUD_STAGE_FEEDBACK_TOKENS.disaster",
  "CITY_HUD_STAGE_FEEDBACK_TOKENS.completion",
  "CityScreenPanel",
  "CITY_HUD_STAGE_ICON_TOKENS.active",
  "CITY_HUD_STAGE_ASSET_SLOTS.windTurbine",
  "CITY_HUD_STAGE_ASSET_SLOTS.solarField",
  "CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant",
  "CITY_HUD_STAGE_ASSET_SLOTS.cleanBadge",
  "CITY_HUD_STAGE_ASSET_SLOTS.warningBadge",
  "bindGameBoot"
] as const;

const GAME_ROOT_MARKERS = [
  "defaultRewardedAdUnitId",
  "defaultRewardedAdUnitId: rewardedAdUnitId.length > 0 ? rewardedAdUnitId : undefined"
] as const;

const CITY_HUD_STAGE_SPEC_MARKERS = [
  "CITY_HUD_STAGE_LAYER_NAMES",
  "CITY_HUD_STAGE_SHELL_ORDER",
  "CITY_HUD_STAGE_VISUAL_ORDER",
  "CITY_HUD_STAGE_ASSET_SLOTS",
  "CITY_HUD_STAGE_SCREEN_TOKENS",
  "CITY_HUD_STAGE_ASSET_TOKENS",
  "CITY_HUD_STAGE_GRID_SLOTS",
  "CITY_HUD_STAGE_GRID_TOKENS",
  "CITY_HUD_STAGE_EFFECT_SLOTS",
  "CITY_HUD_STAGE_EFFECT_TOKENS",
  "CITY_HUD_STAGE_FEEDBACK_SLOTS",
  "CITY_HUD_STAGE_FEEDBACK_TOKENS",
  "CITY_HUD_STAGE_STATE_TOKENS",
  "CityVisualLayer",
  "CityBackgroundLayer",
  "CityFacilityLayer",
  "CityGridLayer",
  "CityEffectLayer",
  "CityStateLayer",
  "CityUiLayer",
  "CityIconLayer",
  "StageAssetWindTurbine",
  "StageAssetSolarField",
  "StageAssetHydroPlant",
  "StageGridWindSolar",
  "StageGridSolarHydro",
  "StageEffectBuildGlow",
  "StageEffectGridGlow",
  "StageFeedbackDisasterWarning",
  "StageFeedbackConstructionProgress",
  "StageFeedbackCompletionPulse",
  "city-stage:screen-city",
  "city-stage:screen-company",
  "city-stage:screen-region",
  "city-stage:screen-world",
  "city-stage:screen-tech",
  "city-stage:asset-visible",
  "city-stage:asset-unavailable",
  "city-stage:asset-resource-rich",
  "city-stage:asset-resource-normal",
  "city-stage:asset-placeholder",
  "city-stage:grid-connected",
  "city-stage:grid-disconnected",
  "city-stage:grid-stable",
  "city-stage:grid-weak",
  "city-stage:effect-active",
  "city-stage:effect-construction",
  "city-stage:effect-grid",
  "city-stage:effect-low-cleanliness",
  "city-stage:effect-normal",
  "city-stage:feedback-visible",
  "city-stage:feedback-hidden",
  "city-stage:feedback-disaster",
  "city-stage:feedback-construction",
  "city-stage:feedback-completion",
  "city-stage:feedback-calm",
  "CITY_HUD_STAGE_UI_SLOTS",
  "CITY_HUD_STAGE_UI_TOKENS",
  "CITY_HUD_STAGE_ACTION_SLOTS",
  "CITY_HUD_STAGE_INTERACTION_TOKENS",
  "CITY_HUD_STAGE_ICON_SLOTS",
  "CITY_HUD_STAGE_ICON_TOKENS",
  "CITY_HUD_STAGE_PREFAB_MANIFEST",
  "CityHudStagePrefabManifest",
  "StageUiResourceBar",
  "StageUiCityStateCard",
  "StageUiPrimaryBuildButton",
  "city-stage:ui-resource",
  "city-stage:ui-detail",
  "city-stage:ui-primary-action",
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
  "city-stage:icon-cash",
  "city-stage:icon-social-value",
  "city-stage:icon-cleanliness",
  "city-stage:low-cleanliness"
] as const;

const UI_SHELL_STAGE_SPEC_MARKERS = [
  "UI_SHELL_LAYER_NAMES",
  "UI_SHELL_SCREEN_TOKENS",
  "UI_SHELL_SLOT_STATE_TOKENS",
  "UI_SHELL_SLOT_ROLE_TOKENS",
  "UI_SHELL_ENTRY_SLOTS",
  "UI_SHELL_PAGE_SLOTS",
  "UI_SHELL_MODAL_SLOTS",
  "UI_SHELL_RESULT_SLOTS",
  "UI_SHELL_STAGE_PREFAB_MANIFEST",
  "UI_SHELL_ALL_SLOTS",
  "ProductUiShellLayer",
  "EntryActionStartNewRun",
  "EntryActionContinueRun",
  "EntryActionClearSave",
  "EntryCurrentSaveHint",
  "CompanyOverviewPanel",
  "CompanyCashflowPanel",
  "CompanyLoanAdsUpgradeArea",
  "TechBranchTabs",
  "TechNodeGraphPlaceholder",
  "TechResearchDrawer",
  "RegionCityNodeLayer",
  "RegionLinkBuildBar",
  "WorldRegionNodeLayer",
  "WorldBackboneLinkLayer",
  "WorldSuperHydroEntryCard",
  "EventFullscreenModalShell",
  "EventModalArtSlot",
  "EventModalConfirmButton",
  "RunResultBanner",
  "RunResultRouteSummary",
  "RunResultRestartEntry",
  "ui-shell:screen-main-menu",
  "ui-shell:screen-city-detail",
  "ui-shell:screen-company",
  "ui-shell:screen-tech-tree",
  "ui-shell:screen-region",
  "ui-shell:screen-world-map",
  "ui-shell:screen-run-result",
  "ui-shell:slot-active",
  "ui-shell:slot-hidden",
  "ui-shell:slot-placeholder",
  "ui-shell:slot-bound",
  "ui-shell:role-resource-bar",
  "ui-shell:role-status-card",
  "ui-shell:role-action-area",
  "ui-shell:role-bottom-nav",
  "ui-shell:role-asset-slot",
  "ui-shell:role-graph",
  "ui-shell:role-map",
  "ui-shell:role-modal",
  "ui-shell:role-result"
] as const;

const CITY_HUD_STAGE_PREFAB_MANIFEST_MARKERS = [
  "screen_city_detail",
  "layers",
  "background",
  "buildings",
  "grid",
  "effects",
  "ui",
  "icons",
  "requiredAssetSlots",
  "requiredGridSlots",
  "requiredEffectSlots",
  "requiredFeedbackSlots",
  "requiredUiSlots",
  "requiredIconSlots",
  "playablePath",
  "primaryAction",
  "cycleAction",
  "advanceAction",
  "runtimeGate",
  "canBuildInCity",
  "requiredRuntimeTokens"
] as const;

const CITY_HUD_LAYOUT_BUTTON_MARKERS = [
  "WorldActionQueueSuperHydroGrid"
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
  const gameRootPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "GameRoot.ts"
  );
  const stageSpecPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "cityHudStageSpec.ts"
  );
  const uiShellSpecPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "uiShellStageSpec.ts"
  );
  const layoutPath = path.join(
    resolveClientCocosRoot(repoRoot),
    "assets",
    "scripts",
    "hudLayout.ts"
  );
  const screenPanelSource = [
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "city", "CityScreenPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "world", "WorldScreenPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "region", "RegionScreenPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "tech", "TechScreenPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "company", "CompanyScreenPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "event", "EventModalPanel.ts"),
    path.join(resolveClientCocosRoot(repoRoot), "assets", "scripts", "screens", "result", "RunResultScreenPanel.ts")
  ]
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");
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
  const layoutSource = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, "utf8") : "";
  for (const marker of CITY_HUD_PANEL_MARKERS) {
    checks.push({
      id: `hud:${marker}`,
      ok: source.includes(marker),
      detail: marker
    });
  }
  const gameRootSource = fs.existsSync(gameRootPath) ? fs.readFileSync(gameRootPath, "utf8") : "";
  for (const marker of GAME_ROOT_MARKERS) {
    checks.push({
      id: `game-root:${marker}`,
      ok: gameRootSource.includes(marker),
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
    id: "hud:ui-shell-stage-spec-file",
    ok: fs.existsSync(uiShellSpecPath),
    detail: path.relative(repoRoot, uiShellSpecPath)
  });
  const uiShellSpecSource = fs.existsSync(uiShellSpecPath)
    ? fs.readFileSync(uiShellSpecPath, "utf8")
    : "";
  for (const marker of UI_SHELL_STAGE_SPEC_MARKERS) {
    checks.push({
      id: `hud:ui-shell-spec:${marker}`,
      ok: uiShellSpecSource.includes(marker),
      detail: marker
    });
  }
  checks.push({
    id: "hud:ui-shell-spec-import",
    ok:
      source.includes("./uiShellStageSpec") &&
      source.includes("UI_SHELL_ALL_SLOTS") &&
      source.includes("UI_SHELL_LAYER_NAMES") &&
      source.includes("UI_SHELL_SCREEN_TOKENS") &&
      source.includes("UI_SHELL_SLOT_STATE_TOKENS"),
    detail: "CityHudPanel imports product UI shell spec"
  });
  checks.push({
    id: "hud:ui-shell-runtime-slots",
    ok:
      source.includes("productUiShellLayer") &&
      source.includes("productUiShellSlots") &&
      source.includes("createProductUiShellSlots") &&
      source.includes("syncProductUiShellSlots") &&
      source.includes("slotMatchesCurrentScreen") &&
      source.includes("redrawProductUiShellSlot") &&
      source.includes("UI_SHELL_SLOT_STATE_TOKENS.active") &&
      source.includes("UI_SHELL_SLOT_STATE_TOKENS.bound"),
    detail: "CityHudPanel creates and synchronizes product UI shell runtime slots"
  });
  checks.push({
    id: "hud:mobile-ui-safe-zone-layout",
    ok:
      layoutSource.includes("topInset = Math.min(122") &&
      layoutSource.includes("bottomInset = Math.min(118") &&
      layoutSource.includes("Math.max(86, container.height * 0.13)") &&
      layoutSource.includes("Math.max(94, container.height * 0.14)") &&
      layoutSource.includes("Math.max(28, actionRowH"),
    detail: "HUD layout keeps top/bottom safe zones and mobile touch targets above the game UI minimum"
  });
  checks.push({
    id: "hud:city-primary-action-layout",
    ok:
      screenPanelSource.includes("class CityScreenPanel") &&
      screenPanelSource.includes("placeCityActionButtons") &&
      screenPanelSource.includes("primaryW = row.width - gap * 2 - sideW * 2") &&
      screenPanelSource.includes("i === 2 ? Math.round(fontSize * 1.04)") &&
      screenPanelSource.includes("this.advanceMonthBtn.node.active = true"),
    detail: "city screen keeps next-month as the larger city-only primary CTA"
  });
  checks.push({
    id: "hud:product-page-shell-visuals",
    ok:
      source.includes("resolveProductShellFill") &&
      source.includes("drawProductShellContent") &&
      source.includes("drawTechGraphShell") &&
      source.includes("drawCompanyOverviewShell") &&
      source.includes("drawRegionMapShell") &&
      source.includes("drawWorldMapShell") &&
      source.includes("drawWorldBackboneShell"),
    detail: "company, tech, region, and world screens render visible page shells instead of debug text only"
  });
  checks.push({
    id: "hud:city-build-picker-shell",
    ok:
      screenPanelSource.includes("CityBuildPickerSheet") &&
      screenPanelSource.includes("CityBuildPickerRow") &&
      screenPanelSource.includes("readCityScreenViewModel") &&
      screenPanelSource.includes("onBuildPickerRow") &&
      screenPanelSource.includes("buildSelectedCityFacility(this.boot, facilityId)") &&
      screenPanelSource.includes("this.buildPickerOpen = true"),
    detail: "city construction uses a build picker sheet before queuing a facility"
  });
  checks.push({
    id: "hud:region-drag-link-shell",
    ok:
      screenPanelSource.includes("onMapTouchStart") &&
      screenPanelSource.includes("onMapTouchMove") &&
      screenPanelSource.includes("onMapTouchEnd") &&
      screenPanelSource.includes("queueRegionLinkByCityPair") &&
      screenPanelSource.includes("resolveRegionMapPoints") &&
      screenPanelSource.includes("findNearestRegionPoint"),
    detail: "region map supports drag-from-city to city link preview and queue action"
  });
  checks.push({
    id: "hud:region-fullscreen-map-slot",
    ok:
      uiShellSpecSource.includes('nodeName: "RegionCityNodeLayer"') &&
      uiShellSpecSource.includes("widthRatio: 0.88") &&
      uiShellSpecSource.includes("heightRatio: 0.58") &&
      uiShellSpecSource.includes('nodeName: "RegionLinkBuildBar"') &&
      uiShellSpecSource.includes("widthRatio: 0.74"),
    detail: "region screen allocates the map as the main full-width play surface"
  });
  checks.push({
    id: "hud:non-city-page-content-space",
    ok:
      source.includes("const onCity = this.isCurrentCityScreen()") &&
      source.includes("this.detailBand.active = onCity") &&
      source.includes("this.hintLabel.node.active = onCity"),
    detail: "non-city screens hide the city state card so page content has usable space"
  });
  checks.push({
    id: "hud:city-stage-prefab-manifest",
    ok:
      stageSpecSource.includes("CITY_HUD_STAGE_PREFAB_MANIFEST") &&
      CITY_HUD_STAGE_PREFAB_MANIFEST_MARKERS.every((marker) => stageSpecSource.includes(marker)),
    detail: "city stage prefab manifest covers layers, required slots, runtime tokens, and playable path"
  });
  checks.push({
    id: "hud:city-stage-prefab-layer-groups",
    ok:
      stageSpecSource.includes("background: CITY_HUD_STAGE_LAYER_NAMES.background") &&
      stageSpecSource.includes("buildings: CITY_HUD_STAGE_LAYER_NAMES.facility") &&
      stageSpecSource.includes("grid: CITY_HUD_STAGE_LAYER_NAMES.grid") &&
      stageSpecSource.includes("effects: CITY_HUD_STAGE_LAYER_NAMES.effect") &&
      stageSpecSource.includes("ui: CITY_HUD_STAGE_LAYER_NAMES.ui") &&
      stageSpecSource.includes("icons: CITY_HUD_STAGE_LAYER_NAMES.icon"),
    detail: "prefab manifest maps background/buildings/grid/effects/ui/icons layers"
  });
  checks.push({
    id: "hud:city-stage-prefab-critical-slots",
    ok:
      stageSpecSource.includes("CITY_HUD_STAGE_ASSET_SLOTS.windTurbine") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ASSET_SLOTS.solarField") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant") &&
      stageSpecSource.includes("CITY_HUD_STAGE_GRID_SLOTS.windSolar") &&
      stageSpecSource.includes("CITY_HUD_STAGE_GRID_SLOTS.solarHydro") &&
      stageSpecSource.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS.disasterWarning") &&
      stageSpecSource.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS.constructionProgress") &&
      stageSpecSource.includes("CITY_HUD_STAGE_UI_SLOTS.resourceBar") &&
      stageSpecSource.includes("CITY_HUD_STAGE_UI_SLOTS.cityStateCard") &&
      stageSpecSource.includes("CITY_HUD_STAGE_UI_SLOTS.primaryBuildButton") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ICON_SLOTS.cash") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ICON_SLOTS.socialValue") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ICON_SLOTS.cleanliness"),
    detail: "prefab manifest includes required city sample slots"
  });
  checks.push({
    id: "hud:city-stage-prefab-runtime-tokens",
    ok:
      stageSpecSource.includes("CITY_HUD_STAGE_INTERACTION_TOKENS.active") &&
      stageSpecSource.includes("CITY_HUD_STAGE_INTERACTION_TOKENS.hidden") &&
      stageSpecSource.includes("CITY_HUD_STAGE_ASSET_TOKENS.unavailable") &&
      stageSpecSource.includes("CITY_HUD_STAGE_GRID_TOKENS.connected") &&
      stageSpecSource.includes("CITY_HUD_STAGE_EFFECT_TOKENS.lowCleanliness") &&
      stageSpecSource.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.disaster") &&
      stageSpecSource.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.construction") &&
      stageSpecSource.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.completion") &&
      stageSpecSource.includes("CITY_HUD_STAGE_STATE_TOKENS.clean") &&
      stageSpecSource.includes("CITY_HUD_STAGE_STATE_TOKENS.lowCleanliness") &&
      stageSpecSource.includes("CITY_HUD_STAGE_UI_TOKENS.primaryAction"),
    detail: "prefab manifest includes required runtime state tokens"
  });
  checks.push({
    id: "hud:city-stage-spec-import",
    ok:
      source.includes("./cityHudStageSpec") &&
      source.includes("CITY_HUD_STAGE_ASSET_SLOTS") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS") &&
      source.includes("CITY_HUD_STAGE_ASSET_TOKENS") &&
      source.includes("CITY_HUD_STAGE_GRID_SLOTS") &&
      source.includes("CITY_HUD_STAGE_GRID_TOKENS") &&
      source.includes("CITY_HUD_STAGE_EFFECT_SLOTS") &&
      source.includes("CITY_HUD_STAGE_EFFECT_TOKENS") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS") &&
      source.includes("CITY_HUD_STAGE_UI_SLOTS") &&
      source.includes("CITY_HUD_STAGE_UI_TOKENS") &&
      source.includes("CITY_HUD_STAGE_ACTION_SLOTS") &&
      source.includes("CITY_HUD_STAGE_ICON_SLOTS") &&
      source.includes("CITY_HUD_STAGE_ICON_TOKENS") &&
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
  checks.push({
    id: "hud:city-stage-panel-icon-tokens",
    ok:
      source.includes("syncPanelStateTokens") &&
      source.includes("resolveIconRoleToken") &&
      source.includes("CITY_HUD_STAGE_UI_TOKENS.resource") &&
      source.includes("CITY_HUD_STAGE_UI_TOKENS.detail") &&
      (source.includes("CITY_HUD_STAGE_UI_TOKENS.primaryAction") ||
        screenPanelSource.includes("StageUiPrimaryBuildButton")) &&
      source.includes("CITY_HUD_STAGE_ICON_TOKENS.active"),
    detail: "CityHudPanel applies panel and icon runtime tokens"
  });
  checks.push({
    id: "hud:city-stage-screen-asset-tokens",
    ok:
      source.includes("syncScreenStateToken") &&
      source.includes("syncFacilityAssetStateTokens") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS.city") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS.company") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS.region") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS.world") &&
      source.includes("CITY_HUD_STAGE_SCREEN_TOKENS.tech") &&
      source.includes("CITY_HUD_STAGE_ASSET_TOKENS.visible") &&
      source.includes("CITY_HUD_STAGE_ASSET_TOKENS.unavailable") &&
      source.includes("CITY_HUD_STAGE_ASSET_TOKENS.resourceRich") &&
      source.includes("CITY_HUD_STAGE_ASSET_TOKENS.placeholder"),
    detail: "CityHudPanel applies screen and facility asset runtime tokens"
  });
  checks.push({
    id: "hud:city-stage-grid-effect-tokens",
    ok:
      source.includes("createStageGridSlot") &&
      source.includes("placeStageGridSlot") &&
      source.includes("createStageEffectSlot") &&
      source.includes("placeStageEffectSlot") &&
      source.includes("CITY_HUD_STAGE_GRID_SLOTS.windSolar") &&
      source.includes("CITY_HUD_STAGE_GRID_SLOTS.solarHydro") &&
      source.includes("CITY_HUD_STAGE_GRID_TOKENS.connected") &&
      source.includes("CITY_HUD_STAGE_GRID_TOKENS.disconnected") &&
      source.includes("CITY_HUD_STAGE_EFFECT_SLOTS.buildGlow") &&
      source.includes("CITY_HUD_STAGE_EFFECT_SLOTS.gridGlow") &&
      source.includes("CITY_HUD_STAGE_EFFECT_TOKENS.construction") &&
      source.includes("CITY_HUD_STAGE_EFFECT_TOKENS.lowCleanliness"),
    detail: "CityHudPanel applies grid and effect runtime tokens"
  });
  checks.push({
    id: "hud:city-stage-feedback-tokens",
    ok:
      source.includes("createStageFeedbackSlot") &&
      source.includes("placeStageFeedbackSlot") &&
      source.includes("hasPendingDisasterFeedback") &&
      source.includes("hasConstructionFeedback") &&
      source.includes("hasCompletionFeedback") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS.disasterWarning") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS.constructionProgress") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_SLOTS.completionPulse") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.visible") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.hidden") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.disaster") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.construction") &&
      source.includes("CITY_HUD_STAGE_FEEDBACK_TOKENS.completion"),
    detail: "CityHudPanel applies temporary feedback runtime tokens"
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
      ok:
        layoutCalls.some((call) => call.includes(`this.${marker}`)) ||
        (screenPanelSource.includes(marker) && screenPanelSource.includes("placeHudButtons")),
      detail: `${marker} in screen panel button layout`
    });
  }
  if (options.withWechatBuildFreshness) {
    checks.push(checkLatestWechatBuildLog(repoRoot));
    checks.push(checkWechatBuildStartupModules(repoRoot));
    checks.push(checkWechatBuildFreshness(repoRoot));
  }

  return checks;
}
