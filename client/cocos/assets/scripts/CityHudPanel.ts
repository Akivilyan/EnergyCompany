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
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenRegion,
  clientNavOpenWorldMap,
  clientNavOpenTechTree,
  getCityHudProfileSnapshot,
  readCityHudViewModel,
  t,
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
  CITY_HUD_STAGE_ACTION_SLOTS,
  CITY_HUD_STAGE_ASSET_SLOTS,
  CITY_HUD_STAGE_ASSET_TOKENS,
  CITY_HUD_STAGE_EFFECT_SLOTS,
  CITY_HUD_STAGE_EFFECT_TOKENS,
  CITY_HUD_STAGE_FEEDBACK_SLOTS,
  CITY_HUD_STAGE_FEEDBACK_TOKENS,
  CITY_HUD_STAGE_GRID_SLOTS,
  CITY_HUD_STAGE_GRID_TOKENS,
  CITY_HUD_STAGE_ICON_SLOTS,
  CITY_HUD_STAGE_ICON_TOKENS,
  CITY_HUD_STAGE_INTERACTION_TOKENS,
  CITY_HUD_STAGE_SHELL_ORDER,
  CITY_HUD_STAGE_LAYER_NAMES,
  CITY_HUD_STAGE_SCREEN_TOKENS,
  CITY_HUD_STAGE_STATE_TOKENS,
  CITY_HUD_STAGE_UI_SLOTS,
  CITY_HUD_STAGE_UI_TOKENS,
  CITY_HUD_STAGE_VISUAL_ORDER,
  type CityHudStageActionSlot,
  type CityHudStageAssetSlot,
  type CityHudStageEffectSlot,
  type CityHudStageFeedbackSlot,
  type CityHudStageGridSlot,
  type CityHudStageIconSlot
} from "./cityHudStageSpec";
import {
  UI_SHELL_ALL_SLOTS,
  UI_SHELL_LAYER_NAMES,
  UI_SHELL_SCREEN_TOKENS,
  UI_SHELL_SLOT_ROLE_TOKENS,
  UI_SHELL_SLOT_STATE_TOKENS,
  type UiShellStageSlot
} from "./uiShellStageSpec";
import { CityScreenPanel } from "./screens/city/CityScreenPanel";
import { readCityScreenViewModel } from "./screens/city/cityViewModel";
import { CompanyScreenPanel } from "./screens/company/CompanyScreenPanel";
import { EventModalPanel } from "./screens/event/EventModalPanel";
import { RegionScreenPanel } from "./screens/region/RegionScreenPanel";
import { RunResultScreenPanel } from "./screens/result/RunResultScreenPanel";
import { ScreenHost } from "./screens/ScreenHost";
import { TechScreenPanel } from "./screens/tech/TechScreenPanel";
import { WorldScreenPanel } from "./screens/world/WorldScreenPanel";

const { ccclass } = _decorator;

type CityHudStageButtonRole = CityHudStageActionSlot["role"] | "primary";

interface HudButton {
  node: Node;
  label: Label;
  bg: Graphics;
  baseName: string;
  messageKey: string;
  role: CityHudStageButtonRole;
}

@ccclass("CityHudPanel")
export class CityHudPanel extends Component {
  private boot: GameBootstrap | null = null;
  private shell: Node | null = null;
  private cityVisualLayer: Node | null = null;
  private cityBackgroundLayer: Node | null = null;
  private cityFacilityLayer: Node | null = null;
  private cityGridLayer: Node | null = null;
  private cityEffectLayer: Node | null = null;
  private cityStateLayer: Node | null = null;
  private cityUiLayer: Node | null = null;
  private cityIconLayer: Node | null = null;
  private productUiShellLayer: Node | null = null;
  private readonly productUiShellSlots = new Map<string, Node>();
  private readonly productUiShellLabels = new Map<string, Label>();
  private cityBackgroundGraphics: Graphics | null = null;
  private cityFacilityGraphics: Graphics | null = null;
  private cityGridGraphics: Graphics | null = null;
  private cityStateGraphics: Graphics | null = null;
  private windAssetSlot: Node | null = null;
  private solarAssetSlot: Node | null = null;
  private hydroAssetSlot: Node | null = null;
  private windSolarGridSlot: Node | null = null;
  private solarHydroGridSlot: Node | null = null;
  private buildGlowSlot: Node | null = null;
  private gridGlowSlot: Node | null = null;
  private disasterWarningSlot: Node | null = null;
  private constructionProgressSlot: Node | null = null;
  private completionPulseSlot: Node | null = null;
  private cleanBadgeSlot: Node | null = null;
  private warningBadgeSlot: Node | null = null;
  private cashIcon: Node | null = null;
  private socialValueIcon: Node | null = null;
  private cleanlinessIcon: Node | null = null;
  private statusBand: Node | null = null;
  private detailBand: Node | null = null;
  private statusBandBg: Graphics | null = null;
  private detailBandBg: Graphics | null = null;
  private statusLabel: Label | null = null;
  private hintLabel: Label | null = null;
  private eventRail: Node | null = null;
  private eventRailBg: Graphics | null = null;
  private eventRailLabel: Label | null = null;
  private openCompanyBtn: HudButton | null = null;
  private openRegionBtn: HudButton | null = null;
  private openWorldBtn: HudButton | null = null;
  private openTechBtn: HudButton | null = null;
  private navBackBtn: HudButton | null = null;
  private screenHost: ScreenHost | null = null;
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
    this.screenHost?.dispose();
    this.screenHost = null;
    view.off("canvas-resize", this.onLayoutChange, this);
    this.boot = null;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.screenHost?.bindGameBoot(boot);
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
    this.cityEffectLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.effect);
    this.cityStateLayer = this.createVisualSubLayer(this.cityVisualLayer, CITY_HUD_STAGE_LAYER_NAMES.state);
    this.cityUiLayer = this.createVisualSubLayer(shell, CITY_HUD_STAGE_LAYER_NAMES.ui);
    this.cityIconLayer = this.createVisualSubLayer(shell, CITY_HUD_STAGE_LAYER_NAMES.icon);
    this.productUiShellLayer = this.createVisualSubLayer(shell, UI_SHELL_LAYER_NAMES.root);
    this.applyStageLayerOrder();
    this.cityBackgroundGraphics = this.cityBackgroundLayer.addComponent(Graphics);
    this.cityFacilityGraphics = this.cityFacilityLayer.addComponent(Graphics);
    this.cityGridGraphics = this.cityGridLayer.addComponent(Graphics);
    this.cityStateGraphics = this.cityStateLayer.addComponent(Graphics);
    this.windAssetSlot = this.createStageAssetSlot(this.cityFacilityLayer, CITY_HUD_STAGE_ASSET_SLOTS.windTurbine);
    this.solarAssetSlot = this.createStageAssetSlot(this.cityFacilityLayer, CITY_HUD_STAGE_ASSET_SLOTS.solarField);
    this.hydroAssetSlot = this.createStageAssetSlot(this.cityFacilityLayer, CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant);
    this.windSolarGridSlot = this.createStageGridSlot(this.cityGridLayer, CITY_HUD_STAGE_GRID_SLOTS.windSolar);
    this.solarHydroGridSlot = this.createStageGridSlot(this.cityGridLayer, CITY_HUD_STAGE_GRID_SLOTS.solarHydro);
    this.buildGlowSlot = this.createStageEffectSlot(this.cityEffectLayer, CITY_HUD_STAGE_EFFECT_SLOTS.buildGlow);
    this.gridGlowSlot = this.createStageEffectSlot(this.cityEffectLayer, CITY_HUD_STAGE_EFFECT_SLOTS.gridGlow);
    this.disasterWarningSlot = this.createStageFeedbackSlot(
      this.cityStateLayer,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.disasterWarning
    );
    this.constructionProgressSlot = this.createStageFeedbackSlot(
      this.cityStateLayer,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.constructionProgress
    );
    this.completionPulseSlot = this.createStageFeedbackSlot(
      this.cityStateLayer,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.completionPulse
    );
    this.cleanBadgeSlot = this.createStageAssetSlot(this.cityStateLayer, CITY_HUD_STAGE_ASSET_SLOTS.cleanBadge);
    this.warningBadgeSlot = this.createStageAssetSlot(this.cityStateLayer, CITY_HUD_STAGE_ASSET_SLOTS.warningBadge);
    this.cashIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.cash);
    this.socialValueIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.socialValue);
    this.cleanlinessIcon = this.createIconSlot(this.cityIconLayer, CITY_HUD_STAGE_ICON_SLOTS.cleanliness);
    this.createProductUiShellSlots();

    this.statusBand = new Node(CITY_HUD_STAGE_UI_SLOTS.resourceBar.nodeName);
    this.statusBand.setParent(this.cityUiLayer);
    this.statusBandBg = this.statusBand.addComponent(Graphics);
    this.statusLabel = this.createBandLabel(this.statusBand);

    this.detailBand = new Node(CITY_HUD_STAGE_UI_SLOTS.cityStateCard.nodeName);
    this.detailBand.setParent(this.cityUiLayer);
    this.detailBandBg = this.detailBand.addComponent(Graphics);
    this.hintLabel = this.createBandLabel(this.detailBand);

    this.eventRail = new Node("EventRailStack");
    this.eventRail.setParent(this.cityUiLayer);
    this.eventRail.addComponent(UITransform);
    this.eventRailBg = this.eventRail.addComponent(Graphics);
    this.eventRailLabel = this.createBandLabel(this.eventRail);
    this.eventRail.on(Node.EventType.TOUCH_END, () => this.onEventRail(), this);

    this.openCompanyBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_ACTION_SLOTS.openCompany.nodeName,
      "hud.btn.company",
      () => this.onOpenCompany()
    );
    this.openRegionBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_ACTION_SLOTS.openRegion.nodeName,
      "hud.btn.region",
      () => this.onOpenRegion()
    );
    this.openWorldBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_ACTION_SLOTS.openWorld.nodeName,
      "hud.btn.world",
      () => this.onOpenWorld()
    );
    this.openTechBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_ACTION_SLOTS.openTech.nodeName,
      "hud.btn.tech",
      () => this.onOpenTech()
    );
    this.navBackBtn = this.createTapButton(
      this.cityUiLayer,
      CITY_HUD_STAGE_ACTION_SLOTS.navBack.nodeName,
      "hud.btn.back",
      () => this.onNavBack()
    );
    const screenPanelHost = {
      requestRefresh: (messageKey?: string | null) => {
        this.lastActionKey = messageKey ?? null;
        this.refresh();
      }
    };
    this.screenHost = new ScreenHost()
      .register("screen_city_detail", new CityScreenPanel(this.cityUiLayer, screenPanelHost))
      .register("screen_company", new CompanyScreenPanel(this.cityUiLayer, screenPanelHost))
      .register("screen_tech_tree", new TechScreenPanel(this.cityUiLayer, screenPanelHost))
      .register("screen_run_result", new RunResultScreenPanel(this.cityUiLayer))
      .register("screen_world_map", new WorldScreenPanel(this.cityUiLayer, screenPanelHost))
      .register("screen_region", new RegionScreenPanel(this.cityUiLayer, screenPanelHost))
      .register("screen_events", new EventModalPanel(this.cityUiLayer, screenPanelHost));

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
      !this.cityIconLayer ||
      !this.productUiShellLayer
    ) return;

    const container = readHudContainerSize(this.node);
    if (container.width <= 0 || container.height <= 0) return;

    const rootTransform = this.node.getComponent(UITransform);
    rootTransform?.setContentSize(container.width, container.height);

    const compensation = computePortraitLetterboxScale(container);
    this.shell.setScale(compensation, compensation, 1);
    this.shell.setPosition(0, 0, 0);

    const layout = buildHudBandLayout(container);
    const onCity = this.isCurrentCityScreen();
    this.redrawCityVisual(container);
    placeCenteredRect(this.cityUiLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.cityIconLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.productUiShellLayer, 0, 0, container.width, container.height);
    placeCenteredRect(this.statusBand, layout.status.x, layout.status.y, layout.status.width, layout.status.height);
    placeCenteredRect(this.detailBand, layout.detail.x, layout.detail.y, layout.detail.width, layout.detail.height);
    this.detailBand.active = onCity;
    this.hintLabel.node.active = onCity;
    this.redrawInfoPanel(this.statusBandBg, layout.status, new Color(18, 73, 104, 218));
    this.redrawInfoPanel(this.detailBandBg, layout.detail, new Color(247, 252, 255, 224));
    this.syncPanelStateTokens(container);
    this.fitLabelToBand(this.statusLabel, layout.status);
    this.fitLabelToBand(this.hintLabel, layout.detail);
    this.placeStatusIcons(layout.status, layout.detail);
    this.syncProductUiShellSlots(container);
    this.statusLabel.fontSize = layout.statusFont;
    this.statusLabel.lineHeight = Math.round(layout.statusFont * 1.2);
    this.hintLabel.fontSize = layout.detailFont;
    this.hintLabel.lineHeight = Math.round(layout.detailFont * 1.2);
    this.hintLabel.color = new Color(31, 66, 82, 255);
    this.placeEventRail(container, layout.buttonFont);
    this.screenHost?.applyLayout({
      container,
      rows: layout.rows,
      buttonFont: layout.buttonFont
    });

    if (onCity) {
      this.placeRowButtons(
        layout.rows[4],
        [this.openCompanyBtn, this.openTechBtn, this.openRegionBtn, this.openWorldBtn],
        Math.max(15, Math.round(layout.buttonFont * 0.88))
      );
    } else {
      this.placeRowButtons(
        layout.rows[1],
        [
        ],
        layout.buttonFont
      );
      this.placeRowButtons(
        layout.rows[3],
        [this.openCompanyBtn, this.openRegionBtn, this.openWorldBtn],
        layout.buttonFont
      );
      this.placeRowButtons(layout.rows[4], [this.openTechBtn, this.navBackBtn], layout.buttonFont);
    }
  }

  private isCurrentCityScreen(): boolean {
    if (!this.boot) return true;
    return readCityHudViewModel(this.boot).screen === "screen_city_detail";
  }

  private placeEventRail(container: { width: number; height: number }, fontSize: number): void {
    if (!this.eventRail || !this.eventRailBg || !this.eventRailLabel) return;
    const onCity = this.isCurrentCityScreen();
    this.eventRail.active = onCity;
    if (!onCity) return;
    const pending = this.hasPendingDisasterFeedback();
    const width = Math.min(54, Math.max(42, container.width * 0.15));
    const height = Math.min(150, Math.max(112, container.height * 0.22));
    const x = -container.width / 2 + width / 2 + container.width * 0.035;
    const y = container.height * 0.02;
    placeCenteredRect(this.eventRail, x, y, width, height);
    this.eventRail.name = pending
      ? `EventRailStack:${CITY_HUD_STAGE_FEEDBACK_TOKENS.visible}:${CITY_HUD_STAGE_FEEDBACK_TOKENS.disaster}`
      : `EventRailStack:${CITY_HUD_STAGE_FEEDBACK_TOKENS.hidden}:${CITY_HUD_STAGE_FEEDBACK_TOKENS.calm}`;
    this.eventRailBg.clear();
    this.eventRailBg.fillColor = pending ? new Color(255, 139, 87, 232) : new Color(39, 111, 147, 218);
    this.eventRailBg.roundRect(-width / 2, -height / 2, width, height, Math.min(14, width * 0.24));
    this.eventRailBg.fill();
    this.eventRailLabel.string = pending ? "事件\n!" : "事件\n0";
    this.eventRailLabel.fontSize = Math.max(18, Math.round(fontSize * 0.9));
    this.eventRailLabel.lineHeight = Math.round(this.eventRailLabel.fontSize * 1.3);
    this.eventRailLabel.color = new Color(255, 255, 255, 255);
    this.fitLabelToBand(this.eventRailLabel, { x, y, width, height });
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

  private formatStatusText(lines: string[], onCity: boolean): string {
    return onCity ? lines.join("    ") : lines.join("\n");
  }

  private formatDetailText(lines: string[], onCity: boolean): string {
    const selected = this.selectPlayableDetailLines(lines, onCity);
    return onCity
      ? selected.map((line) => this.compactHudLine(line, 36)).join("\n")
      : selected.map((line) => this.compactHudLine(line, 48)).join("\n");
  }

  private selectPlayableDetailLines(lines: string[], onCity: boolean): string[] {
    if (!onCity) return lines.slice(0, 6);
    const hiddenPrefixes = [
      "负荷",
      "Demand",
      "界面：",
      "Screen:",
      "返回层",
      "Back stack",
      "可切换建造",
      "Build options",
      "压力拆解：",
      "Pressure breakdown:",
      "科技解法：",
      "Tech solution:",
      "灾害轴：",
      "Disaster axis:"
    ];
    const visible = lines.filter(
      (line) => !hiddenPrefixes.some((prefix) => line.startsWith(prefix))
    );
    const priorityPrefixes = [
      "候选：",
      "Candidate:",
      "建造建议：",
      "Build action:",
      "备考建议：",
      "Prep action:",
      "灾害待确认：",
      "Disaster pending:"
    ];
    const picked: string[] = [];
    for (const prefix of priorityPrefixes) {
      const line = visible.find((item) => item.startsWith(prefix));
      if (line && !picked.includes(line)) picked.push(line);
    }
    for (const line of visible) {
      if (picked.length >= 3) break;
      if (!picked.includes(line)) picked.push(line);
    }
    return picked.slice(0, 3);
  }

  private compactHudLine(line: string, maxLength: number): string {
    return line.length > maxLength ? `${line.slice(0, maxLength - 1)}...` : line;
  }

  private formatCityShellStatus(): string {
    return readCityScreenViewModel(this.boot).status || t("hud.loading");
  }

  private formatCityShellDetail(fallbackLines: string[]): string {
    return readCityScreenViewModel(this.boot).detail || this.formatDetailText(fallbackLines, true);
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
      !this.cityEffectLayer ||
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
    placeCenteredRect(this.cityEffectLayer, 0, 0, container.width, container.height);
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
    this.syncScreenStateToken();
    this.placeStageAssetSlot(this.windAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.windTurbine, left, bottom, w, h);
    this.placeStageAssetSlot(this.solarAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.solarField, left, bottom, w, h);
    this.placeStageAssetSlot(this.hydroAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant, left, bottom, w, h);
    this.syncFacilityAssetStateTokens();
    this.placeStageAssetSlot(this.cleanBadgeSlot, CITY_HUD_STAGE_ASSET_SLOTS.cleanBadge, left, bottom, w, h);
    this.placeStageAssetSlot(this.warningBadgeSlot, CITY_HUD_STAGE_ASSET_SLOTS.warningBadge, left, bottom, w, h);
    this.placeStageFeedbackSlot(
      this.disasterWarningSlot,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.disasterWarning,
      left,
      bottom,
      w,
      h,
      this.hasPendingDisasterFeedback(),
      CITY_HUD_STAGE_FEEDBACK_TOKENS.disaster
    );
    this.placeStageFeedbackSlot(
      this.constructionProgressSlot,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.constructionProgress,
      left,
      bottom,
      w,
      h,
      this.hasConstructionFeedback(),
      CITY_HUD_STAGE_FEEDBACK_TOKENS.construction
    );
    this.placeStageFeedbackSlot(
      this.completionPulseSlot,
      CITY_HUD_STAGE_FEEDBACK_SLOTS.completionPulse,
      left,
      bottom,
      w,
      h,
      this.hasCompletionFeedback(),
      CITY_HUD_STAGE_FEEDBACK_TOKENS.completion
    );
    if (this.cleanBadgeSlot) this.cleanBadgeSlot.active = !lowCleanliness;
    if (this.warningBadgeSlot) this.warningBadgeSlot.active = lowCleanliness;

    this.drawCityBackground(background, left, bottom, w, h, nightPhase);

    const wind = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.windTurbine, left, bottom, w, h);
    const solar = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.solarField, left, bottom, w, h);
    const hydro = this.resolveStagePoint(CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant, left, bottom, w, h);
    this.placeStageGridSlot(this.windSolarGridSlot, CITY_HUD_STAGE_GRID_SLOTS.windSolar, wind, solar, true);
    this.placeStageGridSlot(this.solarHydroGridSlot, CITY_HUD_STAGE_GRID_SLOTS.solarHydro, solar, hydro, false);
    this.placeStageEffectSlot(this.buildGlowSlot, CITY_HUD_STAGE_EFFECT_SLOTS.buildGlow, wind, w, h, lowCleanliness);
    this.placeStageEffectSlot(this.gridGlowSlot, CITY_HUD_STAGE_EFFECT_SLOTS.gridGlow, solar, w, h, lowCleanliness);
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

  private createProductUiShellSlots(): void {
    if (!this.productUiShellLayer) return;
    for (const slot of UI_SHELL_ALL_SLOTS) {
      const node = new Node(slot.nodeName);
      node.setParent(this.productUiShellLayer);
      node.addComponent(UITransform);
      node.addComponent(Graphics);
      const label = this.createBandLabel(node);
      label.color = new Color(37, 79, 94, 255);
      this.productUiShellLabels.set(slot.nodeName, label);
      this.productUiShellSlots.set(slot.nodeName, node);
    }
  }

  private createStageAssetSlot(parent: Node, slot: CityHudStageAssetSlot): Node {
    const node = new Node(slot.nodeName);
    node.setParent(parent);
    node.addComponent(UITransform);
    return node;
  }

  private createStageGridSlot(parent: Node, slot: CityHudStageGridSlot): Node {
    const node = new Node(slot.nodeName);
    node.setParent(parent);
    node.addComponent(UITransform);
    return node;
  }

  private createStageEffectSlot(parent: Node, slot: CityHudStageEffectSlot): Node {
    const node = new Node(slot.nodeName);
    node.setParent(parent);
    node.addComponent(UITransform);
    return node;
  }

  private createStageFeedbackSlot(parent: Node, slot: CityHudStageFeedbackSlot): Node {
    const node = new Node(slot.nodeName);
    node.setParent(parent);
    node.addComponent(UITransform);
    return node;
  }

  private placeStageAssetSlot(
    node: Node | null,
    slot: CityHudStageAssetSlot,
    left: number,
    bottom: number,
    w: number,
    h: number
  ): void {
    if (!node) return;
    placeCenteredRect(
      node,
      left + w * slot.xRatio,
      bottom + h * slot.yRatio,
      w * slot.widthRatio,
      h * slot.heightRatio
    );
  }

  private syncScreenStateToken(): void {
    if (!this.cityVisualLayer || !this.boot) return;
    const viewModel = readCityHudViewModel(this.boot);
    const token =
      viewModel.screen === "screen_company"
        ? CITY_HUD_STAGE_SCREEN_TOKENS.company
        : viewModel.screen === "screen_region"
          ? CITY_HUD_STAGE_SCREEN_TOKENS.region
          : viewModel.screen === "screen_world_map"
            ? CITY_HUD_STAGE_SCREEN_TOKENS.world
            : viewModel.screen === "screen_tech_tree"
              ? CITY_HUD_STAGE_SCREEN_TOKENS.tech
              : CITY_HUD_STAGE_SCREEN_TOKENS.city;
    this.cityVisualLayer.name = `${CITY_HUD_STAGE_LAYER_NAMES.root}:${token}`;
  }

  private resolveProductScreenToken(): string {
    if (!this.boot) return UI_SHELL_SCREEN_TOKENS.mainMenu;
    const screen = readCityHudViewModel(this.boot).screen;
    switch (screen) {
      case "screen_company":
        return UI_SHELL_SCREEN_TOKENS.company;
      case "screen_region":
        return UI_SHELL_SCREEN_TOKENS.region;
      case "screen_world_map":
        return UI_SHELL_SCREEN_TOKENS.world;
      case "screen_tech_tree":
        return UI_SHELL_SCREEN_TOKENS.tech;
      case "screen_run_result":
        return UI_SHELL_SCREEN_TOKENS.runResult;
      case "screen_main_menu":
        return UI_SHELL_SCREEN_TOKENS.mainMenu;
      case "screen_city_detail":
      default:
        return UI_SHELL_SCREEN_TOKENS.city;
    }
  }

  private slotMatchesCurrentScreen(slot: UiShellStageSlot): boolean {
    if (!this.boot) return slot.screen === "mainMenu";
    if (slot.screen === "eventModal") {
      return this.hasPendingDisasterFeedback();
    }
    const screen = readCityHudViewModel(this.boot).screen;
    return (
      (slot.screen === "mainMenu" && screen === "screen_main_menu") ||
      (slot.screen === "city" && screen === "screen_city_detail") ||
      (slot.screen === "company" && screen === "screen_company") ||
      (slot.screen === "tech" && screen === "screen_tech_tree") ||
      (slot.screen === "region" && screen === "screen_region") ||
      (slot.screen === "world" && screen === "screen_world_map") ||
      (slot.screen === "runResult" && screen === "screen_run_result")
    );
  }

  private syncProductUiShellSlots(container: { width: number; height: number }): void {
    if (!this.productUiShellLayer) return;
    const left = -container.width / 2;
    const bottom = -container.height / 2;
    this.productUiShellLayer.name = `${UI_SHELL_LAYER_NAMES.root}:${this.resolveProductScreenToken()}`;
    for (const slot of UI_SHELL_ALL_SLOTS) {
      const node = this.productUiShellSlots.get(slot.nodeName);
      if (!node) continue;
      const active = this.slotMatchesCurrentScreen(slot);
      node.active = active;
      placeCenteredRect(
        node,
        left + container.width * slot.xRatio,
        bottom + container.height * slot.yRatio,
        container.width * slot.widthRatio,
        container.height * slot.heightRatio
      );
      const stateToken = active
        ? UI_SHELL_SLOT_STATE_TOKENS.active
        : UI_SHELL_SLOT_STATE_TOKENS.hidden;
      const bindingToken = active && this.boot
        ? UI_SHELL_SLOT_STATE_TOKENS.bound
        : UI_SHELL_SLOT_STATE_TOKENS.placeholder;
      node.name = `${slot.nodeName}:${stateToken}:${bindingToken}:${slot.role}`;
      this.redrawProductUiShellSlot(node, slot, active);
      this.syncProductUiShellSlotLabel(slot, active);
    }
  }

  private redrawProductUiShellSlot(node: Node, slot: UiShellStageSlot, active: boolean): void {
    const graphics = node.getComponent(Graphics);
    const transform = node.getComponent(UITransform);
    if (!graphics || !transform) return;
    graphics.clear();
    if (!active) return;
    const w = transform.width;
    const h = transform.height;
    if (w <= 0 || h <= 0) return;
    graphics.fillColor = this.resolveProductShellFill(slot);
    graphics.roundRect(-w / 2, -h / 2, w, h, Math.min(18, h * 0.16));
    graphics.fill();
    this.drawProductShellContent(graphics, slot, w, h);
  }

  private resolveProductShellFill(slot: UiShellStageSlot): Color {
    if (slot.screen === "eventModal") return new Color(255, 248, 238, 238);
    if (slot.screen === "runResult") return new Color(242, 252, 255, 224);
    if (slot.role === UI_SHELL_SLOT_ROLE_TOKENS.graph || slot.role === UI_SHELL_SLOT_ROLE_TOKENS.map) {
      return new Color(232, 249, 255, 176);
    }
    if (slot.role === UI_SHELL_SLOT_ROLE_TOKENS.actionArea) return new Color(31, 122, 177, 218);
    if (slot.role === UI_SHELL_SLOT_ROLE_TOKENS.nav) return new Color(23, 102, 156, 226);
    return new Color(247, 253, 255, 202);
  }

  private drawProductShellContent(g: Graphics, slot: UiShellStageSlot, w: number, h: number): void {
    switch (slot.nodeName) {
      case "TechBranchTabs":
        this.drawShellTabs(g, w, h, 6);
        return;
      case "TechNodeGraphPlaceholder":
        this.drawTechGraphShell(g, w, h);
        return;
      case "TechResearchDrawer":
        this.drawDrawerShell(g, w, h);
        return;
      case "CompanyOverviewPanel":
        this.drawCompanyOverviewShell(g, w, h);
        return;
      case "CompanyCashflowPanel":
        this.drawCashflowShell(g, w, h);
        return;
      case "CompanyLoanAdsUpgradeArea":
        this.drawActionStripShell(g, w, h, 3);
        return;
      case "RegionCityNodeLayer":
        this.drawRegionMapShell(g, w, h);
        return;
      case "RegionLinkBuildBar":
        this.drawActionStripShell(g, w, h, 2);
        return;
      case "WorldRegionNodeLayer":
        this.drawWorldMapShell(g, w, h);
        return;
      case "WorldBackboneLinkLayer":
        this.drawWorldBackboneShell(g, w, h);
        return;
      case "WorldSuperHydroEntryCard":
        this.drawHydroEntryShell(g, w, h);
        return;
      case "EventFullscreenModalShell":
        this.drawModalFrameShell(g, w, h);
        return;
      case "RunResultBanner":
        this.drawResultBannerShell(g, w, h);
        return;
      default:
        return;
    }
  }

  private drawShellTabs(g: Graphics, w: number, h: number, count: number): void {
    const gap = w * 0.018;
    const cellW = (w - gap * (count + 1)) / count;
    for (let i = 0; i < count; i += 1) {
      const x = -w / 2 + gap + cellW / 2 + i * (cellW + gap);
      g.fillColor = i === 0 ? new Color(111, 221, 177, 235) : new Color(245, 252, 255, 214);
      g.roundRect(x - cellW / 2, -h * 0.32, cellW, h * 0.64, Math.min(12, h * 0.22));
      g.fill();
    }
  }

  private drawTechGraphShell(g: Graphics, w: number, h: number): void {
    const nodes = [
      { x: -w * 0.34, y: h * 0.18, active: true },
      { x: -w * 0.1, y: h * 0.02, active: true },
      { x: w * 0.16, y: h * 0.2, active: false },
      { x: w * 0.34, y: -h * 0.08, active: false },
      { x: -w * 0.24, y: -h * 0.22, active: true },
      { x: w * 0.02, y: -h * 0.26, active: false }
    ];
    g.strokeColor = new Color(65, 122, 151, 185);
    g.lineWidth = Math.max(3, h * 0.018);
    for (let i = 0; i < nodes.length - 1; i += 1) {
      g.moveTo(nodes[i].x, nodes[i].y);
      g.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      g.stroke();
    }
    for (const node of nodes) {
      this.drawMapNode(g, node.x, node.y, Math.max(18, Math.min(w, h) * 0.08), node.active);
    }
  }

  private drawRegionMapShell(g: Graphics, w: number, h: number): void {
    g.strokeColor = new Color(83, 225, 231, 120);
    g.lineWidth = Math.max(3, h * 0.012);
    g.roundRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, Math.min(18, h * 0.06));
    g.stroke();
  }

  private drawWorldMapShell(g: Graphics, w: number, h: number): void {
    const nodes = [
      { x: -w * 0.28, y: h * 0.14, active: true },
      { x: w * 0.08, y: h * 0.2, active: true },
      { x: w * 0.3, y: -h * 0.02, active: false },
      { x: -w * 0.08, y: -h * 0.18, active: true },
      { x: w * 0.18, y: -h * 0.26, active: false }
    ];
    g.strokeColor = new Color(66, 187, 217, 178);
    g.lineWidth = Math.max(3, h * 0.018);
    for (let i = 0; i < nodes.length - 1; i += 1) {
      g.moveTo(nodes[i].x, nodes[i].y);
      g.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      g.stroke();
    }
    for (const node of nodes) {
      this.drawMapNode(g, node.x, node.y, Math.max(22, h * 0.11), node.active);
    }
  }

  private drawWorldBackboneShell(g: Graphics, w: number, h: number): void {
    g.strokeColor = new Color(247, 227, 111, 218);
    g.lineWidth = Math.max(4, h * 0.022);
    g.moveTo(-w * 0.36, h * 0.08);
    g.bezierCurveTo(-w * 0.12, h * 0.26, w * 0.1, -h * 0.16, w * 0.36, h * 0.02);
    g.stroke();
  }

  private drawMapNode(g: Graphics, x: number, y: number, radius: number, active: boolean): void {
    g.fillColor = active ? new Color(104, 219, 163, 240) : new Color(146, 165, 176, 188);
    g.circle(x, y, radius);
    g.fill();
    g.strokeColor = active ? new Color(255, 244, 148, 235) : new Color(226, 235, 240, 190);
    g.lineWidth = Math.max(3, radius * 0.16);
    g.circle(x, y, radius * 1.18);
    g.stroke();
  }

  private drawDrawerShell(g: Graphics, w: number, h: number): void {
    g.fillColor = new Color(255, 255, 255, 86);
    for (let i = 0; i < 4; i += 1) {
      const y = h * 0.3 - i * h * 0.18;
      g.roundRect(-w * 0.38, y, w * 0.76, h * 0.06, h * 0.03);
      g.fill();
    }
  }

  private drawCompanyOverviewShell(g: Graphics, w: number, h: number): void {
    g.fillColor = new Color(101, 221, 174, 230);
    g.circle(-w * 0.28, h * 0.12, Math.min(w, h) * 0.14);
    g.fill();
    g.fillColor = new Color(255, 218, 101, 230);
    g.circle(w * 0.25, h * 0.14, Math.min(w, h) * 0.13);
    g.fill();
    this.drawProgressTrack(g, -w * 0.35, -h * 0.25, w * 0.7, h * 0.1, 0.58);
  }

  private drawCashflowShell(g: Graphics, w: number, h: number): void {
    const barW = w * 0.09;
    for (let i = 0; i < 6; i += 1) {
      const value = [0.38, 0.62, 0.48, 0.74, 0.52, 0.68][i] ?? 0.5;
      const x = -w * 0.34 + i * w * 0.13;
      const barH = h * value * 0.56;
      g.fillColor = i % 2 === 0 ? new Color(78, 188, 221, 220) : new Color(107, 219, 164, 220);
      g.roundRect(x - barW / 2, -h * 0.28, barW, barH, barW * 0.35);
      g.fill();
    }
  }

  private drawActionStripShell(g: Graphics, w: number, h: number, count: number): void {
    const gap = w * 0.04;
    const cellW = (w - gap * (count + 1)) / count;
    for (let i = 0; i < count; i += 1) {
      const x = -w / 2 + gap + cellW / 2 + i * (cellW + gap);
      g.fillColor = i === 0 ? new Color(255, 216, 100, 232) : new Color(245, 252, 255, 220);
      g.roundRect(x - cellW / 2, -h * 0.22, cellW, h * 0.44, Math.min(12, h * 0.16));
      g.fill();
    }
  }

  private drawHydroEntryShell(g: Graphics, w: number, h: number): void {
    g.fillColor = new Color(74, 188, 223, 210);
    g.ellipse(0, 0, w * 0.32, h * 0.22);
    g.fill();
    g.fillColor = new Color(255, 232, 103, 235);
    g.circle(w * 0.26, h * 0.18, Math.min(w, h) * 0.1);
    g.fill();
  }

  private drawModalFrameShell(g: Graphics, w: number, h: number): void {
    g.strokeColor = new Color(181, 139, 74, 230);
    g.lineWidth = Math.max(4, h * 0.012);
    g.roundRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, Math.min(18, h * 0.06));
    g.stroke();
  }

  private drawResultBannerShell(g: Graphics, w: number, h: number): void {
    this.drawProgressTrack(g, -w * 0.36, -h * 0.12, w * 0.72, h * 0.22, 0.82);
  }

  private drawProgressTrack(g: Graphics, x: number, y: number, w: number, h: number, ratio: number): void {
    g.fillColor = new Color(33, 83, 110, 168);
    g.roundRect(x, y, w, h, h * 0.45);
    g.fill();
    g.fillColor = new Color(104, 219, 163, 230);
    g.roundRect(x, y, w * ratio, h, h * 0.45);
    g.fill();
  }

  private syncProductUiShellSlotLabel(slot: UiShellStageSlot, active: boolean): void {
    const label = this.productUiShellLabels.get(slot.nodeName);
    const node = this.productUiShellSlots.get(slot.nodeName);
    if (!label || !node) return;
    label.node.active = active;
    if (!active) return;
    const transform = node.getComponent(UITransform);
    const w = transform?.width ?? 0;
    const h = transform?.height ?? 0;
    label.string = this.resolveProductUiShellSlotText(slot);
    label.fontSize = Math.round(Math.min(24, Math.max(16, h * 0.13)));
    label.lineHeight = Math.round(label.fontSize * 1.25);
    label.enableWrapText = true;
    this.fitLabelToBand(label, { x: 0, y: 0, width: w, height: h });
  }

  private resolveProductUiShellSlotText(slot: UiShellStageSlot): string {
    switch (slot.nodeName) {
      case "CompanyOverviewPanel":
        return "公司概览\n等级 / 社会价值 / 升级目标";
      case "CompanyCashflowPanel":
        return "现金流\n收入 · 运维 · 贷款";
      case "CompanyLoanAdsUpgradeArea":
        return "经营操作\n贷款 / 激励 / 升级目标";
      case "TechBranchTabs":
        return "风能  光伏  水电  核电  电网  经营";
      case "TechNodeGraphPlaceholder":
        return "科技节点图\n已点亮 / 研发中 / 可研发";
      case "TechResearchDrawer":
        return "研发详情\n成本 · 工期 · 前置 · 加速";
      case "RegionCityNodeLayer":
        return "区域城市节点\n可进入城市 / 在建线路 / 完成线路";
      case "RegionLinkBuildBar":
        return "区内铺线\n候选线路 · 成本 · 工期";
      case "WorldRegionNodeLayer":
        return "大地图\n区域解锁 / 主干线 / 都市节点";
      case "WorldBackboneLinkLayer":
        return "主干电网层\n已接通 / 施工中 / 候选目标";
      case "WorldSuperHydroEntryCard":
        return "战略工程\n超级水电槽位";
      case "RunResultBanner":
        return "终局结果";
      case "RunResultRouteSummary":
        return "路线摘要\n区域解锁 · 主干接通 · 灾害应对";
      case "RunResultRestartEntry":
        return "重新开始";
      case "EventFullscreenModalShell":
        return "事件影响";
      case "EventModalArtSlot":
        return "事件插画位";
      case "EventModalConfirmButton":
        return "知道了";
      default:
        return slot.nodeName;
    }
  }

  private syncFacilityAssetStateTokens(): void {
    const profile = this.boot ? getCityHudProfileSnapshot(this.boot) : null;
    this.syncFacilityAssetStateToken(this.windAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.windTurbine, profile);
    this.syncFacilityAssetStateToken(this.solarAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.solarField, profile);
    this.syncFacilityAssetStateToken(this.hydroAssetSlot, CITY_HUD_STAGE_ASSET_SLOTS.hydroPlant, profile);
  }

  private syncFacilityAssetStateToken(
    node: Node | null,
    slot: CityHudStageAssetSlot,
    profile: ReturnType<typeof getCityHudProfileSnapshot>
  ): void {
    if (!node) return;
    const resource = (slot as { resource?: "wind" | "solar" | "hydro" }).resource;
    if (!resource) return;
    const unavailable = resource === "hydro" && profile !== null && !profile.hasRiver;
    const resourceToken = profile?.richResources.includes(resource)
      ? CITY_HUD_STAGE_ASSET_TOKENS.resourceRich
      : CITY_HUD_STAGE_ASSET_TOKENS.resourceNormal;
    const visibilityToken = unavailable
      ? CITY_HUD_STAGE_ASSET_TOKENS.unavailable
      : CITY_HUD_STAGE_ASSET_TOKENS.visible;
    const placeholderToken = unavailable ? CITY_HUD_STAGE_ASSET_TOKENS.placeholder : resourceToken;
    node.name = `${slot.nodeName}:${visibilityToken}:${placeholderToken}`;
  }

  private placeStageGridSlot(
    node: Node | null,
    slot: CityHudStageGridSlot,
    from: Vec2,
    to: Vec2,
    connected: boolean
  ): void {
    if (!node) return;
    const centerX = (from.x + to.x) / 2;
    const centerY = (from.y + to.y) / 2 + 12;
    const width = Math.max(24, Math.abs(to.x - from.x));
    const height = Math.max(18, Math.abs(to.y - from.y) + 18);
    placeCenteredRect(node, centerX, centerY, width, height);
    const connectionToken = connected
      ? CITY_HUD_STAGE_GRID_TOKENS.connected
      : CITY_HUD_STAGE_GRID_TOKENS.disconnected;
    const stabilityToken = connected ? CITY_HUD_STAGE_GRID_TOKENS.stable : CITY_HUD_STAGE_GRID_TOKENS.weak;
    node.name = `${slot.nodeName}:${connectionToken}:${stabilityToken}`;
  }

  private placeStageEffectSlot(
    node: Node | null,
    slot: CityHudStageEffectSlot,
    anchor: Vec2,
    w: number,
    h: number,
    lowCleanliness: boolean
  ): void {
    if (!node) return;
    placeCenteredRect(node, anchor.x, anchor.y + h * 0.02, w * slot.widthRatio, h * slot.heightRatio);
    const roleToken =
      slot.nodeName === CITY_HUD_STAGE_EFFECT_SLOTS.buildGlow.nodeName
        ? CITY_HUD_STAGE_EFFECT_TOKENS.construction
        : CITY_HUD_STAGE_EFFECT_TOKENS.grid;
    const stateToken = lowCleanliness
      ? CITY_HUD_STAGE_EFFECT_TOKENS.lowCleanliness
      : CITY_HUD_STAGE_EFFECT_TOKENS.normal;
    node.name = `${slot.nodeName}:${CITY_HUD_STAGE_EFFECT_TOKENS.active}:${roleToken}:${stateToken}`;
  }

  private placeStageFeedbackSlot(
    node: Node | null,
    slot: CityHudStageFeedbackSlot,
    left: number,
    bottom: number,
    w: number,
    h: number,
    visible: boolean,
    roleToken: string
  ): void {
    if (!node) return;
    placeCenteredRect(
      node,
      left + w * slot.xRatio,
      bottom + h * slot.yRatio,
      w * slot.widthRatio,
      h * slot.heightRatio
    );
    const visibilityToken = visible
      ? CITY_HUD_STAGE_FEEDBACK_TOKENS.visible
      : CITY_HUD_STAGE_FEEDBACK_TOKENS.hidden;
    const stateToken = visible ? roleToken : CITY_HUD_STAGE_FEEDBACK_TOKENS.calm;
    node.active = visible;
    node.name = `${slot.nodeName}:${visibilityToken}:${stateToken}`;
  }

  private hasPendingDisasterFeedback(): boolean {
    return !!this.boot?.app.screens.events.getSnapshot().pendingFullscreen;
  }

  private hasConstructionFeedback(): boolean {
    return !!this.boot && this.boot.app.controller.state.constructionQueue.length > 0;
  }

  private hasCompletionFeedback(): boolean {
    if (!this.boot) return false;
    const viewModel = readCityHudViewModel(this.boot);
    return viewModel.screen === "screen_city_detail" && viewModel.month > 1 && !this.hasConstructionFeedback();
  }

  private createIconSlot(parent: Node, slot: CityHudStageIconSlot): Node {
    const node = new Node(slot.nodeName);
    node.setParent(parent);
    node.addComponent(UITransform);
    node.addComponent(Graphics);
    return node;
  }

  private applyStageLayerOrder(): void {
    const shellLayers = [this.cityVisualLayer, this.productUiShellLayer, this.cityUiLayer, this.cityIconLayer];
    for (const layerName of CITY_HUD_STAGE_SHELL_ORDER) {
      const layer = shellLayers.find((item) => item?.name === layerName);
      layer?.setSiblingIndex(CITY_HUD_STAGE_SHELL_ORDER.indexOf(layerName));
    }
    this.productUiShellLayer?.setSiblingIndex(1);
    this.cityUiLayer?.setSiblingIndex(2);
    this.cityIconLayer?.setSiblingIndex(3);
    const visualLayers = [
      this.cityBackgroundLayer,
      this.cityFacilityLayer,
      this.cityGridLayer,
      this.cityEffectLayer,
      this.cityStateLayer
    ];
    for (const layerName of CITY_HUD_STAGE_VISUAL_ORDER) {
      const layer = visualLayers.find((item) => item?.name === layerName);
      layer?.setSiblingIndex(CITY_HUD_STAGE_VISUAL_ORDER.indexOf(layerName));
    }
  }

  private placeStatusIcons(status: HudBandLayout, detail: HudBandLayout): void {
    if (!this.cashIcon || !this.socialValueIcon || !this.cleanlinessIcon) return;
    const size = Math.max(12, Math.min(status.height, detail.height) * 0.3);
    this.cleanlinessIcon.active = this.isCurrentCityScreen();
    this.placeIcon(
      this.cashIcon,
      CITY_HUD_STAGE_ICON_SLOTS.cash,
      status,
      size,
      new Color(255, 221, 99, 235)
    );
    this.placeIcon(
      this.socialValueIcon,
      CITY_HUD_STAGE_ICON_SLOTS.socialValue,
      status,
      size,
      new Color(104, 224, 177, 235)
    );
    if (!this.cleanlinessIcon.active) return;
    this.placeIcon(
      this.cleanlinessIcon,
      CITY_HUD_STAGE_ICON_SLOTS.cleanliness,
      detail,
      size,
      new Color(91, 199, 236, 220)
    );
  }

  private placeIcon(node: Node, slot: CityHudStageIconSlot, panel: HudBandLayout, size: number, color: Color): void {
    const x = panel.x - panel.width / 2 + panel.width * slot.xRatio;
    const y = panel.y - panel.height / 2 + panel.height * slot.yRatio;
    placeCenteredRect(node, x, y, size, size);
    node.name = `${slot.nodeName}:${CITY_HUD_STAGE_ICON_TOKENS.active}:${this.resolveIconRoleToken(slot)}`;
    const graphics = node.getComponent(Graphics);
    if (!graphics) return;
    graphics.clear();
    graphics.fillColor = color;
    graphics.circle(0, 0, size / 2);
    graphics.fill();
  }

  private resolveIconRoleToken(slot: CityHudStageIconSlot): string {
    switch (slot.role) {
      case "cash":
        return CITY_HUD_STAGE_ICON_TOKENS.cash;
      case "social-value":
        return CITY_HUD_STAGE_ICON_TOKENS.socialValue;
      case "cleanliness":
      default:
        return CITY_HUD_STAGE_ICON_TOKENS.cleanliness;
    }
  }

  private syncPanelStateTokens(container: { width: number; height: number }): void {
    const densityToken =
      container.width < 760 || container.height < 430
        ? CITY_HUD_STAGE_UI_TOKENS.compact
        : CITY_HUD_STAGE_UI_TOKENS.readable;
    if (this.statusBand) {
      this.statusBand.name = `${CITY_HUD_STAGE_UI_SLOTS.resourceBar.nodeName}:${CITY_HUD_STAGE_UI_TOKENS.resource}:${densityToken}`;
    }
    if (this.detailBand) {
      this.detailBand.name = `${CITY_HUD_STAGE_UI_SLOTS.cityStateCard.nodeName}:${CITY_HUD_STAGE_UI_TOKENS.detail}:${densityToken}`;
    }
    this.syncButtonStateTokens();
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
    label.overflow = Overflow.CLAMP;
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
    const hudButton: HudButton = { node, label, bg, baseName: name, messageKey, role: this.resolveButtonRole(name) };
    return hudButton;
  }

  private redrawButton(btn: HudButton): void {
    const transform = btn.node.getComponent(UITransform);
    if (!transform) return;
    const w = transform.width;
    const h = transform.height;
    if (w <= 0 || h <= 0) return;
    btn.bg.clear();
    btn.bg.fillColor = this.resolveButtonFill(btn.role);
    btn.bg.roundRect(-w / 2, -h / 2, w, h, Math.min(18, h * 0.16));
    btn.bg.fill();
  }

  private resolveButtonRole(name: string): CityHudStageButtonRole {
    if (name === CITY_HUD_STAGE_UI_SLOTS.primaryBuildButton.nodeName) return "primary";
    const action = Object.values(CITY_HUD_STAGE_ACTION_SLOTS).find((slot) => slot.nodeName === name);
    return action?.role ?? "secondary";
  }

  private resolveButtonFill(role: CityHudStageButtonRole): Color {
    switch (role) {
      case "primary":
        return new Color(30, 134, 203, 245);
      case "reward":
        return new Color(35, 151, 108, 245);
      case "warning":
        return new Color(212, 91, 69, 245);
      case "nav":
        return new Color(43, 94, 136, 235);
      case "secondary":
      default:
        return new Color(58, 113, 171, 235);
    }
  }

  private resolveButtonRoleToken(role: CityHudStageButtonRole): string {
    switch (role) {
      case "primary":
        return CITY_HUD_STAGE_INTERACTION_TOKENS.primary;
      case "reward":
        return CITY_HUD_STAGE_INTERACTION_TOKENS.reward;
      case "warning":
        return CITY_HUD_STAGE_INTERACTION_TOKENS.warning;
      case "nav":
        return CITY_HUD_STAGE_INTERACTION_TOKENS.nav;
      case "secondary":
      default:
        return CITY_HUD_STAGE_INTERACTION_TOKENS.secondary;
    }
  }

  private syncButtonStateTokens(): void {
    for (const btn of this.allButtons()) {
      const visibilityToken = btn.node.active
        ? CITY_HUD_STAGE_INTERACTION_TOKENS.active
        : CITY_HUD_STAGE_INTERACTION_TOKENS.hidden;
      btn.node.name = `${btn.baseName}:${visibilityToken}:${this.resolveButtonRoleToken(btn.role)}`;
    }
  }

  private setButtonCaption(btn: HudButton | null, messageKey: string): void {
    if (!btn) return;
    btn.messageKey = messageKey;
    btn.label.string = t(messageKey);
  }

  private syncButtonCaptions(): void {
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
    const onCompany = viewModel.screen === "screen_company";
    const onRegion = viewModel.screen === "screen_region";
    const onWorld = viewModel.screen === "screen_world_map";
    const onTech = viewModel.screen === "screen_tech_tree";
    const onCity = !onCompany && !onRegion && !onWorld && !onTech;
    this.openCompanyBtn!.node.active = true;
    this.openRegionBtn!.node.active = true;
    this.openWorldBtn!.node.active = true;
    this.openTechBtn!.node.active = true;
    this.navBackBtn!.node.active = !onCity;
    this.syncButtonStateTokens();
    this.syncButtonCaptions();
    this.screenHost?.refresh();

    const display = buildClientHudDisplay(this.boot, this.actionMessage());
    this.statusLabel.string = onCity
      ? this.formatCityShellStatus()
      : this.formatPageShellStatus(viewModel.screen, display.statusLines);
    this.hintLabel.string = onCity
      ? this.formatCityShellDetail(display.detailLines)
      : this.formatPageShellDetail(viewModel.screen, display.detailLines);
    this.applyLayout();
  }

  private formatPageShellStatus(screen: string, fallbackLines: string[]): string {
    const state = this.boot?.app.controller.state;
    const prefix =
      screen === "screen_company"
        ? "公司经营"
        : screen === "screen_tech_tree"
          ? "科技研发"
          : screen === "screen_region"
            ? "区域电网"
            : screen === "screen_world_map"
              ? "全国大地图"
              : screen === "screen_run_result"
                ? "结算结果"
                : fallbackLines[0] ?? "";
    return state
      ? `${prefix}  第${state.currentMonth}月  资金 ${state.funds}  SV ${state.socialValueCurrent}`
      : prefix;
  }

  private formatPageShellDetail(screen: string, fallbackLines: string[]): string {
    if (screen === "screen_company") return "经营总览、现金流、贷款与激励入口";
    if (screen === "screen_tech_tree") return "选择科技分支，查看节点状态与当前研发";
    if (screen === "screen_region") return "查看城市节点、区内线路与候选铺线";
    if (screen === "screen_world_map") return "查看区域解锁、主干线和战略工程目标";
    if (screen === "screen_run_result") return "查看胜负结果、路线摘要和重开入口";
    return this.formatDetailText(fallbackLines, false);
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

  private onEventRail(): void {
    this.refresh();
  }
}
