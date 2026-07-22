import {
  Button,
  Color,
  Graphics,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3
} from "cc";
import type { FacilityId, SpriteCatalog } from "./PlayableAssets";

export const BLUE_TEXT = new Color(20, 61, 113, 255);
export const MUTED_TEXT = new Color(73, 103, 132, 255);
export const WHITE = new Color(255, 255, 255, 255);
export const CYAN = new Color(52, 211, 236, 255);
export const YELLOW = new Color(255, 184, 39, 255);

const FACILITY_NAME: Record<FacilityId, string> = {
  wind: "风电·I",
  solar: "光伏·I",
  thermal: "火电·I"
};

export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function renderFatalUi(parent: Node, message: string, width: number, height: number): void {
  const layer = (name: string, layerWidth: number, layerHeight: number, x: number, y: number): Node => {
    const node = new Node(name);
    node.layer = parent.layer;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(layerWidth, layerHeight);
    return node;
  };
  const background = layer("Rect", width, height, 0, 0);
  const graphics = background.addComponent(Graphics);
  graphics.fillColor = new Color(27, 88, 139, 255);
  graphics.rect(-width / 2, -height / 2, width, height);
  graphics.fill();
  const addFatalLabel = (text: string, y: number, labelWidth: number, labelHeight: number, fontSize: number): void => {
    const node = layer("Label", labelWidth, labelHeight, 0, y);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.max(fontSize + 4, labelHeight - 2);
    label.color = WHITE;
    label.useSystemFont = true;
    label.fontFamily = "Microsoft YaHei";
    label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = false;
  };
  addFatalLabel("场景加载失败", 36, width - 40, 36, 26);
  addFatalLabel(message, -22, width - 48, 96, 16);
}

export class UiFactory {
  constructor(
    protected readonly node: Node,
    protected readonly sprites: SpriteCatalog
  ) {}

  protected levelRoman(level: number): string {
    return ["0", "I", "II", "III", "IV", "V"][level] ?? `${level}`;
  }

  protected facilityName(facilityId: FacilityId, tier = 1): string {
    return `${FACILITY_NAME[facilityId].split("·")[0]}·${this.levelRoman(tier)}`;
  }

  protected thumbnailSprite(facilityId: FacilityId): SpriteFrame {
    if (facilityId === "wind") return this.sprites.windThumbnail;
    if (facilityId === "solar") return this.sprites.solarThumbnail;
    return this.sprites.thermalThumbnail;
  }

  protected masterSprite(facilityId: FacilityId): SpriteFrame {
    if (facilityId === "wind") return this.sprites.windMaster;
    if (facilityId === "solar") return this.sprites.solarMaster;
    return this.sprites.thermalMaster;
  }

  protected layer(name: string, parent: Node, width: number, height: number, x: number, y: number): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  protected paintRect(parent: Node, x: number, y: number, width: number, height: number, fill: Color): void {
    const node = this.layer("Rect", parent, width, height, x, y);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  protected paintRounded(
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: Color,
    stroke?: Color,
    lineWidth = 0
  ): Node {
    const node = this.layer("Panel", parent, width, height, x, y);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    if (stroke && lineWidth > 0) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = lineWidth;
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      graphics.stroke();
    }
    return node;
  }

  protected addLabel(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color,
    centered: boolean,
    horizontalAlign = 1
  ): Node {
    const node = this.layer("Label", parent, width, height, x, y);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.max(fontSize + 4, height - 2);
    label.color = color;
    label.useSystemFont = true;
    label.fontFamily = "Microsoft YaHei";
    label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = centered
      ? Label.HorizontalAlign.CENTER
      : horizontalAlign === 2
        ? Label.HorizontalAlign.RIGHT
        : Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = false;
    return node;
  }

  protected addSprite(
    parent: Node,
    frame: SpriteFrame,
    x: number,
    y: number,
    width: number,
    height: number
  ): Node {
    const node = this.layer("Sprite", parent, width, height, x, y);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = frame;
    node.getComponent(UITransform)!.setContentSize(width, height);
    return node;
  }

  protected addStat(
    parent: Node,
    icon: SpriteFrame,
    text: string,
    x: number,
    y: number,
    width: number,
    fontSize = 18
  ): void {
    this.addSprite(parent, icon, x - width / 2 + 18, y, 29, 29);
    this.addLabel(parent, text, x + 13, y, width - 30, 29, fontSize, BLUE_TEXT, true);
  }

  protected makeHitTarget(node: Node, onTap: () => void): void {
    const button = node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.96;
    node.on(Node.EventType.TOUCH_END, onTap, this);
  }

  protected makeTextButton(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Color,
    textColor: Color,
    onTap: () => void,
    fontSize = 18
  ): Node {
    const node = this.paintRounded(parent, x, y, width, height, Math.min(width, height) / 2, fill, new Color(255, 255, 255, 235), 2);
    this.addLabel(node, text, 0, 0, width - 8, height - 4, fontSize, textColor, true);
    this.makeHitTarget(node, onTap);
    return node;
  }

  protected makePrimaryButton(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    onTap: () => void
  ): Node {
    const node = this.paintRounded(
      parent,
      x,
      y,
      width,
      height,
      22,
      enabled ? YELLOW : new Color(190, 202, 204, 255),
      enabled ? new Color(255, 241, 157, 255) : new Color(224, 231, 232, 255),
      3
    );
    this.addLabel(node, text, 0, 0, width - 22, height - 8, 20, enabled ? new Color(87, 56, 9, 255) : MUTED_TEXT, true);
    const button = node.addComponent(Button);
    button.interactable = enabled;
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.97;
    if (enabled) node.on(Node.EventType.TOUCH_END, onTap, this);
    return node;
  }
}
