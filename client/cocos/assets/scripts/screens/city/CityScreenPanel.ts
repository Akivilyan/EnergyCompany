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
import { t, type GameBootstrap } from "../../shared/game-client.mjs";
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
  private readonly buildBtn: HudButton;
  private readonly cycleBuildBtn: HudButton;
  private readonly advanceMonthBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("CityScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

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
    setHudButtonCaption(this.buildBtn, "hud.btn.build_selected.short");
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

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
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] build failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCycleBuild(): void {
    if (!this.boot) return;
    const out = cycleCityBuildCandidate(this.boot);
    this.buildPickerOpen = true;
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] build candidate failed: ${out.errorCode ?? "unknown"}`);
  }

  private onAdvanceMonth(): void {
    if (!this.boot) return;
    const out = advanceCityMonth(this.boot);
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[CityScreenPanel] advance failed: ${out.errorCode ?? "unknown"}`);
  }
}
