---
id: features/README
title: Feature Spec 索引
status: draft
version: 0.1.0
sources:
  - docs/design/TASK-LIST.md#T25
  - docs/design/gdd/README.md#与-feature-spec-映射计划
supersedes: []
depends_on:
  - gdd/README
open_questions:
  - Playable v0 各 Feature 裁剪边界待 T41 与用户共定后回写本表「v0 列」
---

# Feature Spec 索引

`docs/design/features/` 面向 **实现与测试**：规则细节引用 GDD，不复制整章。编写规范见 [`../META.md`](../META.md)；任务节奏见 [`../TASK-LIST.md`](../TASK-LIST.md)。

**状态说明**：下文「文档」指 Feature 文稿是否已有初稿；**优先级**指产品/架构层面的建议分档，**不等同** T41 垂直切片最终范围。

---

## 优先级分档

| 分档 | 含义 |
|------|------|
| **必须** | 首版可玩闭环依赖；缺则无法完成「建—推月—供能—SV—升级—灾害—通关/破产」 |
| **预留** | 逻辑与字段须实现或预留；UI/内容可简化、隐藏或分阶段开放 |
| **后续** | 明确非首版闭环必需；可晚于 Playable v0 接入 |

GDD 已锁定 [**Playable v0 默认仅 `tech` + `simple`**](../gdd/11-replayability.md)；四方针 / 教学 / 一般难度在实现层 **保留字段**，UI 可暂不暴露。

---

## 系统列表

| Feature | 任务 | 优先级 | 文档 | 主要 GDD | 依赖 Feature（直接） |
|---------|------|--------|------|----------|----------------------|
| [全局游戏状态与月度结算](./00-game-state.md) | T13 | **必须** | draft 0.1.0 | [01](../gdd/01-core-loop.md)、[09](../gdd/09-year-end-and-monetization.md)、[11](../gdd/11-replayability.md) | — |
| [地区主界面](./region-main.md) | T14 | **必须** | draft 0.1.0 | [01](../gdd/01-core-loop.md)、[03](../gdd/03-social-value.md) | 00-game-state |
| [设施建设](./construction.md) | T15 | **必须** | draft 0.1.0 | [02](../gdd/02-economy.md)、[05](../gdd/05-map-and-slots.md) | 00-game-state、region-main |
| [供能计算](./supply-calculation.md) | T16 | **必须** | draft 0.1.0 | [04](../gdd/04-energy-supply.md) | 00-game-state、construction |
| [社会价值结算](./social-value-settlement.md) | T17 | **必须** | draft 0.1.0 | [03](../gdd/03-social-value.md) | 00-game-state、supply-calculation |
| [公司管理](./company-management.md) | T18 | **必须** | draft 0.1.0 | [09](../gdd/09-year-end-and-monetization.md)、[03](../gdd/03-social-value.md) | 00-game-state、social-value-settlement |
| [全国大地图](./world-map.md) | T19 | **预留** | draft 0.1.0 | [05](../gdd/05-map-and-slots.md)、[06](../gdd/06-grid.md) | 00-game-state、social-value-settlement |
| [区域电网与主干](./grid-network.md) | T20 | **预留** | draft 0.1.0 | [06](../gdd/06-grid.md) | 00-game-state、construction、region-main |
| [科技树](./tech-tree.md) | T21 | **必须** | draft 0.1.0 | [07](../gdd/07-tech.md) | 00-game-state、construction、grid-network、supply-calculation |
| [事件](./events.md) | T22 | **必须** | draft 0.1.0 | [08](../gdd/08-events.md) | 00-game-state、construction、tech-tree、supply-calculation |
| ~~年度战略~~ | T23 | — | **已合并** → company-management | [09](../gdd/09-year-end-and-monetization.md) | — |
| [商业化](./monetization.md) | T24 | **预留** | draft 0.1.0 | [09](../gdd/09-year-end-and-monetization.md)、[00](../gdd/00-vision.md) | 00-game-state、company-management、construction、grid-network、tech-tree |
| [新手引导](./onboarding.md) | T24a | **必须** | draft 0.1.0 | [10](../gdd/10-onboarding.md) | 00-game-state、construction、company-management、tech-tree、monetization |
| 本索引 | T25 | — | draft 0.1.0 | 全文 | T13–T24a |

---

## 依赖简图（实现顺序参考）

```text
00-game-state
  ├─ region-main ── construction ──┬─ supply-calculation ── social-value-settlement ── company-management
  │                                 ├─ grid-network ─────────┘
  │                                 └─ tech-tree ── events
  ├─ world-map
  ├─ monetization (横切 company / 队列)
  └─ onboarding (横切 00 / 建设 / 公司 / 科技)
```

建议实现波次：

1. **波次 A**：00 → region-main → construction → supply → SV → company  
2. **波次 B**：grid-network → tech-tree → events  
3. **波次 C**：onboarding、world-map、monetization（可与 UI 层并行）

---

## 与 UI / Data 的对应（计划）

| Feature | UI 任务 | Data / 配置 |
|---------|---------|-------------|
| 00-game-state | T26 屏幕地图 | run / 结算字段 |
| region-main | T27 | region-and-city |
| construction | T30 | facility-and-grid |
| supply-calculation | — | 供能公式参数 T37 |
| social-value-settlement | T29（SV 明细） | company-level-and-run |
| company-management | T29 | loan_tiers T37 |
| world-map | T28 | region-and-city |
| grid-network | T27/T28 | facility-and-grid |
| tech-tree | T31 | technology-tree |
| events | T32 | events-and-campaign |
| monetization | T29 | ad_rewards、IAP SKU T37 |
| onboarding | T35a | tutorial_run_config T37 |

---

## 阶段 2 完成度（Feature 文稿）

| 任务区间 | 状态 |
|----------|------|
| T13–T22、T24、T24a、T25 | **已完成**（本索引即 T25） |
| T23 | 已合并至 T18 |

下一阶段：**T26** 起 UI Spec（`ui/00-screen-map.md`）。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T25 初稿：Feature 列表、优先级、GDD 映射与依赖简图 |
