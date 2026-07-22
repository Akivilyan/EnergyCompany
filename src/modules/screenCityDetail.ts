import {
  getCityResourceMultiplier,
  getConstructionBuildCost,
  getFacilityBuildTierMax,
  getFacilityEffectiveOutputMw,
  getFacilityTierSpec,
  getMonthlyOperatingCost,
  type GameState,
  type SettlementReport,
  type SimResult
} from "../sim/index.js";
import type { CitySnapshot, RunController } from "./runController.js";
import {
  buildCompanyUnlockMatrix,
  type CompanyUnlockItem
} from "./companyGrowth.js";

const PLAYABLE_FACILITY_IDS = ["wind", "solar", "thermal"] as const;

export interface CityBuildCandidate {
  facilityId: (typeof PLAYABLE_FACILITY_IDS)[number];
  tier: number;
  buildCost: number;
  buildMonths: number;
  effectiveOutputMw: number;
  monthlyOpex: number;
  resourceMultiplier: number;
  storageMultiplier: number;
  enabled: boolean;
  disabledReasonKey?: string;
}

export interface CityBuildChoiceViewModel {
  cityId: string;
  slotId: string;
  queueActive: number;
  queueMax: number;
  buildSlotsOccupied: number;
  buildSlotsMax: number;
  candidates: CityBuildCandidate[];
}

export interface CityProjectUpdate {
  id: string;
  slotId: string;
  facilityId: string;
  tier: number;
  state: "progress" | "completed";
  monthsLeft?: number;
}

export interface CityMonthlyCashflow {
  income: number;
  opex: number;
  fuel: number;
  loanPaid: number;
}

export interface CityResourceDelta {
  funds: number;
  socialValue: number;
  localSupplyMw: number;
  effectiveSupplyMw: number;
  supplyRatio: number;
}

export interface CityMonthlyAdvanceDetail {
  monthFrom: number;
  monthTo: number;
  before: CitySnapshot;
  after: CitySnapshot;
  delta: CityResourceDelta;
  cashflow: CityMonthlyCashflow;
  projectUpdates: CityProjectUpdate[];
  report: SettlementReport;
  settleResult: SettlementReport["result"];
  growth: {
    levelBefore: number;
    levelAfter: number;
    levelsGained: number;
    expBefore: number;
    expAfter: number;
    expDelta: number;
    reachedThreshold: number | null;
    unlocked: CompanyUnlockItem[];
  };
  research: {
    activeBefore: CityResearchQueueSnapshot | null;
    activeAfter: CityResearchQueueSnapshot | null;
    completed: Array<{ techId: string; displayName: string }>;
    facilityTierChanges: CityFacilityTierChange[];
  };
}

export interface CityResearchQueueSnapshot {
  researchId: string;
  techId: string;
  displayName: string;
  monthsRemaining: number;
}

export interface CityFacilityTierChange {
  facilityInstanceId: string;
  facilityId: string;
  tierBefore: number;
  tierAfter: number;
  outputMwBefore: number;
  outputMwAfter: number;
}

export interface CityConstructionAction {
  before: CitySnapshot;
  after: CitySnapshot;
  result: SimResult<{ state: GameState }>;
}

export interface AdvanceMonthsDetailOutput {
  reports: CityMonthlyAdvanceDetail[];
  failed: SimResult<CityMonthlyAdvanceDetail> | null;
}

function notFoundCity(cityId: string): SimResult<never> {
  return {
    ok: false,
    error: "not_found",
    message: `city not found: ${cityId}`,
    context: { city_id: cityId }
  };
}

function calcDelta(before: CitySnapshot, after: CitySnapshot): CityResourceDelta {
  return {
    funds: after.funds - before.funds,
    socialValue: after.socialValue - before.socialValue,
    localSupplyMw: after.localSupplyMw - before.localSupplyMw,
    effectiveSupplyMw: after.effectiveSupplyMw - before.effectiveSupplyMw,
    supplyRatio: after.supplyRatio - before.supplyRatio
  };
}

function settlementMetric(report: SettlementReport, stepId: string, key: string): number {
  return report.steps.find((step) => step.stepId === stepId)?.metrics[key] ?? 0;
}

function buildProjectUpdates(before: CitySnapshot, after: CitySnapshot): CityProjectUpdate[] {
  const afterProjects = new Map(after.constructionProjects.map((project) => [project.id, project]));
  return before.constructionProjects.map((project) => {
    const current = afterProjects.get(project.id);
    if (!current) {
      return {
        id: project.id,
        slotId: project.slotId,
        facilityId: project.facilityId,
        tier: project.tier,
        state: "completed" as const
      };
    }
    return {
      id: project.id,
      slotId: current.slotId,
      facilityId: current.facilityId,
      tier: current.tier,
      state: "progress" as const,
      monthsLeft: current.monthsRemaining
    };
  });
}

function buildFacilityTierChanges(
  before: CitySnapshot,
  after: CitySnapshot
): CityFacilityTierChange[] {
  const beforeById = new Map(before.facilities.map((facility) => [facility.id, facility]));
  return after.facilities.flatMap((facility) => {
    const previous = beforeById.get(facility.id);
    if (!previous || (previous.tier === facility.tier && previous.outputMw === facility.outputMw)) {
      return [];
    }
    return [{
      facilityInstanceId: facility.id,
      facilityId: facility.facilityId,
      tierBefore: previous.tier,
      tierAfter: facility.tier,
      outputMwBefore: previous.outputMw,
      outputMwAfter: facility.outputMw
    }];
  });
}

export class ScreenCityDetail {
  constructor(
    private readonly controller: RunController,
    private readonly cityId: string
  ) {}

  getSnapshot(): CitySnapshot | null {
    return this.controller.getCitySnapshot(this.cityId);
  }

  getBuildChoice(slotId: string): SimResult<CityBuildChoiceViewModel> {
    const snapshot = this.getSnapshot();
    if (!snapshot) return notFoundCity(this.cityId);
    const cityConfig = this.controller.config.getCity(this.cityId);
    if (!cityConfig) return notFoundCity(this.cityId);
    const occupied = new Set([
      ...snapshot.facilities.map((facility) => facility.slotId),
      ...snapshot.constructionProjects.map((project) => project.slotId)
    ]);
    const slotMatch = /^slot-(\d+)$/.exec(slotId);
    const slotIndex = slotMatch ? Number(slotMatch[1]) : 0;
    if (slotIndex < 1 || slotIndex > cityConfig.build_slot_count) {
      return {
        ok: false,
        error: "invalid_command_payload",
        message: `invalid build slot: ${slotId}`,
        context: { city_id: this.cityId, slot_id: slotId }
      };
    }

    const candidates = PLAYABLE_FACILITY_IDS.flatMap((facilityId) => {
      const facility = this.controller.config.getFacility(facilityId);
      if (!facility) return [];
      if (facility.unlock_tech_id && !this.controller.state.litTechIds.includes(facility.unlock_tech_id)) {
        return [];
      }
      const tier = getFacilityBuildTierMax(
        this.controller.state,
        this.controller.config,
        facilityId
      );
      const spec = getFacilityTierSpec(this.controller.config, facilityId, tier);
      const effectiveOutputMw = getFacilityEffectiveOutputMw(
        this.controller.state,
        this.controller.config,
        this.cityId,
        facilityId,
        tier
      );
      if (!spec || effectiveOutputMw === null) return [];
      const buildCost = getConstructionBuildCost(
        this.controller.state,
        this.controller.config,
        spec.buildCost
      );
      const resourceMultiplier = getCityResourceMultiplier(
        this.controller.config,
        this.cityId,
        facilityId
      );
      const storageMultiplier = Math.max(
        1,
        effectiveOutputMw / spec.outputMw / resourceMultiplier
      );
      let disabledReasonKey: string | undefined;
      if (this.controller.state.phase !== "run_playable") disabledReasonKey = "settling";
      else if (occupied.has(slotId)) disabledReasonKey = "slot_occupied";
      else if (snapshot.globalConstructionQueueActive >= snapshot.globalConstructionQueueMax) disabledReasonKey = "queue_full";
      else if (snapshot.buildSlotsOccupied >= snapshot.buildSlotsMax) {
        disabledReasonKey = "slots_full";
      } else if (snapshot.funds < buildCost) disabledReasonKey = "insufficient_funds";
      return [{
        facilityId,
        tier,
        buildCost,
        buildMonths: spec.buildMonths,
        effectiveOutputMw,
        monthlyOpex: getMonthlyOperatingCost(
          this.controller.state,
          this.controller.config,
          spec.monthlyOpex,
          facilityId
        ),
        resourceMultiplier,
        storageMultiplier,
        enabled: !disabledReasonKey,
        disabledReasonKey
      }];
    });

    return {
      ok: true,
      value: {
        cityId: this.cityId,
        slotId,
        queueActive: snapshot.globalConstructionQueueActive,
        queueMax: snapshot.globalConstructionQueueMax,
        buildSlotsOccupied: snapshot.buildSlotsOccupied,
        buildSlotsMax: snapshot.buildSlotsMax,
        candidates
      }
    };
  }

  queueConstruction(
    facilityId: string,
    tier: number,
    slotId?: string
  ): SimResult<CityConstructionAction> {
    const before = this.getSnapshot();
    if (!before) return notFoundCity(this.cityId);
    const result = this.controller.runCommand({
      type: "queue_construction",
      cityId: this.cityId,
      facilityId,
      tier,
      slotId
    });
    const after = this.getSnapshot();
    if (!after) return notFoundCity(this.cityId);
    return { ok: true, value: { before, after, result } };
  }

  advanceOneMonth(): SimResult<CityMonthlyAdvanceDetail> {
    const before = this.getSnapshot();
    if (!before) return notFoundCity(this.cityId);
    const activeResearchBefore = Object.values(this.controller.state.researches)[0] ?? null;
    const litTechIdsBefore = new Set(this.controller.state.litTechIds);
    const settle = this.controller.runNextMonth();
    if (!settle.ok) return settle;
    const after = this.getSnapshot();
    if (!after) return notFoundCity(this.cityId);
    const levelRows = buildCompanyUnlockMatrix(this.controller.config, after.companyLevel);
    const unlocked = levelRows
      .filter((row) => row.level > before.companyLevel && row.level <= after.companyLevel)
      .flatMap((row) => row.newlyUnlocked);
    const activeResearchAfter = Object.values(this.controller.state.researches)[0] ?? null;
    const toResearchSnapshot = (
      research: typeof activeResearchBefore
    ): CityResearchQueueSnapshot | null => research
      ? {
          researchId: research.researchId,
          techId: research.techId,
          displayName: this.controller.config.getTechnology(research.techId)?.display_name ?? research.techId,
          monthsRemaining: research.monthsRemaining
        }
      : null;
    const completed = this.controller.state.litTechIds
      .filter((techId) => !litTechIdsBefore.has(techId))
      .map((techId) => ({
        techId,
        displayName: this.controller.config.getTechnology(techId)?.display_name ?? techId
      }));
    return {
      ok: true,
      value: {
        monthFrom: before.month,
        monthTo: after.month,
        before,
        after,
        delta: calcDelta(before, after),
        cashflow: {
          income: settlementMetric(settle.value.report, "M5_income_settlement", "income"),
          opex: settlementMetric(settle.value.report, "M6_opex_settlement", "opex"),
          fuel: settlementMetric(settle.value.report, "M7_fuel_settlement", "fuel"),
          loanPaid: settlementMetric(settle.value.report, "M8_loan_settlement", "loan_paid")
        },
        projectUpdates: buildProjectUpdates(before, after),
        report: settle.value.report,
        settleResult: settle.value.report.result,
        growth: {
          levelBefore: before.companyLevel,
          levelAfter: after.companyLevel,
          levelsGained: after.companyLevel - before.companyLevel,
          expBefore: before.socialValue,
          expAfter: after.socialValue,
          expDelta: after.socialValue - before.socialValue,
          reachedThreshold:
            levelRows.find((row) => row.level === after.companyLevel)?.threshold ?? null,
          unlocked
        },
        research: {
          activeBefore: toResearchSnapshot(activeResearchBefore),
          activeAfter: toResearchSnapshot(activeResearchAfter),
          completed,
          facilityTierChanges: buildFacilityTierChanges(before, after)
        }
      }
    };
  }

  advanceMonths(maxMonths: number): AdvanceMonthsDetailOutput {
    const reports: CityMonthlyAdvanceDetail[] = [];
    let failed: SimResult<CityMonthlyAdvanceDetail> | null = null;
    for (let i = 0; i < maxMonths; i += 1) {
      const month = this.advanceOneMonth();
      if (!month.ok) {
        failed = month;
        break;
      }
      reports.push(month.value);
      if (month.value.settleResult !== "continue") {
        break;
      }
    }
    return { reports, failed };
  }
}

export function createScreenCityDetail(
  controller: RunController,
  cityId: string
): ScreenCityDetail {
  return new ScreenCityDetail(controller, cityId);
}
