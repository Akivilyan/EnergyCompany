import fs from "node:fs";
import path from "node:path";
import { ConfigRepo, type ConfigBundle } from "./configRepo.js";

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/** Node / CLI：从仓库 vertical-slice-v0 目录加载。 */
export function loadConfigRepoFromVerticalSlice(rootDir: string): ConfigRepo {
  const base = path.join(rootDir, "docs", "design", "data", "vertical-slice-v0");
  return loadConfigRepoFromConfigDir(base);
}

/** Node / 冒烟：从扁平 config 目录加载。 */
export function loadConfigRepoFromConfigDir(configDir: string): ConfigRepo {
  const bundle: ConfigBundle = {
    runConfig: readJson(path.join(configDir, "run_config.json")),
    disasters: readJson(path.join(configDir, "campaign_disasters.json")),
    facilities: readJson(path.join(configDir, "facilities_slice.json")),
    cities: readJson(path.join(configDir, "cities.json")),
    companyLevels: readJson(path.join(configDir, "company_levels.json")),
    loanTiers: readJson(path.join(configDir, "loan_tiers.json")),
    difficulties: readJson(path.join(configDir, "difficulty_modifiers.json")),
    adRewards: readJson(path.join(configDir, "ad_rewards.json")),
    technologies: readJson(path.join(configDir, "technology_config.json"))
  };
  return ConfigRepo.fromBundle(bundle);
}
