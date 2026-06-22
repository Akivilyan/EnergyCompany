import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedDir = path.join(root, "client", "cocos", "assets", "shared");
const bundleOut = path.join(sharedDir, "game-client.mjs");
const configSrc = path.join(root, "docs", "design", "data", "vertical-slice-v0");
const configDest = path.join(root, "client", "cocos", "assets", "resources", "config", "v0");
const manifestPath = path.join(root, "client", "cocos", "sync-manifest.json");

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
  "grid_loss_config.json"
];

fs.rmSync(sharedDir, { recursive: true, force: true });
fs.mkdirSync(sharedDir, { recursive: true });

execFileSync(process.execPath, [path.join(root, "scripts", "bundle-client-logic.mjs")], {
  cwd: root,
  stdio: "inherit"
});

fs.mkdirSync(configDest, { recursive: true });
for (const file of configFiles) {
  fs.copyFileSync(path.join(configSrc, file), path.join(configDest, file));
}

const manifest = {
  version: 2,
  syncedAt: new Date().toISOString(),
  configFiles,
  sharedBundle: path.relative(root, bundleOut)
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `client sync ok: bundle=${path.relative(root, bundleOut)}, config=${path.relative(root, configDest)}`
);
