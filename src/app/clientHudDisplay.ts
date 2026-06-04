import type { GameBootstrap } from "./gameBootstrap.js";
import { readCityHudViewModel } from "./cityHudController.js";

/** 配置表 loan_id → 玩家可读名称（开发 HUD；真 UI 可改读配置 display_name）。 */
export const LOAN_TIER_LABELS: Record<string, string> = {
  loan_1: "小额贷款（30万）",
  loan_2: "中额贷款（80万）",
  loan_3: "大额贷款（200万）",
  loan_4: "特大贷款（500万）",
  loan_5: "战略贷款（1200万）"
};

export function formatLoanTierLabel(loanId: string): string {
  return LOAN_TIER_LABELS[loanId] ?? `贷款${loanId}`;
}

export interface ClientHudDisplay {
  statusLine: string;
  detailLine: string;
}

function formatCityStatus(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const city = view.cityId === "CITY-START" ? "起始城" : view.cityId;
  return `第${view.month}月 · 资金${view.funds} · ${city}`;
}

function formatCompanyStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.company.getSnapshot();
  const statusLine = `公司 · ${s.companyLevel}级 · 资金${s.funds} · 广告${s.adsRemaining}次`;
  let loanPart = "无在贷";
  if (s.activeLoan) {
    loanPart = `在贷：${formatLoanTierLabel(s.activeLoan.loanId)} · 剩${s.activeLoan.monthsRemaining}月`;
  }
  return { statusLine, detailLine: loanPart };
}

function formatTechStatus(boot: GameBootstrap): ClientHudDisplay {
  const s = boot.app.screens.tech.getSnapshot();
  if (!s.canOpen) {
    return {
      statusLine: `科技 · 未解锁（需2级，当前${s.companyLevel}级）`,
      detailLine: "升级公司后再来"
    };
  }
  if (s.activeResearch) {
    return {
      statusLine: `科技 · 已点亮${s.litTechIds.length}项`,
      detailLine: `在研：${s.activeResearch.techId} · 剩${s.activeResearch.monthsRemaining}月`
    };
  }
  return {
    statusLine: `科技 · 已点亮${s.litTechIds.length}项`,
    detailLine: "当前无在研项目"
  };
}

const SCREEN_LABELS: Record<string, string> = {
  screen_city_detail: "城市",
  screen_company: "公司",
  screen_tech_tree: "科技树",
  screen_region: "区域",
  screen_world_map: "大地图",
  screen_main_menu: "主菜单",
  screen_run_result: "终局"
};

export function formatNavHint(boot: GameBootstrap): string {
  const view = readCityHudViewModel(boot);
  const stack = boot.play.getNavigation().stack.length;
  const screen = SCREEN_LABELS[view.screen] ?? view.screen;
  return `${screen} · 返回层${stack}`;
}

/** 主副两行文案，避免单行过长顶出屏幕。 */
export function buildClientHudDisplay(
  boot: GameBootstrap,
  actionMessage: string | null = null
): ClientHudDisplay {
  const screen = boot.play.getNavigation().currentScreen;
  let display: ClientHudDisplay;
  if (screen === "screen_company") {
    display = formatCompanyStatus(boot);
  } else if (screen === "screen_tech_tree") {
    display = formatTechStatus(boot);
  } else {
    display = { statusLine: formatCityStatus(boot), detailLine: formatNavHint(boot) };
  }

  if (screen === "screen_company" || screen === "screen_tech_tree") {
    const nav = formatNavHint(boot);
    display.detailLine = actionMessage
      ? `${nav} · ${display.detailLine} · ${actionMessage}`
      : `${nav} · ${display.detailLine}`;
  } else if (actionMessage) {
    display.detailLine = `${display.detailLine} · ${actionMessage}`;
  }

  return display;
}
