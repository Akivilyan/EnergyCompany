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
  applySelectedCompanyLoan,
  claimCompanyCashByAd,
  cycleCompanyLoanCandidate,
  speedupCompanyConstructionByAd
} from "./companyActions";
import { readCompanyScreenViewModel } from "./companyViewModel";

export class CompanyScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private actionMessageKey: string | null = null;
  private actionPending = false;
  private readonly objectiveCard: ScreenTextCard;
  private readonly stateCard: ScreenTextCard;
  private readonly focusCard: ScreenTextCard;
  private readonly feedbackCard: ScreenTextCard;
  private readonly applyLoanBtn: HudButton;
  private readonly cycleLoanBtn: HudButton;
  private readonly adCashBtn: HudButton;
  private readonly adSpeedupBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("CompanyScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.objectiveCard = createScreenTextCard(this.root, "CompanyObjectiveCard");
    this.stateCard = createScreenTextCard(this.root, "CompanyStateCard");
    this.focusCard = createScreenTextCard(this.root, "CompanyLoanCard");
    this.feedbackCard = createScreenTextCard(this.root, "CompanyFeedbackCard");

    this.applyLoanBtn = createHudButton(
      this.root,
      "CompanyActionApplyLoan",
      "hud.btn.loan",
      "secondary",
      () => this.onApplyLoan()
    );
    this.cycleLoanBtn = createHudButton(
      this.root,
      "CompanyActionCycleLoan",
      "hud.btn.cycle_loan",
      "secondary",
      () => this.onCycleLoan()
    );
    this.adCashBtn = createHudButton(
      this.root,
      "CompanyActionAdCash",
      "hud.btn.ad_cash",
      "reward",
      () => void this.onAdCash()
    );
    this.adSpeedupBtn = createHudButton(
      this.root,
      "CompanyActionAdSpeedup",
      "hud.btn.ad_build_speedup",
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
    const vm = readCompanyScreenViewModel(this.boot, this.actionMessage());
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
    this.applyLoanBtn.node.active = vm.canApplyLoan;
    this.cycleLoanBtn.node.active = vm.canCycleLoan;
    this.adCashBtn.node.active = vm.canClaimCashAd;
    this.adSpeedupBtn.node.active = vm.canSpeedupConstructionByAd;
    setHudButtonCaption(this.adSpeedupBtn, "hud.btn.ad_build_speedup");
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
      [this.cycleLoanBtn, this.applyLoanBtn, this.adCashBtn],
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
    if (role === "reward") return new Color(35, 151, 108, 245);
    return new Color(58, 113, 171, 235);
  }

  private actionMessage(): string | null {
    return this.actionMessageKey ? t(this.actionMessageKey) : null;
  }

  private publishAction(result: { ok: boolean; messageKey: string | null; errorCode: string | null }, tag: string): void {
    this.actionMessageKey = result.messageKey;
    this.host.requestRefresh(result.messageKey);
    if (!result.ok) console.warn(`[CompanyScreenPanel] ${tag} failed: ${result.errorCode ?? "unknown"}`);
  }

  private onApplyLoan(): void {
    if (!this.boot) return;
    this.publishAction(applySelectedCompanyLoan(this.boot), "loan");
  }

  private onCycleLoan(): void {
    if (!this.boot) return;
    this.publishAction(cycleCompanyLoanCandidate(this.boot), "loan candidate");
  }

  private async onAdCash(): Promise<void> {
    if (!this.boot || this.actionPending) return;
    this.actionPending = true;
    try {
      this.publishAction(await claimCompanyCashByAd(this.boot), "ad cash");
    } finally {
      this.actionPending = false;
      this.host.requestRefresh(this.actionMessageKey);
    }
  }

  private async onAdSpeedup(): Promise<void> {
    if (!this.boot || this.actionPending) return;
    this.actionPending = true;
    try {
      this.publishAction(await speedupCompanyConstructionByAd(this.boot), "build ad");
    } finally {
      this.actionPending = false;
      this.host.requestRefresh(this.actionMessageKey);
    }
  }
}
