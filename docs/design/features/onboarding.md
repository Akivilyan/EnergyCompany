---
id: features/onboarding
title: 新手引导
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/10-onboarding.md#教学方针教学关卡
  - docs/design/gdd/10-onboarding.md#强制引导链仅-doctrine_id--tutorial
  - docs/design/gdd/10-onboarding.md#存档字段
  - docs/design/gdd/10-onboarding.md#弱提示正式局
supersedes: []
depends_on:
  - gdd/10-onboarding
  - gdd/11-replayability
  - features/00-game-state
  - features/construction
  - features/company-management
  - features/tech-tree
  - features/monetization
open_questions:
  - `tutorial_run_config` 独立表 vs 附在 `run_config`（与 [company-level-and-run](../data/schemas/company-level-and-run.md) 对齐，T37 定稿）
  - 教学局是否完全禁用 `campaign_disasters` 或仅裁剪至第一场前（T37）
---

# 新手引导

## 1. 目标

定义 **教学方针**（`doctrine_id = tutorial`）的 7 步强制遮罩链、命令白名单、跳过/完成/存档标记，以及正式四方针局的 **弱提示** 与 **教程图鉴** 触发规则。

## 2. 范围

- **包含**：`step_id` 枚举、每步完成条件、命令白名单、`skip_onboarding` / `advance_onboarding`、档案与单局字段、与 `blocked` 子状态协作、弱提示 `tip_id`。
- **不包含**：遮罩/高亮/手指 UI（T35a）、步骤文案与 `tutorial_run_config` 整数（T37）、图鉴分页正文。

## 3. 触发与入口

| 入口 | 条件 | 行为 |
|------|------|------|
| `screen_new_game_doctrine` 选 **教学** + 确认 | 任意 | 创建 `is_tutorial_run=true` 的教学局 → 进入 `CITY-START` → 自动 `onb_01` |
| 继续游戏 | `is_tutorial_run` 且未完成、未跳过 | 从 `onboarding_current_step_id` 续播 |
| 方针屏再选教学 | 任意 | 新开教学局（进度重置；`tutorial_doctrine_cleared` 不变） |
| 帮助 / 城市 **?** | 任意 | 打开教程图鉴（只读，不推进强制链） |
| 正式局弱提示 | 见 §6 | 非阻塞条/气泡 |

四方针正式局：**不** 进入强制遮罩链。

## 4. 前置条件

### 4.1 教学局创建

| 条件 | 说明 |
|------|------|
| `doctrine_id` | 固定 `tutorial` |
| `tutorial_run_config` | 应用教学专用参数（简单难度、固定起始资金、缩短 II 级 SV 门槛等，T37） |
| 方针 meta | **不计** 局外方针熟练度与等级 |
| 战役轴 | **不触发** 通关战役 / 或裁剪至第一场前（T37） |
| 地图 | 同 `CITY-START` 单城起手 |

### 4.2 强制链运行

| 条件 | 说明 |
|------|------|
| 运行态 | `run_playable` 且 `is_tutorial_run=true` |
| 当前步 | `onboarding_current_step_id` 有效 |
| 未跳过 | `onboarding_skipped=false` |

## 5. 玩家操作

### 5.1 逐步推进（教学局）

每步展示遮罩（UI T35a）：高亮 `highlight_target`、步骤条、**跳过全部** 按钮。

| 步 | `step_id` | 界面 | 教学目标 | 完成条件 | 命令白名单（仅下列可通过；其余 `blocked_by_tutorial`） |
|----|-----------|------|----------|----------|--------------------------------------------------------|
| 1 | `onb_01_welcome` | `screen_city_detail` | 单城、供能、社会价值 | 玩家点「知道了」 | `advance_onboarding` |
| 2 | `onb_02_build` | 城市 + 建造 | 空位 → ·I 设施；首月扣款 | `queue_construction` 成功 1 次 | `open_screen`（city）、`queue_construction` |
| 3 | `onb_03_next_month` | 城市 | **下一月** | `next_month` 执行 1 次 | `next_month` |
| 4 | `onb_04_read_dashboard` | 城市 | 顶栏、供能条、在建 | 确认 | `advance_onboarding` |
| 5 | `onb_05_push_to_finish` | 城市 | 推月至完工或满足率 ≥ 60% | 指定设施 `built` **或** 城 `supply_ratio >= 0.6` | `next_month` |
| 6 | `onb_06_company` | 公司屏（本步解锁入口） | 经营快照 | 进入 `screen_company` 并 `advance_onboarding` | `open_screen`（company）、`back_screen`、`advance_onboarding` |
| 7 | `onb_07_tech_ii` | 科技树 | II 级后单队列演示 | `company_level >= II` 且打开 `screen_tech_tree` 并确认 | `open_screen`（tech_tree）、`advance_onboarding`；达标前仅 `next_month` 与 city |
| — | `onb_done` | — | 教学结束 | 自动 | — |

**导航锁**：未在白名单内的 `open_screen`（地图/区域/事件等）、`apply_loan`、`claim_ad_reward`、`purchase_iap`、`start_research` 等一律拒绝。

### 5.2 跳过（`skip_onboarding`）

1. 玩家点「跳过引导」→ 二次确认。
2. 确认后：`onboarding_skipped=true`；本局教学结束 → `run_result`（类型 `tutorial_skipped`）或直回 `screen_new_game_doctrine`。
3. **不** 写 `tutorial_doctrine_cleared`；方针屏 **无打勾**。

### 5.3 完成（`onb_done`）

1. `onb_07` 完成后进入 `onb_done`。
2. 写 `profile.tutorial_doctrine_cleared = true`；`onboarding_steps_done` 含全部 7 步。
3. 短提示「教程完成，请选择方针开始正式游戏」→ **`screen_new_game_doctrine`**（教学卡显示 ✓）。
4. 本局归档结束，**不** 写入方针熟练度。

### 5.4 教程图鉴

只读查阅 `codex_*` 分页；**不** 改变 `onboarding_current_step_id`。可选「重走教学」跳转方针屏并预选教学（实现层）。

## 6. 系统行为与副作用

### 6.1 命令（扩展全局表）

| 命令 ID | 参数 | 前置 | 副作用 |
|---------|------|------|--------|
| `advance_onboarding` | 无 | 当前步允许确认类完成 | 写入 `onboarding_steps_done`；步进下一 `step_id` |
| `skip_onboarding` | 无 | `is_tutorial_run` | 见 5.2 |

`next_month` / `queue_construction` 等在满足完成条件时 **可自动** 调用步进逻辑（实现二选一：显式 `advance_onboarding` 或条件满足自动步进；**验收** 以步进结果为准）。

### 6.2 与 `run_playable.blocked`

教学局强制链激活时，等效 `run_playable.sub_state = blocked`，`month_advance_lock_reason = tutorial_step`（与 [00-game-state](./00-game-state.md) open question 对齐）。

### 6.3 与大事件优先级

| 事件 | 规则 |
|------|------|
| 公司升级全屏 | 优先展示；引导 **暂停**，关闭后继续当前步 |
| 灾害 / 显著政策全屏 | 同上 |
| 教学局 | **不触发** 战役通关轴弹窗（或裁剪，T37） |

### 6.4 弱提示（正式局，`is_tutorial_run=false`）

| `tip_id` | 触发（首次） | 要点 | 写入 |
|----------|--------------|------|------|
| `tip_region` | `company_level >= II` 且 MAP-01 全境可进 | 省内多城、铺线 | `onboarding_tips_seen.tip_region` |
| `tip_events` | 首个 `scheduled` 事件出现 | 事件、灾害 | `tip_events` |
| `tip_world_map` | 首次打开大地图 | 解锁与灰显 | `tip_world_map` |
| `tip_loan` | II+ 且 `funds` 低于阈值 | 借贷 | `tip_loan` |
| `tip_ads` | `ads_remaining > 0` 且首次进公司屏 | 10 次/局激励 | `tip_ads` |
| `tip_grid_trunk` | `company_level >= IV` | 主干 | `tip_grid_trunk` |

弱提示 **不阻塞** 操作；同 `tip_id` 只展示一次（可「不再提示」）。

### 6.5 方针屏 UI 状态

| 字段 | UI |
|------|-----|
| `tutorial_doctrine_cleared` | 教学卡角标 **✓ / 已完成** |
| 未 cleared | 教学卡 **推荐高亮**（首访） |
| 跳过 / 未完成 | 无打勾 |

## 7. 与月度结算的关系

| 步骤 | 教学局 |
|------|--------|
| M1–M14 | 与正式局相同管道；`onb_03`/`onb_05` 依赖 `next_month` |
| M10 | `onb_07` 依赖升至 II；教学配置可 **降低** II 门槛（T37） |
| M11–M12 | 教学局裁剪灾害；弱提示 `tip_events` 在正式局才典型触发 |
| 破产 M13 | 教学局仍可按规则破产；建议配置为高容错（T37） |

## 8. 数据依赖

| 数据域 | 字段 | 作用域 | 说明 |
|--------|------|--------|------|
| profile | `tutorial_doctrine_cleared` | 跨局 | 完整走完 7 步 + `onb_done` |
| run | `is_tutorial_run` | 单局 | `doctrine_id == tutorial` |
| run | `onboarding_current_step_id` | 单局 | 断点续播 |
| run | `onboarding_skipped` | 单局 | 本局是否跳过 |
| run | `onboarding_steps_done[]` | 单局 | 已完成 `step_id` 列表 |
| run | `onboarding_tips_seen` | 单局 | 正式局弱提示 |
| 配置 | `tutorial_run_config` | data | 教学局参数（T37） |
| 配置 | `onboarding_step_config` | data | 文案、`highlight_target`、阈值（T37） |

**继续存档**：仅 `is_tutorial_run && !onboarding_skipped && step != onb_done` 恢复强制链；正式局 **不** 恢复遮罩。

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 非白名单命令 | `blocked_by_tutorial` |
| 教学局尝试 `open_screen` 世界地图 | 拒绝直至步骤放行（`onb_07` 前无地图入口） |
| `onb_05` 长期未达标 | 允许继续 `next_month`；不自动跳过 |
| 重复 `advance_onboarding` | 幂等：已在下一步则忽略 |
| 正式局调用 `skip_onboarding` | 拒绝；`not_tutorial_run` |
| 结算中 `advance_onboarding` | 拒绝；`month_settling` |

## 10. 验收标准

- [ ] Given 选教学开新局，When 进城，Then 自动进入 `onb_01` 且仅高亮目标可交互。
- [ ] Given `onb_02`，When 未建设却点下一月，Then `next_month` 被 `blocked_by_tutorial`。
- [ ] Given 完整走完 7 步，When `onb_done`，Then `tutorial_doctrine_cleared=true` 且回到方针屏并显示 ✓。
- [ ] Given 中途跳过，When 确认跳过，Then 无打勾且可再次选教学开新局。
- [ ] Given 曾 cleared，When 重玩教学，Then 方针屏仍显示 ✓。
- [ ] Given 正式 `renewable` 局，When 任意月，Then 无强制遮罩；满足条件时出现 `tip_region` 一次。
- [ ] Given 教学局断点存档，When 继续，Then 从 `onboarding_current_step_id` 续播。
- [ ] Given `onb_06`，When 未放行点世界地图，Then 导航被拒绝。

## 11. 相关文档

- GDD：
  - [新手引导与教程](../gdd/10-onboarding.md)
  - [重玩性与方针](../gdd/11-replayability.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [设施建设](./construction.md)
  - [公司管理](./company-management.md)
  - [科技树](./tech-tree.md)
  - [商业化](./monetization.md)
- UI：[新手引导 UI](../ui/onboarding.md)（T35a）
- Data：`tutorial_run_config`（T37）

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T24a 初稿：7 步白名单、跳过/打勾、弱提示与存档字段 |
