---
id: features/world-map
title: 全国大地图
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/05-map-and-slots.md#大地图拓扑
  - docs/design/gdd/06-grid.md#链路类型与建造界面
supersedes: []
depends_on:
  - gdd/05-map-and-slots
  - gdd/06-grid
  - features/00-game-state
  - features/region-main
open_questions: []
---

# 全国大地图

## 1. 目标

定义 `screen_world_map` 的功能范围：节点进入规则、解锁/灰显、主干与战略工程入口，以及全图导航与联通信息。

## 2. 范围

- **包含**：2都8区节点行为、进入路径、解锁状态、主干链路入口、超级水电入口、返回与切屏。
- **不包含**：主干/区域链路详细建链流程（T20）、城市建设流程（T15）、UI 线框（T28）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| 任意子界面返回全国 | 当前为 `run_playable` | `screen_world_map` |
| 新手/教学指定跳转 | 教程步骤允许 | `screen_world_map` |

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| 运行态 | 当前处于 `run_playable`，非 `month_settling` |
| 地图配置可用 | `region_base`、邻接关系、解锁等级表可读取 |
| 公司等级可用 | 用于节点可经营态判定 |

## 5. 玩家操作

### 5.1 节点点击与导航

| 节点类型 | 点击结果 |
|----------|----------|
| 已解锁 `MAP-xx`（区） | 进入 `screen_region` |
| 已解锁 `MET-A/B`（都） | 直接进入该都 `screen_city_detail` |
| 未解锁节点 | 不可进入，保持灰显 |

### 5.2 主干与战略工程入口

| 入口 | 条件 | 行为 |
|------|------|------|
| 主干链路入口 | 公司等级与科技满足主干门槛 | 进入主干建链交互（T20） |
| 超级水电槽位入口 | 满足科技门槛且槽位未满 | 发起战略工程建设流程（细则在后续 Feature） |

### 5.3 时间推进

大地图不作为 `next_month` 主入口；若通过全局方式触发推月，遵循 `features/00-game-state.md` 的 M1-M14 管道。

## 6. 系统行为与副作用

| 行为 | 副作用 |
|------|--------|
| 打开大地图 | 刷新所有节点状态（已解锁/未解锁/可经营）与联通摘要 |
| 进入区或都 | 更新 `current_region_id` / `current_city_id` |
| 提交主干建设 | 写入链路施工队列并扣费 |
| 提交超级水电建设 | 占用战略槽位并写入施工队列 |

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M2 | 主干/战略工程施工推进与完工 |
| M4 | 联通变化影响并网岛供能分配 |
| M9-M10 | 等级变化影响后续节点可经营状态 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 区域基础 | `region_id`, `region_type`, `adjacent_region_ids`, `unlock_company_level` | 节点状态与邻接展示 |
| 公司状态 | `company_level` | 解锁判定 |
| 主干状态 | `backbone_links`, `loss_tier`, `status` | 联通显示与建链入口状态 |
| 战略工程 | `super_hydro_slots`, `super_hydro_status` | 槽位占用与入口可用性 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 点击未解锁节点 | 拒绝导航并提示 `not_unlocked` |
| 科技不足尝试主干建链 | 拒绝并提示 `tech_locked` |
| 战略槽位已满仍尝试建造 | 拒绝并提示 `slot_limit_reached` |
| 结算中重复进入建链 | 拒绝并提示「结算中」 |

## 10. 验收标准

- [ ] Given 节点 `MAP-xx` 已解锁，When 点击该节点，Then 进入对应 `screen_region`。
- [ ] Given 节点 `MET-A/B` 已解锁，When 点击该节点，Then 直接进入对应都的 `screen_city_detail`。
- [ ] Given 节点未解锁，When 点击，Then 节点保持灰显且不触发跳转。
- [ ] Given 满足主干门槛，When 发起主干建链，Then 进入建链流程并写入施工队列。
- [ ] Given 升级导致新节点解锁，When 重新打开大地图，Then 节点从灰显变为可进入状态。

## 11. 相关文档

- GDD：
  - [地图与建设位](../gdd/05-map-and-slots.md)
  - [电网](../gdd/06-grid.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [地区主界面](./region-main.md)
  - [区域电网与主干](./grid-network.md)
  - [全国大地图 UI](../ui/world-map.md)（T28）
