# 公司管理

## 1. 目标

定义 `screen_company` 的功能规格：经营快照、近月流水、借贷、岗位、激励广告入口与状态写回，作为公司经营中枢。

## 2. 范围

- **包含**：公司界面入口、展示数据、借贷申请规则、岗位状态、激励广告入口与限制。
- **不包含**：IAP 支付流程细节、广告 SDK 对接、UI 组件排版（T29）。

## 3. 触发与入口

| 入口 | 条件 | 导航至 |
|------|------|--------|
| 任意可操作界面点击公司按钮 | 当前为 `run_playable` | `screen_company` |
| 月结后查看经营结果 | 月结结束 | `screen_company` |

公司界面任意月份可进入，不绑定特定月份。

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| 运行态 | `run_playable`，非 `month_settling` |
| 公司快照可读 | `funds`、`company_level`、`social_value_current` 等核心字段有效 |
| 借贷状态可读 | 当前是否存在未还清贷款 |

## 5. 玩家操作

### 5.1 浏览经营信息

可查看：
- 资金、等级、社会价值、上月净现金流
- 上月收支分项（收入/建设/研发/运维/原材料/贷款本息）
- 最近 6 个月流水
- 分城概况与社会价值贡献

### 5.2 申请贷款（`apply_loan`）

1. 玩家在贷款分区选择贷款档位。
2. 系统校验档位是否已解锁、是否已有未还清贷款。
3. 通过后放款并生成还款计划（M8 自动扣款）。

### 5.3 激励广告入口（`claim_ad_reward`）

1. 玩家选择奖励类型（现金/秒完工/秒研发）。
2. 系统校验 `ads_remaining > 0` 与目标前置（在建/在研）。
3. 奖励发放并 `ads_remaining -= 1`。

### 5.4 岗位查看

玩家可查看财务总监、工程总监当前状态（baseline 或完整版）及其当前生效效果。

## 6. 系统行为与副作用

| 行为 | 副作用 |
|------|--------|
| 打开公司界面 | 刷新经营快照与近月流水 |
| 贷款申请成功 | `funds` 增加、贷款计划写入、后续 M8 扣款 |
| 激励广告成功 | 对应奖励立即生效并消耗次数 |
| 岗位状态变化（购买后） | 更新运行态 modifier（如在建上限、工期、利息） |

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M5-M7 | 收入与成本会回写公司快照 |
| M8 | 贷款自动扣款并更新剩余期数 |
| M9-M10 | 社会价值与等级更新后在公司界面展示 |
| M13 | 若破产，界面转入结果态不可继续经营操作 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 公司运行态 | `funds`, `company_level`, `social_value_current` | 摘要区展示 |
| 月度账本 | `monthly_income`, `monthly_cost_*`, `monthly_net_cashflow` | 上月收支 |
| 贷款 | `active_loan`, `remaining_terms`, `monthly_payment` | 借贷展示与校验 |
| 岗位 | `role_state.cfo`, `role_state.pe` | baseline/完整版与效果 |
| 广告 | `ads_remaining`, `ad_free_until` | 激励入口可用性 |
| 队列状态 | `active_construction_count`, `active_research_count` | 激励秒完工/秒研发前置 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 已有未还清贷款再申请 | 拒绝并提示 `loan_already_active` |
| 档位未解锁 | 拒绝并提示 `loan_tier_locked` |
| `ads_remaining = 0` | 拒绝奖励并隐藏/灰显入口 |
| 请求秒完工但无在建 | 拒绝并提示 `no_active_construction` |
| 请求秒研发但无在研 | 拒绝并提示 `no_active_research` |

## 10. 验收标准

- [ ] Given 处于任意可操作月份，When 打开公司界面，Then 可查看经营快照与近月流水，且不推进时间。
- [ ] Given 无未还清贷款且档位解锁，When 申请贷款，Then 立即放款并生成 M8 还款计划。
- [ ] Given 已有未还清贷款，When 再申请贷款，Then 被拒绝且贷款记录不变。
- [ ] Given `ads_remaining > 0` 且有在建，When 触发 `ad_instant_build`，Then 指定项目立即完工并扣 1 次。
- [ ] Given 月结后社会价值变化，When 再次进入公司界面，Then 显示最新 `social_value_current` 与等级进度。

## 11. 相关文档

- GDD：
  - [公司经营与商业化](../gdd/09-year-end-and-monetization.md)
  - [社会价值与公司等级](../gdd/03-social-value.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [社会价值结算](./social-value-settlement.md)
  - [商业化](./monetization.md)
  - [公司管理 UI](../ui/company.md)（T29）
