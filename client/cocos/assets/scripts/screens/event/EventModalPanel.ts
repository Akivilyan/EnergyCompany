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
import type { GameBootstrap } from "../../shared/game-client.mjs";
import { placeCenteredRect } from "../../hudLayout";
import {
  createHudButton,
  placeHudButtons,
  setHudButtonCaption,
  type HudButton
} from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import { acknowledgePendingEvent } from "./eventActions";
import { readEventModalViewModel } from "./eventViewModel";

export class EventModalPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private readonly modal: Node;
  private readonly modalBg: Graphics;
  private readonly titleLabel: Label;
  private readonly summaryLabel: Label;
  private readonly impactLabel: Label;
  private readonly ackBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("EventModalPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.modal = new Node("EventModalCard");
    this.modal.setParent(this.root);
    this.modal.addComponent(UITransform);
    this.modalBg = this.modal.addComponent(Graphics);
    this.titleLabel = this.createLabel("EventModalTitle", this.modal, new Color(255, 250, 240, 255));
    this.summaryLabel = this.createLabel("EventModalSummary", this.modal, new Color(46, 78, 92, 255));
    this.impactLabel = this.createLabel("EventModalImpact", this.modal, new Color(134, 64, 47, 255));
    this.ackBtn = createHudButton(
      this.root,
      "EventModalAckButton",
      "hud.btn.ack_event",
      "warning",
      () => this.onAck()
    );
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readEventModalViewModel(this.boot);
    this.root.active = vm.active;
    if (!vm.active) return;
    this.titleLabel.string = vm.title;
    this.summaryLabel.string = vm.summary;
    this.impactLabel.string = vm.impact;
    this.ackBtn.node.active = true;
    setHudButtonCaption(this.ackBtn, vm.ackKey);
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const modalWidth = layout.container.width * 0.72;
    const modalHeight = Math.max(260, Math.min(420, layout.container.height * 0.58));
    placeCenteredRect(this.modal, 0, layout.container.height * 0.05, modalWidth, modalHeight);
    this.modalBg.clear();
    this.modalBg.fillColor = new Color(255, 248, 238, 238);
    this.modalBg.roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, Math.min(24, modalHeight * 0.08));
    this.modalBg.fill();

    placeCenteredRect(this.titleLabel.node, 0, modalHeight * 0.31, modalWidth * 0.84, modalHeight * 0.18);
    this.titleLabel.fontSize = Math.max(22, Math.round(layout.buttonFont * 0.76));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.14);
    placeCenteredRect(this.summaryLabel.node, 0, modalHeight * 0.08, modalWidth * 0.82, modalHeight * 0.22);
    this.summaryLabel.fontSize = Math.max(18, Math.round(layout.buttonFont * 0.58));
    this.summaryLabel.lineHeight = Math.round(this.summaryLabel.fontSize * 1.16);
    placeCenteredRect(this.impactLabel.node, 0, -modalHeight * 0.15, modalWidth * 0.82, modalHeight * 0.22);
    this.impactLabel.fontSize = Math.max(17, Math.round(layout.buttonFont * 0.54));
    this.impactLabel.lineHeight = Math.round(this.impactLabel.fontSize * 1.16);

    placeHudButtons(
      layout.rows[2],
      [this.ackBtn],
      layout.buttonFont,
      () => new Color(212, 91, 69, 245)
    );
  }

  dispose(): void {
    this.root.destroy();
    this.boot = null;
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

  private onAck(): void {
    if (!this.boot) return;
    const out = acknowledgePendingEvent(this.boot);
    this.host.requestRefresh(out.messageKey);
    if (!out.ok) console.warn(`[EventModalPanel] ack failed: ${out.errorCode ?? "unknown"}`);
  }
}
