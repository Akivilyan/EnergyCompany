---
id: data/vertical-slice-v0/README
title: Playable v0 垂直切片数据包
status: draft
version: 0.3.0
sources:
  - docs/design/engineering/vertical-slice-v0.md
  - docs/design/gdd/11-replayability.md
supersedes: []
depends_on:
  - engineering/vertical-slice-v0
  - data/README
open_questions:
  - 设施 `build_cost` / `research_cost` 待 T37 全表替换
---

# Playable v0 垂直切片数据包（T39）

**占位数值**，仅供 v0 工程联调。玩法以 GDD 为准；平衡性 **未** 经 playtest。

## 文件清单

| 文件 | 用途 |
|------|------|
| `manifest.json` | 包版本与文件列表 |
| `run_config.json` | 单局参数 |
| `difficulty_modifiers.json` | 简单档修正 |
| `campaign_disasters.json` | 固定 4 场灾害轴 |
| `company_levels.json` | I–V 门槛（占位 SV） |
| `regions.json` | 10 个大地图节点解锁等级 |
| `cities.json` | v0 城市样板（`MAP-01` 负荷中心省 + `MAP-02` 资源外送省） |
| `facilities_slice.json` | 风/光/火/水/核 ·I 占位 |
| `doctrine_meta_tech_l1.json` | tech 方针熟练度 1 |
| `tutorial_run_config.json` | 教学局缩短 II 门槛（占位） |
| `ad_rewards.json` | 激励现金梯度（降低硬依赖） |
| `loan_tiers.json` | 五档贷款（GDD 09 整数） |

## 裁剪说明

- **城市**：仅 `MAP-01` 内 3 城可玩数据；采用「中心负荷城 + 外围资源城」分工模板，便于验证跨城输电策略。
- **科技**：不全量导出；运行时 v0 可仍读未来 `technology.json`，开发阶段允许 **硬编码开局 lit**（`wind_1`, `solar_1`, `thermal_1`, `hydro_1` + tech 无顶）。
- **事件**：无 `event_pool` 随机条；灾害条目引用 `event_id` 占位。

## 使用

```text
开发加载顺序建议：
  vertical-slice-v0/*.json  →  合并/覆盖到运行时 config/
```

验收勾选项见 [CHECKLIST.md](../CHECKLIST.md) §D。

## MAP-01 模板（v0.2）

| 城市 | 角色 | 关键数值意图 |
|------|------|--------------|
| `CITY-START` | 负荷中心 | 高需求、临水、核电资格、较高建设位 |
| `CITY-MAP01-02` | 次级供给 | 普通需求、光伏偏优 |
| `CITY-MAP01-03` | 外围发电点 | 低需求、风能 rich、少位高效外送 |

---

## MAP-02 模板（v0.3）

| 城市 | 角色 | 关键数值意图 |
|------|------|--------------|
| `CITY-MAP02-01` | 省级负荷枢纽 | 中高需求、临水、核电资格、较高建设位 |
| `CITY-MAP02-02` | 风电主供给点 | 中等需求、风能 rich、承担跨城外送 |
| `CITY-MAP02-03` | 风光混合外送点 | 低需求、风/光均 rich，验证资源叠乘价值 |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T39 占位包初版 |
| 0.2.0 | 2026-05-28 | MAP-01 分工模板、设施扩到五类·I、广告与灾害强度微调、开局资金上调 |
| 0.3.0 | 2026-05-28 | 新增 MAP-02 资源外送省三城模板与区域偏向字段 |
