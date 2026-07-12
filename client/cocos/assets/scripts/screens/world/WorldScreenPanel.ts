import { Color, Node, UITransform } from "cc";
import { t, type GameBootstrap } from "../../../shared/game-client.mjs";
import { placeCenteredRect } from "../../hudLayout";
import { createHudButton, placeHudButtons, type HudButton } from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import { bottomActionRow, createScreenTextCard, placeDecisionCards, type ScreenTextCard } from "../screenUi";
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
  private readonly objectiveCard: ScreenTextCard;
  private readonly stateCard: ScreenTextCard;
  private readonly focusCard: ScreenTextCard;
  private readonly feedbackCard: ScreenTextCard;
  private readonly openTargetBtn: HudButton;
  private readonly cycleTargetBtn: HudButton;
  private readonly queueTrunkBtn: HudButton;
  private readonly queueSuperHydroBtn: HudButton;
  private readonly queueSuperHydroGridBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("WorldScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.objectiveCard = createScreenTextCard(this.root, "WorldObjectiveCard");
    this.stateCard = createScreenTextCard(this.root, "WorldStateCard");
    this.focusCard = createScreenTextCard(this.root, "WorldTargetCard");
    this.feedbackCard = createScreenTextCard(this.root, "WorldFeedbackCard");

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

    this.objectiveCard.title.string = vm.objectiveTitle;
    this.objectiveCard.detail.string = vm.objectiveDetail;
    this.stateCard.title.string = vm.stateTitle;
    this.stateCard.detail.string = vm.stateDetail;
    this.focusCard.title.string = vm.focusTitle;
    this.focusCard.detail.string = vm.focusDetail;
    this.feedbackCard.title.string = vm.feedbackTitle;
    this.feedbackCard.detail.string = vm.feedbackDetail;
    this.cycleTargetBtn.node.active = vm.canCycleTarget;
    this.openTargetBtn.node.active = vm.canOpenTarget;
    this.queueTrunkBtn.node.active = vm.canQueueTrunk;
    this.queueSuperHydroBtn.node.active = vm.canQueueSuperHydro;
    this.queueSuperHydroGridBtn.node.active = vm.canQueueSuperHydroGrid;
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
      [this.cycleTargetBtn, this.openTargetBtn, this.queueTrunkBtn, this.queueSuperHydroBtn, this.queueSuperHydroGridBtn],
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
