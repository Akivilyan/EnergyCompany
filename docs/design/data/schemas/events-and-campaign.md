---
id: data/schemas/events-and-campaign
title: 事件与固定灾害轴字段
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/08-events.md
  - docs/design/gdd/11-replayability.md
supersedes: []
depends_on:
  - gdd/08-events
  - gdd/11-replayability
open_questions:
  - 4 场固定灾害 `event_id` 与金额档（T37 数值精算）
---

# 事件与固定灾害轴字段

## 1) 随机事件池 `event_pool`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event_id` | string | 是 | 事件唯一 ID |
| `event_type` | enum | 是 | `policy` \| `market` \| `disaster` |
| `title` | string | 是 | 标题 |
| `description` | string | 是 | 描述 |
| `duration_months` | int | 是 | 持续月数 |
| `effects` | object[] | 是 | 效果数组（cost/income/research/build/freeze 等） |
| `trigger_weight` | int | 否 | 随机权重 |
| `min_company_level` | int | 否 | 等级门槛 |
| `allow_stack` | bool | 是 | 是否允许与同类叠加 |

## 2) 固定灾害轴 `campaign_disasters`

> 固定月份触发，不参与随机抽取。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `campaign_id` | string | 是 | 战役 ID（如 `main_v0`） |
| `seq` | int | 是 | 序号（1-4） |
| `trigger_month` | int | 是 | 固定触发月（22/41/63/86） |
| `warn_lead_months` | int | 是 | 预警月数（8/10/12/14） |
| `event_id` | string | 是 | 对应灾害事件 ID（指向 `event_pool`） |
| `exam_tier` | int | 是 | 备考档位（1-3） |
| `base_cash_penalty` | int | 是 | 基础扣款（难度前） |
| `base_sv_penalty` | int | 是 | 基础社会价值扣减 |
| `exam_fail_extra_cash` | int | 是 | 备考失败额外现金惩罚 |
| `exam_fail_extra_sv` | int | 是 | 备考失败额外 SV 惩罚 |
| `popup_required` | bool | 是 | 是否强制弹窗（固定灾害 true） |

## 3) 结算顺序（固定）

1. 命中 `trigger_month` -> 触发灾害事件。
2. 应用 `difficulty_modifiers.disaster_cash_mult`、`exam_tier_delta`。
3. 结算后统一截断为整数。

