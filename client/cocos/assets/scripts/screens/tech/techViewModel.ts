import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface TechScreenViewModel {
  active: boolean;
  objectiveTitle: string;
  objectiveDetail: string;
  stateTitle: string;
  stateDetail: string;
  focusTitle: string;
  focusDetail: string;
  feedbackTitle: string;
  feedbackDetail: string;
  hasActiveResearch: boolean;
  canStartResearch: boolean;
  canCancelResearch: boolean;
  canSpeedupResearchByAd: boolean;
  canCycleResearchCandidate: boolean;
}

export function readTechScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): TechScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_tech_tree") {
    return {
      active: false,
      objectiveTitle: "",
      objectiveDetail: "",
      stateTitle: "",
      stateDetail: "",
      focusTitle: "",
      focusDetail: "",
      feedbackTitle: "",
      feedbackDetail: "",
      hasActiveResearch: false,
      canStartResearch: false,
      canCancelResearch: false,
      canSpeedupResearchByAd: false,
      canCycleResearchCandidate: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  const snapshot = boot.app.screens.tech.getSnapshot();
  const hasActiveResearch = !!snapshot.activeResearch;
  const statusLines = display.statusLines as string[];
  const detailLines = display.detailLines as string[];
  const [litLine, researchableLine] = statusLines;
  const activeOrSelected = detailLines.find(
    (line) => line.includes("研发") || line.includes("Research") || line.includes("候选") || line.includes("Candidate")
  );
  const branchLine = detailLines.find((line: string) => line.includes("路线") || line.includes("分支") || line.includes("branch"));
  const pressureLine = detailLines.find((line: string) => line.includes("压力") || line.includes("pressure"));
  return {
    active: true,
    objectiveTitle: hasActiveResearch ? "推进当前科技" : "选择下一项科技",
    objectiveDetail: hasActiveResearch
      ? "研发中时优先判断是否加速，避免关键建设被技术门槛卡住。"
      : "从候选科技中选择能解决当前供能或经营压力的方向。",
    stateTitle: litLine || "科技状态",
    stateDetail: researchableLine || `可研发 ${snapshot.researchableTechIds.length}`,
    focusTitle: hasActiveResearch ? "研发进度" : "候选科技",
    focusDetail: activeOrSelected || "当前没有可展示的科技候选。",
    feedbackTitle: actionMessage ? "行动反馈" : "技术压力",
    feedbackDetail: actionMessage ?? pressureLine ?? branchLine ?? "科技会改变建设、运维和电网扩张效率。",
    hasActiveResearch,
    canStartResearch: caps.canStartResearch,
    canCancelResearch: caps.canCancelResearch,
    canSpeedupResearchByAd: caps.canSpeedupResearchByAd,
    canCycleResearchCandidate: caps.canCycleResearchCandidate
  };
}
