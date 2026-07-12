import {
  buildClientHudDisplay,
  getCityHudBuildSelectionSnapshot,
  getCityHudProfileSnapshot,
  getClientHudCapabilities,
  readCityHudViewModel,
  t,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

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
  objectiveTitle: string;
  objectiveDetail: string;
  cityHealth: string;
  selectedBuildSummary: string;
  queueSummary: string;
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
      objectiveTitle: "",
      objectiveDetail: "",
      cityHealth: "",
      selectedBuildSummary: "",
      queueSummary: "",
      buildPickerItems: []
    };
  }

  const display = buildClientHudDisplay(boot);
  const caps = getClientHudCapabilities(boot);
  const buildSelection = getCityHudBuildSelectionSnapshot(boot);
  const buildItems = (buildSelection.candidates as CityBuildCandidateLike[]).slice(0, 5).map((candidate) => ({
    facilityId: candidate.facilityId,
    displayName: candidate.displayName,
    buildCost: candidate.buildCost,
    buildMonths: candidate.buildMonths
  }));
  const selectedBuild =
    buildItems.find((candidate) => candidate.facilityId === buildSelection.selectedFacilityId) ??
    buildItems[0] ??
    null;
  return {
    active: true,
    status: formatCityStatus(boot),
    detail: formatCityDetail(boot, display.detailLines),
    canBuild: caps.canBuildInCity,
    canCycleBuild: caps.canCycleBuildCandidate,
    objectiveTitle: formatCityObjectiveTitle(boot),
    objectiveDetail: formatCityObjectiveDetail(boot),
    cityHealth: formatCityHealth(boot),
    selectedBuildSummary: selectedBuild
      ? `${selectedBuild.displayName} · ${selectedBuild.buildCost}资金 · ${selectedBuild.buildMonths}月`
      : "当前没有可建设项目",
    queueSummary: formatQueueSummary(boot),
    buildPickerItems: buildItems
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

function formatCityObjectiveTitle(boot: GameBootstrap): string {
  const profile = getCityHudProfileSnapshot(boot);
  const state = boot.app.controller.state;
  if (state.phase === "run_result") return "查看本局结算";
  if (boot.app.screens.events.getSnapshot().pendingFullscreen) return "处理灾害事件";
  if (profile && profile.supplyGapMw > 0) return "补齐城市供电缺口";
  if (state.companyLevel < 2) return "积累SV，解锁科技与区域";
  if (state.companyLevel < 5) return "升级公司，扩张跨区电网";
  return "完成终局供电路线";
}

function formatCityObjectiveDetail(boot: GameBootstrap): string {
  const profile = getCityHudProfileSnapshot(boot);
  const state = boot.app.controller.state;
  if (boot.app.screens.events.getSnapshot().pendingFullscreen) {
    return "先确认事件，再继续推进月份。";
  }
  if (profile && profile.supplyGapMw > 0) {
    return `当前缺口 ${profile.supplyGapMw}MW，优先建设或接入外部电源。`;
  }
  if (state.companyLevel < 2) {
    return `公司${state.companyLevel}级 · SV ${state.socialValueCurrent}，继续稳定供电提高评级。`;
  }
  return `公司${state.companyLevel}级 · 资金 ${state.funds}，选择科技、区域或大地图推进下一阶段。`;
}

function formatCityHealth(boot: GameBootstrap): string {
  const profile = getCityHudProfileSnapshot(boot);
  if (!profile) return "城市状态待同步";
  const supplyRatio = Math.round(profile.supplyRatio * 100);
  const clean = profile.cityFullyEcoSupply ? "清洁达标" : `清洁${Math.round(profile.ecoCapFactor * 100)}%`;
  const gap = profile.supplyGapMw > 0 ? `缺口${profile.supplyGapMw}MW` : "供能稳定";
  return `${gap} · 供能${supplyRatio}% · ${clean}`;
}

function formatQueueSummary(boot: GameBootstrap): string {
  const queue = boot.app.controller.state.constructionQueue;
  if (queue.length === 0) return "无在建项目";
  const first = queue[0];
  const more = queue.length > 1 ? ` +${queue.length - 1}` : "";
  return `在建 ${first.facilityId} · 剩${first.monthsRemaining}月${more}`;
}

function compactHudLine(line: string, maxLength: number): string {
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}...` : line;
}
