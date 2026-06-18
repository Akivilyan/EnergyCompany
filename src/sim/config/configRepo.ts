export interface RunConfig {
  campaign_run_target_months: number;
  starting_cash_base: number;
  doctrine_lit_budget: number;
  bankrupt_consecutive_months: number;
  tutorial_level2_sv_threshold?: number;
}

export interface DisasterConfig {
  campaign_id: string;
  seq: number;
  event_id?: string;
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
  popup_required?: boolean;
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
  region_id?: string;
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
  unlock_level?: number;
  principal: number;
  terms: number;
  total_interest?: number;
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

export type TechnologyTab =
  | "wind"
  | "solar"
  | "thermal"
  | "hydro"
  | "nuclear"
  | "grid"
  | "engineering";

export interface TechnologyConfig {
  tech_id: string;
  display_name: string;
  tab: TechnologyTab;
  company_level_min: number;
  requires_lit?: string[];
  starts_lit: boolean;
  research_cost: number;
  research_months: number;
  effect_type: string;
  effect_target: string;
  effect_value: Record<string, unknown>;
  notes?: string;
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
  technologies: TechnologyConfig[];
}

export class ConfigRepo {
  readonly bundle: ConfigBundle;

  constructor(bundle: ConfigBundle) {
    this.bundle = bundle;
  }

  /** 从已解析 JSON 记录构建（Cocos resources / 小游戏异步加载）。 */
  static fromBundle(bundle: ConfigBundle): ConfigRepo {
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

  getTechnology(id: string): TechnologyConfig | undefined {
    return this.bundle.technologies.find((tech) => tech.tech_id === id);
  }

  getStartingCash(difficultyId: "simple" | "normal"): number {
    const mod = this.bundle.difficulties.find((d) => d.difficulty_id === difficultyId);
    return this.bundle.runConfig.starting_cash_base + (mod?.starting_cash_add ?? 0);
  }
}
