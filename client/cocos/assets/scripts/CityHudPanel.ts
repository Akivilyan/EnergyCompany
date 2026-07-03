import {
  _decorator,
  Component,
  Graphics,
  Label,
  log,
  Node,
  UITransform,
  Color,
  EventTouch,
  HorizontalTextAlignment,
  VerticalTextAlignment,
  Overflow,
  view
} from "cc";
import {
  buildClientHudDisplay,
  cityHudAdvanceMonth,
  cityHudBuildSelected,
  cityHudBuildWind,
  cityHudCycleBuildCandidate,
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenRegion,
  clientNavOpenWorldMap,
  clientNavOpenTechTree,
  regionCycleLinkCandidate,
  regionCancelSelectedLink,
  regionQueueDefaultLink,
  companyApplySelectedLoan,
  companyClaimCashByAd,
  companyCycleLoanCandidate,
  worldCycleTargetCandidate,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro,
  worldQueueSuperHydroGridLink,
  worldOpenSelectedTarget,
  getClientHudCapabilities,
  readCityHudViewModel,
  techCancelActiveResearch,
  techSpeedupResearchByAd,
  techStartDefaultResearch,
  eventsAcknowledgeNextPending,
  t,
  techCycleResearchCandidate,
  type GameBootstrap
} from "../shared/game-client.mjs";
import {
  buildHudBandLayout,
  computePortraitLetterboxScale,
  placeCenteredRect,
  readHudContainerSize,
  splitRowSlots,
  type HudBandLayout,
  unparentWatch
} from "./hudLayout";

const { ccclass } = _decorator;

interface HudButton {
  node: Node;
  label: Label;
  bg: Graphics;
  messageKey: string;
}

@ccclass("CityHudPanel")
export class CityHudPanel extends Component {
  private boot: GameBootstrap | null = null;
  private shell: Node | null = null;
  private statusBand: Node | null = null;
  private detailBand: Node | null = null;
  private statusLabel: Label | null = null;
  private hintLabel: Label | null = null;
  private buildWindBtn: HudButton | null = null;
  private cycleBuildBtn: HudButton | null = null;
  private advanceMonthBtn: HudButton | null = null;
  private applyLoanBtn: HudButton | null = null;
  private cycleLoanBtn: HudButton | null = null;
  private adCashBtn: HudButton | null = null;
  private startResearchBtn: HudButton | null = null;
  private cancelResearchBtn: HudButton | null = null;
  private adSpeedupBtn: HudButton | null = null;
  private ackEventBtn: HudButton | null = null;
  private queueRegionLinkBtn: HudButton | null = null;
  private cancelRegionLinkBtn: HudButton | null = null;
  private cycleRegionLinkBtn: HudButton | null = null;
  private openWorldTargetBtn: HudButton | null = null;
  private cycleWorldTargetBtn: HudButton | null = null;
  private queueWorldTrunkBtn: HudButton | null = null;
  private queueSuperHydroBtn: HudButton | null = null;
  private queueSuperHydroGridBtn: HudButton | null = null;
  private openCompanyBtn: HudButton | null = null;
  private openRegionBtn: HudButton | null = null;
  private openWorldBtn: HudButton | null = null;
  private openTechBtn: HudButton | null = null;
  private navBackBtn: HudButton | null = null;
  private lastActionKey: string | null = null;
  private readonly onLayoutChange = (): void => this.applyLayout();

  onLoad(): void {
    const line = `[CityHudPanel] onLoad on ${this.node.name}`;
    log(line);
    console.warn(line);
    if (!this.node.getComponent(UITransform)) {
      this.node.addComponent(UITransform);
    }
    this.ensureUi();
    this.showLoading();
    this.scheduleLayoutRetries();
  }

  onEnable(): void {
    view.on("canvas-resize", this.onLayoutChange, this);
    this.applyLayout();
    this.scheduleLayoutRetries();
  }

  onDisable(): void {
    view.off("canvas-resize", this.onLayoutChange, this);
    this.unschedule(this.retryLayout);
  }

  onDestroy(): void {
    if (this.shell) unparentWatch(this.shell, this.onLayoutChange);
    view.off("canvas-resize", this.onLayoutChange, this);
    this.boot = null;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  showMountError(message: string): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = t("hud.config_failed");
    this.hintLabel.string = message;
  }

  private scheduleLayoutRetries(): void {
    this.unschedule(this.retryLayout);
    this.schedule(this.retryLayout, 0, 8, 0.05);
  }

  private retryLayout(): void {
    this.applyLayout();
  }

  private ensureUi(): void {
    if (this.statusLabel) return;

    const shell = new Node("HudShell");
    shell.setParent(this.node);
    this.shell = shell;

    this.statusBand = new Node("StatusBand");
    this.statusBand.setParent(shell);
    this.statusLabel = this.createBandLabel(this.statusBand);

    this.detailBand = new Node("DetailBand");
    this.detailBand.setParent(shell);
    this.hintLabel = this.createBandLabel(this.detailBand);

    this.buildWindBtn = this.createTapButton(shell, "BuildWind", "hud.btn.build_wind", () => this.onBuildWind());
    this.cycleBuildBtn = this.createTapButton(shell, "CycleBuild", "hud.btn.cycle_build", () => this.onCycleBuild());
    this.advanceMonthBtn = this.createTapButton(shell, "AdvanceMonth", "hud.btn.next_month", () => this.onAdvanceMonth());
    this.ackEventBtn = this.createTapButton(shell, "AckEvent", "hud.btn.ack_event", () => this.onAckEvent());
    this.applyLoanBtn = this.createTapButton(shell, "ApplyLoan", "hud.btn.loan", () => this.onApplyLoan());
    this.cycleLoanBtn = this.createTapButton(shell, "CycleLoan", "hud.btn.cycle_loan", () => this.onCycleLoan());
    this.adCashBtn = this.createTapButton(shell, "AdCash", "hud.btn.ad_cash", () => this.onAdCash());
    this.startResearchBtn = this.createTapButton(shell, "StartResearch", "hud.btn.start_research", () =>
      this.onStartResearch()
    );
    this.cancelResearchBtn = this.createTapButton(shell, "CancelResearch", "hud.btn.cancel_research", () =>
      this.onCancelResearch()
    );
    this.queueRegionLinkBtn = this.createTapButton(shell, "QueueRegionLink", "hud.btn.queue_link", () =>
      this.onQueueRegionLink()
    );
    this.cancelRegionLinkBtn = this.createTapButton(shell, "CancelRegionLink", "hud.btn.cancel_link", () =>
      this.onCancelRegionLink()
    );
    this.cycleRegionLinkBtn = this.createTapButton(shell, "CycleRegionLink", "hud.btn.cycle_region_link", () =>
      this.onCycleRegionLink()
    );
    this.openWorldTargetBtn = this.createTapButton(shell, "OpenWorldTarget", "hud.btn.world_open_target", () =>
      this.onOpenWorldTarget()
    );
    this.cycleWorldTargetBtn = this.createTapButton(shell, "CycleWorldTarget", "hud.btn.world_cycle_target", () =>
      this.onCycleWorldTarget()
    );
    this.queueWorldTrunkBtn = this.createTapButton(shell, "QueueWorldTrunk", "hud.btn.world_queue_trunk", () =>
      this.onQueueWorldTrunk()
    );
    this.queueSuperHydroBtn = this.createTapButton(shell, "QueueSuperHydro", "hud.btn.super_hydro", () =>
      this.onQueueSuperHydro()
    );
    this.queueSuperHydroGridBtn = this.createTapButton(shell, "QueueSuperHydroGrid", "hud.btn.super_hydro_grid", () =>
      this.onQueueSuperHydroGrid()
    );
    this.adSpeedupBtn = this.createTapButton(shell, "AdSpeedup", "hud.btn.ad_speedup", () => this.onAdSpeedup());
    this.openCompanyBtn = this.createTapButton(shell, "OpenCompany", "hud.btn.company", () => this.onOpenCompany());
    this.openRegionBtn = this.createTapButton(shell, "OpenRegion", "hud.btn.region", () => this.onOpenRegion());
    this.openWorldBtn = this.createTapButton(shell, "OpenWorld", "hud.btn.world", () => this.onOpenWorld());
    this.openTechBtn = this.createTapButton(shell, "OpenTech", "hud.btn.tech", () => this.onOpenTech());
    this.navBackBtn = this.createTapButton(shell, "NavBack", "hud.btn.back", () => this.onNavBack());

    this.applyLayout();
  }

  private applyLayout(): void {
    if (!this.shell || !this.statusBand || !this.detailBand || !this.statusLabel || !this.hintLabel) return;

    const container = readHudContainerSize(this.node);
    if (container.width <= 0 || container.height <= 0) return;

    const rootTransform = this.node.getComponent(UITransform);
    rootTransform?.setContentSize(container.width, container.height);

    const compensation = computePortraitLetterboxScale(container);
    this.shell.setScale(compensation, compensation, 1);
    this.shell.setPosition(0, 0, 0);

    const layout = buildHudBandLayout(container);
    placeCenteredRect(this.statusBand, layout.status.x, layout.status.y, layout.status.width, layout.status.height);
    placeCenteredRect(this.detailBand, layout.detail.x, layout.detail.y, layout.detail.width, layout.detail.height);
    this.fitLabelToBand(this.statusLabel, layout.status);
    this.fitLabelToBand(this.hintLabel, layout.detail);
    this.statusLabel.fontSize = layout.statusFont;
    this.statusLabel.lineHeight = Math.round(layout.statusFont * 1.2);
    this.hintLabel.fontSize = layout.detailFont;
    this.hintLabel.lineHeight = Math.round(layout.detailFont * 1.2);

    this.placeRowButtons(layout.rows[0], [this.cycleBuildBtn, this.buildWindBtn, this.advanceMonthBtn], layout.buttonFont);
    this.placeRowButtons(
      layout.rows[1],
      [
        this.cycleRegionLinkBtn,
        this.queueRegionLinkBtn,
        this.cancelRegionLinkBtn,
        this.ackEventBtn,
        this.cycleWorldTargetBtn,
        this.openWorldTargetBtn,
        this.queueWorldTrunkBtn,
        this.queueSuperHydroBtn,
        this.queueSuperHydroGridBtn,
        this.cycleLoanBtn,
        this.applyLoanBtn,
        this.adCashBtn,
        this.startResearchBtn,
        this.cancelResearchBtn
      ],
      layout.buttonFont
    );
    this.placeRowButtons(layout.rows[2], [this.adSpeedupBtn], layout.buttonFont);
    this.placeRowButtons(
      layout.rows[3],
      [this.openCompanyBtn, this.openRegionBtn, this.openWorldBtn],
      layout.buttonFont
    );
    this.placeRowButtons(layout.rows[4], [this.openTechBtn, this.navBackBtn], layout.buttonFont);
  }

  private placeRowButtons(row: HudBandLayout, buttons: Array<HudButton | null>, fontSize: number): void {
    const active = buttons.filter((btn): btn is HudButton => !!btn && btn.node.active);
    const slots = splitRowSlots(row, active.length);
    for (let i = 0; i < active.length; i += 1) {
      const slot = slots[i];
      const btn = active[i];
      placeCenteredRect(btn.node, slot.x, slot.y, slot.width, slot.height);
      btn.label.fontSize = fontSize;
      btn.label.lineHeight = Math.round(fontSize * 1.12);
      btn.label.enableWrapText = false;
      this.fitLabelToBand(btn.label, slot);
      this.redrawButton(btn);
    }
  }

  private fitLabelToBand(label: Label, band: HudBandLayout): void {
    const node = label.node;
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(band.width * 0.94, band.height * 0.9);
    node.setPosition(0, 0, 0);
  }

  private allButtons(): HudButton[] {
    return [
      this.buildWindBtn,
      this.cycleBuildBtn,
      this.advanceMonthBtn,
      this.applyLoanBtn,
      this.cycleLoanBtn,
      this.adCashBtn,
      this.startResearchBtn,
      this.cancelResearchBtn,
      this.adSpeedupBtn,
      this.ackEventBtn,
      this.queueRegionLinkBtn,
      this.cancelRegionLinkBtn,
      this.cycleRegionLinkBtn,
      this.openWorldTargetBtn,
      this.cycleWorldTargetBtn,
      this.queueWorldTrunkBtn,
      this.queueSuperHydroBtn,
      this.queueSuperHydroGridBtn,
      this.openCompanyBtn,
      this.openRegionBtn,
      this.openWorldBtn,
      this.openTechBtn,
      this.navBackBtn
    ].filter((btn): btn is HudButton => btn !== null);
  }

  private showLoading(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = t("hud.loading");
    this.hintLabel.string = t("hud.wait_mount");
  }

  private createBandLabel(parent: Node): Label {
    const node = new Node("Label");
    node.setParent(parent);
    node.addComponent(UITransform);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.color = new Color(245, 245, 245, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.SHRINK;
    label.enableWrapText = true;
    return label;
  }

  private createTapButton(
    parent: Node,
    name: string,
    messageKey: string,
    handler: () => void
  ): HudButton {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    const bg = node.addComponent(Graphics);
    const labelNode = new Node(`${name}Label`);
    labelNode.setParent(node);
    labelNode.addComponent(UITransform);
    const label = labelNode.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.SHRINK;
    label.enableWrapText = false;
    label.string = t(messageKey);
    node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => handler(), this);
    const hudButton: HudButton = { node, label, bg, messageKey };
    return hudButton;
  }

  private redrawButton(btn: HudButton): void {
    const transform = btn.node.getComponent(UITransform);
    if (!transform) return;
    const w = transform.width;
    const h = transform.height;
    if (w <= 0 || h <= 0) return;
    btn.bg.clear();
    btn.bg.fillColor = new Color(36, 96, 188, 245);
    btn.bg.roundRect(-w / 2, -h / 2, w, h, Math.min(18, h * 0.16));
    btn.bg.fill();
  }

  private setButtonCaption(btn: HudButton | null, messageKey: string): void {
    if (!btn) return;
    btn.messageKey = messageKey;
    btn.label.string = t(messageKey);
  }

  private syncButtonCaptions(): void {
    this.setButtonCaption(this.buildWindBtn, "hud.btn.build_wind");
    this.setButtonCaption(this.cycleBuildBtn, "hud.btn.cycle_build");
    this.setButtonCaption(this.advanceMonthBtn, "hud.btn.next_month");
    this.setButtonCaption(this.applyLoanBtn, "hud.btn.loan");
    this.setButtonCaption(this.cycleLoanBtn, "hud.btn.cycle_loan");
    this.setButtonCaption(this.adCashBtn, "hud.btn.ad_cash");
    this.setButtonCaption(this.startResearchBtn, "hud.btn.start_research");
    this.setButtonCaption(this.cancelResearchBtn, "hud.btn.cancel_research");
    this.setButtonCaption(this.adSpeedupBtn, "hud.btn.ad_speedup");
    this.setButtonCaption(this.ackEventBtn, "hud.btn.ack_event");
    this.setButtonCaption(this.queueRegionLinkBtn, "hud.btn.queue_link");
    this.setButtonCaption(this.cancelRegionLinkBtn, "hud.btn.cancel_link");
    this.setButtonCaption(this.cycleRegionLinkBtn, "hud.btn.cycle_region_link");
    this.setButtonCaption(this.openWorldTargetBtn, "hud.btn.world_open_target");
    this.setButtonCaption(this.cycleWorldTargetBtn, "hud.btn.world_cycle_target");
    this.setButtonCaption(this.queueWorldTrunkBtn, "hud.btn.world_queue_trunk");
    this.setButtonCaption(this.queueSuperHydroBtn, "hud.btn.super_hydro");
    this.setButtonCaption(this.queueSuperHydroGridBtn, "hud.btn.super_hydro_grid");
    this.setButtonCaption(this.openCompanyBtn, "hud.btn.company");
    this.setButtonCaption(this.openRegionBtn, "hud.btn.region");
    this.setButtonCaption(this.openWorldBtn, "hud.btn.world");
    this.setButtonCaption(this.openTechBtn, "hud.btn.tech");
    this.setButtonCaption(this.navBackBtn, "hud.btn.back");
  }

  private actionMessage(): string | null {
    if (!this.lastActionKey) return null;
    return t(this.lastActionKey);
  }

  private refresh(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    if (!this.boot) {
      this.showLoading();
      return;
    }
    const viewModel = readCityHudViewModel(this.boot);
    const caps = getClientHudCapabilities(this.boot);
    const onCompany = viewModel.screen === "screen_company";
    const onRegion = viewModel.screen === "screen_region";
    const onWorld = viewModel.screen === "screen_world_map";
    const onTech = viewModel.screen === "screen_tech_tree";
    const onCity = !onCompany && !onRegion && !onWorld && !onTech;
    const pendingEvent = !!this.boot.app.screens.events.getSnapshot().pendingFullscreen;
    const techSnapshot = this.boot.app.screens.tech.getSnapshot();
    const hasActiveResearch = !!techSnapshot.activeResearch;

    this.buildWindBtn!.node.active = onCity && caps.canBuildInCity;
    this.cycleBuildBtn!.node.active = onCity && caps.canCycleBuildCandidate;
    this.advanceMonthBtn!.node.active = onCity || onRegion;
    this.queueRegionLinkBtn!.node.active = onRegion && caps.canQueueRegionLink;
    this.cancelRegionLinkBtn!.node.active = onRegion && caps.canCancelRegionLink;
    this.cycleRegionLinkBtn!.node.active = onRegion && caps.canCycleRegionLink;
    this.openWorldTargetBtn!.node.active = onWorld && caps.canOpenWorldTarget;
    this.cycleWorldTargetBtn!.node.active = onWorld && caps.canCycleWorldTarget;
    this.queueWorldTrunkBtn!.node.active = onWorld && caps.canQueueWorldTrunk;
    this.queueSuperHydroBtn!.node.active = onWorld && caps.canQueueSuperHydro;
    this.queueSuperHydroGridBtn!.node.active = onWorld && caps.canQueueSuperHydroGridLink;
    this.ackEventBtn!.node.active = onCity && pendingEvent;
    this.applyLoanBtn!.node.active = onCompany && caps.canApplyLoan;
    this.cycleLoanBtn!.node.active = onCompany && caps.canCycleLoanCandidate;
    this.adCashBtn!.node.active = onCompany && caps.canClaimCashAd;
    this.startResearchBtn!.node.active = onTech && caps.canStartResearch;
    this.cancelResearchBtn!.node.active = onTech && caps.canCancelResearch;
    this.adSpeedupBtn!.node.active =
      onTech &&
      (hasActiveResearch ? caps.canSpeedupResearchByAd : caps.canCycleResearchCandidate);
    this.openCompanyBtn!.node.active = true;
    this.openRegionBtn!.node.active = true;
    this.openWorldBtn!.node.active = true;
    this.openTechBtn!.node.active = true;
    this.navBackBtn!.node.active = true;
    this.syncButtonCaptions();
    if (onCity) {
      this.setButtonCaption(this.buildWindBtn, "hud.btn.build_selected");
    }
    if (onTech && !hasActiveResearch) {
      this.setButtonCaption(this.adSpeedupBtn, "hud.btn.cycle_research");
    }

    const display = buildClientHudDisplay(this.boot, this.actionMessage());
    this.statusLabel.string = display.statusLines.join("\n");
    this.hintLabel.string = display.detailLines.join("\n");
    this.applyLayout();
  }

  private onBuildWind(): void {
    if (!this.boot) return;
    const out = cityHudBuildSelected(this.boot);
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] build failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCycleBuild(): void {
    if (!this.boot) return;
    const out = cityHudCycleBuildCandidate(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] build candidate failed: ${out.errorCode ?? "unknown"}`);
  }

  private onAdvanceMonth(): void {
    if (!this.boot) return;
    const out = cityHudAdvanceMonth(this.boot);
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] advance failed: ${out.errorCode ?? "unknown"}`);
  }

  private onOpenCompany(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavOpenCompany(this.boot);
    this.refresh();
  }

  private onOpenTech(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavOpenTechTree(this.boot);
    this.refresh();
  }

  private onOpenRegion(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavOpenRegion(this.boot);
    this.refresh();
  }

  private onOpenWorld(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavOpenWorldMap(this.boot);
    this.refresh();
  }

  private onNavBack(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavBack(this.boot);
    this.refresh();
  }

  private onApplyLoan(): void {
    if (!this.boot) return;
    const out = companyApplySelectedLoan(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] loan failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onCycleLoan(): void {
    if (!this.boot) return;
    const out = companyCycleLoanCandidate(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] loan candidate failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onAdCash(): void {
    if (!this.boot) return;
    const out = companyClaimCashByAd(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] ad cash failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onStartResearch(): void {
    if (!this.boot) return;
    const out = techStartDefaultResearch(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] start research failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onCancelResearch(): void {
    if (!this.boot) return;
    const out = techCancelActiveResearch(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] cancel research failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onAdSpeedup(): void {
    if (!this.boot) return;
    const hasActiveResearch = !!this.boot.app.screens.tech.getSnapshot().activeResearch;
    const out = hasActiveResearch
      ? techSpeedupResearchByAd(this.boot)
      : techCycleResearchCandidate(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] tech action failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onAckEvent(): void {
    if (!this.boot) return;
    const out = eventsAcknowledgeNextPending(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] ack event failed: ${out.uiErrorCode ?? "unknown"}`);
  }

  private onQueueRegionLink(): void {
    if (!this.boot) return;
    const out = regionQueueDefaultLink(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] region link failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCancelRegionLink(): void {
    if (!this.boot) return;
    const out = regionCancelSelectedLink(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] cancel region link failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCycleRegionLink(): void {
    if (!this.boot) return;
    const out = regionCycleLinkCandidate(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] region candidate failed: ${out.errorCode ?? "unknown"}`);
  }

  private onOpenWorldTarget(): void {
    if (!this.boot) return;
    const out = worldOpenSelectedTarget(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] world open failed: ${out.errorCode ?? "unknown"}`);
  }

  private onCycleWorldTarget(): void {
    if (!this.boot) return;
    const out = worldCycleTargetCandidate(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] world cycle failed: ${out.errorCode ?? "unknown"}`);
  }

  private onQueueWorldTrunk(): void {
    if (!this.boot) return;
    const out = worldQueueSelectedTrunk(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] world trunk failed: ${out.errorCode ?? "unknown"}`);
  }

  private onQueueSuperHydro(): void {
    if (!this.boot) return;
    const out = worldQueueSuperHydro(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] super hydro failed: ${out.errorCode ?? "unknown"}`);
  }

  private onQueueSuperHydroGrid(): void {
    if (!this.boot) return;
    const out = worldQueueSuperHydroGridLink(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] super hydro grid failed: ${out.errorCode ?? "unknown"}`);
  }
}
