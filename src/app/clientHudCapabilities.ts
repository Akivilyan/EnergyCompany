import { getCityHudBuildSelectionSnapshot } from "./cityHudController.js";
import { getCompanyHudSelectionSnapshot } from "./companyHudController.js";
import type { GameBootstrap } from "./gameBootstrap.js";
import { getRegionHudSelectionSnapshot } from "./regionHudController.js";
import { getTechHudSelectionSnapshot } from "./techHudController.js";
import {
  getSelectedWorldTrunkCandidate,
  getWorldHudSelectionSnapshot
} from "./worldHudController.js";
import { getGridLinkBuildCost } from "../sim/index.js";

export interface ClientHudCapabilities {
  canQueueRegionLink: boolean;
  canCycleRegionLink: boolean;
  canCancelRegionLink: boolean;
  canQueueWorldTrunk: boolean;
  canOpenWorldTarget: boolean;
  canCycleWorldTarget: boolean;
  canQueueSuperHydro: boolean;
  canQueueSuperHydroGridLink: boolean;
  canOperateTech: boolean;
  canBuildInCity: boolean;
  canCycleBuildCandidate: boolean;
  canApplyLoan: boolean;
  canCycleLoanCandidate: boolean;
  canClaimCashAd: boolean;
  canSpeedupConstructionByAd: boolean;
  canStartResearch: boolean;
  canCancelResearch: boolean;
  canSpeedupResearchByAd: boolean;
  canCycleResearchCandidate: boolean;
}

/**
 * 开发 HUD 的按钮能力必须和当前规则状态一致，避免真机上出现
 * “画面提示未解锁，但按钮仍可点”的误导性反馈。
 */
export function getClientHudCapabilities(boot: GameBootstrap): ClientHudCapabilities {
  const regionId = boot.play.getNavigation().regionId ?? "MAP-01";
  const region = boot.app.screens.region(regionId).getSnapshot();
  const tech = boot.app.screens.tech.getSnapshot();
  const company = boot.app.screens.company.getSnapshot();
  const state = boot.app.controller.state;
  const cityId = boot.play.getNavigation().cityId ?? "CITY-START";
  const city = boot.app.screens.city(cityId).getSnapshot();
  const buildSelection = getCityHudBuildSelectionSnapshot(boot);
  const selectedBuildCandidate =
    buildSelection.candidates.find(
      (candidate) => candidate.facilityId === buildSelection.selectedFacilityId
    ) ?? null;
  const regionSelection = getRegionHudSelectionSnapshot(boot);
  const selectedRegionCandidate =
    regionSelection.candidates.find(
      (candidate) => candidate.candidateId === regionSelection.selectedCandidateId
    ) ?? null;
  const availableRegionCandidates = regionSelection.candidates;
  const companySelection = getCompanyHudSelectionSnapshot(boot);
  const selectedLoanCandidate =
    companySelection.candidates.find(
      (candidate) => candidate.loanId === companySelection.selectedLoanId
    ) ?? null;
  const techSelection = getTechHudSelectionSnapshot(boot);
  const selectedTechCandidate =
    techSelection.candidates.find(
      (candidate) => candidate.techId === techSelection.selectedTechId
    ) ?? null;
  const hasActiveResearch = tech.activeResearch !== null;
  const worldSelection = getWorldHudSelectionSnapshot(boot);
  const selectedWorldCandidate =
    worldSelection.candidates.find(
      (candidate) => candidate.candidateId === worldSelection.selectedCandidateId
    ) ?? null;
  const superHydro = boot.app.screens.world.getSnapshot().superHydro;
  const worldTrunk = getSelectedWorldTrunkCandidate(boot);
  const superHydroGridCost = getGridLinkBuildCost(
    boot.app.controller.state,
    boot.app.controller.config,
    8,
    "trunk"
  );
  return {
    canQueueRegionLink:
      selectedRegionCandidate !== null &&
      selectedRegionCandidate.available &&
      state.funds >= selectedRegionCandidate.cost,
    canCycleRegionLink: availableRegionCandidates.length > 0,
    canCancelRegionLink: region.gridLinks.some((link) => link.status === "building"),
    canQueueWorldTrunk:
      worldTrunk !== null && worldTrunk.available && state.funds >= worldTrunk.cost,
    canOpenWorldTarget: selectedWorldCandidate !== null && selectedWorldCandidate.unlocked,
    canCycleWorldTarget: worldSelection.candidates.length > 0,
    canQueueSuperHydro:
      superHydro.unlocked &&
      superHydro.slots.some(
        (slot) => slot.status === "available" && state.funds >= slot.buildCost
      ),
    canQueueSuperHydroGridLink:
      superHydro.unlocked &&
      superHydro.slots.some(
        (slot) => slot.status === "finished" && slot.gridConnectionStatus === "isolated"
      ) &&
      state.funds >= superHydroGridCost,
    canOperateTech: tech.canOpen,
    canBuildInCity:
      city !== null &&
      selectedBuildCandidate !== null &&
      state.constructionQueue.length < 3 &&
      state.funds >= selectedBuildCandidate.buildCost,
    canCycleBuildCandidate: city !== null && buildSelection.candidates.length > 0,
    canApplyLoan: company.activeLoan === null && selectedLoanCandidate !== null,
    canCycleLoanCandidate: company.activeLoan === null && companySelection.candidates.length > 0,
    canClaimCashAd: state.adsRemaining > 0,
    canSpeedupConstructionByAd:
      state.adsRemaining > 0 && company.activeConstruction.length > 0,
    canStartResearch:
      tech.canOpen &&
      !hasActiveResearch &&
      selectedTechCandidate !== null &&
      state.funds >= selectedTechCandidate.researchCost,
    canCancelResearch: tech.canOpen && hasActiveResearch,
    canSpeedupResearchByAd: tech.canOpen && hasActiveResearch && state.adsRemaining > 0,
    canCycleResearchCandidate:
      tech.canOpen && !hasActiveResearch && techSelection.candidates.length > 0
  };
}
