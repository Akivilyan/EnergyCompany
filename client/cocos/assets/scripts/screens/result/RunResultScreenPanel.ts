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
import type { GameBootstrap } from "../../../shared/game-client.mjs";
import { placeCenteredRect } from "../../hudLayout";
import type { ScreenPanel, ScreenPanelLayout } from "../ScreenPanel";
import { readRunResultScreenViewModel } from "./runResultViewModel";

export class RunResultScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private readonly card: Node;
  private readonly cardBg: Graphics;
  private readonly titleLabel: Label;
  private readonly detailLabel: Label;

  constructor(parent: Node) {
    this.root = new Node("RunResultScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.card = new Node("RunResultScreenSummaryCard");
    this.card.setParent(this.root);
    this.card.addComponent(UITransform);
    this.cardBg = this.card.addComponent(Graphics);
    this.titleLabel = this.createLabel("RunResultScreenTitle", this.card, new Color(245, 252, 255, 255));
    this.detailLabel = this.createLabel("RunResultScreenDetail", this.card, new Color(33, 74, 92, 255));
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readRunResultScreenViewModel(this.boot);
    this.root.active = vm.active;
    if (!vm.active) return;
    this.titleLabel.string = vm.title;
    this.detailLabel.string = vm.detail;
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const cardWidth = layout.container.width * 0.68;
    const cardHeight = Math.max(210, Math.min(330, layout.container.height * 0.42));
    placeCenteredRect(this.card, 0, layout.container.height * 0.02, cardWidth, cardHeight);
    this.cardBg.clear();
    this.cardBg.fillColor = new Color(242, 252, 255, 232);
    this.cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.min(22, cardHeight * 0.1));
    this.cardBg.fill();

    placeCenteredRect(this.titleLabel.node, 0, cardHeight * 0.32, cardWidth * 0.88, cardHeight * 0.22);
    this.titleLabel.fontSize = Math.max(22, Math.round(layout.buttonFont * 0.78));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.14);
    placeCenteredRect(this.detailLabel.node, 0, -cardHeight * 0.12, cardWidth * 0.88, cardHeight * 0.62);
    this.detailLabel.fontSize = Math.max(17, Math.round(layout.buttonFont * 0.54));
    this.detailLabel.lineHeight = Math.round(this.detailLabel.fontSize * 1.18);
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
}
