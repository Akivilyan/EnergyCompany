import { Color, Graphics, Node } from "cc";
import type { SpriteCatalog } from "./PlayableAssets";
import { BLUE_TEXT, CYAN, MUTED_TEXT, UiFactory, WHITE } from "./UiFactory";

export interface TechViewOptions {
  node: Node;
  sprites: SpriteCatalog;
  techScreen: any;
  refresh: () => void;
  showToast: (message: string) => void;
  returnToCity: (toast: string) => void;
}

export class TechView extends UiFactory {
  private readonly techScreen: any;
  private readonly refresh: () => void;
  private readonly showToast: (message: string) => void;
  private readonly returnToCity: (toast: string) => void;
  private selectedTechId = "thermal_2";

  constructor(options: TechViewOptions) {
    super(options.node, options.sprites);
    this.techScreen = options.techScreen;
    this.refresh = options.refresh;
    this.showToast = options.showToast;
    this.returnToCity = options.returnToCity;
  }

  resetSelection(): void {
    this.selectedTechId = "thermal_2";
  }

  render(width: number, height: number): void {
    const snapshot = this.techScreen.getSnapshot();
    const selected = snapshot.technologies.find((item: any) => item.techId === this.selectedTechId);
    const thermal2 = snapshot.technologies.find((item: any) => item.techId === "thermal_2");
    const thermal3 = snapshot.technologies.find((item: any) => item.techId === "thermal_3");
    const active = snapshot.activeResearch;
    const top = height / 2;

    this.paintRect(this.node, 0, 0, width, height, new Color(18, 104, 136, 255));
    const backdrop = this.layer("TechBackdrop", this.node, width, height, 0, 0);
    const g = backdrop.addComponent(Graphics);
    g.fillColor = new Color(37, 161, 174, 255);
    g.circle(-width * 0.45, top - 180, 210);
    g.fill();
    g.fillColor = new Color(36, 117, 168, 255);
    g.circle(width * 0.48, -height * 0.33, 280);
    g.fill();

    this.makeTextButton(
      this.node,
      "‹",
      -width / 2 + 42,
      top - 43,
      48,
      48,
      new Color(236, 248, 252, 248),
      BLUE_TEXT,
      () => this.close(),
      31
    );
    this.addLabel(this.node, "科技研发", -38, top - 43, 150, 36, 25, WHITE, false, 0);
    this.addLabel(this.node, `公司 ${this.levelRoman(snapshot.companyLevel)}`, width / 2 - 92, top - 43, 130, 28, 15, WHITE, false, 2);

    const queue = this.layer("ResearchQueue", this.node, width - 32, 88, 0, top - 116);
    this.paintRounded(queue, 0, 0, width - 32, 88, 20, new Color(242, 251, 253, 248), new Color(255, 255, 255, 255), 2);
    this.addSprite(queue, this.sprites.funds, -142, 20, 29, 29);
    this.addLabel(queue, `${snapshot.funds}`, -111, 20, 70, 28, 18, BLUE_TEXT, false, 0);
    this.addLabel(
      queue,
      active ? `单队列 · ${thermal2?.displayName ?? active.techId} 研发中` : "单队列空闲 · 0 / 1",
      27,
      20,
      width - 134,
      28,
      17,
      BLUE_TEXT,
      false,
      0
    );
    this.addLabel(
      queue,
      active ? `剩 ${active.monthsRemaining} 月 · 返回城市推进月份` : "选择节点后立即扣费，只能同时研发一项",
      0,
      -20,
      width - 62,
      25,
      15,
      MUTED_TEXT,
      false,
      0
    );

    const branch = this.layer("ThermalTechBranch", this.node, width - 32, 154, 0, top - 248);
    this.paintRounded(branch, 0, 0, width - 32, 154, 20, new Color(234, 248, 250, 246));
    this.addLabel(branch, "火电路线 · 本切片代表分支", 0, 58, width - 66, 25, 17, BLUE_TEXT, false, 0);
    this.paintRect(branch, 0, -2, 232, 4, new Color(111, 188, 199, 180));
    this.drawTechNode(branch, -116, -12, "火电·I", "lit", false, () => {});
    this.drawTechNode(branch, 0, -12, thermal2?.displayName ?? "火电·II", thermal2?.status ?? "locked", true, () => {
      this.selectedTechId = "thermal_2";
      this.refresh();
    });
    this.drawTechNode(branch, 116, -12, thermal3?.displayName ?? "火电·III", thermal3?.status ?? "locked", false, () => {
      this.selectedTechId = "thermal_3";
      this.refresh();
    });

    const detail = this.layer("SelectedTechDetail", this.node, width - 32, 292, 0, top - 478);
    this.paintRounded(detail, 0, 0, width - 32, 292, 22, new Color(245, 251, 255, 250), new Color(142, 232, 222, 255), 2);
    if (selected) {
      const preview = selected.facilityEffectPreview;
      const statusText = selected.status === "lit"
        ? "✓ 已点亮"
        : selected.status === "researching"
          ? "研发中"
          : selected.status === "unlocked"
            ? "可研发"
            : `公司 ${this.levelRoman(selected.companyLevelMin)} 级或前置未满足`;
      this.addLabel(detail, selected.displayName, 0, 111, width - 72, 34, 24, BLUE_TEXT, false, 0);
      this.paintRounded(detail, 111, 111, 100, 30, 15, selected.status === "lit"
        ? new Color(193, 242, 222, 255)
        : selected.status === "researching"
          ? new Color(255, 231, 163, 255)
          : new Color(211, 238, 247, 255));
      this.addLabel(detail, statusText, 111, 111, 92, 27, 14, BLUE_TEXT, true);
      this.addLabel(detail, `立即扣 ${selected.researchCost} · 研发 ${selected.researchMonths} 月 · 不消耗科技点`, 0, 72, width - 72, 26, 16, MUTED_TEXT, false, 0);
      this.paintRounded(detail, -84, 15, 144, 80, 16, new Color(233, 246, 252, 255));
      this.paintRounded(detail, 84, 15, 144, 80, 16, new Color(232, 249, 244, 255));
      this.addLabel(detail, "现有设施", -84, 36, 116, 23, 15, MUTED_TEXT, true);
      this.addLabel(detail, preview ? `${this.levelRoman(preview.currentTier)}  →  ${this.levelRoman(preview.unlockedTier)}` : "等待前置", -84, 6, 122, 32, 22, BLUE_TEXT, true);
      this.addLabel(detail, "设施供能", 84, 36, 116, 23, 15, MUTED_TEXT, true);
      this.addLabel(
        detail,
        preview && preview.affectedFacilityCount > 0 ? `${preview.currentOutputMw} → ${preview.projectedOutputMw} MW` : "新建设施开放 II 级",
        84,
        6,
        132,
        32,
        18,
        BLUE_TEXT,
        true
      );
      this.addLabel(
        detail,
        preview && preview.affectedFacilityCount > 0 ? `已建 ${preview.affectedFacilityCount} 座火电自动升级 · 完成当月生效` : "点亮后提高火电可建等级",
        0,
        -48,
        width - 72,
        27,
        15,
        BLUE_TEXT,
        true
      );
      this.addLabel(detail, "M3 点亮  →  同步 tier  →  M4 重算供能", 0, -84, width - 72, 25, 15, MUTED_TEXT, true);
      if (selected.status === "researching" && active) {
        this.makeTextButton(detail, `取消研发 · 全额退 ${selected.researchCost}`, 0, -122, width - 78, 48, new Color(224, 237, 244, 255), BLUE_TEXT, () => this.cancelSelectedResearch(active.researchId), 16);
      }
    }

    const primaryLabel = selected?.status === "researching"
      ? `返回城市 · 下一月完成 ${selected.displayName}`
      : selected?.status === "lit"
        ? "返回城市 · 查看火电 II 与供能变化"
        : selected?.status === "unlocked"
          ? `开始研发 · 扣 ${selected.researchCost}`
          : "该节点尚未开放";
    this.makePrimaryButton(
      this.node,
      primaryLabel,
      0,
      -height / 2 + 48,
      width - 38,
      58,
      selected?.status === "unlocked" || selected?.status === "researching" || selected?.status === "lit",
      () => {
        if (selected?.status === "unlocked") this.startSelectedResearch(selected.techId);
        else this.close();
      }
    );
  }

  private drawTechNode(
    parent: Node,
    x: number,
    y: number,
    label: string,
    status: "locked" | "unlocked" | "researching" | "lit",
    selected: boolean,
    onTap: () => void
  ): void {
    const node = this.layer(`TechNode-${label}`, parent, 96, 104, x, y);
    this.paintRounded(node, 0, 0, 88, 98, 18, selected ? new Color(220, 247, 248, 255) : new Color(246, 251, 252, 255), selected ? CYAN : new Color(166, 205, 214, 255), selected ? 3 : 1);
    const frame = status === "locked"
      ? this.sprites.techLocked
      : selected || status === "researching"
        ? this.sprites.techSelected
        : this.sprites.techNormal;
    this.addSprite(node, frame, 0, 16, 48, 48);
    this.addLabel(node, label, 0, -21, 82, 22, 15, BLUE_TEXT, true);
    this.addLabel(node, status === "lit" ? "已点亮" : status === "researching" ? "研发中" : status === "unlocked" ? "可研发" : "未开放", 0, -42, 82, 20, 14, status === "locked" ? MUTED_TEXT : new Color(18, 112, 105, 255), true);
    this.makeHitTarget(node, onTap);
  }

  private startSelectedResearch(techId: string): void {
    const action = this.techScreen.startResearch(techId);
    if (!action.result.ok) {
      this.showToast(action.uiErrorCode === "insufficient_funds" ? "资金不足，无法开始研发" : "当前不能开始这项研发");
      this.refresh();
      return;
    }
    this.showToast("研发已开始 · 费用已扣除");
    this.refresh();
    console.warn(`[PLAYABLE-CORE-03] research started tech=${techId} funds=${action.before.funds}->${action.after.funds} months=${action.after.activeResearch?.monthsRemaining ?? "missing"}`);
  }

  private cancelSelectedResearch(researchId: string): void {
    const action = this.techScreen.cancelResearch(researchId);
    this.showToast(action.result.ok ? "研发已取消 · 费用全额返还" : "取消研发失败");
    this.refresh();
    console.warn(`[PLAYABLE-CORE-03] research cancel ok=${action.result.ok} funds=${action.before.funds}->${action.after.funds}`);
  }

  private close(): void {
    const snapshot = this.techScreen.getSnapshot();
    const thermal2 = snapshot.technologies.find((item: any) => item.techId === "thermal_2");
    const toast = snapshot.activeResearch
      ? `${thermal2?.displayName ?? "研发"}进行中 · 下一月完成`
      : thermal2?.status === "lit"
        ? "火电·II 已点亮并应用到现有设施"
        : "";
    this.returnToCity(toast);
    console.warn(`[PLAYABLE-CORE-03] technology closed status=${thermal2?.status ?? "missing"} active=${snapshot.activeResearch?.monthsRemaining ?? 0}`);
  }
}
