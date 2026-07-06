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
import { placeCenteredRect } from "../../hudLayout";
import { createHudButton, placeHudButtons, type HudButton } from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import {
  cycleWorldTarget,
  openSelectedWorldTarget,
  queueSelectedWorldTrunk,
  queueWorldSuperHydro,
  queueWorldSuperHydroGrid
} from "./worldActions";
import { readWorldScreenViewModel } from "./worldViewModel";

export class WorldScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private actionMessageKey: string | null = null;
  private readonly card: Node;
  private readonly cardBg: Graphics;
  private readonly titleLabel: Label;
  private readonly detailLabel: Label;
  private readonly openTargetBtn: HudButton;
  private readonly cycleTargetBtn: HudButton;
  private readonly queueTrunkBtn: HudButton;
  private readonly queueSuperHydroBtn: HudButton;
  private readonly queueSuperHydroGridBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("WorldScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.card = new Node("WorldScreenSummaryCard");
    this.card.setParent(this.root);
    this.card.addComponent(UITransform);
    this.cardBg = this.card.addComponent(Graphics);
    this.titleLabel = this.createLabel("WorldScreenTitle", this.card, new Color(245, 252, 255, 255));
    this.detailLabel = this.createLabel("WorldScreenDetail", this.card, new Color(33, 74, 92, 255));

    this.cycleTargetBtn = createHudButton(this.root, "WorldActionCycleTarget", "hud.btn.world_cycle_target", "secondary", () => this.onCycleTarget());
    this.openTargetBtn = createHudButton(this.root, "WorldActionOpenTarget", "hud.btn.world_open_target", "secondary", () => this.onOpenTarget());
    this.queueTrunkBtn = createHudButton(this.root, "WorldActionQueueTrunk", "hud.btn.world_queue_trunk", "primary", () => this.onQueueTrunk());
    this.queueSuperHydroBtn = createHudButton(this.root, "WorldActionQueueSuperHydro", "hud.btn.super_hydro", "primary", () => this.onQueueSuperHydro());
    this.queueSuperHydroGridBtn = createHudButton(this.root, "WorldActionQueueSuperHydroGrid", "hud.btn.super_hydro_grid", "primary", () => this.onQueueSuperHydroGrid());
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readWorldScreenViewModel(this.boot, this.actionMessage());
    this.root.active = vm.active;
    if (!vm.active) return;

    this.titleLabel.string = vm.title || t("hud.btn.world");
    this.detailLabel.string = vm.detail;
    this.cycleTargetBtn.node.active = vm.canCycleTarget;
    this.openTargetBtn.node.active = vm.canOpenTarget;
    this.queueTrunkBtn.node.active = vm.canQueueTrunk;
    this.queueSuperHydroBtn.node.active = vm.canQueueSuperHydro;
    this.queueSuperHydroGridBtn.node.active = vm.canQueueSuperHydroGrid;
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const cardWidth = layout.container.width * 0.34;
    const cardHeight = Math.max(130, Math.min(210, layout.container.height * 0.25));
    placeCenteredRect(this.card, layout.container.width * 0.26, layout.container.height * 0.08, cardWidth, cardHeight);
    this.cardBg.clear();
    this.cardBg.fillColor = new Color(242, 252, 255, 226);
    this.cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.min(18, cardHeight * 0.12));
    this.cardBg.fill();

    placeCenteredRect(this.titleLabel.node, 0, cardHeight * 0.28, cardWidth * 0.88, cardHeight * 0.3);
    this.titleLabel.fontSize = Math.max(19, Math.round(layout.buttonFont * 0.64));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.12);
    placeCenteredRect(this.detailLabel.node, 0, -cardHeight * 0.15, cardWidth * 0.86, cardHeight * 0.58);
    this.detailLabel.fontSize = Math.max(16, Math.round(layout.buttonFont * 0.5));
    this.detailLabel.lineHeight = Math.round(this.detailLabel.fontSize * 1.15);

    placeHudButtons(
      layout.rows[1],
      [this.cycleTargetBtn, this.openTargetBtn, this.queueTrunkBtn, this.queueSuperHydroBtn, this.queueSuperHydroGridBtn],
      layout.buttonFont,
      (role) => this.fillForRole(role)
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

  private fillForRole(role: string): Color {
    if (role === "primary") return new Color(30, 134, 203, 245);
    return new Color(58, 113, 171, 235);
  }

  private actionMessage(): string | null {
    return this.actionMessageKey ? t(this.actionMessageKey) : null;
  }

  private publishAction(result: { ok: boolean; messageKey: string | null; errorCode: string | null }, tag: string): void {
    this.actionMessageKey = result.messageKey;
    this.host.requestRefresh(result.messageKey);
    if (!result.ok) console.warn(`[WorldScreenPanel] ${tag} failed: ${result.errorCode ?? "unknown"}`);
  }

  private onOpenTarget(): void {
    if (!this.boot) return;
    this.publishAction(openSelectedWorldTarget(this.boot), "open target");
  }

  private onCycleTarget(): void {
    if (!this.boot) return;
    this.publishAction(cycleWorldTarget(this.boot), "cycle target");
  }

  private onQueueTrunk(): void {
    if (!this.boot) return;
    this.publishAction(queueSelectedWorldTrunk(this.boot), "queue trunk");
  }

  private onQueueSuperHydro(): void {
    if (!this.boot) return;
    this.publishAction(queueWorldSuperHydro(this.boot), "queue super hydro");
  }

  private onQueueSuperHydroGrid(): void {
    if (!this.boot) return;
    this.publishAction(queueWorldSuperHydroGrid(this.boot), "queue super hydro grid");
  }
}
