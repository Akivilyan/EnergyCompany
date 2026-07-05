---
id: features/supply-calculation
title: 供能计算
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/04-energy-supply.md#分层公式设施--城市--电网
  - docs/design/gdd/06-grid.md#并网岛算法m4
supersedes: []
depends_on:
  - gdd/04-energy-supply
  - gdd/06-grid
  - gdd/03-social-value
  - features/00-game-state
open_questions:
  - `city_demand_profile` 首版取值区间在 T39 试跑后是否需要收窄
---

# 供能计算

## 1. 目标

定义 M4 的供能重算输入、计算流程与输出字段，确保城市供能条、电网调剂与社会价值上游输入可稳定复现。

## 2. 范围

- **包含**：设施层出力、并网岛调剂、满足率、`net_import`、环保判定输出。
- **不包含**：电网建链交互（T20）、社会价值最终公式（T17）、UI 呈现样式（T27/T29）。

## 3. 触发与入口

| 触发 | 时机 | 执行位置 |
|------|------|----------|
| `next_month` | M4 步骤 | 月结管道 |
| 调试重算（开发命令） | 非正式玩法流程 | 仅开发工具 |

正式玩法中仅通过 `next_month` 的 M4 执行，不在城市界面实时逐帧重算。

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| M1-M3 完成 | 在建推进、链路推进、科技推进已写回状态 |
| 本月可经营城市集合已确定 | 包含区内城市与都节点 |
| 链路状态可用 | 仅 `finished` 链路参与并网 |
| 设施状态可用 | 仅 `operational` 设施参与供能 |

## 5. 计算流程（M4）

### 5.1 设施层（本地供能）

对每个城市 `c`：

```text
facility_supply_i = output_capacity_mw_i × region_mult_i × storage_mult_i × event_factor_i × doctrine_factor_i
local_supply_city[c] = Σ facility_supply_i
```

规则：
- 风/光/常规水电：`region_mult`、`storage_mult` 取 1 或 2。
- 火电/核电/超级水电：`region_mult = storage_mult = 1`。
- 在建设施不计入本地供能。

### 5.2 并网岛层（电网调剂）

1. 构建图：节点 = 可经营城市 + 已建成超级水电节点；边 = 已完工区域线/主干线。
2. 求连通分量（并网岛）`I`，逐岛计算：

```text
G = Σ local_supply[n], n ∈ I
D = Σ demand_city[c], c ∈ I (城市)
L = Σ loss_mw[e], e ∈ I
available = max(0, G - L)
rate = min(1, available / D)   // D<=0 时按 0 处理
effective_supply_city[c] = demand_city[c] × rate
net_import_city[c] = effective_supply_city[c] - local_supply_city[c]
```

3. 未联网城市等价于单节点岛，仅使用本地供能。

### 5.3 城市层输出

```text
satisfaction_rate_city = clamp(effective_supply_city / demand_city, 0, 1)
city_fully_eco_supply = all_finished_local_facilities_is_eco(city)
eco_cap_factor = city_fully_eco_supply ? 1.0 : 0.8
```

注意：环保判定只看本市设施，外电输入不追溯来源且视同环保。

## 6. 系统行为与副作用

| 行为 | 副作用 |
|------|--------|
| 完成 M4 重算 | 覆盖写入城市供能快照（非增量叠加） |
| 供能 100% 达标 | 生成界内提示任务（M12 消费），不弹全屏 |
| 输出给 M5/M9 | 收入、社会价值计算读取 M4 结果 |

## 7. 输出字段定义

| 字段 | 类型 | 语义 |
|------|------|------|
| `demand_city` | int | 城市静态需求（本版不动态波动） |
| `local_supply_city` | int | 本市设施供能和 |
| `net_import_city` | int | 净受入（可负） |
| `effective_supply_city` | int | 本地+净受入后的有效供能 |
| `satisfaction_rate_city` | rational/percent | 满足率，封顶 100% |
| `city_fully_eco_supply` | bool | 本市设施是否全环保 |
| `eco_cap_factor` | fixed | 1.0 或 0.8，供 M9 使用 |

## 8. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M3 | 科技点亮会改变 tier / `is_eco`，直接影响本次 M4 |
| M4 | 本功能执行 |
| M5 | 收入读取满足率与供能结果 |
| M9 | 社会价值读取满足率和 `eco_cap_factor` |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| `demand_city <= 0` | 该城满足率记为 0，防止除零 |
| 岛内 `G-L < 0` | `available` 取 0 |
| 浮点误差 | 统一整数/定点演算，结果按规则取整 |
| 链路端点失效 | 跳过该链路并记诊断日志 |
| 超级水电未接入主干 | 仅作为孤岛本地供能，不外送 |

## 10. 验收标准

- [ ] Given 城市无任何完工设施且未联网，When 执行 M4，Then `effective_supply_city=0` 且满足率为 0。
- [ ] Given 两城联网且岛内供给不足，When 执行 M4，Then 两城按同一 `rate` 比例分配可用供能。
- [ ] Given 城市本地有未环保火/核但大量外电受入，When 执行 M4，Then `city_fully_eco_supply=false`。
- [ ] Given `storage_system_1` 已点亮，When 重算风/光/常规水电，Then `storage_mult` 生效为 2。
- [ ] Given 项目当月刚完工，When 同月 M4，Then 不计入；次月 M4 才计入。

## 11. 相关文档

- GDD：
  - [供能与能源类型](../gdd/04-energy-supply.md)
  - [电网](../gdd/06-grid.md)
  - [社会价值与公司等级](../gdd/03-social-value.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - `features/grid-network.md`（T20）
  - `features/social-value-settlement.md`（T17）
