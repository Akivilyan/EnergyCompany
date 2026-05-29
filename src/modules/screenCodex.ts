import type { GameState, SimResult } from "../sim/index.js";
import type { RunController } from "./runController.js";

export type CodexPageId = "codex_core" | "codex_ads";
export type CodexUiErrorCode = "page_not_found";

export interface CodexUiCopySpec {
  messageKey: string;
  actionKey: string;
}

export const CODEX_UI_COPY: Record<CodexUiErrorCode, CodexUiCopySpec> = {
  page_not_found: {
    messageKey: "codex.error.page_not_found",
    actionKey: "codex.action.go_core"
  }
};

export interface CodexPage {
  pageId: CodexPageId;
  titleKey: string;
  summaryKey: string;
  bulletKeys: string[];
}

export interface CodexSnapshot {
  month: number;
  doctrineId: GameState["doctrineId"];
  companyLevel: number;
  adsRemaining: number;
  activePageId: CodexPageId;
  pages: CodexPage[];
}

export interface OpenCodexPageOutput {
  snapshot: CodexSnapshot;
  page: CodexPage | null;
  uiErrorCode: CodexUiErrorCode | null;
  uiCopy: CodexUiCopySpec | null;
}

function resolveUiCopy(code: CodexUiErrorCode | null): CodexUiCopySpec | null {
  if (!code) return null;
  return CODEX_UI_COPY[code];
}

export class ScreenCodex {
  constructor(private readonly controller: RunController) {}

  private buildPages(): CodexPage[] {
    const state = this.controller.state;
    const adCash = this.controller.config.getAdReward(state.companyLevel);
    return [
      {
        pageId: "codex_core",
        titleKey: "codex.core.title",
        summaryKey: "codex.core.summary",
        bulletKeys: [
          "codex.core.bullet.city_build_and_next_month",
          "codex.core.bullet.supply_and_social_value",
          `codex.core.bullet.current_doctrine.${state.doctrineId}`
        ]
      },
      {
        pageId: "codex_ads",
        titleKey: "codex.ads.title",
        summaryKey: "codex.ads.summary",
        bulletKeys: [
          `codex.ads.bullet.cash_reward_${adCash}`,
          "codex.ads.bullet.speedup_finishes_research",
          `codex.ads.bullet.remaining_${state.adsRemaining}`
        ]
      }
    ];
  }

  getSnapshot(activePageId: CodexPageId = "codex_core"): CodexSnapshot {
    const state = this.controller.state;
    const pages = this.buildPages();
    return {
      month: state.currentMonth,
      doctrineId: state.doctrineId,
      companyLevel: state.companyLevel,
      adsRemaining: state.adsRemaining,
      activePageId,
      pages
    };
  }

  openPage(pageId: string): SimResult<OpenCodexPageOutput> {
    const pages = this.buildPages();
    const page = pages.find((item) => item.pageId === pageId) ?? null;
    const fallbackId: CodexPageId = page ? page.pageId : "codex_core";
    const snapshot = this.getSnapshot(fallbackId);
    if (!page) {
      return {
        ok: false,
        error: "not_found",
        message: "codex page not found",
        context: {
          page_id: pageId
        }
      };
    }
    return {
      ok: true,
      value: {
        snapshot,
        page,
        uiErrorCode: null,
        uiCopy: null
      }
    };
  }

  tryOpenPage(pageId: string): OpenCodexPageOutput {
    const result = this.openPage(pageId);
    if (result.ok) return result.value;
    const snapshot = this.getSnapshot("codex_core");
    const uiErrorCode: CodexUiErrorCode = "page_not_found";
    return {
      snapshot,
      page: null,
      uiErrorCode,
      uiCopy: resolveUiCopy(uiErrorCode)
    };
  }
}

export function createScreenCodex(controller: RunController): ScreenCodex {
  return new ScreenCodex(controller);
}
