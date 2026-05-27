---
id: features/region-main
title: 地区主界面
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/01-core-loop.md#区域界面-screen_region
  - docs/design/gdd/03-social-value.md#全图与公司等级-i-v
supersedes: []
depends_on:
  - gdd/01-core-loop
  - gdd/03-social-value
  - gdd/05-map-and-slots
  - gdd/06-grid
  - features/00-game-state
open_questions:
  - 区域界面是否显示「预估线损后供能」二级指标，或仅显示区域连通/供能总览（待 T20 统一）
---

# 地区主界面

## 1. 目标

定义 `screen_region` 的可操作范围：玩家在单一区域（省壳）内完成选城与区域内组网，并进入城市建设界面继续经营。

## 2. 范围

- **包含**：进入条件、区域界面信息区、城市节点选择、区域线建设入口、返回路径、`下一月` 行为约束。
- **不包含**：单城内设施建设细节（T15）、跨区主干建设（T20/T19）、像素与组件布局（UI 层 T27）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| `screen_world_map` 点击 `MAP-xx` | 该区已解锁且可经营 | `screen_region` |
| `screen_city_detail` 返回 | 当前城市属于某 `MAP-xx` | 对应 `screen_region` |
| 新手/教学流程指定跳转 | 教程步骤允许 | 指定 `screen_region` |

补充：
- 点击 **都**（`MET-A/B`）不进入本界面，直接去 `screen_city_detail`。
- 未解锁区在大地图灰显不可点，不触发进入。

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| 区域解锁 | 由公司等级与解锁表决定（见 `gdd/03-social-value`） |
| 区域存在城市节点 | 区内至少 1 个可见城市节点（I 级可能仅 `CITY-START` 可操作） |
| 运行态合法 | 当前处于 `run_playable`，非 `month_settling` |

## 5. 玩家操作

### 5.1 浏览与选城

1. 玩家在区域图查看区内城市节点、连线状态与区域概览。
2. 点击某城市节点：
   - 若可操作：进入该城 `screen_city_detail`。
   - 若仅只读（已解锁省壳但未开放经营）：允许查看基本信息，但不可下达建设命令。

### 5.2 区域内组网（入口级）

1. 玩家选择起点城市与终点城市（均在同一区域）。
2. 发起区域线建设命令（映射 `queue_grid_link`）。
3. 系统通过校验后写入链路施工队列，等待月结 M2 推进。

### 5.3 时间推进

`screen_region` 不作为 `next_month` 主入口。若此界面触发推月（快捷键或全局按钮）：
- 规则与 `features/00-game-state.md` 一致，进入 M1-M14。
- 推月后返回区域界面或切到结果态（破产/通关）。

## 6. 系统行为与副作用

| 行为 | 副作用 |
|------|--------|
| 进入区域界面 | 刷新区域上下文：`current_region_id`、节点状态、连线状态 |
| 选择城市并进入 | 更新 `current_city_id`，切换到 `screen_city_detail` |
| 下达区域线建设 | 扣费、入 `grid_link_queue`、记录预计完工月 |
| 取消区域线建设 | 按规则退款并移出队列（细则在 T20） |
| 区域解锁变更后首次进入 | 依据当前等级刷新节点可操作态/只读态 |

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M2 电网施工推进 | 本界面下达的区域线在此步推进/完工 |
| M4 供能重算 | 区域连通变化影响城市供能结果 |
| M9 社会价值重算 | 本区各城市贡献汇总进公司社会价值 |
| M10 升级检视 | 升级后可能影响本区及其它区可经营范围 |

## 8. 数据依赖

| 数据 | 字段（示意） | 用途 |
|------|--------------|------|
| 区域/城市 | `region_id`, `city_id`, `unlock_company_level`, `city_type` | 控制节点可见与可操作态 |
| 电网链路 | `from_city_id`, `to_city_id`, `build_duration`, `status` | 展示与施工推进 |
| 公司运行态 | `company_level`, `current_month`, `funds` | 校验解锁、扣费、时间显示 |
| 供能摘要缓存 | `region_supply_total`, `region_demand_total` | 区域概览展示 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 未解锁区域尝试进入 | 拒绝并返回 `not_unlocked` |
| 跨区域选点建线 | 拒绝并提示「仅可在同一区域内建线」 |
| 资金不足建线 | 拒绝并提示 `insufficient_funds` |
| 结算中操作区域线 | 拒绝并提示「结算中」 |
| I 级只读城市误点建设入口 | 允许查看，不显示可执行建设命令 |

## 10. 验收标准

- [ ] Given 玩家在大地图点击已解锁 `MAP-xx`，When 进入区域界面，Then 仅展示该区内城市节点与区域线信息。
- [ ] Given 玩家在区域界面点击可操作城市，When 进入城市界面，Then `current_city_id` 更新且可继续建设操作。
- [ ] Given 玩家尝试跨区建线，When 提交命令，Then 被拒绝并保持队列不变。
- [ ] Given 区域线施工中，When 执行 `next_month` 至 M2，Then 链路工期正确推进并在完工月生效。
- [ ] Given 公司等级提升导致区域开放变化，When 重新进入区域界面，Then 节点可操作态按最新等级刷新。

## 11. 相关文档

- GDD：
  - [核心循环与时间](../gdd/01-core-loop.md)
  - [社会价值与公司等级](../gdd/03-social-value.md)
  - [地图与建设位](../gdd/05-map-and-slots.md)
  - [电网](../gdd/06-grid.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [区域电网与主干](./grid-network.md)
  - [全国大地图](./world-map.md)
  - [地区主界面 UI](../ui/region-main.md)（T27）

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T14 初稿：入口、前置、操作流程、结算关系与验收标准 |
