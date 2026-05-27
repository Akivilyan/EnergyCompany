---
id: data/CHECKLIST
title: 数据验收清单
status: draft
version: 0.1.0
sources:
  - docs/design/TASK-LIST.md#T40
supersedes: []
depends_on:
  - data/README
  - data/schemas/README
open_questions: []
---

# 数据验收清单

导出或手填 JSON 后，按本清单自检。实现层可据此写自动化校验（T44）。

## A. 全局

- [ ] 所有主键 `snake_case` 唯一
- [ ] 外键引用存在（如 `city.region_id` → `regions`）
- [ ] 金额字段为整数（万元）
- [ ] 无中文 ID
- [ ] `config_version` 已 bump（若有破坏性变更）

## B. 分表（对照 schemas）

| 表 | 检查项 |
|----|--------|
| regions / cities | `MAP-*` / `MET-*` / `CITY-*` 完整；`unlock_company_level` 单调合理 |
| facilities | 每 `facility_id`+`tier` 一行；`build_cost`/`build_duration_months` > 0 |
| company_levels | level 1–5；`sv_threshold` 严格递增 |
| run_config | `campaign_run_target_months`、`bankrupt_consecutive_months` 与 GDD 一致 |
| campaign_disasters | `trigger_month` 在战役长度内；`is_final` 唯一终局 |
| technology | 节点 ID 与 GDD 07 一致；`requires_lit` 无环 |
| doctrine_meta | 四方针 + 熟练度 1–3 行齐全 |
| loan_tiers | 与 GDD 09 五档一致 |
| ad_rewards | 等级 I–V 各一行 |
| tutorial_run_config | II 门槛 ≤ 正式局 |

## C. 与 Feature 字段对齐

- [ ] `supply_ratio` 计算输入字段在 facility / city 表齐全
- [ ] `ads_remaining` 初值不在 JSON（运行时），但 `ad_rewards` 按等级可查
- [ ] `onboarding_steps` 含全部 `onb_01`…`onb_07` 的 `highlight_target`

## D. Playable v0 子集（T39 / T41 后勾选）

- [ ] 仅暴露 `tech` + `simple` 相关行仍满足完整引用（其它行可保留不展示）
- [ ] 垂直切片地图节点子集无悬空 `city_id`

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T40 初稿 |
