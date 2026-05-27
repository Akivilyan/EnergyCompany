---
id: ui/tech-tree
title: 科技树界面
status: draft
version: 0.1.0
sources:
  - docs/design/features/tech-tree.md
  - docs/design/gdd/07-tech.md
supersedes: []
depends_on:
  - features/tech-tree
  - ui/00-screen-map
open_questions: []
---

# 科技树界面

## 1. 屏幕 ID

`screen_tech_tree`

## 2. 目的

浏览/研发科技节点；展示 **单队列** 在研状态；点亮反馈 **不用全屏弹窗**。

## 3. 布局（线框）

```text
┌──────────────────────────────────────────────┐
│ [←返回]  科技树     资金 | SV | 方针lit余:12  │
├──────────────────────────────────────────────┤
│ [风][光][火][水][核][电网][经营]  ← 分页 Tab   │
├──────────────────────────────────────────────┤
│     (o)--(o)--[● researching 2月]--(lit)     │
│      \    locked    unlocked                  │
│                                              │
│ 选中节点侧栏: 费用|工期|前置| [开研][取消]      │
└──────────────────────────────────────────────┘
```

## 4. 组件树

- `TechTreeScreen`
  - `TopBar` + `DoctrineLitBudgetLabel`
  - `TechCategoryTabs`
  - `TechGraphViewport`（缩放/拖曳）
    - `TechNode`（locked/unlocked/researching/lit）
    - `TechEdge`
  - `TechDetailDrawer`（选中节点）
    - `BtnStartResearch` / `BtnCancelResearch`
  - `ResearchQueueBadge`（唯一在研摘要）

## 5. 交互表

| 控件 | 条件 | 结果 |
|------|------|------|
| `TechNode` unlocked | 点击 | 打开 Drawer |
| `BtnStartResearch` | 无在研、预算 OK | `start_research` |
| `BtnCancelResearch` | researching | `cancel_research` + 确认 |
| 入口 | `company_level < II` | 全局入口隐藏（I 级） |

## 6. 反馈（非弹窗）

| 事件 | UI |
|------|-----|
| 当月 M3 点亮 | 节点变 `lit` + 城市屏 `InlineHintStrip` |
| 研发中 | 节点脉冲 + `ResearchQueueBadge` |

## 7. 异常态

`research_queue_full`、`lit_budget_exhausted`、`doctrine_line_locked` → Drawer 内文案 + 灰显按钮。

## 8. 导航

`back_screen`；教学 `onb_07` 强制打开本屏一次。

## 9. 微信小游戏

- 图过大时 **分页** 减负载；节点热区 ≥ 44pt。
- Drawer 从底滑出，不遮挡图中心路径。

## 10. 相关文档

- Feature：[tech-tree](../features/tech-tree.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T31 初稿 |
