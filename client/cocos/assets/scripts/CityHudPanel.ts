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
  view,
  type Vec2
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
  companyClaimCashByAdAsync,
  companyCycleLoanCandidate,
  worldCycleTargetCandidate,
  worldQueueSelectedTrunk,
  worldQueueSuperHydro,
  worldQueueSuperHydroGridLink,
  worldOpenSelectedTarget,
  getClientHudCapabilities,
  getCityHudProfileSnapshot,
  readCityHudViewModel,
  techCancelActiveResearch,
  techSpeedupResearchByAdAsync,
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
import {
  CITY_HUD_STAGE_ASSET_SLOTS,
  CITY_HUD_STAGE_ICON_SLOTS,
  CITY_HUD_STAGE_LAYER_NAMES,
  CITY_HUD_STAGE_STATE_TOKENS,
  CITY_HUD_STAGE_UI_SLOTS,
  type CityHudStageAssetSlot
} from "./cityHudStageSpec";

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
  private cityVisualLayer: Node | null = null;
  private cityBackgroundLayer: Node | null = null;
  private cityFacilityLayer: Node | null = null;
  private cityGridLayer: Node | null = null;
  private cityStateLayer: Node | null = null;
  private cityUiLayer: Node | null = null;
  private cityIconLayer: Node | null = null;
  private cityBackgroundGraphics: Graphics | null = null;
  private cityFacilityGraphics: Graphics | null = null;
  private cityGridGraphics: Graphics | null = null;
  private cityStateGraphics: Graphics | null = null;
  private cashIcon: Node | null = null;
  private socialValueIcon: Node | null = null;
  private cleanlinessIcon: Node | null = null;
  private statusBand: Node | null = null;
  private detailBand: Node | null = null;
  private statusBandBg: Graphics | null = null;
  private detailBandBg: Graphics | null = null;
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

    this.cityVisualLayer = new Node(CITY_HUD_STAGE_LAYER_NAMES.root);
    this.cityVisualLayer.setParent(shell);
    this.cityBackgroundLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.background);
    this.cityFacilityLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.facility);
    this.cityGridLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.grid);
    this.cityStateLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.state);
    this.cityUiLayer = this.createVisualSubLayer(shell, CITY_HUD_STAGE_LAYER_NAMES.ui);
    this.cityIconLayer = this.createVisualSubLayer(shell, CITY_HUD_STAGE_LAYER_NAMES.icon);
    this.cityBackgroundGraphics = this.cityBackgroundLayer.addComponent(Graphics);
    this.cityFacilityGraphics = this.cityFacilityLayer.addComponent(Graphics);
    this.cityGridGraphics = this.cityGridLayer.addComponent(Graphics);
    this.cityStateGraphics = this.cityStateLayer.addComponent(Graphics);
    this.cashIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.cash.nodeName);
    this.socialValueIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.socialValue.nodeName);
    this.cleanlinessIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.cleanliness.nodeName);

    this.statusBand = new Node(CITY_HUD_STAGE_UI_SLOTS.resourceBar.nodeName);
    this.statusBand.setParent(this.cityUiLayer);
    this.statusBandBg = this.statusBand.addComponent(Graphics);
    this.statusLabel = this.createBandLabel(this.statusBand);

    this.detailBand = new Node(CITY_HUD_STAGE_UI_SLOTS.cityStateCard.nodeName);
    this.detailBand.setParent(this.cityUiLayer);
    this.detailBandBg = this.detailBand.addComponent(Graphics);
    this.hintLabel = this.createBandLabel(this.detailBand);

    this.buildWindBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_UI_SLOTS.primaryBuildButton.nodeName,
      "hud.btn.build_wind",
      () => this.onBuildWind()
    );
    this.cycleBuildBtn = this.createTapButton(this.cityUiLayer, "CycleBuild", "hud.btn.cycle_build", () =>
      this.onCycleBuild()
    );
    this.advanceMonthBtn = this.createTapButton(this.cityUiLayer, "AdvanceMonth", "hud.btn.next_month", () =>
      this.onAdvanceMonth()
    );
    this.ackEventBtn = this.createTapButton(this.cityUiLayer, "AckEvent", "hud.btn.ack_event", () => this.onAckEvent());
    this.applyLoanBtn = this.createTapButton(this.cityUiLayer, "ApplyLoan", "hud.btn.loan", () => this.onApplyLoan());
    this.cycleLoanBtn = this.createTapButton(this.cityUiLayer, "CycleLoan", "hud.btn.cycle_loan", () =>
      this.onCycleLoan()
    );
    this.adCashBtn = this.createTapButton(this.cityUiLayer, "AdCash", "hud.btn.ad_cash", () => {
      void this.onAdCash();
    });
    this.startResearchBtn = this.createTapButton(this.cityUiLayer, "StartResearch", "hud.btn.start_research", () =>
      this.onStartResearch()
    );
    this.cancelResearchBtn = this.createTapButton(this.cityUiLayer, "CancelResearch", "hud.btn.cancel_research", () =>
      this.onCancelResearch()
    );
    this.queueRegionLinkBtn = this.createTapButton(this.cityUiLayer, "QueueRegionLink", "hud.btn.queue_link", () =>
      this.onQueueRegionLink()
    );
    this.cancelRegionLinkBtn = this.createTapButton(this.cityUiLayer, "CancelRegionLink", "hud.btn.cancel_link", () =>
      this.onCancelRegionLink()
    );
    this.cycleRegionLinkBtn = this.createTapButton(
      this.cityUiLayer,
      "CycleRegionLink",
      "hud.btn.cycle_region_link",
      () => this.onCycleRegionLink()
    );
    this.openWorldTargetBtn = this.createTapButton(
      this.cityUiLayer,
      "OpenWorldTarget",
      "hud.btn.world_open_target",
      () => this.onOpenWorldTarget()
    );
    this.cycleWorldTargetBtn = this.createTapButton(
      this.cityUiLayer,
      "CycleWorldTarget",
      "hud.btn.world_cycle_target",
      () => this.onCycleWorldTarget()
    );
    this.queueWorldTrunkBtn = this.createTapButton(
      this.cityUiLayer,
      "QueueWorldTrunk",
      "hud.btn.world_queue_trunk",
      () => this.onQueueWorldTrunk()
    );
    this.queueSuperHydroBtn = this.createTapButton(
      this.cityUiLayer,
      "QueueSuperHydro",
      "hud.btn.super_hydro",
      () => this.onQueueSuperHydro()
    );
    this.queueSuperHydroGridBtn = this.createTapButton(
      this.cityUiLayer,
      "QueueSuperHydroGrid",
      "hud.btn.super_hydro_grid",
      () => this.onQueueSuperHydroGrid()
    );
    this.adSpeedupBtn = this.createTapButton(this.cityUiLayer, "AdSpeedup", "hud.btn.ad_speedup", () => {
      void this.onAdSpeedup();
    });
    this.openCompanyBtn = this.createTapButton(this.cityUiLayer, "OpenCompany", "hud.btn.company", () =>
      this.onOpenCompany()
    );
    this.openRegionBtn = this.createTapButton(this.cityUiLayer, "OpenRegion", "hud.btn.region", () =>
      this.onOpenRegion()
    );
    this.openWorldBtn = this.createTapButton(this.cityUiLayer, "OpenWorld", "hud.btn.world", () => this.onOpenWorld());
    this.openTechBtn = this.createTapButton(this.cityUiLayer, "OpenTech", "hud.btn.tech", () => this.onOpenTech());
    this.navBackBtn = this.createTapButton(this.cityUiLayer, "NavBack", "hud.btn.back", () => this.onNavBack());

    this.applyLayout();
  }

  private applyLayout(): void {
    if (
      !this.shell ||
      !this.statusBand ||
      !this.detailBand ||
      !this.statusLabel ||
      !this.hintLabel ||
      !this.cityUiLayer ||
      !this.cityIconLayer
    ) return;

    const container = readHudContainerSize(this.node);
    if (container.width <= 0 || container.height <= 0) return;

    const rootTransform = this.node.getComponent(UITransform);
    rootTransform?.setContentSize(container.width, container.height);

    const compensation = computePortraitLetterboxScale(container);
    this.shell.setScale(compensation, compensation, 1);
    this.shell.setPosition(0, 0, 0);

    const layout = buildHudBandLayout(container);
    this.redrawCityVisual(container);
    placeCenteredRect(this.cityUiLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityIconLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.statusBand, layout.status.x, layout.status.y, layout.status.width, layout.status.height);
    placeCenteredRect(this.detailBand, layout.detail.x, layout.detail.y, layout.detail.width, layout.detail.height);
    this.redrawInfoPanel(this.statusBandBg, layout.status, new Color(18, 73, 104, 218));
    this.redrawInfoPanel(this.detailBandBg, layout.detail, new Color(247, 252, 255, 224));
    this.fitLabelToBand(this.statusLabel, layout.status);
    this.fitLabelToBand(this.hintLabel, layout.detail);
    this.placeStatusIcons(layout.status, layout.detail);
    this.statusLabel.fontSize = layout.statusFont;
    this.statusLabel.lineHeight = Math.round(layout.statusFont * 1.2);
    this.hintLabel.fontSize = layout.detailFont;
    this.hintLabel.lineHeight = Math.round(layout.detailFont * 1.2);
    this.hintLabel.color = new Color(31, 66, 82, 255);

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

  private redrawInfoPanel(graphics: Graphics | null, band: HudBandLayout, color: Color): void {
    if (!graphics) return;
    graphics.clear();
    graphics.fillColor = color;
    graphics.roundRect(-band.width / 2, -band.height / 2, band.width, band.height, Math.min(20, band.height * 0.18));
    graphics.fill();
  }

  private redrawCityVisual(container: { width: number; height: number }): void {
    if (
      !this.cityVisualLayer ||
      !this.cityBackgroundLayer ||
      !this.cityFacilityLayer ||
      !this.cityGridLayer ||
      !this.cityStateLayer ||
      !this.cityBackgroundGraphics ||
      !this.cityFacilityGraphics ||
      !this.cityGridGraphics ||
      !this.cityStateGraphics
    ) return;
    placeCenteredRect(this.cityVisualLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityBackgroundLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityFacilityLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityGridLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityStateLayer, 0, 0, container.width, container.height);

    const background = this.cityBackgroundGraphics;
    const facilities = this.cityFacilityGraphics;
    const grid = this.cityGridGraphics;
    const state = this.cityStateGraphics;
    background.clear();
    facilities.clear();
    grid.clear();
    state.clear();

    const w = container.width;
    const h = container.height;
    const left = -w / 2;
    const bottom = -h / 2;
    const lowCleanliness = this.isLowCleanlinessPreview();
    const nightPhase = this.boot ? readCityHudViewModel(this.boot).month % 12 >= 8 : false;

    this.drawCityBackground(background, left, bottom, w, h, nightPhase);

    const wind = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.windTurbine, left, bottom, w, h);
    const solar = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.solarField, left, bottom, w, h);
    const hydro = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant, left, bottom, w, h);
    this.drawCityFacilities(facilities, wind, solar, hydro, w, h);
    this.drawCityGrid(grid, wind, solar, hydro);
    this.drawCityState(state, left, bottom, w, h, lowCleanliness);
  }

  private resolveStagePoint(
    slot: CityHudStageAssetSlot,
    left: number,
    bottom: number,
    w: number,
    h: number
  ): Vec2 {
    return { x: left + w * slot.xRatio, y: bottom + h * slot.yRatio } as Vec2;
  }

  private createVisualSubLayer(parent: Node, name: string): Node {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    return node;
  }

  private createIconSlot(parent: Node, name: string): Node {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    node.addComponent(Graphics);
    return node;
  }

  private placeStatusIcons(status: HudBandLayout, detail: HudBandLayout): void {
    if (!this.cashIcon || !this.socialValueIcon || !this.cleanlinessIcon) return;
    const size = Math.max(12, Math.min(status.height, detail.height) * 0.3);
    this.placeIcon(this.cashIcon, status.x - status.width * 0.45, status.y, size, new Color(255, 221, 99, 235));
    this.placeIcon(
      this.socialValueIcon,
      status.x - status.width * 0.39,
      status.y,
      size,
      new Color(104, 224, 177, 235)
    );
    this.placeIcon(
      this.cleanlinessIcon,
      detail.x - detail.width * 0.46,
      detail.y,
      size,
      new Color(91, 199, 236, 220)
    );
  }

  private placeIcon(node: Node, x: number, y: number, size: number, color: Color): void {
    placeCenteredRect(node, x, y, size, size);
    const graphics = node.getComponent(Graphics);
    if (!graphics) return;
    graphics.clear();
    graphics.fillColor = color;
    graphics.circle(0, 0, size / 2);
    graphics.fill();
  }

  private drawCityBackground(
    g: Graphics,
    left: number,
    bottom: number,
    w: number,
    h: number,
    nightPhase: boolean
  ): void {
    this.fillRounded(g, left, bottom, w, h, 0, nightPhase ? new Color(38, 93, 142, 255) : new Color(116, 207, 238, 255));
    this.fillRounded(g, left, bottom, w, h * 0.48, 0, new Color(71, 181, 215, 255));
    this.drawSoftSun(g, left + w * 0.82, bottom + h * 0.8, Math.min(w, h) * 0.08, nightPhase);
    this.drawCloud(g, left + w * 0.18, bottom + h * 0.76, w * 0.08);
    this.drawCloud(g, left + w * 0.64, bottom + h * 0.69, w * 0.065);
    this.drawIsland(g, left + w * 0.16, bottom + h * 0.32, w * 0.25, h * 0.12, new Color(126, 209, 124, 255));
    this.drawIsland(g, left + w * 0.54, bottom + h * 0.28, w * 0.36, h * 0.15, new Color(151, 221, 138, 255));
    this.drawIsland(g, left + w * 0.79, bottom + h * 0.42, w * 0.22, h * 0.1, new Color(117, 199, 132, 255));
  }

  private drawCityFacilities(g: Graphics, wind: Vec2, solar: Vec2, hydro: Vec2, w: number, h: number): void {
    const windSlot = CITY_HUD_STAGE_ASSET_SLOTS.windTurbine;
    const solarSlot = CITY_HUD_STAGE_ASSET_SLOTS.solarField;
    const hydroSlot = CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant;
    this.drawWindTurbine(g, wind.x, wind.y, h * windSlot.heightRatio);
    this.drawSolarField(g, solar.x, solar.y, w * solarSlot.widthRatio, h * solarSlot.heightRatio);
    this.drawHydroPlant(g, hydro.x, hydro.y, w * hydroSlot.widthRatio, h * hydroSlot.heightRatio);
  }

  private drawCityGrid(g: Graphics, wind: Vec2, solar: Vec2, hydro: Vec2): void {
    this.drawGridLine(g, wind, solar, true);
    this.drawGridLine(g, solar, hydro, false);
  }

  private drawCityState(g: Graphics, left: number, bottom: number, w: number, h: number, lowCleanliness: boolean): void {
    if (lowCleanliness) {
      this.cityStateLayer!.name = `${CITY_HUD_STAGE_LAYER_NAMES.state}:${CITY_HUD_STAGE_STATE_TOKENS.lowCleanliness}`;
      const warning = CITY_HUD_STAGE_ASSET_SLOTS.warningBadge;
      this.fillRounded(g, left, bottom, w, h, 0, new Color(113, 126, 132, 68));
      this.drawWarningBadge(
        g,
        left + w * warning.xRatio,
        bottom + h * warning.yRatio,
        w * warning.widthRatio,
        h * warning.heightRatio
      );
    } else {
      this.cityStateLayer!.name = `${CITY_HUD_STAGE_LAYER_NAMES.state}:${CITY_HUD_STAGE_STATE_TOKENS.clean}`;
      const clean = CITY_HUD_STAGE_ASSET_SLOTS.cleanBadge;
      this.drawCompletionBadge(
        g,
        left + w * clean.xRatio,
        bottom + h * clean.yRatio,
        w * clean.widthRatio,
        h * clean.heightRatio
      );
    }
  }

  private isLowCleanlinessPreview(): boolean {
    if (!this.boot) return false;
    const viewModel = readCityHudViewModel(this.boot);
    if (viewModel.screen !== "screen_city_detail") return false;
    const profile = getCityHudProfileSnapshot(this.boot);
    return !!profile && (!profile.cityFullyEcoSupply || profile.supplyGapMw > 0);
  }

  private fillRounded(g: Graphics, x: number, y: number, w: number, h: number, radius: number, color: Color): void {
    g.fillColor = color;
    if (radius > 0) {
      g.roundRect(x, y, w, h, radius);
    } else {
      g.rect(x, y, w, h);
    }
    g.fill();
  }

  private drawSoftSun(g: Graphics, x: number, y: number, radius: number, nightPhase: boolean): void {
    g.fillColor = nightPhase ? new Color(185, 226, 255, 230) : new Color(255, 224, 104, 240);
    g.circle(x, y, radius);
    g.fill();
    g.fillColor = nightPhase ? new Color(120, 189, 255, 50) : new Color(255, 238, 154, 68);
    g.circle(x, y, radius * 1.8);
    g.fill();
  }

  private drawCloud(g: Graphics, x: number, y: number, size: number): void {
    g.fillColor = new Color(246, 253, 255, 190);
    g.circle(x, y, size * 0.42);
    g.circle(x + size * 0.35, y + size * 0.12, size * 0.34);
    g.circle(x + size * 0.68, y, size * 0.4);
    g.roundRect(x - size * 0.24, y - size * 0.24, size * 1.05, size * 0.35, size * 0.16);
    g.fill();
  }

  private drawIsland(g: Graphics, x: number, y: number, w: number, h: number, color: Color): void {
    g.fillColor = new Color(231, 216, 150, 255);
    g.ellipse(x - w * 0.03, y - h * 0.08, w * 0.56, h * 0.54);
    g.fill();
    g.fillColor = color;
    g.ellipse(x, y, w * 0.5, h * 0.42);
    g.fill();
  }

  private drawWindTurbine(g: Graphics, x: number, y: number, size: number): void {
    g.strokeColor = new Color(239, 250, 255, 255);
    g.lineWidth = Math.max(3, size * 0.04);
    g.moveTo(x, y - size * 0.45);
    g.lineTo(x, y + size * 0.22);
    g.stroke();
    g.strokeColor = new Color(219, 244, 255, 255);
    g.moveTo(x, y + size * 0.24);
    g.lineTo(x - size * 0.32, y + size * 0.36);
    g.moveTo(x, y + size * 0.24);
    g.lineTo(x + size * 0.3, y + size * 0.42);
    g.moveTo(x, y + size * 0.24);
    g.lineTo(x + size * 0.02, y - size * 0.12);
    g.stroke();
    g.fillColor = new Color(255, 255, 255, 255);
    g.circle(x, y + size * 0.24, size * 0.045);
    g.fill();
  }

  private drawSolarField(g: Graphics, x: number, y: number, w: number, h: number): void {
    g.fillColor = new Color(34, 109, 176, 255);
    g.roundRect(x - w / 2, y - h / 2, w, h, h * 0.12);
    g.fill();
    g.strokeColor = new Color(123, 215, 255, 255);
    g.lineWidth = Math.max(2, h * 0.06);
    for (let i = -1; i <= 1; i += 1) {
      g.moveTo(x - w * 0.42, y + i * h * 0.16);
      g.lineTo(x + w * 0.42, y + i * h * 0.16);
      g.stroke();
    }
  }

  private drawHydroPlant(g: Graphics, x: number, y: number, w: number, h: number): void {
    g.fillColor = new Color(237, 249, 255, 255);
    g.roundRect(x - w / 2, y - h / 2, w, h, h * 0.16);
    g.fill();
    g.fillColor = new Color(71, 174, 219, 255);
    g.roundRect(x - w * 0.36, y - h * 0.1, w * 0.72, h * 0.23, h * 0.08);
    g.fill();
    g.strokeColor = new Color(121, 221, 246, 210);
    g.lineWidth = Math.max(3, h * 0.08);
    g.moveTo(x - w * 0.36, y - h * 0.42);
    g.lineTo(x + w * 0.36, y - h * 0.42);
    g.stroke();
  }

  private drawGridLine(g: Graphics, from: Vec2, to: Vec2, connected: boolean): void {
    g.strokeColor = connected ? new Color(73, 236, 236, 230) : new Color(242, 248, 255, 115);
    g.lineWidth = connected ? 5 : 3;
    g.moveTo(from.x, from.y + 12);
    g.lineTo(to.x, to.y + 12);
    g.stroke();
    g.fillColor = connected ? new Color(178, 255, 250, 235) : new Color(229, 238, 245, 150);
    g.circle(from.x, from.y + 12, 6);
    g.circle(to.x, to.y + 12, 6);
    g.fill();
  }

  private drawWarningBadge(g: Graphics, x: number, y: number, w: number, h: number): void {
    this.fillRounded(g, x - w / 2, y - h / 2, w, h, h * 0.32, new Color(255, 143, 91, 230));
  }

  private drawCompletionBadge(g: Graphics, x: number, y: number, w: number, h: number): void {
    this.fillRounded(g, x - w / 2, y - h / 2, w, h, h * 0.32, new Color(81, 218, 161, 210));
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

  private async onAdCash(): Promise<void> {
    if (!this.boot) return;
    const out = await companyClaimCashByAdAsync(this.boot);
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

  private async onAdSpeedup(): Promise<void> {
    if (!this.boot) return;
    const hasActiveResearch = !!this.boot.app.screens.tech.getSnapshot().activeResearch;
    const out = hasActiveResearch
      ? await techSpeedupResearchByAdAsync(this.boot)
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
