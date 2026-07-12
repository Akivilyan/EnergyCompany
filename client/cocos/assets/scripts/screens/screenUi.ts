import {
  Color,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment
} from "cc";
import { placeCenteredRect, type HudBandLayout } from "../hudLayout";

export interface ScreenTextCard {
  node: Node;
  bg: Graphics;
  title: Label;
  detail: Label;
}

export function createScreenTextCard(parent: Node, name: string): ScreenTextCard {
  const node = new Node(name);
  node.setParent(parent);
  node.addComponent(UITransform);
  const bg = node.addComponent(Graphics);
  return {
    node,
    bg,
    title: createScreenLabel(`${name}Title`, node),
    detail: createScreenLabel(`${name}Detail`, node)
  };
}

export function createScreenLabel(name: string, parent: Node): Label {
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

export function placeTextCard(
  card: ScreenTextCard,
  x: number,
  y: number,
  width: number,
  height: number,
  buttonFont: number,
  style: "primary" | "paper" | "feedback" = "paper"
): void {
  placeCenteredRect(card.node, x, y, width, height);
  card.bg.clear();
  card.bg.fillColor =
    style === "primary"
      ? new Color(20, 82, 114, 226)
      : style === "feedback"
        ? new Color(36, 124, 103, 232)
        : new Color(242, 252, 255, 228);
  card.bg.roundRect(-width / 2, -height / 2, width, height, Math.min(16, height * 0.15));
  card.bg.fill();

  placeLabel(
    card.title,
    0,
    height * 0.22,
    width * 0.86,
    height * 0.32,
    Math.max(18, Math.round(buttonFont * 0.64)),
    style === "paper" ? new Color(42, 82, 98, 255) : new Color(255, 255, 255, 255)
  );
  placeLabel(
    card.detail,
    0,
    -height * 0.18,
    width * 0.86,
    height * 0.46,
    Math.max(16, Math.round(buttonFont * 0.5)),
    style === "paper" ? new Color(31, 68, 84, 255) : new Color(226, 246, 255, 255)
  );
}

export function placeLabel(
  label: Label,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  color: Color
): void {
  const transform = label.node.getComponent(UITransform) ?? label.node.addComponent(UITransform);
  transform.setContentSize(width, height);
  label.node.setPosition(x, y, 0);
  label.fontSize = Math.max(14, fontSize);
  label.lineHeight = Math.round(label.fontSize * 1.15);
  label.color = color;
}

export function placeDecisionCards(
  container: { width: number; height: number },
  buttonFont: number,
  cards: {
    objective: ScreenTextCard;
    state: ScreenTextCard;
    focus: ScreenTextCard;
    feedback: ScreenTextCard;
  }
): void {
  const contentW = container.width * 0.9;
  const objectiveH = Math.min(88, Math.max(72, container.height * 0.09));
  const objectiveY = container.height * 0.24;
  placeTextCard(cards.objective, 0, objectiveY, contentW, objectiveH, buttonFont, "primary");

  const gap = Math.max(12, container.width * 0.026);
  const cardW = (contentW - gap) / 2;
  const cardH = Math.min(72, Math.max(58, container.height * 0.068));
  const rowY = objectiveY - objectiveH / 2 - cardH / 2 - Math.max(10, container.height * 0.014);
  placeTextCard(cards.state, -cardW / 2 - gap / 2, rowY, cardW, cardH, buttonFont, "paper");
  placeTextCard(cards.focus, cardW / 2 + gap / 2, rowY, cardW, cardH, buttonFont, "paper");

  const feedbackH = Math.min(52, Math.max(42, container.height * 0.048));
  const feedbackY = rowY - cardH / 2 - feedbackH / 2 - Math.max(10, container.height * 0.012);
  placeTextCard(cards.feedback, 0, feedbackY, contentW, feedbackH, buttonFont, "feedback");
}

export function bottomActionRow(rows: HudBandLayout[]): HudBandLayout {
  return rows[3] ?? rows[2] ?? rows[1] ?? rows[0];
}
