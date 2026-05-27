---
id: data/schemas/company-level-and-run
title: 公司等级与单局参数字段
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/03-social-value.md
  - docs/design/gdd/11-replayability.md
  - docs/design/gdd/10-onboarding.md
supersedes: []
depends_on:
  - gdd/03-social-value
  - gdd/10-onboarding
  - gdd/11-replayability
open_questions:
  - 教学局 `tutorial_run_config` 是独立表还是附在 run_config，待 T24a 决定
---

# 公司等级与单局参数字段

## 1) 等级门槛表 `company_level_config`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `level` | int | 是 | 1-5 |
| `sv_threshold` | int | 是 | 升至本级所需社会价值阈值 |
| `unlock_region_capital_count` | int | 是 | 可经营超大都市数量 |
| `unlock_region_ordinary_count` | int | 是 | 可经营普通区数量 |
| `unlock_notes` | string | 否 | 规则备注 |

## 2) 难度修正表 `difficulty_modifiers`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `difficulty_id` | enum | 是 | `simple` \| `normal` |
| `starting_cash_add` | int | 是 | 起始资金增量（简单 +40 万） |
| `disaster_cash_mult` | number | 是 | 灾害扣款系数（简单 0.75） |
| `exam_tier_delta` | int | 是 | 备考档位偏移（简单 -1，最低 1） |

## 3) 单局参数 `run_config`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `campaign_run_target_months` | int | 是 | 固定战役终局月（86） |
| `starting_cash_base` | int | 是 | 基准起始资金（80 万） |
| `doctrine_lit_budget` | int | 是 | 非科技方针点亮预算（15） |
| `bankrupt_consecutive_months` | int | 是 | 连续破产判负月数（2） |
| `allow_decimal_in_config` | bool | 是 | 配置允许小数 |
| `settlement_rounding_mode` | enum | 是 | `truncate_to_int` |

