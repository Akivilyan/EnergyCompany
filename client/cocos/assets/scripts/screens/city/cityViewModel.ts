import {
  buildClientHudDisplay,
  getCityHudBuildSelectionSnapshot,
  getCityHudProfileSnapshot,
  getClientHudCapabilities,
  readCityHudViewModel,
  t,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface CityBuildPickerItem {
  facilityId: string;
  displayName: string;
  buildCost: number;
  buildMonths: number;
}

interface CityBuildCandidateLike {
  facilityId: string;
  displayName: string;
  buildCost: number;
  buildMonths: number;
}

export interface CityScreenViewModel {
  active: boolean;
  status: string;
  detail: string;
  canBuild: boolean;
  canCycleBuild: boolean;
  buildPickerItems: CityBuildPickerItem[];
}

export function readCityScreenViewModel(boot: GameBootstrap | null): CityScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_city_detail") {
    return {
      active: false,
      status: "",
      detail: "",
      canBuild: false,
      canCycleBuild: false,
      buildPickerItems: []
    };
  }

  const display = buildClientHudDisplay(boot);
  const caps = getClientHudCapabilities(boot);
  const buildSelection = getCityHudBuildSelectionSnapshot(boot);
  return {
    active: true,
    status: formatCityStatus(boot),
    detail: formatCityDetail(boot, display.detailLines),
    canBuild: caps.canBuildInCity,
    canCycleBuild: caps.canCycleBuildCandidate,
    buildPickerItems: (buildSelection.candidates as CityBuildCandidateLike[]).slice(0, 5).map((candidate) => ({
      facilityId: candidate.facilityId,
      displayName: candidate.displayName,
      buildCost: candidate.buildCost,
      buildMonths: candidate.buildMonths
    }))
  };
}

function formatCityStatus(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const state = boot.app.controller.state;
  const profile = getCityHudProfileSnapshot(boot);
  const supplyRatio = profile ? Math.round(profile.supplyRatio * 100) : 0;
  return `M${view.month}  资金 ${view.funds}\nSV ${state.socialValueCurrent}  供能 ${supplyRatio}%`;
}

function formatCityDetail(boot: GameBootstrap, fallbackLines: string[]): string {
  const view = readCityHudViewModel(boot);
  const profile = getCityHudProfileSnapshot(boot);
  const cityName = view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId;
  const candidate = fallbackLines.find((line) => line.startsWith("候选：") || line.startsWith("Candidate:"));
  if (!profile) {
    return candidate ? `${cityName}\n${compactHudLine(candidate, 34)}` : cityName;
  }
  const supplyLine = profile.supplyGapMw > 0 ? `缺口 ${profile.supplyGapMw}MW` : "供能稳定";
  const cleanLine = profile.cityFullyEcoSupply ? "清洁达标" : `清洁 ${Math.round(profile.ecoCapFactor * 100)}%`;
  return [
    `${cityName}  ${supplyLine}`,
    `${cleanLine}${candidate ? `  ${compactHudLine(candidate.replace("候选：", ""), 16)}` : ""}`
  ].filter((line): line is string => !!line).join("\n");
}

function compactHudLine(line: string, maxLength: number): string {
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}...` : line;
}
