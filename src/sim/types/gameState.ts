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

export type OnboardingStepId =
  | "onb_01_welcome"
  | "onb_02_build"
  | "onb_03_next_month"
  | "onb_04_read_dashboard"
  | "onb_05_push_to_finish"
  | "onb_06_company"
  | "onb_07_tech_ii"
  | "onb_done";

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
  isEco?: boolean;
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
  buildCost?: number;
}

export interface SuperHydroRuntime {
  slotId: string;
  nodeId: string;
  displayName: string;
  status: "building" | "finished";
  monthsRemaining: number;
  outputMw: number;
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
  isTutorialRun: boolean;
  onboardingCurrentStepId: OnboardingStepId;
  onboardingStepsDone: OnboardingStepId[];
  onboardingSkipped: boolean;
  tutorialDoctrineCleared: boolean;

  bankruptConsecutiveMonths: number;
  runResult: RunResult;

  cities: Record<string, CityRuntime>;
  facilities: Record<string, FacilityRuntime>;
  gridLinks: Record<string, GridLinkRuntime>;
  superHydros: Record<string, SuperHydroRuntime>;
  constructionQueue: ConstructionQueueItem[];
  researches: Record<string, ResearchRuntime>;
  litTechIds: string[];
  loans: Record<string, LoanRuntime>;
  activeDebuffs: ActiveDebuff[];
  disastersTriggered: number[];
  acknowledgedDisasterSeqs: number[];

  adsRemaining: number;
  incomePricePerMw: number;
}
