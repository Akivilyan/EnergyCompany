---
id: data/schemas/region-and-city
title: 地区与城市表字段
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/03-social-value.md
  - docs/design/gdd/04-energy-supply.md
  - docs/design/gdd/05-map-and-slots.md
  - docs/design/gdd/06-grid.md
supersedes: []
depends_on:
  - gdd/03-social-value
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
  - gdd/06-grid
open_questions:
  - `ordinary_city_demand_ratio` 采用 1/3 还是 1/2（或分地区）待精算
---

# 地区与城市表字段

## 1) 地区主表 `region_nodes`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `region_id` | string | 是 | 地区 ID（例：`region_01`） |
| `region_name` | string | 是 | 地区显示名 |
| `region_type` | enum | 是 | `capital` \| `ordinary` |
| `province_group` | string | 否 | 省/片区分组（用于邻接与统计） |
| `unlock_level_min` | int | 是 | 公司等级解锁门槛（1-5） |
| `base_demand_mw` | int | 是 | 城市需求基线（用于 M9/M10） |
| `has_river` | bool | 是 | 是否临水（常规水电选址门槛） |
| `wind_resource` | enum | 是 | `normal` \| `rich` |
| `solar_resource` | enum | 是 | `normal` \| `rich` |
| `hydro_resource` | enum | 是 | `normal` \| `rich`（映射 `region_mult`） |
| `fossil_tag` | enum | 否 | 化石标签（经济侧成本修正） |
| `is_super_hydro_allowed` | bool | 是 | 是否可建设超级水电 |
| `max_build_slots` | int | 是 | 建设位上限 |

## 2) 邻接表 `region_adjacency`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `edge_id` | string | 是 | 邻接边 ID |
| `from_region_id` | string | 是 | 起点地区 |
| `to_region_id` | string | 是 | 终点地区 |
| `edge_type` | enum | 是 | `regional` \| `backbone_candidate` |
| `is_default_open` | bool | 是 | 开局是否可连 |

## 3) 资源映射（落地规则）

| 规则项 | 映射 |
|------|------|
| 风/光/常规水电 `region_mult` | `normal -> 1`，`rich -> 2` |
| 火电/核电/超级水电 `region_mult` | 恒 `1` |
| 常规水电可建 | `has_river = true` |

