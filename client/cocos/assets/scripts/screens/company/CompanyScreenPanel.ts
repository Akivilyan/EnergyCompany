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
  private readonly card: Node;
  private readonly cardBg: Graphics;
  private readonly titleLabel: Label;
  private readonly detailLabel: Label;
  private readonly applyLoanBtn: HudButton;
  private readonly cycleLoanBtn: HudButton;
  private readonly adCashBtn: HudButton;
  private readonly adSpeedupBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("CompanyScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.card = new Node("CompanyScreenSummaryCard");
    this.card.setParent(this.root);
    this.card.addComponent(UITransform);
    this.cardBg = this.card.addComponent(Graphics);
    this.titleLabel = this.createLabel("CompanyScreenTitle", this.card, new Color(245, 252, 255, 255));
    this.detailLabel = this.createLabel("CompanyScreenDetail", this.card, new Color(33, 74, 92, 255));

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

    this.titleLabel.string = vm.title || t("hud.btn.company");
    this.detailLabel.string = vm.detail;
    this.applyLoanBtn.node.active = vm.canApplyLoan;
    this.cycleLoanBtn.node.active = vm.canCycleLoan;
    this.adCashBtn.node.active = vm.canClaimCashAd;
    this.adSpeedupBtn.node.active = vm.canSpeedupConstructionByAd;
    setHudButtonCaption(this.adSpeedupBtn, "hud.btn.ad_build_speedup");
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const cardWidth = layout.container.width * 0.7;
    const cardHeight = Math.max(130, Math.min(190, layout.container.height * 0.22));
    const cardY = layout.container.height * 0.08;
    placeCenteredRect(this.card, 0, cardY, cardWidth, cardHeight);
    this.cardBg.clear();
    this.cardBg.fillColor = new Color(242, 252, 255, 228);
    this.cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.min(18, cardHeight * 0.12));
    this.cardBg.fill();

    const titleHeight = cardHeight * 0.32;
    placeCenteredRect(this.titleLabel.node, 0, cardHeight * 0.28, cardWidth * 0.92, titleHeight);
    this.titleLabel.fontSize = Math.max(20, Math.round(layout.buttonFont * 0.72));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.12);
    placeCenteredRect(this.detailLabel.node, 0, -cardHeight * 0.16, cardWidth * 0.9, cardHeight * 0.58);
    this.detailLabel.fontSize = Math.max(17, Math.round(layout.buttonFont * 0.58));
    this.detailLabel.lineHeight = Math.round(this.detailLabel.fontSize * 1.16);

    placeHudButtons(
      layout.rows[1],
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
