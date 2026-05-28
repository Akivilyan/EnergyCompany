export type RunPhase =
  | "main_menu"
  | "run_setup"
  | "run_playable"
  | "month_settling"
  | "run_result";

export type PlayableSubPhase =
  | "navigating"
  | "editing"
  | "advance_pending"
  | "blocked";

export type RunResult = null | "victory" | "bankrupt";

export interface ActiveDebuff {
  disasterSeq: number;
  monthsRemaining: number;
  incomeMultNum: number;
  incomeMultDen: number;
  buildDurationMultNum: number;
  buildDurationMultDen: number;
  researchDurationMultNum: number;
  researchDurationMultDen: number;
}

export interface ConstructionQueueItem {
  id: string;
  cityId: string;
  facilityId: string;
  tier: number;
  monthsRemaining: number;
  installmentRemaining: number;
}

export interface FacilityRuntime {
  id: string;
  cityId: string;
  facilityId: string;
  tier: number;
  outputMw: number;
  monthlyOpex: number;
  monthlyFuel: number;
}

export interface CityRuntime {
  cityId: string;
  demandMw: number;
  localSupplyMw: number;
  effectiveSupplyMw: number;
  netImportMw: number;
  supplyRatio: number;
  cityFullyEcoSupply: boolean;
  ecoCapFactor: number;
  cityBaseSocialValue: number;
}

export interface LoanRuntime {
  loanId: string;
  principalRemaining: number;
  monthlyPayment: number;
  monthsRemaining: number;
}

export interface ResearchRuntime {
  researchId: string;
  techId: string;
  monthsRemaining: number;
}

export interface GridLinkRuntime {
  linkId: string;
  fromCityId: string;
  toCityId: string;
  linkType: "region" | "trunk";
  status: "building" | "finished";
  monthsRemaining: number;
  lossMw: number;
}

export interface GameState {
  version: number;
  runId: string;
  phase: RunPhase;
  playableSubPhase: PlayableSubPhase | null;

  currentMonth: number;
  funds: number;
  companyLevel: number;
  socialValueCurrent: number;

  doctrineId: "tech" | "renewable" | "hydro" | "thermal" | "tutorial";
  difficultyId: "simple" | "normal";
  campaignId: string;

  bankruptConsecutiveMonths: number;
  runResult: RunResult;

  cities: Record<string, CityRuntime>;
  facilities: Record<string, FacilityRuntime>;
  gridLinks: Record<string, GridLinkRuntime>;
  constructionQueue: ConstructionQueueItem[];
  researches: Record<string, ResearchRuntime>;
  litTechIds: string[];
  loans: Record<string, LoanRuntime>;
  activeDebuffs: ActiveDebuff[];
  disastersTriggered: number[];

  adsRemaining: number;
  incomePricePerMw: number;
}
