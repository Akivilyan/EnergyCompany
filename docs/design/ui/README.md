---
id: ui/README
title: UI Spec 索引
status: draft
version: 0.1.0
sources:
  - docs/design/TASK-LIST.md#T35
  - docs/design/META.md#6-ui-spec-模板
supersedes: []
depends_on:
  - ui/00-screen-map
open_questions:
  - 全局设计 token（色板、字号）待 T41 / 美术共定
---

# UI Spec 索引

`docs/design/ui/` 面向 **线框、组件树、交互表**；玩法规则见 GDD / Feature。本阶段 **以文字 + ASCII 线框为主**，不强制配图；视觉稿可后补 Figma 等。

## 文档约定

| 项 | 约定 |
|----|------|
| 屏幕 ID | 与 [00-screen-map](./00-screen-map.md)、GDD 01 **一致**（如 `screen_region`，非 `screen_region_main`） |
| 线框 | ASCII 分区示意即可 |
| 插图 | 仅 milestones / 事件弹窗 **可选** 插画位 |
| 平台 | 默认 **微信小游戏** 安全区与热区（各屏 §9） |

## 屏幕与叠加一览

| 文档 | 任务 | 类型 |
|------|------|------|
| [00-screen-map](./00-screen-map.md) | T26 | 总表 |
| [region-main](./region-main.md) | T27 | `screen_region` |
| [world-map](./world-map.md) | T28 | `screen_world_map` |
| [company](./company.md) | T29 | `screen_company` + 借贷/激励模态 |
| [construction-flow](./construction-flow.md) | T30 | `screen_city_detail` + 建造模态 |
| [tech-tree](./tech-tree.md) | T31 | `screen_tech_tree` |
| [events](./events.md) | T32 | `panel_events` + 事件全屏 |
| [milestones](./milestones.md) | T34 | 跨屏反馈组件 |
| [onboarding](./onboarding.md) | T35a | 引导遮罩 / 图鉴 |

流程屏（`screen_main_menu`、`screen_new_game*`、`screen_run_result`）见 [00-screen-map](./00-screen-map.md) §4，细节在实现层按 Feature 00 / 11 落地。

## 共享组件（T35）

实现时抽公共 Prefab / 组件：

| 组件 ID | 用途 | 出现屏幕 |
|---------|------|----------|
| `TopBar` | 资金、SV、年月 | city、region、world、tech、company |
| `BtnNextMonth` | 推月主 CTA | **仅** city |
| `BottomNav` | 事件/科技/公司/地图 | city、region、world |
| `ToastHost` | 错误与轻提示 | 全局 |
| `OverlaySettling` | 月结遮罩 | 全局 |
| `SupplyBar` | 供能条 + 100% 徽章 | city（及 region 摘要可选） |

### Toast 策略

| 类型 | 时长 | 示例 |
|------|------|------|
| 错误 | 2.5s | `insufficient_funds`, `blocked_by_tutorial` |
| 提示 | 2s | `construction_queue_full` |
| 成功 | 1.5s | 建造下达成功（可选） |

同时只显示 **1 条** Toast；新覆盖旧。

### 安全区

- 顶栏 `padding-top: safeArea.top`
- 底栏 / `BtnNextMonth` `padding-bottom: safeArea.bottom + 8px`

## 阶段 3 完成度

| 任务 | 状态 |
|------|------|
| T26–T32、T34、T35a、T35 | **已完成**（本文索引） |
| T33 | 已合并 T29 |

下一阶段：**T36** Data 层（`data/README.md`）。

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T35 初稿：索引、共享组件与 Toast/安全区 |
