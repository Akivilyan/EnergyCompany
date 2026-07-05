# 全局游戏状态与月度结算

## 1. 目标

定义单局运行时的**状态机边界**、**玩家命令集合**与**`下一月` 结算管道**，作为后续各 Feature 的统一入口与验收基线。

## 2. 范围

- **包含**：运行态状态机、命令枚举、M1-M14 步骤顺序、结算输入输出、失败中断规则。
- **不包含**：具体屏幕布局（UI 任务）、单系统公式细节（由对应 Feature/GDD 定义）。

## 3. 状态机（单局）

### 3.1 顶层状态

| 状态 ID | 含义 | 可接受命令 |
|---------|------|------------|
| `main_menu` | 主菜单 / 继续 / 新游戏入口 | `start_new_run`、`load_run` |
| `run_setup` | 新游戏参数确认（难度、方针/教学） | `set_run_option`、`confirm_run_setup`、`cancel_run_setup` |
| `run_playable` | 主循环可操作态（地图/城市/科技/公司） | 见 4. 玩家命令枚举 |
| `month_settling` | 月度结算执行中（M1-M14） | 不接受玩家命令 |
| `run_result` | 结算页（通关或破产） | `start_new_run`、`back_to_main_menu` |

### 3.2 运行态子状态（`run_playable`）

| 子状态 ID | 含义 | 进入条件 | 退出条件 |
|-----------|------|----------|----------|
| `navigating` | 纯浏览/切屏，不改数据 | 进入可操作态默认值 | 任意写操作命令触发 |
| `editing` | 发起建设/组网/研发/借贷等写操作 | 收到写操作命令并通过前置校验 | 命令完成后回 `navigating` |
| `advance_pending` | 点击 `next_month` 后的过渡态 | `next_month` 校验通过 | 立即切到 `month_settling` |
| `blocked` | 被强制流程锁定（如教程步骤） | 规则锁命中 | 解除锁后回 `navigating` |

### 3.3 状态迁移（简表）

| From | 触发 | To |
|------|------|----|
| `main_menu` | 新游戏确认 | `run_setup` |
| `run_setup` | 参数确认通过 | `run_playable.navigating` |
| `run_setup` | 取消 | `main_menu` |
| `run_playable.*` | `next_month` 校验通过 | `month_settling` |
| `month_settling` | M14 判定通关 | `run_result` |
| `month_settling` | M13 判定破产 | `run_result` |
| `month_settling` | 未结束 | `run_playable.navigating` |
| `run_result` | 返回主菜单 | `main_menu` |
| `run_result` | 再开一局 | `run_setup` |

## 4. 玩家命令枚举

> 规则依据：`run_playable` 任意月可开科技树/公司界面，时间仅由 `next_month` 推进。见 [gdd/01-core-loop.md](../gdd/01-core-loop.md)。

| 命令 ID | 分类 | 主要参数（示意） | 前置检查 | 主要副作用 |
|---------|------|------------------|----------|------------|
| `open_screen` | 导航 | `screen_id`, `target_id?` | 目标是否已解锁 | 更新当前上下文屏 |
| `back_screen` | 导航 | `from_screen` | 来源上下文有效 | 回到上一层级屏 |
| `queue_construction` | 建设 | `city_id`, `facility_id`, `tier` | 资金、位/选址、科技、并发上限 | 扣建设费、写入建设队列 |
| `cancel_construction` | 建设 | `queue_item_id` | 项目存在且可取消 | 退款并移出队列（规则见 T15） |
| `queue_grid_link` | 电网 | `from_node`, `to_node`, `link_type` | 节点解锁、拓扑合法、资金 | 扣费并写入电网施工队列 |
| `cancel_grid_link` | 电网 | `link_queue_item_id` | 项目存在且可取消 | 退款并移出队列 |
| `start_research` | 科研 | `tech_id` | 解锁、前置节点、无在研冲突 | 扣研发费并写入研发队列 |
| `cancel_research` | 科研 | `research_id` | 在研中 | 按规则返还并清队列 |
| `apply_loan` | 公司经营 | `loan_id` | 同时仅 1 笔未结清、等级可贷 | 放款并生成还款计划 |
| `claim_ad_reward` | 商业化 | `ad_type`, `target_id?` | `ads_remaining > 0`、目标存在 | 立即发奖并扣次数 |
| `purchase_iap` | 商业化 | `sku_id` | 平台可购、SKU 合法 | 写入 profile 岗位/免广告并刷新 modifier |
| `next_month` | 时间推进 | 无 | 当前非结算态且不被锁 | 进入结算管道 M1-M14 |
| `acknowledge_result` | 结果处理 | `result_type` | 当前在 `run_result` | 标记已读并允许跳转 |
| `advance_onboarding` | 新手引导 | 无 | 教学局当前步允许确认 | 步进 `onboarding_current_step_id` |
| `skip_onboarding` | 新手引导 | 无 | `is_tutorial_run` | 结束教学局；不写 `tutorial_doctrine_cleared` |

`set_run_option`、`confirm_run_setup`、`cancel_run_setup` 属于 `run_setup`，由本表外的顶层流程处理。

## 5. `next_month` 结算管道

### 5.1 执行顺序（权威顺序）

| 步骤 | 处理内容 | 主要输入 | 主要输出 |
|------|----------|----------|----------|
| M1 | 建设施工推进（设施） | 建设队列、当前月 | 更新设施完工状态 |
| M2 | 电网链路施工推进（区域 + 主干） | 链路队列、当前月 | 更新链路完工状态 |
| M3 | 科研项目推进 | 在研项目、工期修正 | 点亮科技、同步设施/主干效果 |
| M4 | 各城市/区域供能重算 | 设施、链路、需求、事件修正 | `supply_ratio`、供能相关缓存 |
| M5 | 月收入结算 | 供能结果、价格参数 | 记账：收入 |
| M6 | 月运营成本结算 | 设施状态、运维参数 | 记账：运维成本 |
| M7 | 原材料成本结算 | 发电构成、燃料参数 | 记账：原材料成本 |
| M8 | 贷款还款结算 | 贷款计划、当前月 | 扣款、更新剩余期数 |
| M9 | 社会价值重算 | 供能/环保结果、城市基数 | 写入 `social_value_current` |
| M10 | 公司升级检视 | `social_value_current`、门槛表 | 更新 `company_level`（只升不降） |
| M11 | 事件倒计时与生效 | 事件池、当前月、灾害轴 | 应用事件即时/持续效果 |
| M12 | 关键节点反馈判定 | 本月状态变更汇总 | 生成弹窗或界内提示任务 |
| M13 | 破产检视 | `funds`、连续负资金计数 | 若失败则写 `run_result=bankrupt` |
| M14 | 通关检视 | 灾害完成状态、当前局目标 | 若成功则写 `run_result=victory` |

### 5.2 中断规则

| 场景 | 规则 |
|------|------|
| M13 判定破产 | 立即结束本次结算并进入 `run_result`，不再执行后续可玩态逻辑 |
| M14 判定通关 | 进入 `run_result`，单局结束（首版无通关后继续） |
| M1-M12 出现数据异常 | 记错误日志并回滚至推进前快照（实现策略在工程层细化） |

## 6. 数据依赖（全局）

| 数据域 | 关键字段（示意） | 来源 |
|--------|------------------|------|
| Run 核心 | `run_id`, `current_month`, `funds`, `company_level`, `social_value_current`, `doctrine_id`, `difficulty` | [company-level-and-run](../data/schemas/company-level-and-run.md) |
| 地图与城市 | `region_id`, `city_id`, `build_slot_count`, `unlock_company_level` | [region-and-city](../data/schemas/region-and-city.md) |
| 设施与电网 | `facility_id`, `tier`, `grid_link_id`, `loss_pct` | [facility-and-grid](../data/schemas/facility-and-grid.md) |
| 事件与战役 | `event_id`, `campaign_disasters`, `trigger_month` | [events-and-campaign](../data/schemas/events-and-campaign.md) |
| 方针成长 | `doctrine_meta_table`, `level`, `modifier_pct` | [doctrine-meta](../data/schemas/doctrine-meta.md) |

## 7. 错误与边界

| 场景 | 处理 |
|------|------|
| 结算中重复触发 `next_month` | 忽略并提示「结算中」 |
| 未解锁界面/节点导航 | 拒绝命令并返回 `not_unlocked` |
| 队列类目标不存在 | 拒绝命令并返回 `not_found` |
| 贷款并发超限 | 拒绝 `apply_loan` 并提示「已有未还清贷款」 |
| 教程强制步骤未完成 | 仅允许白名单命令（其余返回 `blocked_by_tutorial`） |

## 8. 验收标准

- [ ] Given 处于 `run_playable` 且未锁，When 执行 `next_month`，Then 严格按 M1→M14 顺序执行且每步仅执行一次。
- [ ] Given M10 达到升级门槛，When 月结结束，Then `company_level` 升级且不会在后续月因社会价值下降而降级。
- [ ] Given 已有未还清贷款，When 再次执行 `apply_loan`，Then 命令被拒绝且贷款数保持 1。
- [ ] Given 触发 M13 破产，When 该月推进完成，Then 状态转到 `run_result` 且本局不可继续操作。
- [ ] Given 触发 M14 通关，When 该月推进完成，Then 状态转到 `run_result` 且标记 `victory`。

## 9. 相关文档

- GDD：
  - [核心循环与时间](../gdd/01-core-loop.md)
  - [资源与经济](../gdd/02-economy.md)
  - [社会价值与公司等级](../gdd/03-social-value.md)
  - [公司经营与商业化](../gdd/09-year-end-and-monetization.md)
  - [重玩性与方针](../gdd/11-replayability.md)
- Data：
  - [核心表字段说明索引](../data/schemas/README.md)
- 后续 Feature：
  - `features/construction.md`（T15）
  - `features/supply-calculation.md`（T16）
  - `features/social-value-settlement.md`（T17）
  - [商业化](./monetization.md)（T24）
  - [新手引导](./onboarding.md)（T24a）
