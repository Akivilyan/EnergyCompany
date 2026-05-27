---
id: data/schemas/facility-and-grid
title: 设施与电网字段
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/04-energy-supply.md
  - docs/design/gdd/05-map-and-slots.md
  - docs/design/gdd/06-grid.md
  - docs/design/gdd/07-tech.md
supersedes: []
depends_on:
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
  - gdd/06-grid
  - gdd/07-tech
open_questions:
  - `nuclear_2`/`nuclear_3` 具体效果口径（单厂升档还是全局 buff）
---

# 设施与电网字段

## 1) 设施配置表 `facility_config`

> 每行对应某设施类型在某 tier 的一条配置。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `facility_id` | string | 是 | 唯一 ID |
| `facility_type` | enum | 是 | `wind` \| `solar` \| `thermal` \| `hydro` \| `nuclear` \| `super_hydro` |
| `tier` | int | 是 | 1-5（核电按其线支持档位） |
| `display_name` | string | 是 | 展示名 |
| `build_cost_total` | int | 是 | 总建设费 |
| `build_months` | int | 是 | 建设月数（最小 1） |
| `monthly_operating_cost` | int | 是 | 月运维费用 |
| `output_capacity_mw` | int | 是 | 标称产能量（波动折算平均） |
| `is_eco_default` | bool | 是 | 是否默认环保（火核默认 false） |
| `requires_river` | bool | 是 | 是否要求临水（常规水电 true） |
| `max_per_city` | int | 否 | 城市内数量上限（核电通常 1） |
| `unlock_tech_id` | string | 是 | 解锁对应科技（例 `wind_3`） |

## 2) 科技同步状态（运行态建议）

| 字段 | 类型 | 说明 |
|------|------|------|
| `storage_system_1_lit` | bool | 储能系统·I 是否点亮 |
| `storage_mult` | int | 由 `storage_system_1_lit` 推导：1 或 2 |
| `facility_build_tier_max.{type}` | int | 各能源线当前可建最高 tier |

## 3) 电网配置 `grid_loss_config`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `core_reference_demand_mw` | int | 是 | 中心城市基准需求 |
| `ordinary_city_demand_ratio` | number | 是 | 常规城需求比例（1/3～1/2） |
| `ordinary_city_reference_demand_mw` | int | 是 | 比例换算后取整 |
| `loss_regional_mw` | int | 是 | 区域链路固定损耗 |
| `loss_backbone_mw` | int | 是 | 主干链路固定损耗 |

