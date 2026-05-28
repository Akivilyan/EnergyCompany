export type SettlementStepId =
  | "M1_construction_progress"
  | "M2_grid_progress"
  | "M3_research_progress"
  | "M4_supply_recalc"
  | "M5_income_settlement"
  | "M6_opex_settlement"
  | "M7_fuel_settlement"
  | "M8_loan_settlement"
  | "M9_social_value_settlement"
  | "M10_company_level_check"
  | "M11_events_apply"
  | "M12_milestones_emit"
  | "M13_bankrupt_check"
  | "M14_victory_check";

export interface SettlementStepReport {
  stepId: SettlementStepId;
  ok: boolean;
  summary: string;
  metrics: Record<string, number>;
}

export interface SettlementReport {
  runId: string;
  monthFrom: number;
  monthTo: number;
  steps: SettlementStepReport[];
  result: "continue" | "victory" | "bankrupt";
}
