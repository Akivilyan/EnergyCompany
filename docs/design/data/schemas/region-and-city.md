---
id: data/schemas/region-and-city
title: 地区与城市表字段
status: draft
version: 0.1.2
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
  - 四类区内行政单位需求范围是否先全国统一，再在 T39 做省级微调
---

# 地区与城市表字段

## 1) 地区主表 `region_nodes`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `region_id` | string | 是 | 地区 ID（例：`region_01`） |
| `region_name` | string | 是 | 地区显示名 |
| `region_type` | enum | 是 | `capital` \| `ordinary` |
| `unit_count_min` | int | 是 | 区内行政单位最小值（固定 6） |
| `unit_count_max` | int | 是 | 区内行政单位最大值（固定 8） |
| `core_city_count` | int | 是 | 每区中心城市数量（固定 1） |
| `province_group` | string | 否 | 省/片区分组（用于邻接与统计） |
| `unlock_level_min` | int | 是 | 公司等级解锁门槛（1-5） |
| `city_type` | enum | 是 | `core_city` \| `ordinary_city` \| `rural` \| `frontier_town` |
| `demand_profile_id` | string | 是 | 引用需求档位（见下表） |
| `base_demand_mw` | int | 是 | 城市需求基线（从需求档位取值） |
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

## 3) 城市需求档位表 `city_demand_profile`

> 地图配置时按城市类型选择一个范围值，不再依赖单一 `ordinary_city_demand_ratio`。

| `city_type` | 中文含义 | 建议范围（MW） | 推荐默认 |
|------|------|------|------|
| `core_city` | 中心城市 | 1000～1400 | 1200 |
| `ordinary_city` | 常规城市 | 400～700 | 550 |
| `rural` | 农村 | 70～140 | 100 |
| `frontier_town` | 边陲小镇 | 40～90 | 60 |

### 都市需求建议（区外单城）

| `city_type` | 中文含义 | 建议范围（MW） | 推荐默认 |
|------|------|------|------|
| `metropolis` | 都（特大城） | 1600～2200 | 2000（MET-A）/1800（MET-B） |

说明：

- 你在地图上配置城市时，给每个城市选择对应 `city_type` 和 `base_demand_mw` 档位值。
- 比例关系建议大致维持：`ordinary_city` ≈ `core_city` 的 35%～55%，农村/边陲继续下探。

## 4) 资源映射（落地规则）

| 规则项 | 映射 |
|------|------|
| 风/光/常规水电 `region_mult` | `normal -> 1`，`rich -> 2` |
| 火电/核电/超级水电 `region_mult` | 恒 `1` |
| 常规水电可建 | `has_river = true` |

