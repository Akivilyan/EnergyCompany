# v0 全经济调参面板（可调 vs 锁定）

> 数值全盘由配置驱动；平衡迭代优先使用本清单，而非仅改广告/灾害。

---

## 1) 锁定项（设计常量）

| 系统 | 字段 | 说明 |
|------|------|------|
| 灾害 | `debuff_duration_months` | 见 [v0-disaster-balance-policy.md](./v0-disaster-balance-policy.md) |
| 灾害 | `trigger_month` | 22 / 41 / 63 / 86 |
| 战役 | `campaign_run_target_months` | 默认 86 |
| 破产 | `bankrupt_consecutive_months` | 连续负资金月数 |

---

## 2) 可调项（按优先级）

### A. 经济底盘（公司经营不下去时优先）

| 文件 | 字段 | 影响 |
|------|------|------|
| `run_config.json` | `starting_cash_base` | 开局现金 |
| `difficulty_modifiers.json` | `starting_cash_add` | 简单档加成 |
| `loan_tiers.json` | `principal`, `terms`, `monthly_payment_approx` | 借贷能力与压力 |
| `facilities_slice.json` | `build_cost_total`, `build_duration_months` | 扩张节奏 |
| `facilities_slice.json` | `monthly_operating_cost`, `output_capacity_mw` | 现金流与供能 |
| `facilities_slice.json` | 火电燃料（后续 `fuel_cost` 字段） | M7 原材料 |

### B. 成长节奏

| 文件 | 字段 | 影响 |
|------|------|------|
| `company_levels.json` | `sv_threshold` | 升级门槛 |
| `cities.json` | `base_demand_mw`, `city_base_social_value` | 区域压力与 SV |
| `regions.json` | 资源偏向字段 | 分工与外送价值 |

### C. 灾害力度（不改持续月数）

| 文件 | 字段 | 影响 |
|------|------|------|
| `campaign_disasters.json` | `immediate_cash_penalty` | 触发月现金冲击 |
| `campaign_disasters.json` | `income_mult_*` | 持续收入压制（如 92/100） |
| `campaign_disasters.json` | `build_duration_mult_*` | 建造减速 |
| `campaign_disasters.json` | `research_duration_mult_*` | 科研减速 |
| `difficulty_modifiers.json` | `disaster_cash_mult` | 难度对现金惩罚缩放 |

### D. 边际调节（靠后）

| 文件 | 字段 | 影响 |
|------|------|------|
| `ad_rewards.json` | `reward_cash` | 广告救急强度 |
| 模拟常量 | `incomePricePerMw` | 电价（代码内，待入表） |

---

## 3) 每轮调参流程（3~4 参数）

1. 从 **A/B/C** 中选一类问题（生存 / 成长 / 灾害体感）。
2. 只改 3~4 个字段，写 runlog。
3. `npm test` + `npm run sim:demo` 冒烟。
4. 引擎实跑 A/B/C 抽样复验。

---

## 4) 代码入口

- 配置加载：[`src/sim/config/configRepo.ts`](../../../src/sim/config/configRepo.ts)
- 灾害 debuff：[`src/sim/systems/debuff.ts`](../../../src/sim/systems/debuff.ts)
- 月结：[`src/sim/core/settleNextMonth.ts`](../../../src/sim/core/settleNextMonth.ts)
