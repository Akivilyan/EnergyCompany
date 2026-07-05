---
id: data/schemas/events-and-campaign
title: 事件与固定灾害轴字段
status: draft
version: 0.1.1
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
| `immediate_cash_penalty` | int | 是 | 即刻现金惩罚（难度修正前） |
| `debuff_duration_months` | int | 是 | 负面持续月数 N |
| `income_mult_num` / `income_mult_den` | int / int | 是 | 每月收益倍率（持续期间） |
| `build_duration_mult_num` / `build_duration_mult_den` | int / int | 是 | 设施建造工期倍率（持续期间） |
| `research_duration_mult_num` / `research_duration_mult_den` | int / int | 是 | 科研周期倍率（持续期间） |
| `exam_fail_extra_cash` | int | 是 | 备考失败额外现金惩罚 |
| `popup_required` | bool | 是 | 是否强制弹窗（固定灾害 true） |

> 约束：固定灾害**不使用社会价值扣减**字段，避免造成升级路径锁死。

## 3) 结算顺序（固定）

1. 命中 `trigger_month` -> 触发灾害事件。
2. 应用 `difficulty_modifiers.disaster_cash_mult`、`exam_tier_delta`。
3. 写入持续性 debuff（收益/建造/科研）并设置 `debuff_duration_months`。
4. 月结算按 active debuff 叠乘后统一截断为整数。
