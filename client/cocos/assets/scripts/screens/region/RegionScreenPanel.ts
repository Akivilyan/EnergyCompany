import {
  Color,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment,
  Vec3,
  type Vec2
} from "cc";
import { t, type GameBootstrap } from "../../shared/game-client.mjs";
import { placeCenteredRect } from "../../hudLayout";
import { createHudButton, placeHudButtons, type HudButton } from "../../ui/HudButton";
import type { ScreenPanel, ScreenPanelHost, ScreenPanelLayout } from "../ScreenPanel";
import {
  cancelSelectedRegionLink,
  cycleRegionLink,
  queueDefaultRegionLink,
  queueRegionLinkByCityPair
} from "./regionActions";
import { readRegionScreenViewModel } from "./regionViewModel";

interface RegionMapPoint {
  cityId: string;
  label: string;
  x: number;
  y: number;
  unlocked: boolean;
}

export class RegionScreenPanel implements ScreenPanel {
  readonly root: Node;
  private boot: GameBootstrap | null = null;
  private actionMessageKey: string | null = null;
  private regionDragFromCityId: string | null = null;
  private regionDragToPoint: Vec2 | null = null;
  private readonly mapLayer: Node;
  private readonly mapGraphics: Graphics;
  private readonly card: Node;
  private readonly cardBg: Graphics;
  private readonly titleLabel: Label;
  private readonly detailLabel: Label;
  private readonly cycleLinkBtn: HudButton;
  private readonly queueLinkBtn: HudButton;
  private readonly cancelLinkBtn: HudButton;

  constructor(parent: Node, private readonly host: ScreenPanelHost) {
    this.root = new Node("RegionScreenPanel");
    this.root.setParent(parent);
    this.root.addComponent(UITransform);

    this.mapLayer = new Node("RegionCityNodeLayer");
    this.mapLayer.setParent(this.root);
    this.mapLayer.addComponent(UITransform);
    this.mapGraphics = this.mapLayer.addComponent(Graphics);
    this.mapLayer.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onMapTouchStart(event));
    this.mapLayer.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onMapTouchMove(event));
    this.mapLayer.on(Node.EventType.TOUCH_END, (event: EventTouch) => this.onMapTouchEnd(event));
    this.mapLayer.on(Node.EventType.TOUCH_CANCEL, () => this.clearRegionDrag());

    this.card = new Node("RegionScreenSummaryCard");
    this.card.setParent(this.root);
    this.card.addComponent(UITransform);
    this.cardBg = this.card.addComponent(Graphics);
    this.titleLabel = this.createLabel("RegionScreenTitle", this.card, new Color(245, 252, 255, 255));
    this.detailLabel = this.createLabel("RegionScreenDetail", this.card, new Color(33, 74, 92, 255));

    this.cycleLinkBtn = createHudButton(this.root, "RegionActionCycleLink", "hud.btn.cycle_region_link", "secondary", () => this.onCycleLink());
    this.queueLinkBtn = createHudButton(this.root, "RegionActionQueueLink", "hud.btn.queue_link", "primary", () => this.onQueueLink());
    this.cancelLinkBtn = createHudButton(this.root, "RegionActionCancelLink", "hud.btn.cancel_link", "warning", () => this.onCancelLink());
    this.root.active = false;
  }

  bindGameBoot(boot: GameBootstrap): void {
    this.boot = boot;
    this.refresh();
  }

  refresh(): void {
    const vm = readRegionScreenViewModel(this.boot, this.actionMessage());
    this.root.active = vm.active;
    if (!vm.active) return;

    this.titleLabel.string = vm.title || t("hud.btn.region");
    this.detailLabel.string = vm.detail;
    this.cycleLinkBtn.node.active = vm.canCycleLink;
    this.queueLinkBtn.node.active = vm.canQueueLink;
    this.cancelLinkBtn.node.active = vm.canCancelLink;
  }

  applyLayout(layout: ScreenPanelLayout): void {
    placeCenteredRect(this.root, 0, 0, layout.container.width, layout.container.height);
    if (!this.root.active) return;

    const mapWidth = layout.container.width * 0.88;
    const mapHeight = layout.container.height * 0.58;
    const mapX = 0;
    const mapY = -layout.container.height * 0.03;
    placeCenteredRect(this.mapLayer, mapX, mapY, mapWidth, mapHeight);
    this.drawRegionMap(mapWidth, mapHeight);

    const cardWidth = layout.container.width * 0.34;
    const cardHeight = Math.max(120, Math.min(190, layout.container.height * 0.22));
    placeCenteredRect(this.card, layout.container.width * 0.27, layout.container.height * 0.12, cardWidth, cardHeight);
    this.cardBg.clear();
    this.cardBg.fillColor = new Color(242, 252, 255, 226);
    this.cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.min(18, cardHeight * 0.12));
    this.cardBg.fill();

    placeCenteredRect(this.titleLabel.node, 0, cardHeight * 0.28, cardWidth * 0.88, cardHeight * 0.3);
    this.titleLabel.fontSize = Math.max(18, Math.round(layout.buttonFont * 0.62));
    this.titleLabel.lineHeight = Math.round(this.titleLabel.fontSize * 1.12);
    placeCenteredRect(this.detailLabel.node, 0, -cardHeight * 0.15, cardWidth * 0.86, cardHeight * 0.58);
    this.detailLabel.fontSize = Math.max(15, Math.round(layout.buttonFont * 0.48));
    this.detailLabel.lineHeight = Math.round(this.detailLabel.fontSize * 1.15);

    placeHudButtons(
      layout.rows[1],
      [this.cycleLinkBtn, this.queueLinkBtn, this.cancelLinkBtn],
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
    if (role === "primary") return new Color(30, 134, 203, 245);
    if (role === "warning") return new Color(212, 91, 69, 245);
    return new Color(58, 113, 171, 235);
  }

  private drawRegionMap(w: number, h: number): void {
    const g = this.mapGraphics;
    g.clear();
    g.fillColor = new Color(22, 91, 125, 88);
    g.roundRect(-w / 2, -h / 2, w, h, Math.min(22, h * 0.08));
    g.fill();

    const points = this.resolveRegionMapPoints(w, h);
    if (points.length === 0) {
      const a = { x: -w * 0.26, y: h * 0.1 };
      const b = { x: w * 0.18, y: h * 0.18 };
      const c = { x: -w * 0.02, y: -h * 0.2 };
      g.strokeColor = new Color(81, 223, 226, 215);
      g.lineWidth = Math.max(4, h * 0.02);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.moveTo(a.x, a.y);
      g.lineTo(c.x, c.y);
      g.stroke();
      this.drawMapNode(g, a.x, a.y, Math.max(24, h * 0.13), true);
      this.drawMapNode(g, b.x, b.y, Math.max(24, h * 0.13), true);
      this.drawMapNode(g, c.x, c.y, Math.max(24, h * 0.13), false);
      return;
    }

    const pointByCityId = new Map(points.map((point) => [point.cityId, point]));
    const regionId = this.boot?.play.getNavigation().regionId ?? "MAP-01";
    const snapshot = this.boot?.app.screens.region(regionId).getSnapshot();
    if (snapshot) {
      g.lineWidth = Math.max(5, h * 0.018);
      for (const link of snapshot.gridLinks) {
        const from = pointByCityId.get(link.fromCityId);
        const to = pointByCityId.get(link.toCityId);
        if (!from || !to) continue;
        g.strokeColor = link.status === "finished"
          ? new Color(89, 237, 226, 232)
          : new Color(255, 224, 103, 232);
        g.moveTo(from.x, from.y);
        g.lineTo(to.x, to.y);
        g.stroke();
      }
    }
    if (this.regionDragFromCityId && this.regionDragToPoint) {
      const from = pointByCityId.get(this.regionDragFromCityId);
      if (from) {
        g.strokeColor = new Color(255, 244, 132, 244);
        g.lineWidth = Math.max(6, h * 0.022);
        g.moveTo(from.x, from.y);
        g.lineTo(this.regionDragToPoint.x, this.regionDragToPoint.y);
        g.stroke();
      }
    }
    for (const point of points) {
      this.drawMapNode(g, point.x, point.y, Math.max(30, h * 0.1), point.unlocked);
    }
  }

  private resolveRegionMapPoints(w: number, h: number): RegionMapPoint[] {
    if (!this.boot) return [];
    const regionId = this.boot.play.getNavigation().regionId ?? "MAP-01";
    const snapshot = this.boot.app.screens.region(regionId).getSnapshot();
    const cities = snapshot.cities as Array<{ cityId: string; displayName?: string; unlocked: boolean }>;
    const count = cities.length;
    if (count === 0) return [];
    return cities.map((city, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
      const rx = w * (count <= 3 ? 0.26 : 0.34);
      const ry = h * (count <= 3 ? 0.25 : 0.31);
      return {
        cityId: city.cityId,
        label: city.displayName ?? city.cityId,
        x: Math.cos(angle) * rx,
        y: Math.sin(angle) * ry,
        unlocked: city.unlocked
      };
    });
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

  private onMapTouchStart(event: EventTouch): void {
    if (!this.boot || this.boot.play.getNavigation().currentScreen !== "screen_region") return;
    const local = this.getLocalPoint(event);
    if (!local) return;
    const transform = this.mapLayer.getComponent(UITransform);
    if (!transform) return;
    const nearest = this.findNearestRegionPoint(local, transform.width, transform.height);
    if (!nearest) return;
    this.regionDragFromCityId = nearest.cityId;
    this.regionDragToPoint = local;
    this.drawRegionMap(transform.width, transform.height);
  }

  private onMapTouchMove(event: EventTouch): void {
    if (!this.regionDragFromCityId) return;
    const local = this.getLocalPoint(event);
    const transform = this.mapLayer.getComponent(UITransform);
    if (!local || !transform) return;
    this.regionDragToPoint = local;
    this.drawRegionMap(transform.width, transform.height);
  }

  private onMapTouchEnd(event: EventTouch): void {
    if (!this.boot || !this.regionDragFromCityId) {
      this.clearRegionDrag();
      return;
    }
    const local = this.getLocalPoint(event);
    const transform = this.mapLayer.getComponent(UITransform);
    if (local && transform) {
      const target = this.findNearestRegionPoint(local, transform.width, transform.height);
      if (target && target.cityId !== this.regionDragFromCityId) {
        const out = queueRegionLinkByCityPair(this.boot, this.regionDragFromCityId, target.cityId);
        this.actionMessageKey = out.messageKey;
        this.host.requestRefresh(out.messageKey);
        if (!out.ok) console.warn(`[RegionScreenPanel] drag region link failed: ${out.errorCode ?? "unknown"}`);
      }
    }
    this.clearRegionDrag();
  }

  private clearRegionDrag(): void {
    this.regionDragFromCityId = null;
    this.regionDragToPoint = null;
    const transform = this.mapLayer.getComponent(UITransform);
    if (transform) this.drawRegionMap(transform.width, transform.height);
  }

  private getLocalPoint(event: EventTouch): Vec2 | null {
    const transform = this.mapLayer.getComponent(UITransform);
    if (!transform) return null;
    const ui = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
    return { x: local.x, y: local.y } as Vec2;
  }

  private findNearestRegionPoint(local: Vec2, w: number, h: number): RegionMapPoint | null {
    const points = this.resolveRegionMapPoints(w, h).filter((point) => point.unlocked);
    if (points.length === 0) return null;
    let best = points[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const point of points) {
      const dx = point.x - local.x;
      const dy = point.y - local.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    const hitRadius = Math.max(54, Math.min(w, h) * 0.18);
    return bestDistance <= hitRadius ? best : null;
  }

  private actionMessage(): string | null {
    return this.actionMessageKey ? t(this.actionMessageKey) : null;
  }

  private publishAction(result: { ok: boolean; messageKey: string | null; errorCode: string | null }, tag: string): void {
    this.actionMessageKey = result.messageKey;
    this.host.requestRefresh(result.messageKey);
    if (!result.ok) console.warn(`[RegionScreenPanel] ${tag} failed: ${result.errorCode ?? "unknown"}`);
  }

  private onQueueLink(): void {
    if (!this.boot) return;
    this.publishAction(queueDefaultRegionLink(this.boot), "queue link");
  }

  private onCancelLink(): void {
    if (!this.boot) return;
    this.publishAction(cancelSelectedRegionLink(this.boot), "cancel link");
  }

  private onCycleLink(): void {
    if (!this.boot) return;
    this.publishAction(cycleRegionLink(this.boot), "cycle link");
  }
}
