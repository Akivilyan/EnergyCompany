---
id: gdd/06-grid
title: 电网
status: draft
version: 0.3.1
sources:
  - docs/game-core-design.md#14
supersedes: []
depends_on:
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
open_questions:
  - `ordinary_city_demand_ratio` 相对中心城取 1/3～1/2 的具体值（精算取整）
  - 特高压科技是否门控主干连线（T09 科技树）
  - 超级水电并网节点挂接方式（枢纽同城 vs 独立节点）
---

# 电网

## 概述

本章定义 **区域电网**、**主干电网**、**固定线损尺度**，以及 M4 的 **并网岛** 供能算法（**已确认**）。

- **未联网城市**：不与其他城接边 → 并网岛仅含自身 → **只吃本地发电**（`net_import = 0`）。
- **联网后**：与旧稿一致，岛内 **负载均衡**（按需求比例分配，见下）。
- **策略**：拉线有 **建设费 + 每月线损**；大地图主干尤甚，玩家须取舍 **连哪些城、是否跨区**（见「组网策略」）。

[04-energy-supply.md](./04-energy-supply.md) 定义设施/城市公式；本章产出 **`net_import_city`**。

---

## 链路类型

| 类型 | 建造界面 | 连接对象 | 线损 |
|------|----------|----------|------|
| `regional_link` | `screen_region` | 同省壳内 **两座城市** | `loss_regional_mw` |
| `backbone_link` | `screen_world_map` | **枢纽** 与 **枢纽** 之间 | `loss_backbone_mw` |

**枢纽** `is_grid_hub = true`：省内 `core_city`、**都**（`metropolis`）、建成后的 **超级水电** 槽位。

**非枢纽城市**：仅当与邻城/枢纽之间存在 **已完工区域线** 时，才并入同一并网岛。

**在建链路**：不连通、不计线损；**完工次月** 生效（与设施建设一致）。

---

## 线损尺度（固定配置值）

线损为 **每月固定 MW**，写入配置文件（**不按流量、不按距离**）。绝对数 **精算后取整**。

### 普通城市需求锚点（`data/`）

**普通城市**（`mid_city` 等，非中心/非都）月需求 `base_demand_mw` 宜为 **中心城** 的 **1/3～1/2**；线损推导用参考值：

```text
ordinary_city_reference_demand_mw
    = round( core_reference_demand_mw × ordinary_city_demand_ratio )
// ordinary_city_demand_ratio ∈ [1/3, 1/2]
```

### 线损关系（已确认）

| 线型 | 每月线损（单条链路） |
|------|----------------------|
| **区域线** `regional_link` | **普通城市** 月需求总量的 **1/4** |
| **主干线** `backbone_link` | **普通城市** 月需求总量（全额） |

```text
loss_regional_mw  = round( ordinary_city_reference_demand_mw / 4 )
loss_backbone_mw  = round( ordinary_city_reference_demand_mw )
```

推论：**1 条主干线损 = 4 条区域线损之和**（便于玩家心算）。

### 配置落表

**`grid_loss_config`** 建议字段：

| 字段 | 说明 |
|------|------|
| `core_reference_demand_mw` | 典型中心城需求 |
| `ordinary_city_demand_ratio` | 普通城相对中心（0.333～0.5） |
| `ordinary_city_reference_demand_mw` | 取整后的普通城参考需求 |
| `loss_regional_mw` | `round(ordinary_reference / 4)` |
| `loss_backbone_mw` | `round(ordinary_reference)` |

**`grid_links`**：按 `link_type` 读取上表固定 `loss_mw`；含 `build_cost_total`、`build_months`（见 [02-economy.md](./02-economy.md)）。

### 量级示例

`core_reference = 900`，`ordinary_city_demand_ratio = 0.4` → 普通城参考 **360 MW**：

| 线型 | 线损 |
|------|------|
| 区域 ×1 | 90 MW |
| 主干 ×1 | 360 MW |
| 区域 ×4 合计 | 360 MW（= 主干 ×1） |

---

## 并网岛算法（已确认）

### 规则摘要

1. **并查集**：节点 = 可经营城市 + 超级水电（若建成）；边 = **已完工** 区域线 + 主干线。
2. 每岛：`available = max(0, Σ local_supply − Σ 链路 loss_mw)`。
3. `rate = min(1, available / Σ demand)`；每城 `effective = demand × rate`。
4. `net_import = effective − local`（正=净受入，负=净外送）。

**未接任何线的城市**：岛大小为 1，等价于只吃本地，**不** 享受外省调剂。

### M4 伪代码

```text
// 04 章已算
for each city c:
    local_supply[c] = Σ (产能量 × 地区系数 × 事件) over finished facilities in c
    demand[c] = base_demand_mw[c]

graph.nodes = operable cities + super_hydro hubs (if built)
graph.edges = finished regional_link + finished backbone_link

for each island I in connected_components(graph):
    G = Σ local_supply[c],  c ∈ I
    D = Σ demand[c],        c ∈ I
    L = Σ loss_mw(link),    link with both endpoints in I
    available = max(0, G - L)

    if D <= 0:
        for c in I: effective[c] = 0; net_import[c] = -local_supply[c]
        continue

    rate = min(1, available / D)

    for c in I:
        effective_supply[c] = demand[c] × rate
        net_import[c] = effective_supply[c] - local_supply[c]
```

### 示例

岛内有 A、B：A 本地 80、需求 100；B 本地 40、需求 50；1 条区域线，`loss_regional = 90`（普通城参考 360 时）。

```text
G = 120, D = 150, L = 90 → available = 30
rate = 30/150 = 0.2
```
（示例仅演示算法；线损以配置为准。）

---

## 组网策略（大地图思考点）

拉线 **不是免费 buff**，玩家需在 **建设费、线损、并网范围** 之间取舍。

| 杠杆 | 作用 |
|------|------|
| **建设费 + 工期** | 铺得多 → 现金流与「下一月」节奏压力大 |
| **每月线损** | 每多一条线，岛内 `L` 增加 → `available` 下降；**盲目全连会亏** |
| **并网岛范围** | 把缺电城并入富电省 → 富电省 `rate` 被拉低；是否值得取决于社会价值/收入布局 |
| **区域 vs 主干** | 单条区域 = 普通城需求÷4；单条主干 = 整城普通城需求；**4 条区域 ≈ 1 条主干** |
| **不连** | 农村风光基地可 **故意孤岛**，本地 100% 吃满绿电，再仅用 **少量** 线外送枢纽 |

**首版不采用**「无节制免费铺线」：靠 **造价 + 线损 + 岛池稀释** 自然限制；**不** 另加「每条城最多 N 条线」硬上限（除非精算后仍过宽）。

**大地图** 上主干走向是长期规划重点：连哪两个 **枢纽**、是否值得每月付出 **一整段中心基准损耗**，应与解锁省壳、超级水电位置一并考虑。

---

## 与超级水电、战略工程

| 工程 | 并网 |
|------|------|
| **超级水电** | 产出计入所挂 **枢纽岛** 的 `G`（挂接细则待表） |
| **核电 / 常规机组** | 仅经所在城 `local_supply` 入岛 |
| **特高压** | 是否门控主干见 `open_questions` / T09 |

---

## 已决事项

| 议题 | 决策 |
|------|------|
| 供能算法 | **并网岛 + 固定线损 + 按需求比例分配** |
| 未联网城市 | 仅本岛 size=1，**只吃本地** |
| 线损关系 | 单条区域 = **普通城需求÷4**；单条主干 = **普通城需求全额** |
| 普通城需求 | 中心城的 **1/3～1/2**（`ordinary_city_demand_ratio`） |
| 线损数值 | **固定 MW**，`grid_loss_config` 精算后 **取整** |
| 设施层不算电网 | 见 04 章 |
| 再简化变体 | **不采用**（与「未联网=仅本地」重复） |

---

## 与其他文档的关系

| 文档 | 关系 |
|------|------|
| [04-energy-supply.md](./04-energy-supply.md) | 设施/城市公式；M4 调用 `net_import` |
| [05-map-and-slots.md](./05-map-and-slots.md) | 区域/大地图建链；枢纽城 |
| [02-economy.md](./02-economy.md) | 链路建设费、工期 |
| [03-social-value.md](./03-social-value.md) | 外电视同环保 |

---

## 首版本章边界

**本章包含**：链路类型、线损尺度、并网岛算法、组网策略意图、`net_import` 语义。

**本章不包含**：建链 UI 线框、链路造价具体数、特高压全文（Feature T20 / data T37）。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-22 | 草案：并网岛+比例分配 |
| 0.2.0 | 2026-05-22 | 用户确认算法；线损 5×区域=主干=中心基准×10%；组网策略；未联网=仅本地 |
| 0.3.0 | 2026-05-22 | 线损改小城需求锚点：5区域=小城需求，主干=5区域；固定配置取整；小城=中心1/3～1/2 |
| 0.3.1 | 2026-05-22 | 线损：单条区域=普通城需求/4，单条主干=普通城需求全额（4区域≈1主干） |
