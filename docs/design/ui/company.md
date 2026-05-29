---
id: ui/company
title: 公司管理界面
status: draft
version: 0.1.1
sources:
  - docs/design/features/company-management.md
  - docs/design/gdd/09-year-end-and-monetization.md#公司经营界面大理石式快照
supersedes: []
depends_on:
  - features/company-management
  - features/monetization
  - features/social-value-settlement
  - ui/00-screen-map
open_questions: []
---

# 公司管理界面

## 1. 屏幕 ID

`screen_company`；子模态 `modal_loan_apply`、`modal_ad_reward_pick`。

## 2. 目的

大理石式 **经营快照 + 近月流水**；借贷、岗位、激励广告、社会价值明细入口。

## 3. 布局（线框）

```text
┌──────────────────────────────────────────────┐
│ [←返回]  公司经营          资金 | SV | 年月   │
├──────────────────────────────────────────────┤
│ 摘要: 等级 I→II进度 | 上月净现金流              │
├──────────────┬───────────────────────────────┤
│ Tab: 概览    │  Tab: 社会价值明细 → 子页滚动    │
├──────────────┴───────────────────────────────┤
│ [上月收支条形图/表]  收入|建设|研发|运维|原料|贷 │
│ [近6月简表]                                   │
│ [分城概况列表]                                │
├──────────────────────────────────────────────┤
│ 借贷: 当前贷款 / [申请贷款]                   │
│ 岗位: CFO [baseline/已购]  PE [标准/已购]      │
│ 激励: 剩余 N/10  [资金][秒完工][秒研发]        │
└──────────────────────────────────────────────┘
```

## 4. 组件树

- `CompanyScreen`
  - `TopBar` + `BtnBack`
  - `SummaryCard`（level, net_cashflow_last_month）
  - `TabBar`：`Overview` | `SocialValueDetail`
  - `OverviewPanel`
    - `LastMonthBreakdown`
    - `RecentSixMonthsTable`
    - `PerCityTable`
    - `LoanSection` → `BtnApplyLoan` → `modal_loan_apply`
    - `RolesSection`（CFO/PE 卡 + 购买入口）
    - `RewardedAdsSection`（`AdsRemainingLabel` + 三按钮）
  - `SocialValueDetailPanel`（绑定 T17 字段）
  - `ModalLoanApply`（档位列表、并发提示）
  - `ModalAdRewardPick`（类型选择 → 可选目标列表）

## 5. 数据绑定

| 组件 | 字段 |
|------|------|
| 摘要 | `funds`, `company_level`, `social_value_current`, `monthly_net_cashflow` |
| 借贷 | `active_loan`, `loan_tiers_unlocked` |
| 岗位 | `role_state.cfo`, `role_state.pe` |
| 激励 | `ads_remaining` |
| SV 明细 | `social_value_breakdown_by_city` |

## 6. 交互表

| 控件 | 操作 | 结果 |
|------|------|------|
| `BtnApplyLoan` | 点击 | 打开 `modal_loan_apply`；已有贷款则灰显+说明 |
| 贷款档位行 | 确认 | `apply_loan` |
| 激励按钮 | 点击 | `ads_remaining>0` → `modal_ad_reward_pick`；否则灰显 |
| `modal_ad_reward_pick` | 选类型+目标 | 播激励视频 → `claim_ad_reward` |
| 岗位购买 | 点击 | `purchase_iap`（商店流） |
| `Tab SocialValue` | 切换 | 滚动明细表 |

## 7. 异常态

| 场景 | UI |
|------|-----|
| 贷款已存在 | 申请按钮灰显「请先还清当前贷款」 |
| `ads_remaining=0` | 三激励入口灰显 |
| 秒完工无在建 | 类型不可选 + 说明 |
| 教学 `onb_06` 前 | 公司入口由遮罩控制（T35a） |

## 7.1 壳层契约（T45-13）

`screenCompany` 最小壳层已提供：

- `getSnapshot()`：`funds/companyLevel/socialValue/runResult/adsRemaining`、当前贷款、可申请贷款档位（含 `unlockLevel/unlocked`）。
- `getRecentCashflows(limit)`：按近月结算报告输出 `income/opex/fuel/loanPaid/netCashflow`，用于“近月流水”列表。
- `applyLoan(loanId)`：调用 `apply_loan` 并返回 `before/after/result/uiErrorCode/uiCopy`。

贷款动作错误码映射（`uiErrorCode -> messageKey/actionKey`）：

| `uiErrorCode` | `messageKey` | `actionKey` |
|---|---|---|
| `loan_not_found` | `company.error.loan_not_found` | `company.action.refresh_loan_tiers` |
| `loan_tier_locked` | `company.error.loan_tier_locked` | `company.action.level_up_first` |
| `loan_already_active` | `company.error.loan_already_active` | `company.action.wait_or_repay` |
| `action_invalid` | `company.error.action_invalid` | `company.action.return_to_playable` |
| `action_failed` | `company.error.action_failed` | `company.action.retry` |

## 8. 导航

`back_screen` → 推月前上下文。无 `下一月`。

## 9. 微信小游戏

- 长表 **纵向滚动**；固定顶栏与 Tab。
- 激励视频回调前按钮 loading，防连点。

## 10. 相关文档

- Feature：[company-management](../features/company-management.md)、[monetization](../features/monetization.md)、[social-value-settlement](../features/social-value-settlement.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T29 初稿 |
| 0.1.1 | 2026-05-29 | 对齐 T45-13：补 `screenCompany` 快照/近月流水/贷款动作壳层契约与错误码映射 |
