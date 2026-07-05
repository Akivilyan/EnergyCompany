import { Canvas, Node, screen, UITransform, view, Widget } from "cc";

export interface Size2 {
  width: number;
  height: number;
}

export interface InsetRatio {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const DEFAULT_INSET: InsetRatio = { top: 0.03, bottom: 0.03, left: 0.04, right: 0.04 };

export function findCanvasNode(from: Node): Node | null {
  let current: Node | null = from;
  while (current) {
    if (current.getComponent(Canvas)) return current;
    current = current.parent;
  }
  return null;
}

/** 读取 HUD 应参照的容器尺寸：优先 Canvas，其次可见区域。 */
export function readHudContainerSize(from: Node): Size2 {
  const canvasNode = findCanvasNode(from);
  const canvasTransform = canvasNode?.getComponent(UITransform);
  if (canvasTransform && canvasTransform.width > 0 && canvasTransform.height > 0) {
    return { width: canvasTransform.width, height: canvasTransform.height };
  }
  const visible = view.getVisibleSize();
  return { width: visible.width, height: visible.height };
}

/**
 * 竖屏设备 + 横屏设计画布时，画布在物理屏幕上被压成横条。
 * 按帧缓冲与设计尺寸实时计算补偿，不写死分辨率。
 */
export function computePortraitLetterboxScale(container: Size2): number {
  const frame = screen.windowSize;
  if (frame.width <= 0 || frame.height <= 0 || container.width <= 0 || container.height <= 0) {
    return 1;
  }
  const portraitDevice = frame.height > frame.width;
  const landscapeDesign = container.width > container.height;
  if (!portraitDevice || !landscapeDesign) return 1;

  const pxPerDesignX = frame.width / container.width;
  const physicalCanvasH = container.height * pxPerDesignX;
  if (physicalCanvasH <= 0) return 1;

  const target = frame.height / physicalCanvasH;
  return Math.max(1, Math.min(target, 4.5));
}

export function bindInsetWidget(node: Node, inset: InsetRatio = DEFAULT_INSET): Widget {
  const widget = node.getComponent(Widget) ?? node.addComponent(Widget);
  widget.isAlignTop = true;
  widget.isAlignBottom = true;
  widget.isAlignLeft = true;
  widget.isAlignRight = true;
  widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  const apply = (size: Size2) => {
    widget.top = size.height * inset.top;
    widget.bottom = size.height * inset.bottom;
    widget.left = size.width * inset.left;
    widget.right = size.width * inset.right;
    widget.updateAlignment();
  };
  const refresh = () => apply(readHudContainerSize(node));
  refresh();
  parentWatch(node.parent, refresh);
  view.on("canvas-resize", refresh, node);
  return widget;
}

export function parentWatch(node: Node | null, handler: () => void): void {
  if (!node) return;
  node.on(Node.EventType.SIZE_CHANGED, handler);
  view.on("canvas-resize", handler, node);
}

export function unparentWatch(node: Node | null, handler: () => void): void {
  if (!node) return;
  node.off(Node.EventType.SIZE_CHANGED, handler);
  view.off("canvas-resize", handler, node);
}

/** 在父节点本地坐标系内放置矩形（锚点居中）。 */
export function placeCenteredRect(node: Node, centerX: number, centerY: number, width: number, height: number): void {
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(width, height);
  node.setPosition(centerX, centerY, 0);
}

export interface HudBandLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 根据容器尺寸计算产品 UI 壳各区块与按钮格，预留顶部刘海与底部手势区。 */
export function buildHudBandLayout(container: Size2): {
  status: HudBandLayout;
  detail: HudBandLayout;
  rows: HudBandLayout[];
  statusFont: number;
  detailFont: number;
  buttonFont: number;
} {
  const insetX = container.width * 0.04;
  const contentW = container.width - insetX * 2;
  const top = container.height * 0.5;
  const bottom = -container.height * 0.5;

  const topInset = Math.min(92, Math.max(54, container.height * 0.09));
  const bottomInset = Math.min(74, Math.max(44, container.height * 0.07));
  const statusH = Math.min(86, Math.max(64, container.height * 0.11));
  const detailH = Math.min(128, Math.max(92, container.height * 0.16));
  const gap = Math.min(16, Math.max(10, container.height * 0.018));
  const rowCount = 5;
  const buttonsBottom = bottom + bottomInset;
  const navRowH = Math.min(78, Math.max(60, container.height * 0.1));
  const actionRowH = Math.min(82, Math.max(64, container.height * 0.105));
  const supportRowH = Math.min(58, Math.max(42, container.height * 0.07));
  const rowHeights = [actionRowH, supportRowH, supportRowH, navRowH, navRowH];

  const centerX = 0;
  let cursorY = top - topInset - statusH / 2;
  const status: HudBandLayout = { x: centerX, y: cursorY, width: contentW, height: statusH };
  cursorY -= statusH / 2 + gap + detailH / 2;
  const detail: HudBandLayout = { x: centerX, y: cursorY, width: contentW, height: detailH };

  const rows: HudBandLayout[] = [];
  let rowBottom = buttonsBottom;
  for (let i = rowCount - 1; i >= 0; i -= 1) {
    const height = rowHeights[i] ?? actionRowH;
    rows[i] = { x: centerX, y: rowBottom + height / 2, width: contentW, height };
    rowBottom += height + gap;
  }

  return {
    status,
    detail,
    rows,
    statusFont: Math.round(Math.min(28, Math.max(20, statusH * 0.34))),
    detailFont: Math.round(Math.min(18, Math.max(14, detailH * 0.16))),
    buttonFont: Math.round(Math.min(28, Math.max(20, actionRowH * 0.36)))
  };
}

/** 一行内 N 个激活格子的中心点与尺寸。 */
export function splitRowSlots(
  row: HudBandLayout,
  slotCount: number,
  gapRatio = 0.025
): HudBandLayout[] {
  if (slotCount <= 0) return [];
  const gap = row.width * gapRatio;
  const cellW = (row.width - gap * (slotCount - 1)) / slotCount;
  const startX = row.x - row.width / 2 + cellW / 2;
  const slots: HudBandLayout[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    slots.push({
      x: startX + i * (cellW + gap),
      y: row.y,
      width: cellW,
      height: row.height
    });
  }
  return slots;
}
