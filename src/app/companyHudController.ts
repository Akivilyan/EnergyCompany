import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";
import type { ClientNavResult } from "./screenNavController.js";

export interface CompanyHudActionResult {
  ok: boolean;
  view: ClientNavResult["view"];
  uiErrorCode: string | null;
  messageKey: string | null;
}

function toActionResult(boot: GameBootstrap, ok: boolean, uiErrorCode: string | null, messageKey: string | null): CompanyHudActionResult {
  return {
    ok,
    view: readCityHudViewModel(boot),
    uiErrorCode,
    messageKey
  };
}

/** 申请第一个已解锁档位（v0 开发 HUD 用，非正式贷款 UI）。 */
export function companyApplyFirstUnlockedLoan(boot: GameBootstrap): CompanyHudActionResult {
  const snapshot = boot.app.screens.company.getSnapshot();
  const tier = snapshot.loanTierOptions.find((item) => item.unlocked);
  if (!tier) {
    return toActionResult(boot, false, "loan_not_found", "company.error.loan_not_found");
  }
  const out = boot.app.screens.company.applyLoan(tier.loanId);
  return toActionResult(
    boot,
    out.result.ok,
    out.uiErrorCode,
    out.uiCopy?.messageKey ?? null
  );
}

/** 公司屏激励广告领现金（stub Provider 默认可成功）。 */
export function companyClaimCashByAd(boot: GameBootstrap): CompanyHudActionResult {
  const out = boot.app.screens.company.claimCashByAd();
  return toActionResult(
    boot,
    out.result.ok,
    out.uiErrorCode,
    out.uiCopy?.messageKey ?? null
  );
}
