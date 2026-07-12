import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../../shared/game-client.mjs";

export interface CompanyScreenViewModel {
  active: boolean;
  objectiveTitle: string;
  objectiveDetail: string;
  stateTitle: string;
  stateDetail: string;
  focusTitle: string;
  focusDetail: string;
  feedbackTitle: string;
  feedbackDetail: string;
  canApplyLoan: boolean;
  canCycleLoan: boolean;
  canClaimCashAd: boolean;
  canSpeedupConstructionByAd: boolean;
}

export function readCompanyScreenViewModel(
  boot: GameBootstrap | null,
  actionMessage: string | null
): CompanyScreenViewModel {
  if (!boot || boot.play.getNavigation().currentScreen !== "screen_company") {
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
      canApplyLoan: false,
      canCycleLoan: false,
      canClaimCashAd: false,
      canSpeedupConstructionByAd: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  const statusLines = display.statusLines as string[];
  const detailLines = display.detailLines as string[];
  const [companyLine, fundsLine, adsLine] = statusLines;
  const svLine = detailLines[0] ?? "";
  const goalLine = detailLines[1] ?? "";
  const cashflowLine = detailLines.find((line: string) => line.includes("现金流") || line.includes("Cashflow"));
  const loanLine = detailLines.find((line: string) => line.includes("贷款") || line.includes("loan") || line.includes("Loan"));
  return {
    active: true,
    objectiveTitle: "公司经营",
    objectiveDetail: goalLine || "用资金工具稳住现金流，再回到城市推进建设。",
    stateTitle: companyLine || "公司状态",
    stateDetail: [fundsLine, adsLine].filter(Boolean).join(" · "),
    focusTitle: "当前资金方案",
    focusDetail: loanLine || "无贷款压力，可按需要切换融资方案。",
    feedbackTitle: actionMessage ? "行动反馈" : "经营提示",
    feedbackDetail: actionMessage ?? cashflowLine ?? svLine ?? "资金、广告次数和评级会影响建设节奏。",
    canApplyLoan: caps.canApplyLoan,
    canCycleLoan: caps.canCycleLoanCandidate,
    canClaimCashAd: caps.canClaimCashAd,
    canSpeedupConstructionByAd: caps.canSpeedupConstructionByAd
  };
}
