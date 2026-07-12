import { Color, Node, UITransform } from "cc";
import { t, type GameBootstrap } from "../../../shared/game-client.mjs";
import { placeCenteredRect } from "../../hudLayout";
import {
  createHudButton,
  placeHudButtons,
  setHudButtonCaption,
  type HudButton
} from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import { bottomActionRow, createScreenTextCard, placeDecisionCards, type ScreenTextCard } from "../screenUi";
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
  private readonly objectiveCard: ScreenTextCard;
  private readonly stateCard: ScreenTextCard;
  private readonly focusCard: ScreenTextCard;
  private readonly feedbackCard: ScreenTextCard;
  private readonly startResearchBtn: HudButton;
  private readonly cancelResearchBtn: HudButton;
  private readonly adSpeedupBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("TechScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.objectiveCard = createScreenTextCard(this.root, "TechObjectiveCard");
    this.stateCard = createScreenTextCard(this.root, "TechStateCard");
    this.focusCard = createScreenTextCard(this.root, "TechResearchCard");
    this.feedbackCard = createScreenTextCard(this.root, "TechFeedbackCard");

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

    this.objectiveCard.title.string = vm.objectiveTitle;
    this.objectiveCard.detail.string = vm.objectiveDetail;
    this.stateCard.title.string = vm.stateTitle;
    this.stateCard.detail.string = vm.stateDetail;
    this.focusCard.title.string = vm.focusTitle;
    this.focusCard.detail.string = vm.focusDetail;
    this.feedbackCard.title.string = vm.feedbackTitle;
    this.feedbackCard.detail.string = vm.feedbackDetail;
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

    placeDecisionCards(layout.container, layout.buttonFont, {
      objective: this.objectiveCard,
      state: this.stateCard,
      focus: this.focusCard,
      feedback: this.feedbackCard
    });

    placeHudButtons(
      bottomActionRow(layout.rows),
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
