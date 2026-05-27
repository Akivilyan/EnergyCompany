---
id: features/construction
title: 设施建设
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/02-economy.md#设施建设规则
  - docs/design/gdd/05-map-and-slots.md#建设位系统
  - docs/design/gdd/04-energy-supply.md#首版能源类型
supersedes: []
depends_on:
  - gdd/02-economy
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
  - gdd/07-tech
  - features/00-game-state
  - features/region-main
open_questions:
  - 在建取消的退款比例是否首版固定 100%（当前按旧规则暂定全额返还，后续可调）
---

# 设施建设

## 1. 目标

定义城市内设施建设的可执行流程：从空位选建、校验、扣费、入队到完工生效，形成可实现与可测试的统一行为。

## 2. 范围

- **包含**：选址规则、建设扣费/工期、在建队列、完工生效、取消与拆除入口约束。
- **不包含**：区域/主干建链（T20）、供能公式细节（T16）、UI 线框样式（T30）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| `screen_city_detail` 点空位 | 当前城市可操作、存在空位 | 建造列表弹层/面板 |
| 建造列表点设施项 | 设施满足科技与选址规则 | 建造确认 |
| 建造确认提交 | 校验通过 | 创建在建项目 |

仅 `screen_city_detail` 可发起设施建设；`screen_region` 与 `screen_world_map` 不直接下达城内设施。

## 4. 前置条件

### 4.1 通用校验

| 条件 | 说明 |
|------|------|
| 运行态 | 当前处于 `run_playable` 且非 `month_settling` |
| 建设位 | `occupied_slots < build_slot_count` |
| 全局在建上限 | `active_construction_count < max_concurrent_construction`（基础 3，工程总监可 4） |
| 科技解锁 | 该设施线已解锁，且仅可建当前 `facility_build_tier_max` |

### 4.2 设施选址约束

| 设施类型 | 约束 |
|----------|------|
| 风电 / 光伏 / 火电 | 满足通用校验即可 |
| 常规水电 | `has_river = true` |
| 核电 | `is_nuclear_eligible = true` 且当前城核电数 `< 1` 且核电科技已满足 |
| 超级水电 | 非本功能范围（大地图战略工程） |

## 5. 玩家操作

1. 进入可操作城市，点击空建设位。
2. 系统展示建造列表（每设施线只显示最高可建 tier）。
3. 玩家选择设施，查看建造确认信息（建设费、工期、运行费、产能量）。
4. 玩家确认后创建在建项目；取消则不产生副作用。
5. 在建项目可从在建列表执行取消（若规则允许）。

## 6. 系统行为与副作用

### 6.1 下达建设（`queue_construction`）

| 行为 | 规则 |
|------|------|
| 校验顺序 | 运行态 → 位上限 → 全局在建上限 → 科技 → 设施选址 |
| 扣费时机 | 下达当月立即扣**首月建设款** |
| 入队 | 写入 `construction_queue`，状态 `under_construction` |
| 占位 | 在建即占位，`occupied_slots += 1` |
| 工期 | 写入项目剩余工期（应用工程总监 -1 月，且下限 1） |

### 6.2 月度推进（M1）

| 行为 | 规则 |
|------|------|
| 分期扣费 | 从次月起每次 M1 扣后续期款（避免重复扣首月） |
| 工期递减 | 每次 M1 推进剩余工期 |
| 完工判定 | 剩余工期归零即完工，状态转 `operational` |

### 6.3 完工生效

| 项目 | 规则 |
|------|------|
| 生效时点 | 完工次月起参与 M4 供能重算 |
| 运行成本 | 进入 M6 运维结算范围 |
| 社会价值影响 | 通过 M4→M9 间接影响（非即时写 SV） |

### 6.4 取消与拆除

| 操作 | 当前规则 |
|------|----------|
| 取消在建 | 允许取消；默认全额返还未发生期款（首版按旧规则可全额返还） |
| 拆除完工设施 | 若开启拆除功能，释放建设位并在后续月影响供能/收入/SV |

拆除的费用与返还数值由后续配表细化；本规格先锁流程行为。

## 7. 与月度结算的关系

| 结算步骤 | 建设系统影响 |
|----------|--------------|
| M1 | 在建项目推进、分期扣费、完工判定 |
| M4 | 仅完工设施参与供能重算 |
| M6 | 完工设施计入运维 |
| M9 | 通过供能与环保结果影响社会价值 |
| M13 | 资金连续为负可触发破产 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 城市配置 | `city_id`, `build_slot_count`, `has_river`, `is_nuclear_eligible` | 选址与位校验 |
| 设施配置 | `facility_id`, `tier`, `build_cost`, `build_duration_months`, `monthly_operating_cost`, `output_capacity_mw` | 建造确认与结算 |
| 运行态 | `funds`, `active_construction_count`, `max_concurrent_construction` | 扣费与并发校验 |
| 在建队列 | `queue_item_id`, `start_month`, `remaining_months`, `installment_plan`, `status` | 推进与取消 |
| 科技状态 | `facility_build_tier_max`, `tech_lit_flags` | 建造列表过滤 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 建设位已满 | 拒绝下达并提示 `slot_full` |
| 全局在建已满 | 拒绝下达并提示 `construction_queue_full` |
| 选址不合法（如非临水建水电） | 拒绝并提示 `invalid_site` |
| 结算中重复下达 | 拒绝并提示「结算中」 |
| 同城重复核电 | 拒绝并提示 `nuclear_limit_reached` |
| 当月重复扣首月款 | 禁止，M1 去重保证不重复扣同一期 |

## 10. 验收标准

- [ ] Given 城市有空位且满足校验，When 下达建设，Then 立即扣首月款并写入在建队列且占位 +1。
- [ ] Given 在建项目处于第 2 月，When 进入 M1，Then 扣当期分期款且工期正确推进一次。
- [ ] Given 项目当月完工，When 同月 M4，Then 不参与供能；When 次月 M4，Then 参与供能。
- [ ] Given 城市 `has_river = false`，When 选择常规水电，Then 下达失败并返回 `invalid_site`。
- [ ] Given `active_construction_count` 达上限，When 尝试新建，Then 被拒绝且资金不变。

## 11. 相关文档

- GDD：
  - [资源与经济](../gdd/02-economy.md)
  - [供能与能源类型](../gdd/04-energy-supply.md)
  - [地图与建设位](../gdd/05-map-and-slots.md)
  - [科技研发](../gdd/07-tech.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [地区主界面](./region-main.md)
  - `features/grid-network.md`（T20）

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T15 初稿：建设校验、扣费工期、在建队列、完工生效与验收标准 |
