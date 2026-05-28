# v0 首轮调参测试包（Batch 1~4）

> 目的：将“每批只改 3~4 参数”的方案变成可直接执行的测试工单。  
> 适用范围：`docs/design/data/vertical-slice-v0/*.json` 当前占位数据。

---

## 1) 基线快照（开始前）

- `run_config.starting_cash_base = 90`
- `campaign_disasters[1]`（M22）：`immediate_cash_penalty = 12`，`debuff_duration_months = 2`
- `campaign_disasters[2]`（M41）：`immediate_cash_penalty = 20`，`debuff_duration_months = 3`
- `campaign_disasters[3]`（M63）：`immediate_cash_penalty = 32`，`debuff_duration_months = 4`
- `ad_rewards.reward_cash = [10, 18, 28, 42, 60]`（L1~L5）

---

## 2) 批次改值（建议首轮）

约束：`debuff_duration_months` 视为设计锁定项，本阶段不调持续月数，只调惩罚力度。

## Batch 1：基础生存托底（4 参数）

- `campaign_disasters.seq=1.immediate_cash_penalty`: `12 -> 10`
- `campaign_disasters.seq=1.income_mult_num`: `92 -> 94`
- `campaign_disasters.seq=2.immediate_cash_penalty`: `20 -> 18`
- `run_config.starting_cash_base`: `90 -> 95`

目标：降低 A 在 M22 前的崩盘密度，不显著削弱 B/C 的经营压力。

## Batch 2：中段压力平滑（3 参数）

- `campaign_disasters.seq=2.income_mult_num`: `88 -> 90`
- `campaign_disasters.seq=3.immediate_cash_penalty`: `32 -> 30`
- `campaign_disasters.seq=3.income_mult_num`: `84 -> 86`

目标：将 M41/M63 从“断崖”调整为“可挽回压力段”。

## Batch 3：广告价值校准（3 参数）

- `ad_rewards.company_level=1.reward_cash`: `10 -> 9`
- `ad_rewards.company_level=3.reward_cash`: `28 -> 25`
- `ad_rewards.company_level=5.reward_cash`: `60 -> 54`

目标：让 B 成为更优体验而非“广告必需”，避免 C 无脑碾压。

## Batch 4：地图分工强化（4 参数）

- `cities.CITY-START.base_demand_mw`: `1200 -> 1260`
- `cities.CITY-MAP01-03.base_demand_mw`: `100 -> 80`
- `cities.CITY-MAP02-02.base_demand_mw`: `480 -> 420`
- `cities.CITY-MAP02-03.base_demand_mw`: `90 -> 70`

目标：提高负荷中心的受电需求，强化“外围发电点外送”的策略价值。

注：线损参数待 `grid_loss_config` 数据文件落地后，再并入 Batch 4 的复验子批次。

---

## 3) 执行顺序与停止规则

1. 严格按 Batch 1 -> 2 -> 3 -> 4 顺序执行。
2. 每批至少跑 A/B/C 各 2 局（共 >= 6 局）后再判定是否进入下一批。
3. 单批未达标时，仅允许在该批 3~4 参数内做二次微调，不得跨批混改。
4. 若出现 C 无脑通关，提前插入 Batch 3（广告校准）并复跑 Batch 2 验证副作用。

---

## 4) 每批验收门槛（沿用目标线）

- A 通关率目标：`60% ~ 70%`（底线不低于 50%）
- B 通关率目标：`80% ~ 90%`
- C 通关率目标：`>= 90%`，但不应“无经营决策”
- 平均广告次数：`3 ~ 5 次/局`
- 平均单局时长：`60 ~ 90 分钟`

---

## 5) 记录要求

- 每局用 `docs/design/engineering/v0-balance-runlog-template.md` 记完整节点（6/12/22/41/63/86）。
- 记录文件名建议：`v0-runlog-YYYYMMDD-b{batch}-s{A|B|C}-n{idx}.md`。
- 每批结束后写一段 3 行结论：
  - 本批是否保留；
  - 主要收益；
  - 新增副作用与下批验证点。
