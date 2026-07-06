import {
  buildClientHudDisplay,
  getClientHudCapabilities,
  type GameBootstrap
} from "../../shared/game-client.mjs";

export interface CompanyScreenViewModel {
  active: boolean;
  title: string;
  detail: string;
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
      title: "",
      detail: "",
      canApplyLoan: false,
      canCycleLoan: false,
      canClaimCashAd: false,
      canSpeedupConstructionByAd: false
    };
  }

  const display = buildClientHudDisplay(boot, actionMessage);
  const caps = getClientHudCapabilities(boot);
  return {
    active: true,
    title: display.statusLines.join("    "),
    detail: display.detailLines.slice(0, 4).join("\n"),
    canApplyLoan: caps.canApplyLoan,
    canCycleLoan: caps.canCycleLoanCandidate,
    canClaimCashAd: caps.canClaimCashAd,
    canSpeedupConstructionByAd: caps.canSpeedupConstructionByAd
  };
}
