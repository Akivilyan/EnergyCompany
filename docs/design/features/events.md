---
id: features/events
title: 事件系统
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/08-events.md#实例生命周期
  - docs/design/gdd/08-events.md#与月度结算的关系
  - docs/design/gdd/08-events.md#固定灾害轴与随机事件单局通关
supersedes: []
depends_on:
  - gdd/08-events
  - gdd/11-replayability
  - features/00-game-state
  - features/construction
  - features/tech-tree
  - features/supply-calculation
open_questions:
  - policy/market 与固定灾害同月排期冲突时的优先级细则（实现层细化）
---

# 事件系统

## 1. 目标

定义事件实例的生命周期、效果类型、M11 调度规则、并发上限，以及与固定灾害轴和随机事件池的协作方式。

## 2. 范围

- **包含**：scheduled/active/expired 状态、四类效果挂载、≤3 并发、M11 推进、固定灾害与随机池。
- **不包含**：事件 UI 线框（T32）、具体事件数值表（Data 层 T37）。

## 3. 触发与入口

| 触发 | 时机 | 说明 |
|------|------|------|
| 固定灾害 | `trigger_month` 到达 | `campaign_disasters[]` |
| 随机事件 | M11 权重抽取 | policy/market 池 |
| 玩家查看 | 任意可操作月 | 事件面板/悬浮按钮 |

玩家不能主动「发起」事件；仅可查看与应对。

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| 运行态 | 事件调度在 `month_settling` 的 M11 执行 |
| 并发槽 | 新实例进入 `active` 时 `active_count < 3` |
| 固定灾害 | 按 `trigger_month` 与 `exam_tier` 配置 |

## 5. 玩家操作

1. 在城市界面打开事件面板，查看即将到来/进行中/已结束事件。
2. 根据倒计时与摘要调整建设、研发、借贷策略。
3. 灾害/显著政策市场事件触发全屏弹窗（只读确认，不阻塞结算管道）。

## 6. 系统行为与副作用

### 6.1 实例生命周期

```text
scheduled → active → expired
```

| 状态 | 规则 |
|------|------|
| `scheduled` | 已排期，显示倒计时与摘要 |
| `active` | 生效中，参与 M1–M7/M3/M4/M5 修正；占用并发槽 |
| `expired` | 到期后移出活跃列表 |

### 6.2 效果类型（四类 + 补充）

| 效果 | 挂载步骤 | 说明 |
|------|----------|------|
| `one_time_cash` | active 当月（M5 前） | 一次性收支；灾害常用 |
| 持续 debuff/buff | M1/M3/M5/M6/M7 | `build_cost_mult`、`research_cost_mult`、`income_mult`、`operating_cost_mult` 等 |
| `event_factor` | M4 | 供能修正 |
| `freeze_build` / `freeze_research` | 玩家操作时 | 禁止新建，已在建/在研不暂停 |

**不做**：直接修改 `social_value_current`。

### 6.3 M11 调度逻辑

1. 对每条 `active` 实例：`duration_months -= 1`；为 0 则转 `expired`。
2. 检查 `campaign_disasters` 是否到达 `trigger_month` → 创建实例。
3. 从随机池按权重抽取（若槽位未满）。
4. 新实例默认当月起效；若槽位已满则推迟至有空槽月份。

### 6.4 固定灾害 vs 随机事件

| 类型 | 来源 | 月份 | 弹窗 |
|------|------|------|------|
| 固定灾害 | `campaign_disasters` | 固定 `trigger_month` | 一律全屏 |
| 随机 policy/market | 事件池 | 不固定 | 显著干预时全屏 |

同月可并存（仍受 ≤3 限制）。最终场 `is_final=true` 结算完成且未破产 → M14 通关。

## 7. 与月度结算的关系

| 步骤 | 事件参与 |
|------|----------|
| M1 | 建设费/工期修正、freeze_build |
| M3 | 研发修正、freeze_research |
| M4 | event_factor |
| M5 | income_mult；one_time_cash 入账 |
| M6–M7 | operating_cost_mult |
| M11 | 生命周期推进与新实例激活 |
| M12 | 弹窗判定 |
| M13–M14 | 灾害经济压力间接影响破产/通关 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 事件配置 | `event_id`, `event_type`, `effect_type`, `duration_months`, `intensity_tier` | 实例创建与效果 |
| 战役轴 | `campaign_disasters`, `trigger_month`, `exam_tier`, `is_final` | 固定灾害 |
| 运行态 | `event_instances[]`, `active_count` | 生命周期管理 |
| 科技 | `eng_risk_reserve_lit` | one_time_cash 减免 15% |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| active 已达 3 | 新实例保持 scheduled，推迟激活 |
| 同 effect_type + 同 scope | 叠乘（如 0.8 × 0.9 = 0.72） |
| freeze 期间尝试新建 | 拒绝并提示原因 |
| 激励秒完工/秒研发 | 不绕过 freeze（仅加速已在建/在研） |
| 公司升级与灾害同月 | 先升级弹窗，事件弹窗排队或次月 |

## 10. 验收标准

- [ ] Given 3 个 active 事件，When M11 尝试激活第 4 个，Then 推迟至后续有空槽的月份。
- [ ] Given 固定灾害到达 trigger_month，When M11 执行，Then 创建 disaster 实例并占用 active 槽。
- [ ] Given active 事件含 build_cost_mult，When M1 施工，Then 费用按叠乘结果修正。
- [ ] Given 灾害 one_time_cash 且 eng_risk_reserve 已点亮，When 入账，Then 负向现金 ×0.85。
- [ ] Given 最终固定灾害结算完成且未破产，When M14 执行，Then 标记 victory。

## 11. 相关文档

- GDD：
  - [事件系统](../gdd/08-events.md)
  - [重玩性与方针](../gdd/11-replayability.md)
- Data：
  - [events-and-campaign](../data/schemas/events-and-campaign.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [设施建设](./construction.md)
  - [科技树](./tech-tree.md)
  - [供能计算](./supply-calculation.md)
  - [事件 UI](../ui/events.md)（T32）

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T22 初稿：生命周期、M11 调度、效果挂载、固定灾害与验收标准 |
