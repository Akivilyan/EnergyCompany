import type {
  AdRewardConfig,
  CityConfig,
  CompanyLevelConfig,
  ConfigBundle,
  DifficultyModifier,
  DisasterConfig,
  FacilityConfig,
  LoanTierConfig,
  RunConfig
} from "./configRepo.js";
import { ConfigRepo } from "./configRepo.js";

/** Cocos resources 路径前缀：assets/resources/config/v0/<name>.json */
export const V0_CONFIG_RESOURCE_BASE = "config/v0";

export const V0_CONFIG_JSON_FILES = {
  runConfig: "run_config.json",
  disasters: "campaign_disasters.json",
  facilities: "facilities_slice.json",
  cities: "cities.json",
  companyLevels: "company_levels.json",
  loanTiers: "loan_tiers.json",
  difficulties: "difficulty_modifiers.json",
  adRewards: "ad_rewards.json"
} as const;

export interface ConfigBundleInput {
  runConfig: RunConfig;
  disasters: DisasterConfig[];
  facilities: FacilityConfig[];
  cities: CityConfig[];
  companyLevels: CompanyLevelConfig[];
  loanTiers: LoanTierConfig[];
  difficulties: DifficultyModifier[];
  adRewards: AdRewardConfig[];
}

export function buildConfigBundle(input: ConfigBundleInput): ConfigBundle {
  return {
    runConfig: input.runConfig,
    disasters: input.disasters,
    facilities: input.facilities,
    cities: input.cities,
    companyLevels: input.companyLevels,
    loanTiers: input.loanTiers,
    difficulties: input.difficulties,
    adRewards: input.adRewards
  };
}

export function configRepoFromBundle(bundle: ConfigBundle): ConfigRepo {
  return ConfigRepo.fromBundle(bundle);
}
