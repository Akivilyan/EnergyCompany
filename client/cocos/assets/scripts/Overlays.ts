import { Color, Node } from "cc";
import type { FacilityId, SpriteCatalog } from "./PlayableAssets";
import { BLUE_TEXT, MUTED_TEXT, signed, UiFactory, WHITE } from "./UiFactory";

export interface OverlayVisibility {
  receipt: boolean;
  toast: boolean;
  settling: boolean;
  levelUp: boolean;
}

export interface OverlaysOptions {
  node: Node;
  sprites: SpriteCatalog;
  refresh: () => void;
  openCompany: () => void;
}

export class Overlays extends UiFactory {
  private readonly refresh: () => void;
  private readonly openCompany: () => void;
  private receipt: any = null;
  private levelUpDetail: any = null;
  private toast = "";
  private settling = false;

  constructor(options: OverlaysOptions) {
    super(options.node, options.sprites);
    this.refresh = options.refresh;
    this.openCompany = options.openCompany;
  }

  setToast(message: string): void {
    this.toast = message;
  }

  clearToast(): void {
    this.toast = "";
  }

  clearReceipt(): void {
    this.receipt = null;
  }

  setReceipt(detail: any): void {
    this.receipt = detail;
  }

  setLevelUpDetail(detail: any): void {
    this.levelUpDetail = detail;
  }

  setSettling(settling: boolean): void {
    this.settling = settling;
  }

  isSettling(): boolean {
    return this.settling;
  }

  render(width: number, height: number, visibility: OverlayVisibility): void {
    if (visibility.receipt && this.receipt) this.drawMonthReceipt(this.receipt, width, height);
    if (visibility.toast && this.toast) this.drawToast(this.toast, width, height);
    if (visibility.settling && this.settling) this.drawSettlingOverlay(width, height);
    if (visibility.levelUp && this.levelUpDetail) this.drawLevelUpModal(this.levelUpDetail, width, height);
  }

  private drawLevelUpModal(detail: any, width: number, height: number): void {
    const blocker = this.layer("CompanyLevelUpBlocker", this.node, width, height, 0, 0);
    this.paintRect(blocker, 0, 0, width, height, new Color(20, 63, 94, 128));
    this.makeHitTarget(blocker, () => {});

    const modal = this.layer("CompanyLevelUpModal", this.node, width - 32, 430, 0, 8);
    this.paintRounded(modal, 0, 0, width - 32, 430, 28, new Color(246, 252, 255, 255), new Color(134, 239, 226, 255), 3);
    this.addSprite(modal, this.sprites.companyExp, 0, 163, 48, 48);
    this.addLabel(modal, "公司升级", 0, 119, width - 70, 38, 27, BLUE_TEXT, true);
    this.addLabel(modal, `${this.levelRoman(detail.growth.levelBefore)}  →  ${this.levelRoman(detail.growth.levelAfter)}`, 0, 78, width - 80, 36, 27, new Color(119, 71, 177, 255), true);
    this.paintRounded(modal, 0, 23, width - 74, 74, 17, new Color(239, 244, 252, 255));
    this.addLabel(modal, "为何升级", 0, 41, width - 76, 24, 16, MUTED_TEXT, false, 0);
    this.addLabel(modal, `M9 EXP ${detail.growth.expBefore} → ${detail.growth.expAfter} · 达到门槛 ${detail.growth.reachedThreshold}`, 0, 10, width - 76, 26, 16, BLUE_TEXT, false, 0);
    this.addLabel(modal, "本次解锁", 0, -35, width - 76, 26, 18, BLUE_TEXT, false, 0);
    this.addLabel(modal, "✓ 科技研发入口", 0, -70, width - 76, 25, 17, new Color(18, 112, 105, 255), false, 0);
    this.addLabel(modal, "✓ 起始省新增 2 座可经营城市", 0, -103, width - 76, 25, 16, BLUE_TEXT, false, 0);
    this.addLabel(modal, "等级与这些解锁不会因 EXP 回落而失去", 0, -140, width - 72, 24, 15, MUTED_TEXT, true);
    this.makePrimaryButton(modal, "查看公司成长与下一步", 0, -184, width - 74, 58, true, () => {
      this.levelUpDetail = null;
      this.receipt = null;
      this.openCompany();
      console.warn("[PLAYABLE-CORE-02] level-up acknowledged and company opened");
    });
  }

  private drawMonthReceipt(detail: any, width: number, height: number): void {
    const hudY = height / 2 - 82;
    const completedResearch = detail.research.completed[0];
    const tierChange = detail.research.facilityTierChanges[0];
    if (completedResearch) {
      const receipt = this.layer("TechnologyCompletionReceipt", this.node, width - 32, 176, 0, hudY - 160);
      this.paintRounded(receipt, 0, 0, width - 32, 176, 20, new Color(243, 251, 255, 250), new Color(116, 235, 217, 255), 3);
      this.addSprite(receipt, this.sprites.techSelected, -142, 57, 42, 42);
      this.addLabel(receipt, `第${detail.monthTo}月 · 科技完成`, 0, 60, 240, 29, 19, BLUE_TEXT, false, 0);
      this.addLabel(receipt, `✓ ${completedResearch.displayName} 已点亮`, 8, 25, width - 90, 27, 18, new Color(18, 112, 105, 255), false, 0);
      this.addLabel(
        receipt,
        tierChange
          ? `现有火电 ${this.levelRoman(tierChange.tierBefore)} → ${this.levelRoman(tierChange.tierAfter)} · 设施 ${tierChange.outputMwBefore} → ${tierChange.outputMwAfter} MW`
          : "科技效果已应用",
        8,
        -8,
        width - 90,
        26,
        16,
        BLUE_TEXT,
        false,
        0
      );
      this.addLabel(receipt, `城市供能 ${detail.before.effectiveSupplyMw} → ${detail.after.effectiveSupplyMw} MW (${signed(detail.delta.effectiveSupplyMw)})`, 8, -38, width - 90, 25, 16, BLUE_TEXT, false, 0);
      this.addLabel(receipt, `M3 点亮 → M4 供能重算 · 资金 ${signed(detail.delta.funds)}`, 8, -67, width - 90, 24, 14, MUTED_TEXT, false, 0);
      return;
    }
    const receipt = this.layer("MonthReceipt", this.node, width - 32, 112, 0, hudY - 126);
    this.paintRounded(receipt, 0, 0, width - 32, 112, 19, new Color(243, 251, 255, 247), new Color(255, 255, 255, 255), 2);
    const update = detail.projectUpdates[0];
    const projectText = update
      ? update.state === "completed"
        ? `${this.facilityName(update.facilityId as FacilityId, update.tier)} 已完工 · 当月供能生效`
        : `${this.facilityName(update.facilityId as FacilityId, update.tier)} 施工中 · 剩 ${update.monthsLeft}月`
      : "经营稳定";
    this.addLabel(receipt, `第${detail.monthTo}月速报`, -62, 35, 132, 24, 17, BLUE_TEXT, false, 0);
    this.addLabel(receipt, projectText, 26, 8, width - 82, 24, 16, BLUE_TEXT, false, 0);
    this.addLabel(receipt, `资金 ${signed(detail.delta.funds)} · 每回合 ${signed(detail.after.recurringFundsDeltaEstimate)}`, 26, -18, width - 82, 23, 15, MUTED_TEXT, false, 0);
    this.addSprite(receipt, this.sprites.companyExp, -144, -42, 25, 25);
    this.addLabel(receipt, `供能 ${detail.before.effectiveSupplyMw} → ${detail.after.effectiveSupplyMw} MW · 公司 EXP ${detail.before.socialValue} → ${detail.after.socialValue} (${signed(detail.delta.socialValue)})`, 36, -42, width - 66, 23, 14, BLUE_TEXT, false, 0);
    this.makeTextButton(receipt, "×", width / 2 - 42, 35, 48, 48, new Color(225, 238, 246, 240), BLUE_TEXT, () => {
      this.receipt = null;
      this.refresh();
    }, 23);
  }

  private drawToast(message: string, width: number, height: number): void {
    const y = -height / 2 + 126;
    const toast = this.layer("ActionToast", this.node, width - 70, 46, 0, y);
    this.paintRounded(toast, 0, 0, width - 70, 46, 23, new Color(29, 91, 124, 235), new Color(112, 234, 231, 255), 1);
    this.addLabel(toast, message, 0, 0, width - 88, 30, 16, WHITE, true);
  }

  private drawSettlingOverlay(width: number, height: number): void {
    const overlay = this.layer("MonthSettling", this.node, width, height, 0, 0);
    this.paintRect(overlay, 0, 0, width, height, new Color(211, 244, 252, 56));
    this.paintRounded(overlay, 0, 12, width - 76, 74, 20, new Color(238, 250, 254, 248), new Color(255, 255, 255, 255), 2);
    this.addLabel(overlay, "项目推进  →  供能重算  →  经营结算", 0, 20, width - 96, 28, 17, BLUE_TEXT, true);
    this.addLabel(overlay, "正在推进月份…", 0, -10, width - 96, 22, 14, MUTED_TEXT, true);
  }
}
