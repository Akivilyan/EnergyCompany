import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedSrc = path.join(root, "client", "cocos", "assets", "shared", "src");
const configSrc = path.join(root, "docs", "design", "data", "vertical-slice-v0");
const configDest = path.join(root, "client", "cocos", "assets", "resources", "config", "v0");
const manifestPath = path.join(root, "client", "cocos", "sync-manifest.json");

const srcRoots = ["sim", "modules", "ui", "infra", "app"];
const skipFile = (name) => name.endsWith("Cli.ts");

const configFiles = [
  "run_config.json",
  "campaign_disasters.json",
  "facilities_slice.json",
  "cities.json",
  "company_levels.json",
  "loan_tiers.json",
  "difficulty_modifiers.json",
  "ad_rewards.json"
];

function copyDir(src, dest, { fileFilter } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (fileFilter && !fileFilter(name, path.join(src, name))) continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) {
      copyDir(from, to, { fileFilter });
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

fs.rmSync(path.join(root, "client", "cocos", "assets", "shared"), { recursive: true, force: true });

for (const dir of srcRoots) {
  copyDir(path.join(root, "src", dir), path.join(sharedSrc, dir), {
    fileFilter: (name) => !skipFile(name)
  });
}

fs.mkdirSync(configDest, { recursive: true });
for (const file of configFiles) {
  fs.copyFileSync(path.join(configSrc, file), path.join(configDest, file));
}

const manifest = {
  version: 1,
  syncedAt: new Date().toISOString(),
  configFiles,
  sharedFrom: "src"
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`client sync ok: shared=${path.relative(root, sharedSrc)}, config=${path.relative(root, configDest)}`);
