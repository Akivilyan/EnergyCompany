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
  Vec3,
  HorizontalTextAlignment,
  VerticalTextAlignment,
  Overflow
} from "cc";
import {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenTechTree,
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd,
  formatClientHudStatus,
  formatClientNavHint,
  readCityHudViewModel,
  techCancelActiveResearch,
  techSpeedupResearchByAd,
  techStartDefaultResearch,
  type GameBootstrap
} from "../shared/game-client.mjs";

const { ccclass } = _decorator;

/** 城市页最小 HUD：顶栏状态 + 建造风场 + 推月。 */
@ccclass("CityHudPanel")
export class CityHudPanel extends Component {
  private boot: GameBootstrap | null = null;
  private statusLabel: Label | null = null;
  private hintLabel: Label | null = null;
  private buildWindBtn: Node | null = null;
  private advanceMonthBtn: Node | null = null;
  private applyLoanBtn: Node | null = null;
  private adCashBtn: Node | null = null;
  private startResearchBtn: Node | null = null;
  private cancelResearchBtn: Node | null = null;
  private adSpeedupBtn: Node | null = null;
  private lastActionKey: string | null = null;

  onLoad(): void {
    const line = `[CityHudPanel] onLoad on ${this.node.name}`;
    log(line);
    console.warn(line);
    this.ensureUi();
    this.showLoading();
  }

  /** GameRoot 完成 mountGameClient 后直接注入（不依赖跨模块 registry）。 */
  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  showMountError(message: string): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = "Config load failed";
    this.hintLabel.string = message;
  }

  onDestroy(): void {
    this.boot = null;
  }

  private ensureUi(): void {
    if (this.statusLabel) return;

    const panel = new Node("CityHudPanel");
    panel.setParent(this.node);
    panel.setPosition(new Vec3(0, 250, 0));
    panel.addComponent(UITransform).setContentSize(640, 240);

    this.statusLabel = this.createLabel(panel, "StatusLabel", new Vec3(0, 80, 0), 24);
    this.hintLabel = this.createLabel(panel, "HintLabel", new Vec3(0, 45, 0), 18);
    this.buildWindBtn = this.createTapButton(panel, "BuildWind", new Vec3(-120, 0, 0), "Build Wind", () =>
      this.onBuildWind()
    );
    this.advanceMonthBtn = this.createTapButton(panel, "AdvanceMonth", new Vec3(120, 0, 0), "Next Month", () =>
      this.onAdvanceMonth()
    );
    this.applyLoanBtn = this.createTapButton(panel, "ApplyLoan", new Vec3(-60, 0, 0), "Loan", () =>
      this.onApplyLoan()
    );
    this.adCashBtn = this.createTapButton(panel, "AdCash", new Vec3(60, 0, 0), "Ad Cash", () => this.onAdCash());
    this.startResearchBtn = this.createTapButton(panel, "StartResearch", new Vec3(-120, 0, 0), "Start", () =>
      this.onStartResearch()
    );
    this.cancelResearchBtn = this.createTapButton(panel, "CancelResearch", new Vec3(0, 0, 0), "Cancel", () =>
      this.onCancelResearch()
    );
    this.adSpeedupBtn = this.createTapButton(panel, "AdSpeedup", new Vec3(120, 0, 0), "Ad Speed", () =>
      this.onAdSpeedup()
    );
    this.applyLoanBtn.active = false;
    this.adCashBtn.active = false;
    this.startResearchBtn.active = false;
    this.cancelResearchBtn.active = false;
    this.adSpeedupBtn.active = false;
    this.createTapButton(panel, "OpenCompany", new Vec3(-160, -55, 0), "Company", () => this.onOpenCompany());
    this.createTapButton(panel, "OpenTech", new Vec3(0, -55, 0), "Tech", () => this.onOpenTech());
    this.createTapButton(panel, "NavBack", new Vec3(160, -55, 0), "Back", () => this.onNavBack());
  }

  private showLoading(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = "Loading…";
    this.hintLabel.string = "等待 GameRoot 加载配置";
  }

  private createLabel(parent: Node, name: string, position: Vec3, fontSize: number): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(300, 36);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.color = new Color(240, 240, 240, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.RESIZE_HEIGHT;
    label.string = name;
    return label;
  }

  private createTapButton(
    parent: Node,
    name: string,
    position: Vec3,
    caption: string,
    handler: () => void
  ): Node {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(position);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(180, 44);
    const bg = node.addComponent(Graphics);
    bg.fillColor = new Color(48, 72, 120, 220);
    bg.roundRect(-90, -22, 180, 44, 6);
    bg.fill();
    const label = this.createLabel(node, `${name}Label`, new Vec3(0, 0, 0), 20);
    label.string = caption;
    node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => handler(), this);
    return node;
  }

  private refresh(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    if (!this.boot) {
      this.showLoading();
      return;
    }
    const view = readCityHudViewModel(this.boot);
    const stackDepth = this.boot.play.getNavigation().stack.length;
    const onCompany = view.screen === "screen_company";
    const onTech = view.screen === "screen_tech_tree";
    const onCity = !onCompany && !onTech;
    this.buildWindBtn!.active = onCity;
    this.advanceMonthBtn!.active = onCity;
    this.applyLoanBtn!.active = onCompany;
    this.adCashBtn!.active = onCompany;
    this.startResearchBtn!.active = onTech;
    this.cancelResearchBtn!.active = onTech;
    this.adSpeedupBtn!.active = onTech;
    this.statusLabel.string = formatClientHudStatus(this.boot);
    const navHint = formatClientNavHint(view, stackDepth);
    this.hintLabel.string = this.lastActionKey ? `${navHint} · ${this.lastActionKey}` : navHint;
  }

  private onBuildWind(): void {
    if (!this.boot) return;
    const out = cityHudBuildWind(this.boot);
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] build failed: ${out.errorCode ?? "unknown"}`);
    }
  }

  private onAdvanceMonth(): void {
    if (!this.boot) return;
    const out = cityHudAdvanceMonth(this.boot);
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] advance failed: ${out.errorCode ?? "unknown"}`);
    }
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

  private onNavBack(): void {
    if (!this.boot) return;
    this.lastActionKey = null;
    clientNavBack(this.boot);
    this.refresh();
  }

  private onApplyLoan(): void {
    if (!this.boot) return;
    const out = companyApplyFirstUnlockedLoan(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] loan failed: ${out.uiErrorCode ?? "unknown"}`);
    }
  }

  private onAdCash(): void {
    if (!this.boot) return;
    const out = companyClaimCashByAd(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] ad cash failed: ${out.uiErrorCode ?? "unknown"}`);
    }
  }

  private onStartResearch(): void {
    if (!this.boot) return;
    const out = techStartDefaultResearch(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] start research failed: ${out.uiErrorCode ?? "unknown"}`);
    }
  }

  private onCancelResearch(): void {
    if (!this.boot) return;
    const out = techCancelActiveResearch(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] cancel research failed: ${out.uiErrorCode ?? "unknown"}`);
    }
  }

  private onAdSpeedup(): void {
    if (!this.boot) return;
    const out = techSpeedupResearchByAd(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) {
      console.warn(`[CityHudPanel] ad speedup failed: ${out.uiErrorCode ?? "unknown"}`);
    }
  }
}
