# v0 灾害数值政策（锁定项 vs 可调项）

> 参考体感：大理石时代（Marble Age）——灾害后通常有 **10 期以上** 的持续压制，而非“当月罚完即恢复”。

---

## 1) 设计锁定项（本阶段禁止调参）

| 字段 | 规则 |
|------|------|
| `debuff_duration_months` | **仅按灾害档位写死**，不在 batch / overlay / playtest 中修改 |
| `trigger_month` | 固定战役轴：22 / 41 / 63 / 86 |
| `warn_lead_months` | 按档位写死，与 GDD 预警节奏一致 |

### v0 固定持续月数（`main_v0`）

| seq | 月份 | exam_tier | `debuff_duration_months` | 设计意图 |
|-----|------|-----------|--------------------------|----------|
| 1 | M22 | 1（轻） | **8** | 首灾：中长期压力，可运营挽回 |
| 2 | M41 | 2（中） | **10** | 中段：明显压制，需提前备现金/外送 |
| 3 | M63 | 2（中） | **10** | 后段：与 M41 同级持续，力度靠倍率区分 |
| 4 | M86 | 3（重） | **12** | 终局：最长 debuff，配合高现金惩罚 |

区间原则：**轻灾 8 月、中灾 10 月、重灾 12 月**（落在 6–12 / 8–12 月目标带内）。

---

## 2) 可调项（平衡迭代只动这些）

| 类别 | 字段 | 说明 |
|------|------|------|
| 即时冲击 | `immediate_cash_penalty` | 触发月一次性扣款（万） |
| 持续压制 | `income_mult_num` / `income_mult_den` | 收入倍率（如 92/100 ≈ −8%） |
| 持续压制 | `build_duration_mult_num` / `den` | 建造工期倍率 |
| 持续压制 | `research_duration_mult_num` / `den` | 科研工期倍率 |
| 考试失败 | `exam_fail_extra_cash` | 额外现金惩罚（若启用考试判定） |

**不通过缩短 `debuff_duration_months` 来“救难度”**；若 A 策略过难，优先：

1. 下调 `immediate_cash_penalty` 或放宽 `income_mult_num`
2. 上调 `starting_cash_base`、设施收入侧、或 `loan_tiers`
3. 调整 `facilities_slice` 造价/运维/出力
4. 最后才微调 `ad_rewards`（广告非主杠杆）

---

## 3) 实验与脚本约束

- `playtest-lab/` 代理仿真：**不得**将 `debuff_duration_months` 纳入 overlay。
- `experiments/batch-*-overlay.json`：**不得**包含 `debuff_duration_months`。
- 代码侧：`ConfigRepo` 加载灾害表时可将持续月数标为 `locked: true`（见 `campaign_disasters` schema 注释）。

---

## 4) 相关文档

- [v0-balance-target-lines.md](./v0-balance-target-lines.md)
- [v0-balance-knob-surface.md](./v0-balance-knob-surface.md)
- [data/schemas/events-and-campaign.md](../data/schemas/events-and-campaign.md)
