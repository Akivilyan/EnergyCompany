import fs from "node:fs";
import path from "node:path";
import {
  resolveClientCocosRoot,
  resolveClientConfigDir,
  resolveClientSharedDir
} from "./clientPaths.js";

export interface CocosInitCheckItem {
  id: string;
  ok: boolean;
  detail: string;
}

const REQUIRED_SCRIPTS = [
  "GameRoot.ts",
  "CityHudPanel.ts",
  "CocosSceneHost.ts",
  "loadConfigFromResources.ts"
];

const REQUIRED_CONFIG_FILES = [
  "run_config.json",
  "campaign_disasters.json",
  "facilities_slice.json",
  "cities.json",
  "company_levels.json",
  "loan_tiers.json",
  "difficulty_modifiers.json",
  "ad_rewards.json"
];

export function runCocosInitChecks(repoRoot: string): CocosInitCheckItem[] {
  const cocosRoot = resolveClientCocosRoot(repoRoot);
  const scriptsDir = path.join(cocosRoot, "assets", "scripts");
  const configDir = resolveClientConfigDir(repoRoot);
  const sharedDir = resolveClientSharedDir(repoRoot);
  const checks: CocosInitCheckItem[] = [];

  const packageJsonPath = path.join(cocosRoot, "package.json");
  const legacyProjectJsonPath = path.join(cocosRoot, "project.json");
  let cocosProjectOk = false;
  let cocosProjectDetail = path.relative(repoRoot, cocosRoot);
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
        creator?: { version?: string };
      };
      cocosProjectOk = true;
      const version = pkg.creator?.version ?? "unknown";
      cocosProjectDetail = `${cocosProjectDetail} (creator ${version})`;
    } catch {
      cocosProjectDetail = "package.json is invalid JSON";
    }
  } else if (fs.existsSync(legacyProjectJsonPath)) {
    cocosProjectOk = true;
    cocosProjectDetail = `${cocosProjectDetail} (legacy project.json)`;
  } else {
    cocosProjectDetail = "missing package.json (Cocos 3.8+ project root)";
  }
  checks.push({
    id: "cocos-project",
    ok: cocosProjectOk,
    detail: cocosProjectDetail
  });

  for (const file of REQUIRED_SCRIPTS) {
    const fullPath = path.join(scriptsDir, file);
    checks.push({
      id: `script:${file}`,
      ok: fs.existsSync(fullPath),
      detail: path.relative(repoRoot, fullPath)
    });
  }

  checks.push({
    id: "scene-registry",
    ok: fs.existsSync(path.join(cocosRoot, "scene-registry.json")),
    detail: "screenId -> sceneName registry for CocosSceneHost"
  });

  for (const file of REQUIRED_CONFIG_FILES) {
    const fullPath = path.join(configDir, file);
    checks.push({
      id: `config:${file}`,
      ok: fs.existsSync(fullPath),
      detail: path.relative(repoRoot, fullPath)
    });
  }

  const sharedBundle = path.join(sharedDir, "game-client.mjs");
  checks.push({
    id: "shared-sync",
    ok: fs.existsSync(sharedBundle),
    detail: fs.existsSync(sharedBundle)
      ? path.relative(repoRoot, sharedBundle)
      : "missing; run npm run build:client before opening Cocos"
  });

  const sceneFiles = findSceneAssets(cocosRoot);
  checks.push({
    id: "editor-scenes",
    ok: sceneFiles.length > 0,
    detail:
      sceneFiles.length > 0
        ? `found ${sceneFiles.length} scene asset(s): ${sceneFiles.map((item) => path.basename(item)).join(", ")}`
        : "none in repo; create CityDetail in Cocos Editor and set as launch scene"
  });

  return checks;
}

function findSceneAssets(cocosRoot: string): string[] {
  const assetsRoot = path.join(cocosRoot, "assets");
  if (!fs.existsSync(assetsRoot)) return [];
  const found: string[] = [];
  walkDir(assetsRoot, (filePath) => {
    if (filePath.endsWith(".scene")) {
      found.push(filePath);
    }
  });
  return found.sort();
}

function walkDir(dir: string, onFile: (filePath: string) => void): void {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

export function summarizeCocosInitChecks(checks: CocosInitCheckItem[]): {
  passed: number;
  total: number;
  blockingFailed: CocosInitCheckItem[];
  advisoryFailed: CocosInitCheckItem[];
} {
  const blocking = checks.filter((item) => item.id !== "editor-scenes");
  const blockingFailed = blocking.filter((item) => !item.ok);
  const advisoryFailed = checks.filter((item) => item.id === "editor-scenes" && !item.ok);
  const passed = checks.filter((item) => item.ok).length;
  return {
    passed,
    total: checks.length,
    blockingFailed,
    advisoryFailed
  };
}
