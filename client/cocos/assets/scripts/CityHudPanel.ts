import {
  _decorator,
  Color,
  Component,
  Graphics,
  HorizontalTextAlignment,
  Label,
  log,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment,
  view
} from "cc";
import {
  clientNavOpenCity,
  getCityHudProfileSnapshot,
  t,
  type GameBootstrap
} from "../shared/game-client.mjs";
import { buildHudBandLayout, placeCenteredRect, readHudContainerSize } from "./hudLayout";
import { CityScreenPanel } from "./screens/city/CityScreenPanel";
import { EventModalPanel } from "./screens/event/EventModalPanel";
import { RunResultScreenPanel } from "./screens/result/RunResultScreenPanel";
import { ScreenHost } from "./screens/ScreenHost";

const { ccclass } = _decorator;

/**
 * 首局可玩切片的根宿主。
 *
 * 这里只负责画城市背景、挂载当前切片需要的 panel 和响应尺寸变化；
 * 业务动作、文案和信息层级全部属于 CityScreenPanel。
 */
@ccclass("CityHudPanel")
export class CityHudPanel extends Component {
  private boot: GameBootstrap | null = null;
  private shell: Node | null = null;
  private backdrop: Graphics | null = null;
  private screenLayer: Node | null = null;
  private loadingLabel: Label | null = null;
  private screenHost: ScreenHost | null = null;
  private readonly onLayoutChange = (): void => this.applyLayout();

  onLoad(): void {
    const line = `[CityHudPanel] playable shell mounted on ${this.node.name}`;
    log(line);
    console.warn(line);
    if (!this.node.getComponent(UITransform)) this.node.addComponent(UITransform);
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
    view.off("canvas-resize", this.onLayoutChange, this);
    this.screenHost?.dispose();
    this.screenHost = null;
    this.boot = null;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    const current = boot.play.getNavigation().currentScreen;
    if (current !== "screen_city_detail" && current !== "screen_run_result") {
      clientNavOpenCity(boot);
    }
    this.loadingLabel && (this.loadingLabel.node.active = false);
    this.screenHost?.bindGameBoot(boot);
    this.refresh();
  }

  showMountError(message: string): void {
    if (!this.loadingLabel) return;
    this.loadingLabel.node.active = true;
    this.loadingLabel.string = `${t("hud.config_failed")}\n${message}`;
    this.loadingLabel.color = new Color(255, 236, 230, 255);
  }

  private ensureUi(): void {
    if (this.shell) return;
    this.shell = new Node("PlayableHudShell");
    this.shell.setParent(this.node);
    this.shell.addComponent(UITransform);

    const backdropNode = new Node("CityBackdrop");
    backdropNode.setParent(this.shell);
    backdropNode.addComponent(UITransform);
    this.backdrop = backdropNode.addComponent(Graphics);

    this.screenLayer = new Node("PlayableScreenLayer");
    this.screenLayer.setParent(this.shell);
    this.screenLayer.addComponent(UITransform);

    this.loadingLabel = this.createLabel("LoadingLabel", this.screenLayer);
    const host = {
      requestRefresh: () => this.refresh()
    };
    this.screenHost = new ScreenHost()
      .register("screen_city_detail", new CityScreenPanel(this.screenLayer, host))
      .register("screen_run_result", new RunResultScreenPanel(this.screenLayer))
      .register("screen_events", new EventModalPanel(this.screenLayer, host));
    this.applyLayout();
  }

  private refresh(): void {
    this.screenHost?.refresh();
    this.applyLayout();
  }

  private scheduleLayoutRetries(): void {
    this.unschedule(this.retryLayout);
    this.schedule(this.retryLayout, 0, 6, 0.05);
  }

  private retryLayout(): void {
    this.applyLayout();
  }

  private applyLayout(): void {
    if (!this.shell || !this.backdrop || !this.screenLayer || !this.loadingLabel) return;
    const container = readHudContainerSize(this.node);
    if (container.width <= 0 || container.height <= 0) return;

    this.node.getComponent(UITransform)?.setContentSize(container.width, container.height);
    this.shell.setScale(1, 1, 1);
    this.shell.setPosition(0, 0, 0);
    placeCenteredRect(this.shell, 0, 0, container.width, container.height);
    placeCenteredRect(this.backdrop.node, 0, 0, container.width, container.height);
    placeCenteredRect(this.screenLayer, 0, 0, container.width, container.height);
    this.drawCityBackdrop(container.width, container.height);

    const layout = buildHudBandLayout(container);
    this.screenHost?.applyLayout({
      container,
      rows: layout.rows,
      buttonFont: layout.buttonFont
    });
    placeCenteredRect(this.loadingLabel.node, 0, 0, container.width * 0.82, container.height * 0.18);
    this.loadingLabel.fontSize = Math.max(18, Math.round(container.width * 0.045));
    this.loadingLabel.lineHeight = Math.round(this.loadingLabel.fontSize * 1.25);
  }

  private drawCityBackdrop(width: number, height: number): void {
    if (!this.backdrop) return;
    const g = this.backdrop;
    const left = -width / 2;
    const bottom = -height / 2;
    const top = height / 2;
    const profile = this.boot ? getCityHudProfileSnapshot(this.boot) : null;
    const lowSupply = !!profile && profile.supplyRatio < 0.72;
    const connected = !!profile && profile.supplyRatio > 0;

    g.clear();
    g.fillColor = lowSupply ? new Color(127, 184, 198, 255) : new Color(119, 207, 232, 255);
    g.rect(left, bottom, width, height);
    g.fill();
    g.fillColor = lowSupply ? new Color(70, 143, 166, 255) : new Color(65, 173, 207, 255);
    g.rect(left, bottom, width, height * 0.47);
    g.fill();

    this.drawSun(g, width * 0.31, top - height * 0.2, Math.max(34, width * 0.085));
    this.drawCloud(g, -width * 0.25, top - height * 0.18, width * 0.09);
    this.drawCloud(g, width * 0.15, top - height * 0.29, width * 0.07);

    const stageY = bottom + height * 0.47;
    const wind = { x: -width * 0.27, y: stageY - height * 0.09 };
    const solar = { x: width * 0.02, y: stageY - height * 0.15 };
    const hydro = { x: width * 0.28, y: stageY - height * 0.04 };
    this.drawIsland(g, wind.x, wind.y, width * 0.28, height * 0.09, new Color(113, 188, 121, 255));
    this.drawIsland(g, solar.x, solar.y, width * 0.36, height * 0.1, new Color(137, 202, 127, 255));
    this.drawIsland(g, hydro.x, hydro.y, width * 0.24, height * 0.085, new Color(104, 181, 126, 255));
    this.drawGridLine(g, wind.x, wind.y + height * 0.025, solar.x, solar.y + height * 0.03, connected);
    this.drawGridLine(g, solar.x, solar.y + height * 0.03, hydro.x, hydro.y + height * 0.02, connected);
    this.drawWindTurbine(g, wind.x, wind.y + height * 0.065, width * 0.075);
    this.drawSolarField(g, solar.x, solar.y + height * 0.055, width * 0.13, height * 0.035);
    this.drawHydroPlant(g, hydro.x, hydro.y + height * 0.05, width * 0.1, height * 0.055);

    if (lowSupply) {
      g.fillColor = new Color(255, 139, 87, 215);
      g.circle(hydro.x + width * 0.08, hydro.y + height * 0.1, Math.max(12, width * 0.025));
      g.fill();
    }
  }

  private createLabel(name: string, parent: Node): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.addComponent(UITransform);
    const label = node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = "Arial";
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Overflow.CLAMP;
    label.enableWrapText = true;
    return label;
  }

  private drawSun(g: Graphics, x: number, y: number, radius: number): void {
    g.fillColor = new Color(255, 224, 112, 88);
    g.circle(x, y, radius * 1.55);
    g.fill();
    g.fillColor = new Color(255, 220, 91, 245);
    g.circle(x, y, radius);
    g.fill();
  }

  private drawCloud(g: Graphics, x: number, y: number, size: number): void {
    g.fillColor = new Color(245, 252, 255, 210);
    g.circle(x - size * 0.28, y, size * 0.3);
    g.circle(x, y + size * 0.08, size * 0.4);
    g.circle(x + size * 0.32, y, size * 0.28);
    g.fill();
  }

  private drawIsland(g: Graphics, x: number, y: number, width: number, height: number, color: Color): void {
    g.fillColor = new Color(239, 211, 132, 255);
    g.ellipse(x, y - height * 0.08, width * 0.54, height * 0.58);
    g.fill();
    g.fillColor = color;
    g.ellipse(x, y + height * 0.08, width * 0.49, height * 0.48);
    g.fill();
  }

  private drawWindTurbine(g: Graphics, x: number, y: number, size: number): void {
    g.strokeColor = new Color(244, 251, 255, 255);
    g.lineWidth = Math.max(3, size * 0.055);
    g.moveTo(x, y - size * 0.75);
    g.lineTo(x, y + size * 0.25);
    g.stroke();
    for (const angle of [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]) {
      g.moveTo(x, y + size * 0.25);
      g.lineTo(x + Math.cos(angle) * size * 0.52, y + size * 0.25 + Math.sin(angle) * size * 0.52);
    }
    g.stroke();
    g.fillColor = new Color(244, 251, 255, 255);
    g.circle(x, y + size * 0.25, size * 0.08);
    g.fill();
  }

  private drawSolarField(g: Graphics, x: number, y: number, width: number, height: number): void {
    g.fillColor = new Color(39, 103, 161, 255);
    g.roundRect(x - width / 2, y - height / 2, width, height, Math.max(4, height * 0.12));
    g.fill();
    g.strokeColor = new Color(118, 194, 228, 255);
    g.lineWidth = Math.max(2, height * 0.05);
    for (const ratio of [-0.25, 0, 0.25]) {
      g.moveTo(x - width * 0.38, y + height * ratio);
      g.lineTo(x + width * 0.38, y + height * ratio);
    }
    g.stroke();
  }

  private drawHydroPlant(g: Graphics, x: number, y: number, width: number, height: number): void {
    g.fillColor = new Color(238, 246, 248, 255);
    g.roundRect(x - width / 2, y - height / 2, width, height, Math.max(6, height * 0.12));
    g.fill();
    g.fillColor = new Color(73, 161, 204, 255);
    g.roundRect(x - width * 0.32, y - height * 0.18, width * 0.64, height * 0.22, Math.max(3, height * 0.07));
    g.fill();
  }

  private drawGridLine(
    g: Graphics,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    connected: boolean
  ): void {
    g.strokeColor = connected ? new Color(99, 246, 226, 230) : new Color(214, 237, 241, 155);
    g.lineWidth = connected ? 6 : 3;
    g.moveTo(fromX, fromY);
    g.lineTo(toX, toY);
    g.stroke();
  }

  private showLoading(): void {
    if (!this.loadingLabel) return;
    this.loadingLabel.node.active = true;
    this.loadingLabel.string = `${t("hud.loading")}\n${t("hud.wait_mount")}`;
  }
}
