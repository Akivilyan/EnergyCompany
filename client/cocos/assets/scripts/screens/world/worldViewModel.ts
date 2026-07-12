import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface WorldScreenViewModel {
  active: boolean;
  objectiveTitle: string;
  objectiveDetail: string;
  stateTitle: string;
  stateDetail: string;
  focusTitle: string;
  focusDetail: string;
  feedbackTitle: string;
  feedbackDetail: string;
  canOpenTarget: boolean;
  canCycleTarget: boolean;
  canQueueTrunk: boolean;
  canQueueSuperHydro: boolean;
  canQueueSuperHydroGrid: boolean;
}

export function readWorldScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): WorldScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_world_map") {
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
      canOpenTarget: false,
      canCycleTarget: false,
      canQueueTrunk: false,
      canQueueSuperHydro: false,
      canQueueSuperHydroGrid: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  const statusLines = display.statusLines as string[];
  const detailLines = display.detailLines as string[];
  const [worldLine, regionsLine, trunksLine] = statusLines;
  const nextUnlockLine = detailLines[0];
  const regionDetail = detailLines.find((line: string) => line.includes("区域") || line.includes("Region")) ?? detailLines[1];
  const trunkLine = detailLines.find((line: string) => line.includes("干线") || line.includes("trunk") || line.includes("Trunk"));
  const superHydroLine = detailLines.find((line: string) => line.includes("超级水电") || line.includes("Super"));
  return {
    active: true,
    objectiveTitle: "扩张全国电网",
    objectiveDetail: nextUnlockLine || "选择目标区域，建设跨区干线或超级水电链路。",
    stateTitle: worldLine || "大地图状态",
    stateDetail: [regionsLine, trunksLine].filter(Boolean).join(" · "),
    focusTitle: "当前目标",
    focusDetail: regionDetail || "切换目标区域后可进入区域页查看城市供需。",
    feedbackTitle: actionMessage ? "行动反馈" : "跨区工程",
    feedbackDetail: actionMessage ?? trunkLine ?? superHydroLine ?? "跨区工程会占用资金和月份，但能打通长期供能路线。",
    canOpenTarget: caps.canOpenWorldTarget,
    canCycleTarget: caps.canCycleWorldTarget,
    canQueueTrunk: caps.canQueueWorldTrunk,
    canQueueSuperHydro: caps.canQueueSuperHydro,
    canQueueSuperHydroGrid: caps.canQueueSuperHydroGridLink
  };
}
