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
import {
  createHudButton,
  placeHudButtons,
  setHudButtonCaption,
  type HudButton
} from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import {
  cancelActiveTechResearch,
  cycleTechResearchCandidate,
  speedupTechResearchByAd,
  startDefaultTechResearch
} from "./techActions";
import { readTechScreenViewModel } from "./techViewModel";

export class TechScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private actionMessageKey: string | null = null;
  private actionPending = false;
  private readonly card: Node;
  private readonly cardBg: Graphics;
  private readonly titleLabel: Label;
  private readonly detailLabel: Label;
  private readonly startResearchBtn: HudButton;
  private readonly cancelResearchBtn: HudButton;
  private readonly adSpeedupBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("TechScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.card = new Node("TechScreenSummaryCard");
    this.card.setParent(this.root);
    this.card.addComponent(UITransform);
    this.cardBg = this.card.addComponent(Graphics);
    this.titleLabel = this.createLabel("TechScreenTitle", this.card, new Color(245, 252, 255, 255));
    this.detailLabel = this.createLabel("TechScreenDetail", this.card, new Color(33, 74, 92, 255));

    this.startResearchBtn = createHudButton(
      this.root,
      "TechActionStartResearch",
      "hud.btn.start_research",
      "primary",
      () => this.onStartResearch()
    );
    this.cancelResearchBtn = createHudButton(
      this.root,
      "TechActionCancelResearch",
      "hud.btn.cancel_research",
      "warning",
      () => this.onCancelResearch()
    );
    this.adSpeedupBtn = createHudButton(
      this.root,
      "TechActionAdSpeedup",
      "hud.btn.ad_speedup",
      "reward",
      () => void this.onAdSpeedup()
    );
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readTechScreenViewModel(this.boot, this.actionMessage());
    this.root.active = vm.active;
    if (!vm.active) return;

    this.titleLabel.string = vm.title || t("hud.btn.tech");
    this.detailLabel.string = vm.detail;
    this.startResearchBtn.node.active = vm.canStartResearch;
    this.cancelResearchBtn.node.active = vm.canCancelResearch;
    this.adSpeedupBtn.node.active = vm.hasActiveResearch
      ? vm.canSpeedupResearchByAd
      : vm.canCycleResearchCandidate;
    setHudButtonCaption(
      this.adSpeedupBtn,
      vm.hasActiveResearch ? "hud.btn.ad_speedup" : "hud.btn.cycle_research"
    );
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const cardWidth = layout.container.width * 0.66;
    const cardHeight = Math.max(130, Math.min(200, layout.container.height * 0.24));
    const cardY = layout.container.height * 0.05;
    placeCenteredRect(this.card, -layout.container.width * 0.08, cardY, cardWidth, cardHeight);
    this.cardBg.clear();
    this.cardBg.fillColor = new Color(242, 252, 255, 228);
    this.cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.min(18, cardHeight * 0.12));
    this.cardBg.fill();

    placeCenteredRect(this.titleLabel.node, 0, cardHeight * 0.28, cardWidth * 0.92, cardHeight * 0.3);
    this.titleLabel.fontSize = Math.max(20, Math.round(layout.buttonFont * 0.7));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.12);
    placeCenteredRect(this.detailLabel.node, 0, -cardHeight * 0.16, cardWidth * 0.9, cardHeight * 0.58);
    this.detailLabel.fontSize = Math.max(17, Math.round(layout.buttonFont * 0.56));
    this.detailLabel.lineHeight = Math.round(this.detailLabel.fontSize * 1.16);

    placeHudButtons(
      layout.rows[1],
      [this.startResearchBtn, this.cancelResearchBtn],
      layout.buttonFont,
      (role) => this.fillForRole(role)
    );
    placeHudButtons(
      layout.rows[2],
      [this.adSpeedupBtn],
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
    if (role === "reward") return new Color(35, 151, 108, 245);
    if (role === "warning") return new Color(212, 91, 69, 245);
    return new Color(58, 113, 171, 235);
  }

  private actionMessage(): string | null {
    return this.actionMessageKey ? t(this.actionMessageKey) : null;
  }

  private publishAction(result: { ok: boolean; messageKey: string | null; errorCode: string | null }, tag: string): void {
    this.actionMessageKey = result.messageKey;
    this.host.requestRefresh(result.messageKey);
    if (!result.ok) console.warn(`[TechScreenPanel] ${tag} failed: ${result.errorCode ?? "unknown"}`);
  }

  private onStartResearch(): void {
    if (!this.boot) return;
    this.publishAction(startDefaultTechResearch(this.boot), "start research");
  }

  private onCancelResearch(): void {
    if (!this.boot) return;
    this.publishAction(cancelActiveTechResearch(this.boot), "cancel research");
  }

  private async onAdSpeedup(): Promise<void> {
    if (!this.boot || this.actionPending) return;
    this.actionPending = true;
    try {
      const hasActiveResearch = !!this.boot.app.screens.tech.getSnapshot().activeResearch;
      this.publishAction(
        hasActiveResearch
          ? await speedupTechResearchByAd(this.boot)
          : cycleTechResearchCandidate(this.boot),
        "tech action"
      );
    } finally {
      this.actionPending = false;
      this.host.requestRefresh(this.actionMessageKey);
    }
  }
}
