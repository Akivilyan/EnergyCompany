# 科技树

## 1. 目标

定义 `screen_tech_tree` 的研发流程：节点解锁/点亮、单队列研发、取消返还，以及点亮效果挂载到设施/电网/经营系统的规则。

## 2. 范围

- **包含**：研发状态机、开研/取消命令、M3 推进、效果挂载点、方针 lit 预算约束。
- **不包含**：科技树 UI 线框（T31）、具体 `research_cost`/`research_months` 数值（Data 层）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| 任意界面点击科技树按钮 | 公司等级 `>= II` | `screen_tech_tree` |
| 激励广告 `ad_instant_research` | 有在研项目且 `ads_remaining > 0` | 立即点亮当前在研节点 |

公司 **I 级** 不开放科技树界面；仅享受开局已点亮的四线 ·I 效果。

## 4. 前置条件

### 4.1 开研（`start_research`）

| 条件 | 说明 |
|------|------|
| 公司等级 | `company_level >= II` |
| 节点状态 | 当前为 `unlocked`（非 `locked`/`lit`/`researching`） |
| 单队列 | 当前无其它 `researching` 项目 |
| 前置 lit | `requires_lit` 全部满足 |
| 方针预算 | 非 `tech` 方针时，`doctrine_lit_remaining > 0`（开局已 lit 节点不计入） |
| 异线硬顶 | 非本线发电 ·II+ 不可研（`tech` 方针除外；`hydro` 方针下 `nuclear_*` 视为本线） |
| 资金 | 允许扣款后 `funds < 0`（风险提示） |

### 4.2 取消（`cancel_research`）

| 条件 | 说明 |
|------|------|
| 目标存在 | 指定 `tech_id` 处于 `researching` |
| 运行态 | `run_playable` 且非 `month_settling` |

## 5. 玩家操作

1. 进入 `screen_tech_tree`，按分页浏览节点（风/光/火/水/核电/电网/经营）。
2. 选择 `unlocked` 节点，查看费用与工期。
3. 确认开研 → 立即扣 `research_cost`，节点转 `researching`。
4. 可选：取消在研 → 全额退款，节点回 `unlocked`。
5. 点击 `下一月` 后，M3 推进在研项目；完成当月点亮。

## 6. 系统行为与副作用

### 6.1 节点状态机

```text
locked → unlocked → researching → lit
```

| 转移 | 触发 |
|------|------|
| `locked → unlocked` | 公司升档、前置 lit 满足、方针规则通过 |
| `unlocked → researching` | `start_research` 成功 |
| `researching → unlocked` | `cancel_research`（退款） |
| `researching → lit` | M3 完成拍 |

### 6.2 开研副作用

| 行为 | 副作用 |
|------|------|
| 扣费 | `funds -= research_cost`（一次性） |
| 写队列 | `active_research = { tech_id, remaining_months }` |
| 方针预算 | 非 `tech` 方针：`doctrine_lit_remaining -= 1`（仅 lit 时扣，开研时不扣；**lit 完成时扣 1**） |

> 预算扣减时机：**节点 lit 时** 扣 1，取消 researching **不** 扣预算。

### 6.3 M3 点亮与效果挂载

研发完成当月（M3 完成拍）执行效果挂载：

| `effect_type` | 挂载目标 | 生效时机 |
|---------------|----------|----------|
| `facility_tier` | `facility_build_tier_max.{type}` | 立即；已完工设施自动同步 tier |
| `storage_buff` | 全局 `storage_mult` | 立即；次月 M4 供能重算生效 |
| `storage_gate` | 允许研/点更高 tier | 立即解锁下游节点 |
| `eco_sync` | 已完工火/核 `is_eco` | 立即 |
| `grid` | 区域/主干/特高压权限 | 立即；特高压触发主干自动升档 |
| `modifier` | 经营 modifier（`eng_*`） | 立即写入运行态 |

### 6.4 取消研发

| 行为 | 规则 |
|------|------|
| 退款 | **全额** 返还 `research_cost` |
| 状态 | `researching → unlocked` |
| 进度 | 清空 `active_research` |
| 预算 | 不消耗 lit 预算（因尚未 lit） |

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M3 | 在研项目推进；完成则 lit 并挂载效果 |
| M4 | `storage_buff`、设施 tier 同步后影响供能 |
| M10 | 公司升档批量解锁对应等级节点 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 科技配置 | `technology_config` 全表 | 节点定义与效果 |
| 运行态 | `tech_states.{tech_id}` | locked/unlocked/researching/lit |
| 研发队列 | `active_research` | 单队列在研项目 |
| 方针 | `doctrine_id`, `doctrine_lit_remaining` | 预算与异线硬顶 |
| 挂载缓存 | `facility_build_tier_max`, `storage_mult`, modifier 字段 | 下游系统读取 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| I 级尝试打开科技树 | 拒绝并提示「公司 II 级起开放」 |
| 已有在研再开研 | 拒绝并提示 `research_queue_full` |
| 前置 lit 未满足 | 拒绝并提示具体前置节点 |
| lit 预算用尽（非 tech 方针） | 拒绝并提示 `lit_budget_exhausted` |
| 异线 tier 硬顶 | 拒绝并提示 `doctrine_line_locked` |
| 结算中开研/取消 | 拒绝并提示「结算中」 |

## 10. 验收标准

- [ ] Given 公司 II 级且无在研，When 对 `unlocked` 节点开研，Then 立即扣费并写入单队列。
- [ ] Given 在研中，When 取消研发，Then 全额退款且节点回到 `unlocked`。
- [ ] Given 在研项目剩余 1 月，When 执行 M3，Then 节点转 `lit` 且效果按 `effect_type` 挂载。
- [ ] Given `storage_system_1` 点亮，When 次月 M4，Then 风光水 `storage_mult=2` 生效。
- [ ] Given 非 tech 方针且 lit 预算为 0，When 尝试开研新节点，Then 被拒绝。
- [ ] Given 公司 I 级，When 尝试进入科技树，Then 入口不可用。

## 11. 相关文档

- GDD：
  - [科技研发](../gdd/07-tech.md)
  - [重玩性与方针](../gdd/11-replayability.md)
- Data：
  - [科技树配置说明](../data/technology-tree.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [设施建设](./construction.md)
  - [区域电网与主干](./grid-network.md)
  - [供能计算](./supply-calculation.md)
  - [科技树 UI](../ui/tech-tree.md)（T31）
