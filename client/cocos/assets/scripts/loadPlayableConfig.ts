import { JsonAsset, resources } from "cc";
import {
  buildConfigBundle,
  ConfigRepo,
  V0_CONFIG_JSON_FILES,
  V0_CONFIG_RESOURCE_BASE,
  type ConfigBundleInput
} from "../shared/game-client.mjs";

function stripJsonSuffix(fileName: string): string {
  return fileName.replace(/\.json$/, "");
}

function loadJsonAsset<T>(resourcePath: string): Promise<T> {
  return new Promise((resolve, reject) => {
    resources.load(`${V0_CONFIG_RESOURCE_BASE}/${resourcePath}`, JsonAsset, (error, asset) => {
      if (error || !asset) {
        reject(error ?? new Error(`config asset missing: ${resourcePath}`));
        return;
      }
      resolve(asset.json as T);
    });
  });
}

export async function loadPlayableConfig(): Promise<ConfigRepo> {
  const input: ConfigBundleInput = {
    runConfig: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.runConfig)),
    disasters: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.disasters)),
    facilities: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.facilities)),
    regions: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.regions)),
    cities: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.cities)),
    companyLevels: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.companyLevels)),
    loanTiers: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.loanTiers)),
    difficulties: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.difficulties)),
    adRewards: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.adRewards)),
    technologies: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.technologies)),
    doctrineMetaTechL1: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.doctrineMetaTechL1)),
    gridLoss: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.gridLoss)),
    superHydroSlots: await loadJsonAsset(stripJsonSuffix(V0_CONFIG_JSON_FILES.superHydroSlots))
  };
  return ConfigRepo.fromBundle(buildConfigBundle(input));
}
