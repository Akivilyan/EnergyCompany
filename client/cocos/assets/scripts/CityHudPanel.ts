import {
  _decorator,
  Component,
  Label,
  Node,
  UITransform,
  Color,
  EventTouch,
  Vec3
} from "cc";
import {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  formatCityHudStatus,
  readCityHudViewModel
} from "../shared/src/app/cityHudController";
import {
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenTechTree,
  formatClientNavHint
} from "../shared/src/app/screenNavController";
import { getMountedGameClient, onGameClientMounted } from "../shared/src/app/gameClientRegistry";
import type { GameBootstrap } from "../shared/src/app/gameBootstrap";

const { ccclass } = _decorator;

/** 城市页最小 HUD：顶栏状态 + 建造风场 + 推月。 */
@ccclass("CityHudPanel")
export class CityHudPanel extends Component {
  private boot: GameBootstrap | null = null;
  private unbindMount: (() => void) | null = null;
  private statusLabel: Label | null = null;
  private hintLabel: Label | null = null;

  onLoad(): void {
    this.ensureUi();
    this.unbindMount = onGameClientMounted((boot) => {
      this.boot = boot;
      this.refresh();
    });
    const existing = getMountedGameClient();
    if (existing) {
      this.boot = existing;
      this.refresh();
    }
  }

  onDestroy(): void {
    this.unbindMount?.();
    this.unbindMount = null;
  }

  private ensureUi(): void {
    if (this.statusLabel) return;

    const panel = new Node("CityHudPanel");
    panel.setParent(this.node);
    panel.setPosition(new Vec3(0, 250, 0));
    panel.addComponent(UITransform).setContentSize(640, 240);

    this.statusLabel = this.createLabel(panel, "StatusLabel", new Vec3(0, 80, 0), 24);
    this.hintLabel = this.createLabel(panel, "HintLabel", new Vec3(0, 45, 0), 18);
    this.createTapButton(panel, "BuildWind", new Vec3(-120, 0, 0), "Build Wind", () => this.onBuildWind());
    this.createTapButton(panel, "AdvanceMonth", new Vec3(120, 0, 0), "Next Month", () => this.onAdvanceMonth());
    this.createTapButton(panel, "OpenCompany", new Vec3(-160, -55, 0), "Company", () => this.onOpenCompany());
    this.createTapButton(panel, "OpenTech", new Vec3(0, -55, 0), "Tech", () => this.onOpenTech());
    this.createTapButton(panel, "NavBack", new Vec3(160, -55, 0), "Back", () => this.onNavBack());
  }

  private createLabel(parent: Node, name: string, position: Vec3, fontSize: number): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(300, 36);
    const label = node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = new Color(240, 240, 240, 255);
    label.string = name;
    return label;
  }

  private createTapButton(
    parent: Node,
    name: string,
    position: Vec3,
    caption: string,
    handler: () => void
  ): void {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(180, 44);
    const label = this.createLabel(node, `${name}Label`, new Vec3(0, 0, 0), 20);
    label.string = caption;
    node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => handler(), this);
  }

  private refresh(): void {
    if (!this.boot || !this.statusLabel || !this.hintLabel) return;
    const view = readCityHudViewModel(this.boot);
    const stackDepth = this.boot.play.getNavigation().stack.length;
    this.statusLabel.string = formatCityHudStatus(view);
    this.hintLabel.string = formatClientNavHint(view, stackDepth);
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
    clientNavOpenCompany(this.boot);
    this.refresh();
  }

  private onOpenTech(): void {
    if (!this.boot) return;
    clientNavOpenTechTree(this.boot);
    this.refresh();
  }

  private onNavBack(): void {
    if (!this.boot) return;
    clientNavBack(this.boot);
    this.refresh();
  }
}
