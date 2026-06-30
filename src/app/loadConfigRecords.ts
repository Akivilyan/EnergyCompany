import fs from "node:fs";
import path from "node:path";
import {
  buildConfigBundle,
  configRepoFromBundle,
  V0_CONFIG_JSON_FILES,
  type ConfigBundleInput
} from "../sim/config/configBundle.js";
import type { ConfigRepo } from "../sim/index.js";

function readJsonFile<T>(dir: string, fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8")) as T;
}

/** 从目录读取 JSON 记录并构建 ConfigRepo（模拟 Cocos resources 解析结果）。 */
export function loadConfigRepoFromJsonDir(configDir: string): ConfigRepo {
  const input: ConfigBundleInput = {
    runConfig: readJsonFile(configDir, V0_CONFIG_JSON_FILES.runConfig),
    disasters: readJsonFile(configDir, V0_CONFIG_JSON_FILES.disasters),
    facilities: readJsonFile(configDir, V0_CONFIG_JSON_FILES.facilities),
    regions: readJsonFile(configDir, V0_CONFIG_JSON_FILES.regions),
    cities: readJsonFile(configDir, V0_CONFIG_JSON_FILES.cities),
    companyLevels: readJsonFile(configDir, V0_CONFIG_JSON_FILES.companyLevels),
    loanTiers: readJsonFile(configDir, V0_CONFIG_JSON_FILES.loanTiers),
    difficulties: readJsonFile(configDir, V0_CONFIG_JSON_FILES.difficulties),
    adRewards: readJsonFile(configDir, V0_CONFIG_JSON_FILES.adRewards),
    technologies: readJsonFile(configDir, V0_CONFIG_JSON_FILES.technologies),
    doctrineMetaTechL1: readJsonFile(configDir, V0_CONFIG_JSON_FILES.doctrineMetaTechL1),
    gridLoss: readJsonFile(configDir, V0_CONFIG_JSON_FILES.gridLoss),
    superHydroSlots: readJsonFile(configDir, V0_CONFIG_JSON_FILES.superHydroSlots)
  };
  return configRepoFromBundle(buildConfigBundle(input));
}

/** 从已解析 JSON 记录构建 ConfigRepo（引擎 resources.load 回调路径）。 */
export function loadConfigRepoFromRecords(input: ConfigBundleInput): ConfigRepo {
  return configRepoFromBundle(buildConfigBundle(input));
}
