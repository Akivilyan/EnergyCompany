---
id: ui/events
title: 事件面板与弹窗
status: draft
version: 0.1.0
sources:
  - docs/design/features/events.md
  - docs/design/gdd/08-events.md
  - docs/design/gdd/01-core-loop.md#关键节点反馈
supersedes: []
depends_on:
  - features/events
  - ui/00-screen-map
open_questions: []
---

# 事件面板与弹窗

## 1. 屏幕与叠加 ID

- `panel_events`（城市/区域/地图底栏入口）
- `modal_event_fullscreen`（灾害 / 显著政策市场）

## 2. 目的

查看 scheduled/active/expired 事件；大事件 **全屏只读确认**（不阻塞结算管道完成后操作）。

## 3. 面板线框（`panel_events`）

```text
┌─ 事件 ──────────────── [×] ─┐
│ 即将到来                    │
│  · 寒潮预警  还有 3 月       │
│ 进行中 (2/3 槽)             │
│  · 燃料涨价  剩 2 月         │
│ 已结束                      │
│  · …                        │
└─────────────────────────────┘
```

**形态**：底部 **半屏 sheet**（T26 open question 定稿为此）。

## 4. 全屏弹窗线框

```text
┌──────────────────────────────────────────────┐
│           [插画区 - 可选]                     │
│           灾害 / 政策标题                     │
│           摘要 · 影响说明（只读）              │
│                                              │
│              [ 知道了 ]                       │
└──────────────────────────────────────────────┘
```

- **灾害**：一律全屏。
- **政策/市场**：仅「显著干预」时全屏；其余面板内展示。
- 同月与公司升级弹窗：**先升级**（T34），事件排队。

## 5. 组件树

- `EventPanelSheet`
  - `EventSection` × 3（upcoming / active / expired）
  - `EventRow`（icon, title, countdown, intensity）
- `EventFullscreenModal`
  - `EventArt`（可选）
  - `EventCopy`
  - `BtnAcknowledge`（只读，不关游戏逻辑）

## 6. 交互表

| 控件 | 结果 |
|------|------|
| `BtnEvents` |  toggle `panel_events` |
| `EventRow` active | 展开 debuff 摘要 |
| `BtnAcknowledge` | 关闭弹窗；标记 M12 已展示 |
| 结算中 | 面板不可打开新操作；已排队弹窗 M12 后显示 |

## 7. 与引导优先级

`modal_event_fullscreen` > `overlay_onboarding`（引导暂停）。

## 8. 微信小游戏

- 全屏弹窗 **单按钮** 大热区；插画可静态图压缩。
- 面板列表虚拟滚动（事件多时）。

## 9. 相关文档

- Feature：[events](../features/events.md)
- UI：[milestones](./milestones.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T32 初稿 |
