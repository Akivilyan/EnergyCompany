---
id: gdd/06-grid
title: 电网
status: draft
version: 0.5.1
sources:
  - docs/game-core-design.md#14
supersedes: []
depends_on:
  - gdd/03-social-value
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
open_questions:
  - ordinary_city_demand_ratio 相对中心城取 1/3～1/2 的具体值（精算取整，T37）
---

# 电网

## 概述

本章定义 **区域电网**、**主干电网**、**固定线损尺度**、**建链与科技门控**，以及 M4 的 **并网岛** 供能算法。

- **未联网城市**：无已完工链路 → 并网岛仅含自身 → **只吃本地发电**（`net_import = 0`）。
- **联网后**：岛内按 **需求比例** 分配可用电力；扣 **固定线损**（不按流量、不按距离）。
- **策略**：拉线有 **建设费 + 工期 + 每月线损**；盲目全连会稀释富电省、抬高 `L`。

[04-energy-supply.md](./04-energy-supply.md) 定义设施/城市公式；本章产出 **`net_import_city`** 供 M4 满足率使用。

---

## 规则

### 链路类型与建造界面

| 类型 | `link_type` | 建造界面 | 端点 | 首版科技门控 |
|------|-------------|----------|------|--------------|
| **区域线** | `regional_link` | `screen_region` | 同一 **省壳** 内任意两座 **可经营** 城市 | 须 **`grid_regional` 已点亮**（公司 **III** 起可研，[07-tech.md](./07-tech.md)） |
| **主干线** | `backbone_link` | `screen_world_map` | 两个 **`is_grid_hub`** 节点之间 | 须 **`grid_backbone` 已点亮** 且 **公司 ≥ IV**；线损分特高压前/后（见下） |

**枢纽** `is_grid_hub = true`：

| 节点 | 说明 |
|------|------|
| 省内 `core_city` | 每省 **有且仅一** 座 |
| **都** `metropolis` | `MET-A` / `MET-B` 自身即城级节点 |
| **超级水电** | 全图 2 槽；建成后对应图节点亦为枢纽（见下节） |

**非枢纽城市**：不铺主干；须通过 **区域线** 与枢纽或其它城相连，才并入省内并网岛。

**在建链路**：不连通、不计线损；**完工次月** 起参与 M4 与 M2 后续推进（与设施建设一致，见 [02-economy.md](./02-economy.md)）。

### 施工与月度管道

| 项 | 规则 |
|----|------|
| 扣款 | 下达当月扣首月建设款；之后 M2 每月推进工期并扣款 |
| 生效 | **完工次月** 起：边加入并网图、线损计入岛内 `L` |
| 拆除 | 首版 **不做** 拆线（若 Feature 后续加入，须 M4 重算并释放建设费规则单列） |

### 特高压与跨区组网

| 阶段 | 铺线条件 | 主干线损 |
|------|----------|----------|
| **公司 < IV** 或 **`grid_backbone` 未点亮** | 不可铺 `backbone_link` | — |
| **≥ IV 且已点亮主干科技、未点亮** `uhv_transmission` | 可铺 `backbone_link` | **特高压前档**（约 1.5×普通城参考需求，见公式） |
| **已点亮** `uhv_transmission`（公司 **V** 科技） | 同上；新铺主干用 **后档** | **特高压后档** = 普通城参考需求 **全额** |

**区域线** 始终仅在同省壳内铺设，**不受** 公司等级与特高压影响。

#### 特高压研发完成 → 主干自动升档

与设施科技同步规则一致（见 [05-map-and-slots.md](./05-map-and-slots.md)）：

- `uhv_transmission` **研发完成当月**（M3 完成拍），所有 **已完工** 且仍为 **特高压前档** 的 `backbone_link`，**自动** 将 `loss_mw` 改为 **特高压后档**。
- **无需** 玩家点升级、**无** 追加工期、**无** 升级费用。

`grid_links` 建议字段：`loss_tier` = `pre_uhv` | `uhv`（或由 `loss_mw` 与配置表反查）。

### 战略工程与并网

| 工程 | 建造层 | 并网方式 |
|------|--------|----------|
| **超级水电** | 大地图固定槽（不占城内建设位） | 建成后在图上加节点 `SUPER-HYDRO-{n}`，`is_grid_hub = true`；`local_supply` = 配置表出力；须用 **`backbone_link`** 与至少一座枢纽城相连才并入跨区岛 |
| **核电 / 常规机组** | 城市通用建设位 | 仅经所在城 `local_supply` 进入该城所在岛 |
| **常规水电** | 城内临水位 | 同上 |

旧稿将核电列在大地图战略层；**首版以 [05-map-and-slots.md](./05-map-and-slots.md) 为准**：核电在 **城内** 建造，仅 **超级水电 / 主干线** 在大地图操作。

### 组网策略（设计意图）

拉线 **不是免费 buff**。玩家需在 **建设费、线损、并网范围** 之间取舍。

| 杠杆 | 作用 |
|------|------|
| **建设费 + 工期** | 铺得多 → 现金流与「下一月」节奏压力大 |
| **每月线损** | 每多一条线，岛内 `L` 增加 → `available` 下降 |
| **并网岛范围** | 缺电城并入富电省 → 全岛 `rate` 被拉低 |
| **区域 vs 主干** | 单条区域 = 普通城需求÷4；单条主干 = 普通城需求全额；**4 条区域 ≈ 1 条主干** |
| **故意不连** | 农村风光基地可 **孤岛** 本地满供，再 **少量** 线外送枢纽 |

**首版不采用**「每条城最多 N 条线」硬上限；靠 **造价 + 线损 + 岛池稀释** 限制。大地图 **枢纽间** 主干走向是长期规划重点。

---

## 公式与数值

### 线损尺度（固定配置值）

线损为 **每月固定 MW**，写入 `grid_loss_config`（**不按流量、不按距离**）。绝对数 **精算后取整**。

**普通城市**（`mid_city` / `rural` / `remote`，非中心/非都）月需求 `base_demand_mw` 宜为 **中心城** 的 **1/3～1/2**：

```text
ordinary_city_reference_demand_mw
    = round( core_reference_demand_mw × ordinary_city_demand_ratio )
// ordinary_city_demand_ratio ∈ [1/3, 1/2]，具体值待表（T37）
```

| 线型 | 每月线损（单条链路） |
|------|----------------------|
| **区域线** `regional_link` | 普通城参考需求的 **1/4** |
| **主干·特高压后** `backbone_link`（`uhv`） | 普通城参考需求的 **全额** |
| **主干·特高压前** `backbone_link`（`pre_uhv`） | 见下式（约为全额 **1.5 倍**，再 **个位归零**） |

```text
loss_regional_mw  = round( ordinary_city_reference_demand_mw / 4 )

loss_backbone_uhv_mw = round( ordinary_city_reference_demand_mw )

raw_pre = ordinary_city_reference_demand_mw × 1.5
loss_backbone_pre_uhv_mw = floor( raw_pre / 10 ) × 10   // 先向下取整，再把个位改为 0
```

**个位归零示例**：`ordinary_reference = 360` → `raw_pre = 540` → **540**；`ordinary_reference = 347` → `raw_pre = 520.5` → `floor(520.5)=520` → **520**。

特高压 **后**，已铺主干与新建主干均用 `loss_backbone_uhv_mw`。特高压 **前** 铺的主干在研发完成前用 `loss_backbone_pre_uhv_mw`。

推论（特高压后）：**1 条主干线损 = 4 条区域线损之和**（便于玩家心算）。特高压前单条主干线损 **高于** 后档（约 1.5× 后再个位归零，通常 **≥** 后档）。

#### 配置落表

**`grid_loss_config`**：

| 字段 | 说明 |
|------|------|
| `core_reference_demand_mw` | 典型中心城需求 |
| `ordinary_city_demand_ratio` | 普通城相对中心（0.333～0.5） |
| `ordinary_city_reference_demand_mw` | 取整后的普通城参考需求 |
| `loss_regional_mw` | `round(ordinary_reference / 4)` |
| `loss_backbone_uhv_mw` | `round(ordinary_reference)`（特高压后 / 升档目标） |
| `loss_backbone_pre_uhv_mw` | `floor(ordinary_reference × 1.5 / 10) × 10` |

**`grid_links`**（每条链路实例）：`link_type`、`endpoint_a`、`endpoint_b`、`loss_mw`（由类型查表）、`build_cost_total`、`build_months`。

#### 量级示例

`core_reference = 900`，`ordinary_city_demand_ratio = 0.4` → 普通城参考 **360 MW**：

| 线型 | 线损 |
|------|------|
| 区域 ×1 | 90 MW |
| 主干 ×1（特高压后） | 360 MW |
| 主干 ×1（特高压前） | `floor(540/10)×10` = **540 MW** |
| 区域 ×4 合计 | 360 MW（= 特高压后主干 ×1） |

### 并网岛算法（M4）

1. **并查集**：节点 = 可经营城市 + 已建成的 `SUPER-HYDRO-{n}`；边 = **已完工** `regional_link` + `backbone_link`。
2. 每岛：`available = max(0, Σ local_supply − Σ loss_mw)`。
3. `rate = min(1, available / Σ demand)`；每城 `effective = demand × rate`。
4. `net_import = effective − local`（正=净受入，负=净外送）。

**未接任何线的城市**：岛大小为 1，等价于仅本地，**不** 享受外省调剂。

#### 伪代码

```text
for each city c:
    local_supply[c] = Σ (产能量 × 地区系数 × 事件) over finished facilities in c
    demand[c] = base_demand_mw[c]

for each super_hydro h (if built):
    local_supply[h] = output_mw from config

graph.nodes = operable cities + built super_hydro hubs
graph.edges = finished regional_link + finished backbone_link

for each island I in connected_components(graph):
    G = Σ local_supply[n],  n ∈ I
    D = Σ demand[c],        c ∈ I (cities only; super_hydro demand = 0)
    L = Σ loss_mw(link),    link with both endpoints in I
    available = max(0, G - L)

    if D <= 0:
        for c in I (cities): effective[c] = 0; net_import[c] = -local_supply[c]
        continue

    rate = min(1, available / D)

    for c in I (cities):
        effective_supply[c] = demand[c] × rate
        net_import[c] = effective_supply[c] - local_supply[c]
```

#### 算例

岛内有 A、B：A 本地 80、需求 100；B 本地 40、需求 50；1 条区域线（`loss_regional = 90`，锚点 360 时）。

```text
G = 120, D = 150, L = 90 → available = 30
rate = 30/150 = 0.2
→ A effective=20, net_import=-60；B effective=10, net_import=-30
```

---

## 与其他系统的关系

| 文档 | 关系 |
|------|------|
| [04-energy-supply.md](./04-energy-supply.md) | 设施层不算电网；M4 使用 `net_import`、`satisfaction_rate` |
| [05-map-and-slots.md](./05-map-and-slots.md) | 省壳内多城、枢纽城、超级水电槽；`base_demand_mw` 锚点 |
| [01-core-loop.md](./01-core-loop.md) | M2 链路施工；区域/大地图分工 |
| [02-economy.md](./02-economy.md) | 链路建设费、分期扣款 |
| [03-social-value.md](./03-social-value.md) | **IV 级** 起可铺主干；外电视同环保 |
| [07-tech.md](./07-tech.md) | `uhv_transmission` 节点定义（T09） |

---

## 首版本章边界

**本章包含**：链路类型、枢纽与端点规则、特高压门控、线损尺度、并网岛算法、组网策略、`net_import` 语义、超级水电图节点。

**本章不包含**：建链 UI 线框、邻接白名单表、链路造价具体数、拆线（Feature T20 / data T37）。

---

## 已决事项

| 议题 | 决策 |
|------|------|
| 供能算法 | **并网岛 + 固定线损 + 按需求比例分配** |
| 未联网城市 | 岛 size=1，**只吃本地** |
| 线损关系 | 单条区域 = **普通城需求÷4**；单条主干 = **普通城需求全额** |
| 普通城需求锚点 | 中心城的 **1/3～1/2** |
| 线损数值 | **固定 MW**，精算后 **取整** |
| 主干铺线 | **公司 ≥ IV** 可铺；**不必** 先点亮特高压 |
| 特高压前线损 | **≈1.5×** 普通城参考需求，`floor` 后 **个位归零** |
| 特高压后 | 新铺主干用后档线损；**已铺主干自动升档**，无手动升级 |
| 区域线 | 同省壳内任意可经营城对；**无** 条数硬上限 |
| 主干端点 | 仅 **枢纽** 之间 |
| 超级水电 | 独立图节点 + 枢纽；经主干并入跨区岛 |
| 设施层不算电网 | 见 04 章 |

---

## 开放问题

1. **`ordinary_city_demand_ratio`** 取 1/3 还是 1/2（或分省差异）——与 `region_nodes.base_demand_mw` 一并精算（T37）。
2. **链路造价与工期**——与线损量级同批落表（T37）；本章只定线损比例关系。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-22 | 草案：并网岛+比例分配 |
| 0.2.0 | 2026-05-22 | 用户确认算法；线损与组网策略；未联网=仅本地 |
| 0.3.0 | 2026-05-22 | 线损锚点改普通城需求；固定配置取整 |
| 0.3.1 | 2026-05-22 | 单条区域=普通城/4，单条主干=普通城全额 |
| 0.4.0 | 2026-05-22 | T08 定稿：建链/枢纽/特高压门控、超级水电图节点、M2 施工；开放问题收敛 |
| 0.5.0 | 2026-05-22 | IV 级可铺主干；特高压前线损 1.5× 个位归零；点亮后主干自动升档 |
| 0.5.1 | 2026-05-22 | 区域电网 III、主干 IV、特高压 V 科技门控 |
