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
  buildClientHudDisplay,
  cityHudAdvanceMonth,
  cityHudBuildWind,
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenTechTree,
  companyApplyFirstUnlockedLoan,
  companyClaimCashByAd,
  readCityHudViewModel,
  techCancelActiveResearch,
  techSpeedupResearchByAd,
  techStartDefaultResearch,
  type GameBootstrap
} from "../shared/game-client.mjs";

const { ccclass } = _decorator;

/** 设计分辨率 1280×720 下 HUD 布局常量（开发用，勿超出安全区）。 */
const HUD = {
  panelWidth: 720,
  panelHeight: 200,
  panelY: 120,
  statusY: 72,
  detailY: 38,
  actionRowY: -8,
  navRowY: -58,
  labelWidth: 680,
  statusFont: 22,
  detailFont: 16,
  buttonW: 128,
  buttonH: 40,
  buttonFont: 18,
  actionGap: 140,
  navGap: 150
} as const;

const BTN = {
  buildWind: "建造风场",
  nextMonth: "下一月",
  loan: "申请贷款",
  adCash: "广告领钱",
  startResearch: "开始研发",
  cancelResearch: "取消研发",
  adSpeedup: "广告加速",
  company: "公司",
  tech: "科技",
  back: "返回"
} as const;

const ACTION_MSG: Record<string, string> = {
  "company.error.loan_not_found": "未找到该贷款档位",
  "company.error.loan_tier_locked": "该档位尚未解锁",
  "company.error.loan_already_active": "已有贷款，不能再借",
  "company.error.ad_not_completed": "广告未看完",
  "company.error.ad_provider_failed": "广告服务失败",
  "company.error.ads_exhausted": "今日广告次数已用完",
  "company.error.action_invalid": "当前阶段不能操作",
  "company.error.action_failed": "操作失败",
  "tech_tree.error.tech_locked": "需公司2级才能开科技树",
  "tech_tree.error.insufficient_funds": "资金不足",
  "tech_tree.error.research_queue_full": "研发队列已满",
  "tech_tree.error.research_not_found": "未找到该研发",
  "tech_tree.error.no_active_research": "当前没有在研项目",
  "tech_tree.error.ad_not_completed": "广告未看完",
  "tech_tree.error.ad_provider_failed": "广告服务失败",
  "tech_tree.error.action_blocked": "教学引导中，暂不可操作",
  "tech_tree.error.action_invalid": "当前阶段不能操作",
  "tech_tree.error.action_failed": "操作失败"
};

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

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  showMountError(message: string): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = "配置加载失败";
    this.hintLabel.string = message;
  }

  onDestroy(): void {
    this.boot = null;
  }

  private ensureUi(): void {
    if (this.statusLabel) return;

    const panel = new Node("CityHudPanel");
    panel.setParent(this.node);
    panel.setPosition(new Vec3(0, HUD.panelY, 0));
    panel.addComponent(UITransform).setContentSize(HUD.panelWidth, HUD.panelHeight);

    this.statusLabel = this.createLabel(
      panel,
      "StatusLabel",
      new Vec3(0, HUD.statusY, 0),
      HUD.statusFont,
      HUD.labelWidth
    );
    this.hintLabel = this.createLabel(
      panel,
      "HintLabel",
      new Vec3(0, HUD.detailY, 0),
      HUD.detailFont,
      HUD.labelWidth
    );

    const half = HUD.actionGap / 2;
    this.buildWindBtn = this.createTapButton(
      panel,
      "BuildWind",
      new Vec3(-half, HUD.actionRowY, 0),
      BTN.buildWind,
      () => this.onBuildWind()
    );
    this.advanceMonthBtn = this.createTapButton(
      panel,
      "AdvanceMonth",
      new Vec3(half, HUD.actionRowY, 0),
      BTN.nextMonth,
      () => this.onAdvanceMonth()
    );
    this.applyLoanBtn = this.createTapButton(
      panel,
      "ApplyLoan",
      new Vec3(-half, HUD.actionRowY, 0),
      BTN.loan,
      () => this.onApplyLoan()
    );
    this.adCashBtn = this.createTapButton(
      panel,
      "AdCash",
      new Vec3(half, HUD.actionRowY, 0),
      BTN.adCash,
      () => this.onAdCash()
    );
    this.startResearchBtn = this.createTapButton(
      panel,
      "StartResearch",
      new Vec3(-HUD.actionGap, HUD.actionRowY, 0),
      BTN.startResearch,
      () => this.onStartResearch()
    );
    this.cancelResearchBtn = this.createTapButton(
      panel,
      "CancelResearch",
      new Vec3(0, HUD.actionRowY, 0),
      BTN.cancelResearch,
      () => this.onCancelResearch()
    );
    this.adSpeedupBtn = this.createTapButton(
      panel,
      "AdSpeedup",
      new Vec3(HUD.actionGap, HUD.actionRowY, 0),
      BTN.adSpeedup,
      () => this.onAdSpeedup()
    );

    this.applyLoanBtn.active = false;
    this.adCashBtn.active = false;
    this.startResearchBtn.active = false;
    this.cancelResearchBtn.active = false;
    this.adSpeedupBtn.active = false;

    const navHalf = HUD.navGap;
    this.createTapButton(panel, "OpenCompany", new Vec3(-navHalf, HUD.navRowY, 0), BTN.company, () =>
      this.onOpenCompany()
    );
    this.createTapButton(panel, "OpenTech", new Vec3(0, HUD.navRowY, 0), BTN.tech, () => this.onOpenTech());
    this.createTapButton(panel, "NavBack", new Vec3(navHalf, HUD.navRowY, 0), BTN.back, () => this.onNavBack());
  }

  private showLoading(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    this.statusLabel.string = "加载中…";
    this.hintLabel.string = "等待游戏初始化";
  }

  private createLabel(
    parent: Node,
    name: string,
    position: Vec3,
    fontSize: number,
    width: number
  ): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(width, 40);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.color = new Color(240, 240, 240, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.SHRINK;
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
    const w = HUD.buttonW;
    const h = HUD.buttonH;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(w, h);
    const bg = node.addComponent(Graphics);
    bg.fillColor = new Color(48, 72, 120, 220);
    bg.roundRect(-w / 2, -h / 2, w, h, 6);
    bg.fill();
    const label = this.createLabel(node, `${name}Label`, new Vec3(0, 0, 0), HUD.buttonFont, w - 8);
    label.string = caption;
    label.overflow = Overflow.SHRINK;
    node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => handler(), this);
    return node;
  }

  private actionMessage(): string | null {
    if (!this.lastActionKey) return null;
    return ACTION_MSG[this.lastActionKey] ?? this.lastActionKey;
  }

  private refresh(): void {
    if (!this.statusLabel || !this.hintLabel) return;
    if (!this.boot) {
      this.showLoading();
      return;
    }
    const view = readCityHudViewModel(this.boot);
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

    const display = buildClientHudDisplay(this.boot, this.actionMessage());
    this.statusLabel.string = display.statusLine;
    this.hintLabel.string = display.detailLine;
  }

  private onBuildWind(): void {
    if (!this.boot) return;
    const out = cityHudBuildWind(this.boot);
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] build failed: ${out.errorCode ?? "unknown"}`);
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
    if (!out.ok) console.warn(`[CityHudPanel] loan failed: ${out.uiErrorCode ?? "unknown"}`);
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
    const out = techSpeedupResearchByAd(this.boot);
    this.lastActionKey = out.messageKey;
    this.refresh();
    if (!out.ok) console.warn(`[CityHudPanel] ad speedup failed: ${out.uiErrorCode ?? "unknown"}`);
  }
}
