import { Canvas, Node, UITransform, view, Widget } from "cc";

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

const DEFAULT_INSET: InsetRatio = { top: 0.04, bottom: 0.04, left: 0.05, right: 0.05 };

export function findCanvasNode(from: Node): Node | null {
  let current: Node | null = from;
  while (current) {
    if (current.getComponent(Canvas)) return current;
    current = current.parent;
  }
  return null;
}

export function readHudContainerSize(from: Node): Size2 {
  const canvasNode = findCanvasNode(from);
  const canvasTransform = canvasNode?.getComponent(UITransform);
  if (canvasTransform && canvasTransform.width > 0 && canvasTransform.height > 0) {
    return { width: canvasTransform.width, height: canvasTransform.height };
  }
  const visible = view.getVisibleSize();
  return { width: visible.width, height: visible.height };
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

export function placeCenteredRect(
  node: Node,
  centerX: number,
  centerY: number,
  width: number,
  height: number
): void {
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

/**
 * 竖屏原生布局。rows[3] 是主要操作区，rows[2] 供阻塞模态使用；
 * 其它 row 只为延后 panel 保持编译兼容，不参与首局信息布局。
 */
export function buildHudBandLayout(container: Size2): {
  status: HudBandLayout;
  detail: HudBandLayout;
  rows: HudBandLayout[];
  statusFont: number;
  detailFont: number;
  buttonFont: number;
} {
  const marginX = container.width * 0.055;
  const contentW = container.width - marginX * 2;
  const bottom = -container.height / 2;
  const top = container.height / 2;
  const actionH = Math.max(58, Math.min(104, container.height * 0.082));
  const actionY = bottom + container.height * 0.055 + actionH / 2;
  const modalY = bottom + container.height * 0.18 + actionH;
  const rows: HudBandLayout[] = [
    { x: 0, y: top - container.height * 0.13, width: contentW, height: actionH },
    { x: 0, y: 0, width: contentW, height: actionH },
    { x: 0, y: modalY, width: contentW, height: actionH },
    { x: 0, y: actionY, width: contentW, height: actionH },
    { x: 0, y: actionY, width: contentW, height: actionH }
  ];
  return {
    status: rows[0],
    detail: rows[1],
    rows,
    statusFont: Math.max(18, Math.round(container.width * 0.043)),
    detailFont: Math.max(16, Math.round(container.width * 0.036)),
    buttonFont: Math.max(18, Math.round(container.width * 0.044))
  };
}

export function splitRowSlots(
  row: HudBandLayout,
  slotCount: number,
  gapRatio = 0.025
): HudBandLayout[] {
  if (slotCount <= 0) return [];
  const gap = row.width * gapRatio;
  const cellW = (row.width - gap * (slotCount - 1)) / slotCount;
  const startX = row.x - row.width / 2 + cellW / 2;
  return Array.from({ length: slotCount }, (_, index) => ({
    x: startX + index * (cellW + gap),
    y: row.y,
    width: cellW,
    height: row.height
  }));
}
