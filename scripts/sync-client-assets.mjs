import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedDir = path.join(root, "client", "cocos", "assets", "shared");
const bundleOut = path.join(sharedDir, "game-client.mjs");
const configSrc = path.join(root, "docs", "design", "data", "vertical-slice-v0");
const configDest = path.join(root, "client", "cocos", "assets", "resources", "config", "v0");
const manifestPath = path.join(root, "client", "cocos", "sync-manifest.json");
const runtimeArtSrc = path.join(root, "docs", "design", "ui", "assets");
const runtimeArtDest = path.join(root, "client", "cocos", "assets", "resources", "art");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const skipBundle = args.has("--skip-bundle");
const skipConfig = args.has("--skip-config");

const configFiles = [
  "run_config.json",
  "campaign_disasters.json",
  "facilities_slice.json",
  "regions.json",
  "cities.json",
  "company_levels.json",
  "loan_tiers.json",
  "difficulty_modifiers.json",
  "ad_rewards.json",
  "technology_config.json",
  "doctrine_meta_tech_l1.json",
  "grid_loss_config.json",
  "super_hydro_slots.json"
];

const runtimeArtFiles = [
  ["buildings/representative-v1/master/building-wind-tier1-master-v1.png", "buildings/wind-master.png"],
  ["buildings/representative-v1/master/building-solar-tier1-master-v1.png", "buildings/solar-master.png"],
  ["buildings/representative-v1/master/building-thermal-tier1-master-v1.png", "buildings/thermal-master.png"],
  ["buildings/representative-v1/thumbnail/building-wind-tier1-thumbnail-v1.png", "buildings/wind-thumbnail.png"],
  ["buildings/representative-v1/thumbnail/building-solar-tier1-thumbnail-v1.png", "buildings/solar-thumbnail.png"],
  ["buildings/representative-v1/thumbnail/building-thermal-tier1-thumbnail-v1.png", "buildings/thermal-thumbnail.png"],
  ["icons/runtime/resources/icon-funds-v1.png", "icons/funds.png"],
  ["icons/runtime/resources/icon-energy-v1.png", "icons/energy.png"],
  ["icons/runtime/resources/icon-company-exp-v1.png", "icons/company-exp.png"],
  ["icons/runtime/common/icon-calendar-v1.png", "icons/calendar.png"],
  ["icons/runtime/common/icon-turn-income-v1.png", "icons/turn-income.png"],
  ["icons/runtime/common/icon-confirm-v1.png", "icons/confirm.png"],
  ["icons/runtime/tech-point/icon-tech-point-normal-v1.png", "icons/tech-normal.png"],
  ["icons/runtime/tech-point/icon-tech-point-selected-v1.png", "icons/tech-selected.png"],
  ["icons/runtime/tech-point/icon-tech-point-locked-v1.png", "icons/tech-locked.png"],
  ["icons/runtime/action-state/icon-build-v1.png", "icons/build.png"],
  ["icons/runtime/action-state/icon-complete-v1.png", "icons/complete.png"],
  ["icons/runtime/action-state/icon-warning-v1.png", "icons/warning.png"],
  ["icons/runtime/clean-supply/icon-clean-supply-fully-clean-v1.png", "icons/clean.png"],
  ["icons/runtime/clean-supply/icon-clean-supply-needs-improvement-v1.png", "icons/needs-improvement.png"]
];

if (force) {
  fs.rmSync(sharedDir, { recursive: true, force: true });
}
fs.mkdirSync(sharedDir, { recursive: true });

if (!skipBundle) {
  execFileSync(process.execPath, [path.join(root, "scripts", "bundle-client-logic.mjs")], {
    cwd: root,
    stdio: "inherit"
  });
}

fs.mkdirSync(configDest, { recursive: true });
const copiedConfigFiles = [];
const copiedRuntimeArtFiles = [];
if (!skipConfig) {
  for (const file of configFiles) {
    const sourcePath = path.join(configSrc, file);
    const targetPath = path.join(configDest, file);
    if (!fs.existsSync(targetPath) || fs.readFileSync(sourcePath).compare(fs.readFileSync(targetPath)) !== 0) {
      fs.copyFileSync(sourcePath, targetPath);
      copiedConfigFiles.push(file);
    }
  }
}

for (const [sourceFile, targetFile] of runtimeArtFiles) {
  const sourcePath = path.join(runtimeArtSrc, sourceFile);
  const targetPath = path.join(runtimeArtDest, targetFile);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (!fs.existsSync(targetPath) || fs.readFileSync(sourcePath).compare(fs.readFileSync(targetPath)) !== 0) {
    fs.copyFileSync(sourcePath, targetPath);
    copiedRuntimeArtFiles.push(targetFile);
  }
}

const manifest = {
  version: 3,
  syncedAt: new Date().toISOString(),
  mode: {
    force,
    skipBundle,
    skipConfig
  },
  configFiles,
  copiedConfigFiles,
  runtimeArtFiles: runtimeArtFiles.map(([, targetFile]) => targetFile),
  copiedRuntimeArtFiles,
  sharedBundle: path.relative(root, bundleOut)
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `client sync ok: bundle=${skipBundle ? "skipped" : path.relative(root, bundleOut)}, config=${skipConfig ? "skipped" : `${copiedConfigFiles.length}/${configFiles.length} copied`}, art=${copiedRuntimeArtFiles.length}/${runtimeArtFiles.length} copied`
);
