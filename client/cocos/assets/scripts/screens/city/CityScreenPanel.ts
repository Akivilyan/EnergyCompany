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
import { placeCenteredRect } from "../../hudLayout";
import {
  createHudButton,
  redrawHudButton,
  setHudButtonCaption,
  type HudButton
} from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import { advanceCityMonth, buildSelectedCityFacility } from "./cityActions";
import { readCityScreenViewModel, type CityBuildPickerItem } from "./cityViewModel";

interface TextPanel {
  node: Node;
  bg: Graphics;
}

interface MetricCard extends TextPanel {
  label: Label;
}

interface PickerRow extends TextPanel {
  label: Label;
  facilityId: string | null;
}

/** 城市首局的唯一展示映射：ViewModel -> 可读 HUD。 */
export class CityScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private readonly titleLabel: Label;
  private readonly metricCards: MetricCard[];
  private readonly objective: TextPanel;
  private readonly objectiveTitle: Label;
  private readonly objectiveDetail: Label;
  private readonly decisionSheet: TextPanel;
  private readonly statusLabel: Label;
  private readonly buildPlanLabel: Label;
  private readonly feedbackLabel: Label;
  private readonly buildBtn: HudButton;
  private readonly advanceMonthBtn: HudButton;
  private readonly pickerLayer: TextPanel;
  private readonly pickerTitle: Label;
  private readonly pickerRows: PickerRow[] = [];
  private pickerOpen = false;
  private actionFeedback: string | null = null;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("CityScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.titleLabel = this.createLabel("CityTitle", this.root, new Color(255, 255, 255, 255));
    this.metricCards = ["FundsMetric", "SupplyMetric", "SocialValueMetric"].map((name) => {
      const panel = this.createPanel(name, this.root);
      return { ...panel, label: this.createLabel(`${name}Label`, panel.node, new Color(28, 64, 80, 255)) };
    });

    this.objective = this.createPanel("CityObjective", this.root);
    this.objectiveTitle = this.createLabel("CityObjectiveTitle", this.objective.node, new Color(255, 255, 255, 255));
    this.objectiveDetail = this.createLabel("CityObjectiveDetail", this.objective.node, new Color(224, 245, 255, 255));

    this.decisionSheet = this.createPanel("CityDecisionSheet", this.root);
    this.statusLabel = this.createLabel("CityStatus", this.decisionSheet.node, new Color(31, 69, 83, 255));
    this.buildPlanLabel = this.createLabel("CityBuildPlan", this.decisionSheet.node, new Color(28, 88, 119, 255));
    this.feedbackLabel = this.createLabel("CityFeedback", this.decisionSheet.node, new Color(48, 93, 79, 255));

    this.buildBtn = createHudButton(this.root, "CityBuildButton", "hud.btn.build_selected", "secondary", () => this.togglePicker());
    this.advanceMonthBtn = createHudButton(this.root, "CityAdvanceMonthButton", "hud.btn.next_month", "primary", () => this.onAdvanceMonth());

    this.pickerLayer = this.createPanel("CityBuildPickerSheet", this.root);
    this.pickerTitle = this.createLabel("CityBuildPickerTitle", this.pickerLayer.node, new Color(255, 255, 255, 255));
    for (let index = 0; index < 5; index += 1) {
      const panel = this.createPanel(`CityBuildPickerRow${index + 1}`, this.pickerLayer.node);
      const row: PickerRow = {
        ...panel,
        label: this.createLabel("Label", panel.node, new Color(255, 255, 255, 255)),
        facilityId: null
      };
      row.node.on(Node.EventType.TOUCH_END, () => this.onPickBuild(row.facilityId));
      this.pickerRows.push(row);
    }
    this.pickerLayer.node.active = false;
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
      this.pickerOpen = false;
      this.pickerLayer.node.active = false;
      return;
    }
    this.titleLabel.string = `${vm.cityName} · 第 ${vm.month} 月`;
    this.metricCards[0].label.string = `资金  ${vm.funds}`;
    this.metricCards[1].label.string = `供能  ${vm.supplyPercent}%`;
    this.metricCards[2].label.string = `SV  ${vm.socialValue}`;
    this.objectiveTitle.string = vm.objectiveTitle;
    this.objectiveDetail.string = vm.objectiveDetail;
    this.statusLabel.string = vm.cityStatus;
    this.buildPlanLabel.string = `建议：${vm.selectedBuildSummary}`;
    this.feedbackLabel.string = this.actionFeedback ?? vm.queueSummary;
    this.buildBtn.node.active = vm.canBuild;
    this.advanceMonthBtn.node.active = true;
    setHudButtonCaption(this.buildBtn, this.pickerOpen ? "hud.btn.back" : "hud.btn.build_selected");
    this.syncPickerRows(vm.buildPickerItems);
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;
    const { width, height } = layout.container;
    const left = -width / 2;
    const bottom = -height / 2;
    const safeX = width * 0.055;
    const safeTop = height * 0.045;
    const safeBottom = height * 0.045;
    const contentW = width - safeX * 2;
    const bodyFont = Math.max(16, Math.round(width * 0.038));
    const smallFont = Math.max(15, Math.round(width * 0.033));
    const titleFont = Math.max(21, Math.round(width * 0.052));

    const titleY = height / 2 - safeTop - Math.max(28, height * 0.026);
    this.placeLabel(this.titleLabel, 0, titleY, contentW, Math.max(46, height * 0.046), titleFont);

    const metricH = Math.max(58, Math.min(86, height * 0.065));
    const metricY = titleY - Math.max(58, height * 0.062);
    const gap = width * 0.025;
    const metricW = (contentW - gap * 2) / 3;
    this.metricCards.forEach((card, index) => {
      const x = left + safeX + metricW / 2 + index * (metricW + gap);
      this.placePanel(card, x, metricY, metricW, metricH, new Color(244, 252, 255, 238), 15);
      this.placeLabel(card.label, 0, 0, metricW * 0.9, metricH * 0.74, bodyFont);
    });

    const objectiveH = Math.max(118, Math.min(158, height * 0.125));
    const objectiveY = metricY - metricH / 2 - objectiveH / 2 - Math.max(14, height * 0.014);
    this.placePanel(this.objective, 0, objectiveY, contentW, objectiveH, new Color(19, 82, 113, 232), 20);
    this.placeLabel(this.objectiveTitle, 0, objectiveH * 0.24, contentW * 0.88, objectiveH * 0.3, titleFont);
    this.placeLabel(this.objectiveDetail, 0, -objectiveH * 0.23, contentW * 0.88, objectiveH * 0.34, smallFont);

    const actionH = Math.max(58, Math.min(104, height * 0.082));
    const actionY = bottom + safeBottom + actionH / 2;
    const actionGap = width * 0.025;
    const buildW = contentW * 0.37;
    const advanceW = contentW - buildW - actionGap;
    this.placeActionButton(this.buildBtn, left + safeX + buildW / 2, actionY, buildW, actionH, layout.buttonFont, new Color(48, 113, 171, 245));
    this.placeActionButton(this.advanceMonthBtn, left + safeX + buildW + actionGap + advanceW / 2, actionY, advanceW, actionH, Math.max(20, layout.buttonFont), new Color(25, 139, 201, 250));

    const sheetH = Math.max(190, Math.min(278, height * 0.22));
    const sheetY = actionY + actionH / 2 + sheetH / 2 + Math.max(12, height * 0.012);
    this.placePanel(this.decisionSheet, 0, sheetY, contentW, sheetH, new Color(247, 253, 255, 242), 22);
    this.placeLabel(this.statusLabel, 0, sheetH * 0.27, contentW * 0.88, sheetH * 0.22, bodyFont);
    this.placeLabel(this.buildPlanLabel, 0, 0, contentW * 0.88, sheetH * 0.25, bodyFont);
    this.placeLabel(this.feedbackLabel, 0, -sheetH * 0.28, contentW * 0.88, sheetH * 0.24, smallFont);

    this.placePicker(layout.container, bodyFont, smallFont);
  }

  dispose(): void {
    this.root.destroy();
    this.boot = null;
  }

  private togglePicker(): void {
    if (!this.boot) return;
    this.pickerOpen = !this.pickerOpen;
    this.actionFeedback = null;
    this.host.requestRefresh();
  }

  private onPickBuild(facilityId: string | null): void {
    if (!this.boot || !facilityId) return;
    const before = readCityScreenViewModel(this.boot);
    const candidate = before.buildPickerItems.find((item) => item.facilityId === facilityId);
    const out = buildSelectedCityFacility(this.boot, facilityId);
    const after = readCityScreenViewModel(this.boot);
    this.pickerOpen = false;
    this.actionFeedback = out.ok
      ? `已开工${candidate?.displayName ?? facilityId}：资金 ${signed(after.funds - before.funds)}，按“下一月”推进工程。`
      : out.messageKey
        ? t(out.messageKey)
        : "建设失败，请检查资金、建设位或选址。";
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] build failed: ${out.errorCode ?? "unknown"}`);
  }

  private onAdvanceMonth(): void {
    if (!this.boot) return;
    const before = readCityScreenViewModel(this.boot);
    const out = advanceCityMonth(this.boot);
    const after = readCityScreenViewModel(this.boot);
    this.actionFeedback = out.ok
      ? `月结完成：资金 ${signed(after.funds - before.funds)}，供能 ${signed(after.supplyPercent - before.supplyPercent, "%")}，SV ${signed(after.socialValue - before.socialValue)}。`
      : out.messageKey
        ? t(out.messageKey)
        : "本月无法推进，请先处理当前阻塞。";
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] advance failed: ${out.errorCode ?? "unknown"}`);
  }

  private syncPickerRows(items: CityBuildPickerItem[]): void {
    this.pickerLayer.node.active = this.pickerOpen;
    this.pickerRows.forEach((row, index) => {
      const item = items[index];
      row.node.active = !!item;
      row.facilityId = item?.facilityId ?? null;
      row.label.string = item ? `${item.displayName}    ${item.buildCost} 资金 · ${item.buildMonths} 月` : "";
    });
  }

  private placePicker(container: { width: number; height: number }, bodyFont: number, smallFont: number): void {
    if (!this.pickerLayer.node.active) return;
    const width = container.width * 0.9;
    const height = Math.max(360, Math.min(620, container.height * 0.5));
    const y = -container.height * 0.06;
    this.placePanel(this.pickerLayer, 0, y, width, height, new Color(16, 73, 105, 250), 24);
    this.placeLabel(this.pickerTitle, 0, height * 0.4, width * 0.86, height * 0.12, Math.max(20, bodyFont));
    this.pickerTitle.string = "选择本月建设项目";

    const activeRows = this.pickerRows.filter((row) => row.node.active);
    const gap = Math.max(8, height * 0.018);
    const usableH = height * 0.72;
    const rowH = Math.max(52, (usableH - gap * Math.max(0, activeRows.length - 1)) / Math.max(1, activeRows.length));
    const firstY = height * 0.28;
    activeRows.forEach((row, index) => {
      const rowY = firstY - rowH / 2 - index * (rowH + gap);
      this.placePanel(row, 0, rowY, width * 0.86, rowH, new Color(42, 139, 190, 250), 15);
      this.placeLabel(row.label, 0, 0, width * 0.78, rowH * 0.78, Math.max(16, smallFont));
    });
  }

  private createPanel(name: string, parent: Node): TextPanel {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    return { node, bg: node.addComponent(Graphics) };
  }

  private createLabel(name: string, parent: Node, color: Color): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.color = color;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.CLAMP;
    label.enableWrapText = true;
    return label;
  }

  private placePanel(
    panel: TextPanel,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Color,
    radius: number
  ): void {
    placeCenteredRect(panel.node, x, y, width, height);
    panel.bg.clear();
    panel.bg.fillColor = fill;
    panel.bg.roundRect(-width / 2, -height / 2, width, height, Math.min(radius, height * 0.22));
    panel.bg.fill();
  }

  private placeLabel(label: Label, x: number, y: number, width: number, height: number, fontSize: number): void {
    placeCenteredRect(label.node, x, y, width, height);
    label.fontSize = Math.max(15, fontSize);
    label.lineHeight = Math.round(label.fontSize * 1.18);
  }

  private placeActionButton(
    button: HudButton,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    fill: Color
  ): void {
    if (!button.node.active) return;
    placeCenteredRect(button.node, x, y, width, height);
    placeCenteredRect(button.label.node, 0, 0, width * 0.88, height * 0.76);
    button.label.fontSize = Math.max(18, fontSize);
    button.label.lineHeight = Math.round(button.label.fontSize * 1.12);
    redrawHudButton(button, fill);
  }
}

function signed(value: number, suffix = ""): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${suffix}`;
}
