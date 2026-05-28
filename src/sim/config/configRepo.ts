import fs from "node:fs";
import path from "node:path";

export interface RunConfig {
  campaign_run_target_months: number;
  starting_cash_base: number;
  doctrine_lit_budget: number;
  bankrupt_consecutive_months: number;
}

export interface DisasterConfig {
  campaign_id: string;
  seq: number;
  trigger_month: number;
  immediate_cash_penalty: number;
  /** 设计锁定：调参不得修改，见 v0-disaster-balance-policy.md */
  debuff_duration_months: number;
  income_mult_num: number;
  income_mult_den: number;
  build_duration_mult_num: number;
  build_duration_mult_den: number;
  research_duration_mult_num: number;
  research_duration_mult_den: number;
  exam_tier: number;
  is_final?: boolean;
}

export interface FacilityConfig {
  facility_id: string;
  facility_type?: string;
  build_cost_total: number;
  build_duration_months: number;
  installment_count: number;
  monthly_operating_cost: number;
  output_capacity_mw: number;
  is_eco_default?: boolean;
  requires_river: boolean;
}

export interface CityConfig {
  city_id: string;
  base_demand_mw: number;
  city_base_social_value: number;
  has_river: boolean;
  unlock_company_level: number;
}

export interface CompanyLevelConfig {
  level: number;
  sv_threshold: number;
}

export interface LoanTierConfig {
  loan_id: string;
  principal: number;
  terms: number;
  monthly_payment_approx: number;
}

export interface DifficultyModifier {
  difficulty_id: string;
  starting_cash_add: number;
  disaster_cash_mult: number;
}

export interface AdRewardConfig {
  company_level: number;
  reward_cash: number;
}

export interface ConfigBundle {
  runConfig: RunConfig;
  disasters: DisasterConfig[];
  facilities: FacilityConfig[];
  cities: CityConfig[];
  companyLevels: CompanyLevelConfig[];
  loanTiers: LoanTierConfig[];
  difficulties: DifficultyModifier[];
  adRewards: AdRewardConfig[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export class ConfigRepo {
  readonly bundle: ConfigBundle;

  constructor(bundle: ConfigBundle) {
    this.bundle = bundle;
  }

  static loadFromVerticalSlice(rootDir: string): ConfigRepo {
    const base = path.join(rootDir, "docs", "design", "data", "vertical-slice-v0");
    const bundle: ConfigBundle = {
      runConfig: readJson(path.join(base, "run_config.json")),
      disasters: readJson(path.join(base, "campaign_disasters.json")),
      facilities: readJson(path.join(base, "facilities_slice.json")),
      cities: readJson(path.join(base, "cities.json")),
      companyLevels: readJson(path.join(base, "company_levels.json")),
      loanTiers: readJson(path.join(base, "loan_tiers.json")),
      difficulties: readJson(path.join(base, "difficulty_modifiers.json")),
      adRewards: readJson(path.join(base, "ad_rewards.json"))
    };
    return new ConfigRepo(bundle);
  }

  getFacility(id: string): FacilityConfig | undefined {
    return this.bundle.facilities.find((f) => f.facility_id === id);
  }

  getCity(id: string): CityConfig | undefined {
    return this.bundle.cities.find((c) => c.city_id === id);
  }

  getDisasterForMonth(month: number): DisasterConfig | undefined {
    return this.bundle.disasters.find((d) => d.trigger_month === month);
  }

  getAdReward(level: number): number {
    const row = this.bundle.adRewards.find((r) => r.company_level === level);
    return row?.reward_cash ?? 0;
  }

  getStartingCash(difficultyId: "simple" | "normal"): number {
    const mod = this.bundle.difficulties.find((d) => d.difficulty_id === difficultyId);
    return this.bundle.runConfig.starting_cash_base + (mod?.starting_cash_add ?? 0);
  }
}
