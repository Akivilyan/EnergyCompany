# 科技树配置说明（T38）

本文定义 `technology_config` 的数据结构、取值约束与最小样例，作为科技系统实现与数值表落地的直接依据。

## 1. 目标与边界

- 对齐 `gdd/07-tech.md`：四线 I～V、储能系统 I～III、核电、电网、减压节点。
- 对齐 `gdd/11-replayability.md`：非科技方针 lit 预算 15、风光开局送 `storage_system_1`。
- 不在本文定义具体 `research_cost` 与 `research_months` 数值，仅定义字段与填表口径。

## 2. 主表：`technology_config`

## 2.1 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tech_id` | string | 是 | 唯一 ID，snake_case |
| `display_name` | string | 是 | 显示名（中文） |
| `tab` | enum | 是 | `wind` \| `solar` \| `thermal` \| `hydro` \| `nuclear` \| `grid` \| `engineering` |
| `company_level_min` | int | 是 | 解锁公司等级（1-5） |
| `requires_lit` | string[] | 否 | 前置 lit 节点列表（AND 关系） |
| `starts_lit` | bool | 是 | 是否开局即 lit |
| `research_cost` | int | 是 | 一次性研发费用 |
| `research_months` | int | 是 | 研发月数（最小 1） |
| `effect_type` | enum | 是 | `facility_tier` \| `storage_gate` \| `storage_buff` \| `eco_sync` \| `grid` \| `modifier` |
| `effect_target` | string | 是 | 作用对象（如 `wind`、`all_thermal`） |
| `effect_value` | json | 是 | 效果值（结构由 `effect_type` 决定） |
| `notes` | string | 否 | 策划说明 |

## 2.2 ID 规范（强约束）

- 储能科技只能使用：
  - `storage_system_1`
  - `storage_system_2`
  - `storage_system_3`
- 不再使用 `storage_1`～`storage_3`。
- 旧 `storage_system` 节点已废弃，不得重新引入。

## 3. 关键规则映射

## 3.1 四线 tier 节点（风/光/火/水）

- `wind_1`～`wind_5`
- `solar_1`～`solar_5`
- `thermal_1`～`thermal_5`
- `hydro_1`～`hydro_5`

映射约束：

- `*_1`：`starts_lit = true`，`research_cost = 0`，`research_months = 0`（或直接不出现在研发列表）。
- `*_3` / `*_4` / `*_5`：对风光水线必须配置 `requires_lit` 指向储能系统 I/II/III。

## 3.2 储能系统 I～III

| tech_id | effect_type | effect_target | effect_value |
|------|------|------|------|
| `storage_system_1` | `storage_buff` + `storage_gate` | `wind,solar,hydro` | `{ "storage_mult": 2, "unlock_tier": 3 }` |
| `storage_system_2` | `storage_gate` | `wind,solar,hydro` | `{ "unlock_tier": 4 }` |
| `storage_system_3` | `storage_gate` | `wind,solar,hydro` | `{ "unlock_tier": 5 }` |

说明：

- 仅 `storage_system_1` 改变 `storage_mult`。
- `storage_system_2/3` 只做 tier 闸门，不再叠乘 `storage_mult`。

## 3.3 经营与电网节点（摘要）

- `eco_thermal`：`effect_type = eco_sync`，目标 `all_thermal`。
- `eco_nuclear`：`effect_type = eco_sync`，目标 `all_nuclear`。
- `grid_regional` / `grid_backbone` / `uhv_transmission`：`effect_type = grid`。
- `eng_*`：统一 `effect_type = modifier`，由 `effect_value` 决定具体字段。

## 3.4 核电 II / III（已定：方案 A）

`nuclear_2` / `nuclear_3` 固定采用 **单厂升 tier**，不采用全局核电 buff。

| tech_id | effect_type | effect_target | effect_value |
|------|------|------|------|
| `nuclear_2` | `facility_tier` | `nuclear` | `{ "tier_max": 2 }` |
| `nuclear_3` | `facility_tier` | `nuclear` | `{ "tier_max": 3 }` |

## 4. 结构化样例（最小可执行）

```json
[
  {
    "tech_id": "storage_system_1",
    "display_name": "储能系统·I",
    "tab": "wind",
    "company_level_min": 3,
    "requires_lit": [],
    "starts_lit": false,
    "research_cost": 0,
    "research_months": 0,
    "effect_type": "storage_buff",
    "effect_target": "wind,solar,hydro",
    "effect_value": { "storage_mult": 2, "unlock_tier": 3 }
  },
  {
    "tech_id": "wind_3",
    "display_name": "风电·III",
    "tab": "wind",
    "company_level_min": 3,
    "requires_lit": ["storage_system_1"],
    "starts_lit": false,
    "research_cost": 0,
    "research_months": 0,
    "effect_type": "facility_tier",
    "effect_target": "wind",
    "effect_value": { "tier_max": 3 }
  }
]
```

## 5. 校验清单（供 T40 复用）

- `tech_id` 唯一、不可重复。
- 所有 `requires_lit` 引用都必须存在。
- 风光水 `*_3/4/5` 必须分别依赖 `storage_system_1/2/3`。
- `storage_system_1` 必须存在且 `effect_value.storage_mult = 2`。
- `storage_system_2/3` 不得包含 `storage_mult` 字段。
- `starts_lit = true` 的节点必须与 GDD 对齐（四线 `*_1`）。

## 6. 与其他表的接口

- 与 `data/schemas/doctrine-meta.md`：`doctrine_lit_budget`、方针开局 lit 规则联动。
- 与 `data/schemas/facility-and-grid.md`：`facility_tier` 和 `eco_sync` 触发运行态同步。
- 与 `data/schemas/events-and-campaign.md`：政策事件可调整研发 cost/duration（通过 tech_id 命中）。
