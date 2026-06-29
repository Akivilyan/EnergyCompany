import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedDir = path.join(root, "client", "cocos", "assets", "shared");
const bundleOut = path.join(sharedDir, "game-client.mjs");
const configSrc = path.join(root, "docs", "design", "data", "vertical-slice-v0");
const configDest = path.join(root, "client", "cocos", "assets", "resources", "config", "v0");
const manifestPath = path.join(root, "client", "cocos", "sync-manifest.json");
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
  "grid_loss_config.json",
  "super_hydro_slots.json"
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
  sharedBundle: path.relative(root, bundleOut)
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `client sync ok: bundle=${skipBundle ? "skipped" : path.relative(root, bundleOut)}, config=${skipConfig ? "skipped" : `${copiedConfigFiles.length}/${configFiles.length} copied`}`
);
