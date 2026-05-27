---
id: features/monetization
title: 商业化
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/09-year-end-and-monetization.md#激励广告
  - docs/design/gdd/09-year-end-and-monetization.md#商业化分阶段
  - docs/design/gdd/09-year-end-and-monetization.md#总监岗位
  - docs/design/gdd/00-vision.md#商业化边界
supersedes: []
depends_on:
  - gdd/00-vision
  - gdd/02-economy
  - gdd/07-tech
  - gdd/09-year-end-and-monetization
  - features/00-game-state
  - features/company-management
  - features/construction
  - features/grid-network
  - features/tech-tree
open_questions:
  - 首发阶段工程礼包未开放时，插屏/横幅的首次展示月与频率表（T37 `ad_placement_config`）
  - 激励视频 SDK 失败重试次数与离线降级策略（工程层）
---

# 商业化

## 1. 目标

定义 **激励广告**（三类奖励、单局 10 次硬顶）、**强迫广告**（插屏/横幅与免广告期）、**两档 IAP**（财务总监 / 工程总监礼包）的可执行规则，以及岗位 modifier 的挂载点与存档边界。

## 2. 范围

- **包含**：`claim_ad_reward` / `purchase_iap` 命令语义、单局 `ads_remaining`、账号级 `role_state` 与 `ad_free_until`、三类激励效果、岗位 baseline/完整版数值挂载、与结算/队列的交互。
- **不包含**：商店 UI 线框（T29）、广告 SDK 对接与归因（Engineering）、贷款申请流程细节（[company-management.md](./company-management.md)）、`ad_cash` / `loan_tiers` 具体整数表（Data T37）。

## 3. 触发与入口

| 入口 | 条件 | 行为 |
|------|------|------|
| `screen_company` → 激励分区 | `run_playable`、`ads_remaining > 0` | 选择奖励类型 → 播激励视频 → `claim_ad_reward` |
| `screen_company` → 岗位分区 | 任意 | 展示 baseline/完整版；未购显示购买入口 |
| 商店 / 岗位升级按钮 | 平台支付可用 | `purchase_iap`（`iap_cfo` / `iap_pe_bundle`） |
| 插屏 / 横幅 | `now >= ad_free_until` 且配置允许 | 系统展示强迫广告（**非** `claim_ad_reward`） |

激励入口也可从建设/科技上下文 **深链** 到公司屏对应子区（UI T29 细化）；规则校验以本 Feature 为准。

### 3.1 分阶段（与 GDD 一致）

| 阶段 | 可用能力 |
|------|----------|
| **首发** | 激励广告 + 插屏/横幅（工程礼包 **未开放** 时全员可见强迫广告） |
| **后续** | 上表 + `iap_cfo`（6 元）+ `iap_pe_bundle`（30 元） |

除广告与上述两档 IAP 外：**无** 抽卡、随机池、第三档礼包链。

## 4. 前置条件

### 4.1 `claim_ad_reward`

| 条件 | 说明 |
|------|------|
| 运行态 | `run_playable`，非 `month_settling` / `run_result` |
| 次数 | `ads_remaining > 0` |
| 类型合法 | `ad_type ∈ { ad_cash, ad_instant_build, ad_instant_research }` |
| `ad_cash` | 无额外前置 |
| `ad_instant_build` | 全局在建池至少 1 项 `under_construction`；`target_id` 指向有效 `queue_item_id` |
| `ad_instant_research` | 存在 `active_research`；无需 `target_id`（始终作用于当前唯一在研） |

### 4.2 `purchase_iap`

| 条件 | 说明 |
|------|------|
| 支付环境 | 平台商店 / 支付 SDK 返回可购买 |
| SKU | `sku_id ∈ { iap_cfo, iap_pe_bundle }` |
| 重复购买 | `iap_cfo` 已拥有 → 拒绝或提示「已拥有」（不重复扣款） |
| `iap_pe_bundle` | 工程总监已拥有时 **仍允许** 购买，仅用于续 `ad_free_until` |

IAP 为 **账号级** 写入，不绑定单局 `run_id`。

## 5. 玩家操作

### 5.1 领取激励奖励（`claim_ad_reward`）

1. 玩家在公司屏（或深链入口）选择奖励类型；`ad_instant_build` 需先选一项在建/在链项目。
2. 客户端拉起 **激励视频**（rewarded）；玩家 **完整观看** 且平台回调成功。
3. 服务端/本地校验通过后执行发奖：`ads_remaining -= 1`。
4. 若中途关闭、加载失败或回调失败：**不扣次数**、不写奖励。

### 5.2 购买 IAP（`purchase_iap`）

1. 玩家点击 CFO（6 元）或工程礼包（30 元）并完成平台支付。
2. 支付成功回调后按 SKU 写入账号态（见 6.3）。
3. 当前进行中的单局 **立即** 重算 `max_concurrent_construction`、贷款档位上限等（若相关 modifier 新生效）。

## 6. 系统行为与副作用

### 6.1 `ads_remaining` 生命周期

| 事件 | `ads_remaining` |
|------|-----------------|
| `confirm_run_setup` 开 **新局** | 置 `10` |
| `load_run` 继续存档 | **保持** 存档值，不重置 |
| `claim_ad_reward` 成功 | `-1`，下限 0 |
| `ads_remaining = 0` | 隐藏或灰显全部激励入口 |
| Game Over 后 `start_new_run` | 新局重置为 `10` |
| 通关后开新局 | 同失败重开，重置为 `10` |
| 购买 / 处于 `ad_free_until` 免强迫广告期 | **不增加** 激励额度；仍为 **10 次/局** 硬顶 |
| IAP / 月卡 | **不可** 购买额外激励次数 |

### 6.2 三类激励效果

| `ad_type` | 发奖逻辑 | 与事件 / 冻结 |
|-----------|----------|----------------|
| `ad_cash` | `funds += ad_rewards[company_level]`（万，见 GDD 表；T37 配表） | 可用于当月回正；破产仍按 M13 月末快照 |
| `ad_instant_build` | 指定 `queue_item_id`：`remaining_months = 0`，状态转完工；**供能/运维** 按 [construction](./construction.md) / [grid-network](./grid-network.md)「完工次月生效」 | **不** 绕过 `freeze_build` 对 **新建** 的禁止；仅加速已在建项 |
| `ad_instant_research` | 当前 `active_research` 立即 `lit`，执行 [tech-tree](./tech-tree.md) 6.3 效果挂载（**当月**生效） | **不** 绕过 `freeze_research` 对 **新开研** 的禁止 |

每次观看 **只兑现一类** 一种奖励（参数 `ad_type` 单选）。

### 6.3 IAP 与账号字段

| SKU | 价格 | 写入字段 | 效果 |
|-----|------|----------|------|
| `iap_cfo` | 6 元 | `profile.role_state.cfo = full` | 财务总监完整版（见 6.4） |
| `iap_pe_bundle` | 30 元 | `profile.role_state.pe = full`；`profile.ad_free_until = max(ad_free_until, now) + 30d` | 工程总监完整版 + 30 天免强迫广告 |

| 规则 | 说明 |
|------|------|
| 免广告范围 | `now < ad_free_until` 时 **不展示** 插屏与横幅 |
| 激励仍可用 | 免广告期内若 `ads_remaining > 0`，玩家 **仍可主动** 看激励换奖励 |
| 重复买 30 元 | 工程总监已 `full` 时 **只延长** `ad_free_until`，不叠岗位 |
| 非订阅 | 无自动续费；到期恢复强迫广告，PE 岗位 **永久** 保留 |

### 6.4 总监岗位 modifier（运行态挂载）

岗位状态：`baseline`（默认）| `full`（IAP）。槽位 **始终显示**；未购标注可升级。

| 岗位 | `role_id` | baseline | full（IAP 后） | 挂载点 |
|------|-----------|----------|----------------|--------|
| 财务总监 | `cfo` | 贷款利息 **×0.95**；原材料 **×0.97** | 利息 **×0.90**；原材料 **×0.92**；可贷档位 **+1** | M7 原材料；M8 本息；`apply_loan` 档位校验 |
| 工程总监 | `pe` | 无数值加成（UI「标准编制」） | 新下达建设 **工期 −1 月**（下限 1）；`max_concurrent_construction` **3→4** | `queue_construction` / 区域·主干入队时写工期；并发校验 |

| 叠加规则 | 说明 |
|----------|------|
| 贷款 +1 档 | CFO full 与 `eng_cashflow` 各 +1 档，**合计上限 +2 档**（见 GDD 09） |
| 施工 −1 月 | **仅** PE full 与 `ad_instant_build`；科技树 **无** 工期减免 |
| 研发 | **无** 常驻研发总监 modifier；研发靠单队列 + `ad_instant_research` + `eng_*` |

单局开始时从 `profile.role_state` 复制到运行态 modifier 缓存；局内 `purchase_iap` 成功后 **立即刷新** 缓存。

### 6.5 强迫广告（插屏 / 横幅）

| 行为 | 规则 |
|------|------|
| 与激励区分 | 不经过 `claim_ad_reward`；不消耗 `ads_remaining` |
| 展示条件 | `now >= ad_free_until` 且当前屏/月满足 `ad_placement_config` |
| 免广告期 | `now < ad_free_until` → **跳过** 插屏与横幅 |
| 结算中 | `month_settling` **不插屏**（避免打断管道） |

具体触发月、冷却、场景 ID 由 Data T37 定义；本 Feature 只锁 **与激励独立** 及 **免广告窗口** 语义。

## 7. 与月度结算的关系

| 步骤 | 商业化参与 |
|------|------------|
| M1 | 正常推进未被执行 `ad_instant_build` 的在建项；已秒完工项不再扣建设期款 |
| M3 | 正常推进在研；`ad_instant_research` 已在当月提前 lit 的节点不再重复推进 |
| M7 | CFO 原材料折扣 |
| M8 | CFO 贷款利息折扣 |
| M13 | `ad_cash` 可抬高当月 `funds`，破产仍以 **月末快照** 为准 |
| 新局初始化 | `ads_remaining = 10`；从 profile 加载岗位与 `ad_free_until` |

## 8. 数据依赖

| 数据域 | 字段（示意） | 作用域 | 用途 |
|--------|--------------|--------|------|
| 单局运行态 | `ads_remaining` | run | 0–10，激励次数 |
| 账号 profile | `role_state.cfo`, `role_state.pe` | profile | baseline / full |
| 账号 profile | `ad_free_until` | profile | 免强迫广告截止 |
| 运行态缓存 | `max_concurrent_construction`, `loan_tier_bonus`, `loan_interest_mult`, `raw_material_mult` | run | 自 profile 派生，供队列/结算读取 |
| 配表 | `ad_rewards`（按 `company_level`） | data | `ad_cash` 金额 |
| 配表 | `ad_placement_config` | data | 插屏/横幅时机（T37） |
| 商店 | `iap_cfo`, `iap_pe_bundle` | platform | SKU 映射 |

存档：**`ads_remaining` 随单局存档**；**`role_state` / `ad_free_until` 随账号存档**。删档/清账号不重置已购 IAP（平台收据为准，工程层对账）。

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| `ads_remaining = 0` | 拒绝 `claim_ad_reward`；`error_code = ads_exhausted` |
| 激励未看完 / 回调失败 | 不扣次数；`error_code = ad_not_completed` |
| 无在建却选 `ad_instant_build` | 拒绝；`no_active_construction` |
| 无效 `target_id` | 拒绝；`not_found` |
| 无在研却选 `ad_instant_research` | 拒绝；`no_active_research` |
| 重复购买 `iap_cfo` | 拒绝或提示已拥有；不二次发货 |
| 结算中发起激励 / IAP | 拒绝；`month_settling` |
| `run_result` 中发起激励 | 拒绝；`run_ended` |
| 教程白名单未包含商业化命令 | 返回 `blocked_by_tutorial`（步骤定义见 T24a） |

## 10. 验收标准

- [ ] Given 新局确认，`ads_remaining` 为 10；When 继续旧存档，Then 保持存档中的剩余次数。
- [ ] Given `ads_remaining = 1` 且观看成功，When `claim_ad_reward(ad_cash)`，Then `funds` 按等级表增加且 `ads_remaining = 0`，且三类入口不可用。
- [ ] Given 全局 3 项在建且选合法 `target_id`，When `ad_instant_build` 成功，Then 该项立即完工且 `ads_remaining` 减 1，且 **不** 释放全局槽位直到完工状态写入（完工后 `active_construction_count` 减 1）。
- [ ] Given 有在研项目，When `ad_instant_research` 成功，Then 当前节点变 `lit` 且效果当月挂载，且 `ads_remaining` 减 1。
- [ ] Given `freeze_build` 生效，When 尝试 **新建** 建设，Then 仍被拒绝；When 对 **已在建** 项使用 `ad_instant_build`，Then 允许（若满足次数与目标）。
- [ ] Given `profile.role_state.pe = baseline`，When 购买 `iap_pe_bundle`，Then `pe = full`、`max_concurrent_construction = 4`，且 `ad_free_until` 延长 30 天。
- [ ] Given 已在免广告期内且 `ads_remaining > 0`，When 打开游戏，Then 无插屏/横幅，但激励入口仍可用。
- [ ] Given `iap_cfo` 已 full，When 再次购买 `iap_cfo`，Then 不重复扣款且不改变状态。
- [ ] Given 激励观看取消，When 回调失败，Then `ads_remaining` 不变且无奖励。

## 11. 相关文档

- GDD：
  - [公司经营与商业化](../gdd/09-year-end-and-monetization.md)
  - [愿景与边界](../gdd/00-vision.md)
  - [资源与经济](../gdd/02-economy.md)（全局 3/4 在建）
  - [科技研发](../gdd/07-tech.md)（单队列、无施工工期科技减免）
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)（`claim_ad_reward`、`purchase_iap`）
  - [公司管理](./company-management.md)（公司屏入口与借贷）
  - [设施建设](./construction.md)
  - [区域电网与主干](./grid-network.md)
  - [科技树](./tech-tree.md)
- UI：`ui/company.md`（T29）

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T24 初稿：激励三类与 10 次/局、IAP 双 SKU、岗位 modifier、免广告与验收标准 |
