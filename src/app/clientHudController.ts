import type { GameBootstrap } from "./gameBootstrap.js";
import { formatCityHudStatus, readCityHudViewModel } from "./cityHudController.js";

/** 按当前 screen 生成顶栏主文案（城市 / 公司 / 科技树）。 */
export function formatClientHudStatus(boot: GameBootstrap): string {
  const screen = boot.play.getNavigation().currentScreen;

  if (screen === "screen_company") {
    const s = boot.app.screens.company.getSnapshot();
    const loan = s.activeLoan
      ? `loan ${s.activeLoan.loanId}(${s.activeLoan.monthsRemaining}m)`
      : "no loan";
    return `Company · Lv${s.companyLevel} · ${s.funds} · ads=${s.adsRemaining} · ${loan}`;
  }

  if (screen === "screen_tech_tree") {
    const s = boot.app.screens.tech.getSnapshot();
    if (!s.canOpen) {
      return `Tech · locked (need Lv2, now Lv${s.companyLevel})`;
    }
    const research = s.activeResearch
      ? `${s.activeResearch.techId} · ${s.activeResearch.monthsRemaining}m left`
      : "idle";
    return `Tech · lit=${s.litTechIds.length} · ${research}`;
  }

  return formatCityHudStatus(readCityHudViewModel(boot));
}
