import {
  Color,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment
} from "cc";
import { t, type GameBootstrap } from "../../../shared/game-client.mjs";
import { placeCenteredRect, splitRowSlots, type HudBandLayout } from "../../hudLayout";
import {
  createHudButton,
  placeHudButtons,
  setHudButtonCaption,
  type HudButton
} from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import {
  advanceCityMonth,
  buildSelectedCityFacility,
  cycleCityBuildCandidate
} from "./cityActions";
import { readCityScreenViewModel, type CityBuildPickerItem } from "./cityViewModel";

export class CityScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private buildPickerOpen = false;
  private readonly buildPickerLayer: Node;
  private readonly buildPickerBg: Graphics;
  private readonly buildPickerRows: Array<{ node: Node; bg: Graphics; label: Label; facilityId: string | null }> = [];
  private readonly objectiveCard: Node;
  private readonly objectiveBg: Graphics;
  private readonly objectiveTitle: Label;
  private readonly objectiveDetail: Label;
  private readonly cityHealthCard: Node;
  private readonly cityHealthBg: Graphics;
  private readonly cityHealthLabel: Label;
  private readonly buildPlanCard: Node;
  private readonly buildPlanBg: Graphics;
  private readonly buildPlanTitle: Label;
  private readonly buildPlanDetail: Label;
  private readonly feedbackCard: Node;
  private readonly feedbackBg: Graphics;
  private readonly feedbackTitle: Label;
  private readonly feedbackDetail: Label;
  private readonly buildBtn: HudButton;
  private readonly cycleBuildBtn: HudButton;
  private readonly advanceMonthBtn: HudButton;
  private actionFeedback: string | null = null;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("CityScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    const objective = this.createCard("CityObjectiveCard");
    this.objectiveCard = objective.node;
    this.objectiveBg = objective.bg;
    this.objectiveTitle = this.createLabel("ObjectiveTitle", this.objectiveCard);
    this.objectiveDetail = this.createLabel("ObjectiveDetail", this.objectiveCard);

    const cityHealth = this.createCard("CityHealthCard");
    this.cityHealthCard = cityHealth.node;
    this.cityHealthBg = cityHealth.bg;
    this.cityHealthLabel = this.createLabel("CityHealthLabel", this.cityHealthCard);

    const buildPlan = this.createCard("CityBuildPlanCard");
    this.buildPlanCard = buildPlan.node;
    this.buildPlanBg = buildPlan.bg;
    this.buildPlanTitle = this.createLabel("BuildPlanTitle", this.buildPlanCard);
    this.buildPlanDetail = this.createLabel("BuildPlanDetail", this.buildPlanCard);

    const feedback = this.createCard("CityFeedbackCard");
    this.feedbackCard = feedback.node;
    this.feedbackBg = feedback.bg;
    this.feedbackTitle = this.createLabel("FeedbackTitle", this.feedbackCard);
    this.feedbackDetail = this.createLabel("FeedbackDetail", this.feedbackCard);

    this.buildPickerLayer = new Node("CityBuildPickerSheet");
    this.buildPickerLayer.setParent(this.root);
    this.buildPickerLayer.addComponent(UITransform);
    this.buildPickerBg = this.buildPickerLayer.addComponent(Graphics);
    for (let i = 0; i < 5; i += 1) {
      const row = new Node(`CityBuildPickerRow${i + 1}`);
      row.setParent(this.buildPickerLayer);
      row.addComponent(UITransform);
      const bg = row.addComponent(Graphics);
      const label = this.createLabel("Label", row);
      const rowState = { node: row, bg, label, facilityId: null as string | null };
      row.on(Node.EventType.TOUCH_END, () => this.onBuildPickerRow(rowState.facilityId));
      this.buildPickerRows.push(rowState);
    }

    this.buildBtn = createHudButton(
      this.root,
      "StageUiPrimaryBuildButton",
      "hud.btn.build_wind",
      "primary",
      () => this.onBuild()
    );
    this.cycleBuildBtn = createHudButton(
      this.root,
      "StageActionCycleBuild",
      "hud.btn.cycle_build",
      "secondary",
      () => this.onCycleBuild()
    );
    this.advanceMonthBtn = createHudButton(
      this.root,
      "StageActionAdvanceMonth",
      "hud.btn.next_month",
      "primary",
      () => this.onAdvanceMonth()
    );
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readCityScreenViewModel(this.boot);
    this.root.active = vm.active;
    if (!vm.active) {
      this.buildPickerOpen = false;
      this.buildPickerLayer.active = false;
      return;
    }
    this.buildBtn.node.active = vm.canBuild;
    this.cycleBuildBtn.node.active = vm.canCycleBuild;
    this.advanceMonthBtn.node.active = true;
    setHudButtonCaption(this.buildBtn, vm.canBuild ? "hud.btn.build_selected.short" : "hud.btn.build_selected");
    this.objectiveTitle.string = vm.objectiveTitle;
    this.objectiveDetail.string = vm.objectiveDetail;
    this.cityHealthLabel.string = vm.cityHealth;
    this.buildPlanTitle.string = "本月建设方案";
    this.buildPlanDetail.string = vm.selectedBuildSummary;
    this.feedbackTitle.string = this.actionFeedback ? "行动反馈" : "工程队列";
    this.feedbackDetail.string = this.actionFeedback ?? vm.queueSummary;
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    this.placeCityDashboard(layout.container, layout.buttonFont);
    this.placeCityActionButtons(layout.rows[3], layout.buttonFont);
    this.placeBuildPicker(layout.container, layout.buttonFont);
  }

  dispose(): void {
    this.root.destroy();
    this.boot = null;
  }

  private createLabel(name: string, parent: Node): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.CLAMP;
    label.enableWrapText = true;
    return label;
  }

  private createCard(name: string): { node: Node; bg: Graphics } {
    const node = new Node(name);
    node.setParent(this.root);
    node.addComponent(UITransform);
    const bg = node.addComponent(Graphics);
    return { node, bg };
  }

  private placeCityDashboard(container: { width: number; height: number }, buttonFont: number): void {
    const contentW = container.width * 0.92;
    const topY = container.height * 0.24;
    const objectiveH = Math.min(88, Math.max(72, container.height * 0.09));
    this.placeInfoCard(
      this.objectiveCard,
      this.objectiveBg,
      0,
      topY,
      contentW,
      objectiveH,
      new Color(20, 82, 114, 226)
    );
    this.placeCardLabel(this.objectiveTitle, 0, objectiveH * 0.18, contentW * 0.9, objectiveH * 0.34, Math.round(buttonFont * 0.78), new Color(255, 255, 255, 255));
    this.placeCardLabel(this.objectiveDetail, 0, -objectiveH * 0.2, contentW * 0.88, objectiveH * 0.42, Math.round(buttonFont * 0.56), new Color(222, 244, 255, 255));

    const gap = container.width * 0.035;
    const cardW = (contentW - gap) / 2;
    const cardH = Math.min(72, Math.max(58, container.height * 0.068));
    const rowY = topY - objectiveH / 2 - cardH / 2 - Math.max(12, container.height * 0.015);
    this.placeInfoCard(
      this.cityHealthCard,
      this.cityHealthBg,
      -cardW / 2 - gap / 2,
      rowY,
      cardW,
      cardH,
      new Color(238, 249, 252, 232)
    );
    this.placeCardLabel(this.cityHealthLabel, 0, 0, cardW * 0.86, cardH * 0.72, Math.round(buttonFont * 0.55), new Color(32, 70, 84, 255));

    this.placeInfoCard(
      this.buildPlanCard,
      this.buildPlanBg,
      cardW / 2 + gap / 2,
      rowY,
      cardW,
      cardH,
      new Color(243, 250, 255, 236)
    );
    this.placeCardLabel(this.buildPlanTitle, 0, cardH * 0.22, cardW * 0.84, cardH * 0.28, Math.round(buttonFont * 0.48), new Color(56, 93, 112, 255));
    this.placeCardLabel(this.buildPlanDetail, 0, -cardH * 0.16, cardW * 0.86, cardH * 0.5, Math.round(buttonFont * 0.52), new Color(24, 62, 86, 255));

    const feedbackH = Math.min(52, Math.max(42, container.height * 0.048));
    const feedbackY = rowY - cardH / 2 - feedbackH / 2 - Math.max(10, container.height * 0.012);
    this.placeInfoCard(
      this.feedbackCard,
      this.feedbackBg,
      0,
      feedbackY,
      contentW,
      feedbackH,
      this.actionFeedback ? new Color(34, 132, 104, 232) : new Color(42, 101, 138, 224)
    );
    this.placeCardLabel(this.feedbackTitle, -contentW * 0.31, 0, contentW * 0.22, feedbackH * 0.7, Math.round(buttonFont * 0.48), new Color(255, 255, 255, 255));
    this.placeCardLabel(this.feedbackDetail, contentW * 0.08, 0, contentW * 0.62, feedbackH * 0.72, Math.round(buttonFont * 0.54), new Color(239, 252, 255, 255));
  }

  private placeInfoCard(
    node: Node,
    bg: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Color
  ): void {
    placeCenteredRect(node, x, y, width, height);
    bg.clear();
    bg.fillColor = fill;
    bg.roundRect(-width / 2, -height / 2, width, height, Math.min(16, height * 0.16));
    bg.fill();
  }

  private placeCardLabel(
    label: Label,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color
  ): void {
    const transform = label.node.getComponent(UITransform) ?? label.node.addComponent(UITransform);
    transform.setContentSize(width, height);
    label.node.setPosition(x, y, 0);
    label.fontSize = fontSize;
    label.lineHeight = Math.round(fontSize * 1.16);
    label.color = color;
  }

  private placeCityActionButtons(row: HudBandLayout, fontSize: number): void {
    const active = [this.cycleBuildBtn, this.buildBtn, this.advanceMonthBtn].filter(
      (btn) => btn.node.active
    );
    if (active.length === 3) {
      const gap = row.width * 0.025;
      const sideW = row.width * 0.23;
      const primaryW = row.width - gap * 2 - sideW * 2;
      const slots: HudBandLayout[] = [
        { x: row.x - row.width / 2 + sideW / 2, y: row.y, width: sideW, height: row.height },
        { x: row.x, y: row.y, width: primaryW, height: row.height },
        { x: row.x + row.width / 2 - sideW / 2, y: row.y, width: sideW, height: row.height }
      ];
      active.forEach((btn, i) => {
        const slot = slots[i];
        placeCenteredRect(btn.node, slot.x, slot.y, slot.width, slot.height);
        placeCenteredRect(btn.label.node, 0, 0, slot.width * 0.92, slot.height * 0.8);
        btn.label.fontSize = i === 2 ? Math.round(fontSize * 1.04) : Math.max(15, Math.round(fontSize * 0.86));
        btn.label.lineHeight = Math.round(btn.label.fontSize * 1.1);
        this.redrawButton(btn);
      });
      return;
    }
    placeHudButtons(row, active, fontSize, (role) => this.fillForRole(role));
  }

  private placeBuildPicker(container: { width: number; height: number }, fontSize: number): void {
    const vm = readCityScreenViewModel(this.boot);
    this.buildPickerLayer.active = vm.active && this.buildPickerOpen;
    if (!this.buildPickerLayer.active) return;

    const width = container.width * 0.88;
    const height = Math.max(150, Math.min(230, container.height * 0.26));
    placeCenteredRect(this.buildPickerLayer, 0, -container.height * 0.2, width, height);
    this.buildPickerLayer.name = "CityBuildPickerSheet:ui-shell:slot-active:ui-shell:slot-bound";
    this.buildPickerBg.clear();
    this.buildPickerBg.fillColor = new Color(20, 89, 128, 236);
    this.buildPickerBg.roundRect(-width / 2, -height / 2, width, height, Math.min(20, height * 0.12));
    this.buildPickerBg.fill();

    const rowGap = Math.max(8, height * 0.045);
    const rowHeight = Math.max(42, (height - rowGap * 3) / 2);
    const colGap = Math.max(8, width * 0.03);
    const colWidth = (width - colGap * 4) / 3;
    const items = vm.buildPickerItems;
    for (let i = 0; i < this.buildPickerRows.length; i += 1) {
      const rowState = this.buildPickerRows[i];
      const candidate = items[i];
      rowState.node.active = !!candidate;
      rowState.facilityId = candidate?.facilityId ?? null;
      if (!candidate) continue;
      this.placePickerCandidate(rowState, candidate, i, width, height, colWidth, rowHeight, colGap, rowGap, fontSize);
    }
  }

  private placePickerCandidate(
    rowState: { node: Node; bg: Graphics; label: Label; facilityId: string | null },
    candidate: CityBuildPickerItem,
    index: number,
    width: number,
    height: number,
    colWidth: number,
    rowHeight: number,
    colGap: number,
    rowGap: number,
    fontSize: number
  ): void {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cellX = -width / 2 + colGap + colWidth / 2 + col * (colWidth + colGap);
    const cellY = height / 2 - rowGap - rowHeight / 2 - row * (rowHeight + rowGap);
    placeCenteredRect(rowState.node, cellX, cellY, colWidth, rowHeight);
    rowState.bg.clear();
    rowState.bg.fillColor = new Color(41, 139, 190, 245);
    rowState.bg.roundRect(-colWidth / 2, -rowHeight / 2, colWidth, rowHeight, Math.min(14, rowHeight * 0.18));
    rowState.bg.fill();
    rowState.label.string = `${candidate.displayName}\n${candidate.buildCost}资 · ${candidate.buildMonths}月`;
    rowState.label.fontSize = Math.max(16, Math.round(fontSize * 0.72));
    rowState.label.lineHeight = Math.round(rowState.label.fontSize * 1.12);
    const transform = rowState.label.node.getComponent(UITransform) ?? rowState.label.node.addComponent(UITransform);
    transform.setContentSize(colWidth * 0.94, rowHeight * 0.9);
    rowState.label.node.setPosition(0, 0, 0);
  }

  private fillForRole(role: string): Color {
    if (role === "primary") return new Color(30, 134, 203, 245);
    return new Color(58, 113, 171, 235);
  }

  private redrawButton(btn: HudButton): void {
    const transform = btn.node.getComponent(UITransform);
    if (!transform) return;
    btn.bg.clear();
    btn.bg.fillColor = this.fillForRole(btn.role);
    btn.bg.roundRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height, Math.min(18, transform.height * 0.16));
    btn.bg.fill();
  }

  private onBuild(): void {
    if (!this.boot) return;
    this.buildPickerOpen = !this.buildPickerOpen;
    this.host.requestRefresh(null);
  }

  private onBuildPickerRow(facilityId: string | null): void {
    if (!this.boot || !facilityId) return;
    const out = buildSelectedCityFacility(this.boot, facilityId);
    this.buildPickerOpen = false;
    this.actionFeedback = out.messageKey ? t(out.messageKey) : (out.ok ? "建设已加入队列" : "建设失败");
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] build failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCycleBuild(): void {
    if (!this.boot) return;
    const out = cycleCityBuildCandidate(this.boot);
    this.buildPickerOpen = true;
    this.actionFeedback = out.messageKey ? t(out.messageKey) : null;
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] build candidate failed: ${out.errorCode ?? "unknown"}`);
  }

  private onAdvanceMonth(): void {
    if (!this.boot) return;
    const out = advanceCityMonth(this.boot);
    const month = this.boot.app.controller.state.currentMonth;
    this.actionFeedback = out.messageKey ? t(out.messageKey) : `已进入 M${month}`;
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] advance failed: ${out.errorCode ?? "unknown"}`);
  }
}
