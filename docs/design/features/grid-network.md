---
id: features/grid-network
title: 区域电网与主干
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/06-grid.md#链路类型与建造界面
  - docs/design/gdd/06-grid.md#特高压与跨区组网
  - docs/design/gdd/06-grid.md#线损尺度固定配置值
supersedes: []
depends_on:
  - gdd/06-grid
  - gdd/05-map-and-slots
  - features/00-game-state
  - features/region-main
  - features/world-map
  - features/supply-calculation
open_questions: []
---

# 区域电网与主干

## 1. 目标

定义区域线与主干线的建链规则、门槛、施工推进、线损生效与跨区接入条件，保证电网行为与 M2/M4 一致。

## 2. 范围

- **包含**：`regional_link`/`backbone_link` 创建与校验、完工生效、特高压前后档、接入并网岛。
- **不包含**：地图节点解锁逻辑（T19）、供能最终分配公式细节（T16）、UI 线框（T28/T32）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| `screen_region` 组网入口 | 同省可经营城市之间 | 区域线建链流程 |
| `screen_world_map` 主干入口 | 枢纽节点之间，满足门槛 | 主干建链流程 |

## 4. 前置条件

### 4.1 区域线 `regional_link`

| 条件 | 说明 |
|------|------|
| 端点范围 | 同一省壳内两座可经营城市 |
| 科技门槛 | `grid_regional` 已点亮 |
| 运行态 | `run_playable` 且非 `month_settling` |
| 资金与并发 | 满足建设费用与在建上限 |

### 4.2 主干线 `backbone_link`

| 条件 | 说明 |
|------|------|
| 端点范围 | 两个 `is_grid_hub=true` 的枢纽节点 |
| 等级门槛 | 公司等级 `>= IV` |
| 科技门槛 | `grid_backbone` 已点亮 |
| 运行态/资金 | 同区域线 |

## 5. 玩家操作

1. 玩家进入区域或大地图的建链模式。
2. 选择起点与终点节点。
3. 系统做合法性校验（端点、门槛、资金、并发）。
4. 玩家确认后下达建链命令，写入链路施工队列。
5. 在建链路于 M2 推进，完工后次月并入电网图。

## 6. 系统行为与副作用

### 6.1 下达建链（`queue_grid_link`）

| 行为 | 规则 |
|------|------|
| 扣费 | 下达当月扣首月款 |
| 入队 | 写入 `grid_link_queue`，状态 `under_construction` |
| 线损档位 | 区域线固定 `loss_regional_mw`；主干线按当前是否已点亮 `uhv_transmission` 选择前/后档 |

### 6.2 月度推进（M2）

| 行为 | 规则 |
|------|------|
| 推进 | 每月 M2 推进工期并扣后续期款 |
| 完工 | 完工次月开始参与并网与线损结算 |
| 在建状态 | 在建期间不连通、不计线损 |

### 6.3 特高压自动升档

当 `uhv_transmission` 在 M3 点亮后：
- 所有已完工且 `pre_uhv` 的主干线自动切到 `uhv` 档；
- 不需要玩家手动升级；
- 无额外工期与费用。

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M2 | 链路施工推进与完工判定 |
| M3 | 特高压科技点亮触发主干自动升档 |
| M4 | 仅完工链路参与并网岛计算并计线损 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 链路队列 | `link_id`, `link_type`, `endpoint_a`, `endpoint_b`, `remaining_months`, `status` | 施工推进 |
| 链路配置 | `loss_regional_mw`, `loss_backbone_pre_uhv_mw`, `loss_backbone_uhv_mw` | 线损取值 |
| 节点状态 | `region_id`, `city_id`, `is_grid_hub`, `unlock_state` | 端点合法性 |
| 科技状态 | `grid_regional_lit`, `grid_backbone_lit`, `uhv_transmission_lit` | 门槛与升档 |
| 公司状态 | `company_level`, `funds` | 资格与扣费 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 非同省城市尝试建区域线 | 拒绝并提示 `invalid_regional_endpoint` |
| 非枢纽尝试建主干线 | 拒绝并提示 `invalid_backbone_endpoint` |
| 等级/科技不满足 | 拒绝并提示 `locked` |
| 重复下达相同链路 | 拒绝并提示 `duplicate_link` |
| 结算中下达建链 | 拒绝并提示「结算中」 |

## 10. 验收标准

- [ ] Given 同省两城且满足门槛，When 下达区域线，Then 入队并按 M2 推进。
- [ ] Given 两个枢纽且公司等级 IV+，When 下达主干线，Then 按当前特高压档位写入线损。
- [ ] Given 主干线在 `pre_uhv` 状态，When `uhv_transmission` 点亮，Then 自动切换到 `uhv` 档。
- [ ] Given 链路仍在建，When 执行 M4，Then 该链路不参与并网与线损。
- [ ] Given 完工链路生效次月，When 执行 M4，Then 该链路参与并网岛连通与 `L` 计算。

## 11. 相关文档

- GDD：
  - [电网](../gdd/06-grid.md)
  - [地图与建设位](../gdd/05-map-and-slots.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [地区主界面](./region-main.md)
  - [全国大地图](./world-map.md)
  - [供能计算](./supply-calculation.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T20 初稿：建链规则、门槛、M2推进、特高压自动升档与验收标准 |
