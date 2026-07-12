import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface RegionScreenViewModel {
  active: boolean;
  objectiveTitle: string;
  objectiveDetail: string;
  stateTitle: string;
  stateDetail: string;
  focusTitle: string;
  focusDetail: string;
  feedbackTitle: string;
  feedbackDetail: string;
  canQueueLink: boolean;
  canCancelLink: boolean;
  canCycleLink: boolean;
}

export function readRegionScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): RegionScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_region") {
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
      canQueueLink: false,
      canCancelLink: false,
      canCycleLink: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  const statusLines = display.statusLines as string[];
  const detailLines = display.detailLines as string[];
  const [regionLine, citiesLine, candidatesLine] = statusLines;
  const profileLine = detailLines.find((line: string) => line.includes("缺口") || line.includes("gap")) ?? detailLines[1];
  const selectedLink = detailLines.find((line: string) => line.includes("线路") || line.includes("Link") || line.includes("link"));
  const actionLine = detailLines[detailLines.length - 1];
  return {
    active: true,
    objectiveTitle: "规划区域电网",
    objectiveDetail: "在地图上选择城市连线，让缺电城市获得外部供能。",
    stateTitle: regionLine || "区域状态",
    stateDetail: [citiesLine, candidatesLine].filter(Boolean).join(" · "),
    focusTitle: "当前连线",
    focusDetail: selectedLink || "拖拽两个已解锁城市，或使用候选连线按钮。",
    feedbackTitle: actionMessage ? "行动反馈" : "区域压力",
    feedbackDetail: actionMessage ?? profileLine ?? actionLine ?? "优先连接缺口高、资源互补的城市。",
    canQueueLink: caps.canQueueRegionLink,
    canCancelLink: caps.canCancelRegionLink,
    canCycleLink: caps.canCycleRegionLink
  };
}
