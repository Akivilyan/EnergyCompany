import type {
  AdRewardConfig,
  CityConfig,
  CompanyLevelConfig,
  ConfigBundle,
  DifficultyModifier,
  DoctrineMetaTechConfig,
  DisasterConfig,
  FacilityConfig,
  GridLossConfig,
  LoanTierConfig,
  RegionConfig,
  SuperHydroSlotConfig,
  TechnologyConfig,
  RunConfig
} from "./configRepo.js";
import { ConfigRepo } from "./configRepo.js";

/** Cocos resources 路径前缀：assets/resources/config/v0/<name>.json */
export const V0_CONFIG_RESOURCE_BASE = "config/v0";

export const V0_CONFIG_JSON_FILES = {
  runConfig: "run_config.json",
  disasters: "campaign_disasters.json",
  facilities: "facilities_slice.json",
  regions: "regions.json",
  cities: "cities.json",
  companyLevels: "company_levels.json",
  loanTiers: "loan_tiers.json",
  difficulties: "difficulty_modifiers.json",
  adRewards: "ad_rewards.json",
  technologies: "technology_config.json",
  doctrineMetaTechL1: "doctrine_meta_tech_l1.json",
  gridLoss: "grid_loss_config.json",
  superHydroSlots: "super_hydro_slots.json"
} as const;

export interface ConfigBundleInput {
  runConfig: RunConfig;
  disasters: DisasterConfig[];
  facilities: FacilityConfig[];
  regions: RegionConfig[];
  cities: CityConfig[];
  companyLevels: CompanyLevelConfig[];
  loanTiers: LoanTierConfig[];
  difficulties: DifficultyModifier[];
  adRewards: AdRewardConfig[];
  technologies: TechnologyConfig[];
  doctrineMetaTechL1: DoctrineMetaTechConfig;
  gridLoss: GridLossConfig;
  superHydroSlots: SuperHydroSlotConfig[];
}

export function buildConfigBundle(input: ConfigBundleInput): ConfigBundle {
  return {
    runConfig: input.runConfig,
    disasters: input.disasters,
    facilities: input.facilities,
    regions: input.regions,
    cities: input.cities,
    companyLevels: input.companyLevels,
    loanTiers: input.loanTiers,
    difficulties: input.difficulties,
    adRewards: input.adRewards,
    technologies: input.technologies,
    doctrineMetaTechL1: input.doctrineMetaTechL1,
    gridLoss: input.gridLoss,
    superHydroSlots: input.superHydroSlots
  };
}

export function configRepoFromBundle(bundle: ConfigBundle): ConfigRepo {
  return ConfigRepo.fromBundle(bundle);
}
