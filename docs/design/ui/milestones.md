---
id: ui/milestones
title: 关键节点反馈
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/01-core-loop.md#关键节点反馈
  - docs/design/gdd/03-social-value.md
supersedes: []
depends_on:
  - gdd/01-core-loop
  - gdd/03-social-value
  - ui/00-screen-map
  - ui/construction-flow
  - ui/events
open_questions:
  - 战略工程竣工是否一律全屏（GDD 默认保留，可 v0 仅 Toast）
---

# 关键节点反馈

跨屏 **反馈组件** 注册表（非独立导航屏）。

## 1. 全屏弹窗（`modal_*`）

| ID | 触发 | 内容 | 按钮 |
|----|------|------|------|
| `modal_company_level_up` | M10 升级 | 新等级、解锁摘要（区域/科技） | 知道了 |
| `modal_event_fullscreen` | 灾害 / 显著政策 | 见 [events](./events.md) | 知道了 |
| `modal_mega_project_complete` | 超大水电/核电完工 | 工程名、影响摘要 | 知道了 |

**排队**：同月 `modal_company_level_up` **优先**；其余次月或队列。

## 2. 界面内提示（不弹窗）

| ID | 触发 | 挂载位置 | 表现 |
|----|------|----------|------|
| `toast_tech_lit` | M3 点亮 | `screen_city_detail` `InlineHintStrip` | 条带 + 节点名，3s 可关 |
| `badge_supply_100` | 城 `supply_ratio>=1` | `SupplyBar` | 绿色满条/角标「100%」 |
| `toast_construction_done` | 设施完工（可选） | 城市屏 | 轻 Toast，非必须 |

## 3. 组件规范

- **全屏**：暗背景 60%；插画区 **可选**（无图时纯文案，T41 前可全文案）。
- **内提示**：不阻断点击；与 `overlay_onboarding` 并存时 **内提示让位** 给遮罩。

## 4. 明确不做

- 每月经营结果全屏（GDD 已定）
- 科技完成 / 供能 100% **全屏插画**

## 5. 相关文档

- GDD：[01-core-loop](../gdd/01-core-loop.md)
- UI：[construction-flow](./construction-flow.md)、[events](./events.md)
