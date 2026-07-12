import {
  Color,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment
} from "cc";
import { t } from "../../shared/game-client.mjs";
import { placeCenteredRect, splitRowSlots, type HudBandLayout } from "../hudLayout";

export interface HudButton {
  node: Node;
  label: Label;
  bg: Graphics;
  baseName: string;
  messageKey: string;
  role: string;
}

export function createHudButton(
  parent: Node,
  name: string,
  messageKey: string,
  role: string,
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

  node.on(Node.EventType.TOUCH_END, (_event: EventTouch) => handler());
  return { node, label, bg, baseName: name, messageKey, role };
}

export function setHudButtonCaption(btn: HudButton, messageKey: string): void {
  btn.messageKey = messageKey;
  btn.label.string = t(messageKey);
}

export function redrawHudButton(btn: HudButton, fill: Color): void {
  const transform = btn.node.getComponent(UITransform);
  if (!transform || transform.width <= 0 || transform.height <= 0) return;
  btn.bg.clear();
  btn.bg.fillColor = fill;
  btn.bg.roundRect(
    -transform.width / 2,
    -transform.height / 2,
    transform.width,
    transform.height,
    Math.min(18, transform.height * 0.16)
  );
  btn.bg.fill();
}

export function placeHudButtons(
  row: HudBandLayout,
  buttons: HudButton[],
  fontSize: number,
  fillForRole: (role: string) => Color
): void {
  const active = buttons.filter((btn) => btn.node.active);
  const slots = splitRowSlots(row, active.length);
  active.forEach((btn, index) => {
    const slot = slots[index];
    if (!slot) return;
    placeCenteredRect(btn.node, slot.x, slot.y, slot.width, slot.height);
    placeCenteredRect(btn.label.node, 0, 0, slot.width * 0.92, slot.height * 0.8);
    btn.label.fontSize = fontSize;
    btn.label.lineHeight = Math.round(fontSize * 1.1);
    redrawHudButton(btn, fillForRole(btn.role));
  });
}
