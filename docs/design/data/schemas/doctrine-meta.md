# 方针熟练度与科技门槛字段

## 1) 方针熟练度表 `doctrine_meta_table`

> 每条方针独立 1～3 级；L1 为核心值，2→3 线性步长。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `doctrine_id` | enum | 是 | `renewable` \| `hydro` \| `thermal` \| `tech` |
| `meta_level` | int | 是 | 1-3 |
| `build_cost_mult_num` | int | 否 | 建设费分子（可选分数表达） |
| `build_cost_mult_den` | int | 否 | 建设费分母 |
| `build_duration_delta_months` | int | 否 | 建设工期修正（负值为减月） |
| `research_cost_mult_num` | int | 否 | 研发费分子（tech 线用） |
| `research_cost_mult_den` | int | 否 | 研发费分母 |
| `research_duration_delta_months` | int | 否 | 研发工期修正（tech 线用） |
| `doctrine_hydro_mult_num` | int | 否 | 常规水电乘区分子（hydro 线用） |
| `doctrine_hydro_mult_den` | int | 否 | 常规水电乘区分母 |
| `doctrine_super_hydro_mult_num` | int | 否 | 超级水电乘区分子（hydro 线用） |
| `doctrine_super_hydro_mult_den` | int | 否 | 超级水电乘区分母 |

## 2) 熟练度进度表 `doctrine_meta_progress`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `player_id` | string | 是 | 玩家 ID |
| `doctrine_id` | enum | 是 | 方针 |
| `doctrine_meta_level` | int | 是 | 当前等级（1-3） |
| `progress_value` | int | 是 | 当前进度值 |
| `progress_to_next_level` | int | 是 | 升级所需值 |

## 3) 通关增量规则 `doctrine_meta_gain`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `difficulty_id` | enum | 是 | `simple` \| `normal` |
| `meta_gain_on_win` | int | 是 | 通关提升（简单 +1，一般 +2） |
| `meta_level_cap` | int | 是 | 熟练度上限（3） |

## 4) 科技树门槛引用（字段约束）

- `technology_config.requires_lit` 允许引用 `storage_system_1～3`。
- `technology_config.tech_id` 中储能节点必须为：
  - `storage_system_1`
  - `storage_system_2`
  - `storage_system_3`
