import {
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

interface CityBuildCandidateLike extends CityBuildPickerItem {}

export interface CityScreenViewModel {
  active: boolean;
  cityName: string;
  month: number;
  funds: number;
  socialValue: number;
  supplyPercent: number;
  supplyGapMw: number;
  cleanlinessPercent: number;
  objectiveTitle: string;
  objectiveDetail: string;
  cityStatus: string;
  selectedBuildSummary: string;
  queueSummary: string;
  canBuild: boolean;
  buildPickerItems: CityBuildPickerItem[];
}

const EMPTY_VM: CityScreenViewModel = {
  active: false,
  cityName: "",
  month: 0,
  funds: 0,
  socialValue: 0,
  supplyPercent: 0,
  supplyGapMw: 0,
  cleanlinessPercent: 0,
  objectiveTitle: "",
  objectiveDetail: "",
  cityStatus: "",
  selectedBuildSummary: "",
  queueSummary: "",
  canBuild: false,
  buildPickerItems: []
};

export function readCityScreenViewModel(boot: GameBootstrap | null): CityScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_city_detail") return EMPTY_VM;

  const view = readCityHudViewModel(boot);
  const state = boot.app.controller.state;
  const profile = getCityHudProfileSnapshot(boot);
  const caps = getClientHudCapabilities(boot);
  const selection = getCityHudBuildSelectionSnapshot(boot);
  const buildPickerItems = (selection.candidates as CityBuildCandidateLike[])
    .slice(0, 5)
    .map((candidate) => ({
      facilityId: candidate.facilityId,
      displayName: candidate.displayName,
      buildCost: candidate.buildCost,
      buildMonths: candidate.buildMonths
    }));
  const selected =
    buildPickerItems.find((candidate) => candidate.facilityId === selection.selectedFacilityId) ??
    buildPickerItems[0] ??
    null;
  const supplyPercent = profile ? Math.round(profile.supplyRatio * 100) : 0;
  const supplyGapMw = profile?.supplyGapMw ?? 0;
  const cleanlinessPercent = profile ? Math.round(profile.ecoCapFactor * 100) : 0;
  const objective = buildObjective(boot, supplyGapMw);

  return {
    active: true,
    cityName: view.cityId === "CITY-START" ? t("hud.city.start") : view.cityId,
    month: view.month,
    funds: view.funds,
    socialValue: state.socialValueCurrent,
    supplyPercent,
    supplyGapMw,
    cleanlinessPercent,
    objectiveTitle: objective.title,
    objectiveDetail: objective.detail,
    cityStatus:
      supplyGapMw > 0
        ? `供能 ${supplyPercent}% · 缺口 ${supplyGapMw}MW · 清洁 ${cleanlinessPercent}%`
        : `供能稳定 ${supplyPercent}% · 清洁 ${cleanlinessPercent}%`,
    selectedBuildSummary: selected
      ? `${selected.displayName} · ${selected.buildCost} 资金 · ${selected.buildMonths} 月`
      : "暂无可建设项目",
    queueSummary: buildQueueSummary(boot),
    canBuild: caps.canBuildInCity && buildPickerItems.length > 0,
    buildPickerItems
  };
}

function buildObjective(
  boot: GameBootstrap,
  supplyGapMw: number
): { title: string; detail: string } {
  const state = boot.app.controller.state;
  const pending = boot.app.screens.events.getSnapshot().pendingFullscreen;
  const firstQueue = state.constructionQueue[0];
  if (pending) {
    return { title: "先处理突发事件", detail: "确认影响后，再决定本月建设与推进。" };
  }
  if (firstQueue) {
    return {
      title: "推进月份，等待工程投产",
      detail: `${facilityName(boot, firstQueue.facilityId)}还需 ${firstQueue.monthsRemaining} 月；投产后供能才会变化。`
    };
  }
  if (supplyGapMw > 0) {
    return {
      title: "建设第一座电源",
      detail: `缺口 ${supplyGapMw}MW。比较造价与工期后开工。`
    };
  }
  if (state.companyLevel < 2) {
    return {
      title: "保持稳定供电，积累社会价值",
      detail: `当前 SV ${state.socialValueCurrent}；继续经营以解锁下一阶段。`
    };
  }
  return { title: "城市运行稳定", detail: "继续优化能源结构，或推进月份观察经营结果。" };
}

function buildQueueSummary(boot: GameBootstrap): string {
  const queue = boot.app.controller.state.constructionQueue;
  if (queue.length === 0) return "工程队空闲，可以开始一项建设。";
  const first = queue[0];
  const more = queue.length > 1 ? `；另有 ${queue.length - 1} 项` : "";
  return `${facilityName(boot, first.facilityId)}建设中 · 剩 ${first.monthsRemaining} 月${more}`;
}

function facilityName(boot: GameBootstrap, facilityId: string): string {
  const selection = getCityHudBuildSelectionSnapshot(boot);
  const candidate = (selection.candidates as CityBuildCandidateLike[]).find(
    (item) => item.facilityId === facilityId
  );
  return candidate?.displayName ?? facilityId;
}
