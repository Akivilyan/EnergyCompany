# Playable v0 垂直切片数据包（T39）

**占位数值**，仅供 v0 工程联调。玩法以 GDD 为准；已完成首轮代理仿真调参与一轮后半程试玩扩张，仍需引擎实跑复验。

## 文件清单

| 文件 | 用途 |
|------|------|
| `manifest.json` | 包版本与文件列表 |
| `run_config.json` | 单局参数 |
| `difficulty_modifiers.json` | 简单档修正 |
| `campaign_disasters.json` | 固定 4 场灾害轴 |
| `company_levels.json` | I–V 门槛（已拉回 V 级可达区间） |
| `regions.json` | 10 个大地图节点解锁等级 |
| `cities.json` | v0 城市样板（`MAP-01` 起始省 + `MAP-02` 外送省 + `MET-A` + `MAP-03~08` + `MET-B` 后半程扩张样板） |
| `facilities_slice.json` | 风/光/火/水/核 ·I 占位 |
| `doctrine_meta_tech_l1.json` | tech 方针熟练度 1 |
| `tutorial_run_config.json` | 教学局缩短 II 门槛（占位） |
| `ad_rewards.json` | 激励现金梯度（降低硬依赖） |
| `loan_tiers.json` | 五档贷款（GDD 09 整数） |

## 裁剪说明

- **城市**：当前覆盖 `MAP-01`、`MAP-02`、`MET-A`、`MAP-03~08` 与 `MET-B` 的最小样板；采用「中心负荷城 + 外围资源城」分工模板，便于验证跨城输电与后半程扩张。
- **科技**：不全量导出；运行时 v0 可仍读未来 `technology.json`，开发阶段允许 **硬编码开局 lit**（`wind_1`, `solar_1`, `thermal_1`, `hydro_1` + tech 无顶）。
- **事件**：无 `event_pool` 随机条；灾害条目引用 `event_id` 占位。

## 使用

```text
开发加载顺序建议：
  vertical-slice-v0/*.json  →  合并/覆盖到运行时 config/
```

首轮调参批次覆盖文件（可选）：

```text
  vertical-slice-v0/experiments/batch-1-overlay.json
  vertical-slice-v0/experiments/batch-2-overlay.json
  vertical-slice-v0/experiments/batch-3-overlay.json
  vertical-slice-v0/experiments/batch-4-overlay.json
```

说明：每次只加载一个 batch overlay，避免跨批混改导致因果不可追踪。

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

## 后半程扩张模板（v0.3.5）

| 区域 | 节点 | 关键数值意图 |
|------|------|--------------|
| `MET-A` | `CITY-META-01` | III 级即可直达的高需求都会；承担升 IV 前的额外 SV 与高负荷压力 |
| `MAP-03` | 3 城 | IV 级第一块新增可经营省壳；偏水电与山地外送 |
| `MAP-04` | 3 城 | IV 级第二块新增省壳；偏光伏与风电组合 |
| `MAP-05` | 3 城 | IV 级第三块新增省壳；偏河谷水电与风光混合 |
| `MAP-06` | 3 城 | V 级第一块新增沿海工业省；偏海风/光伏与核电承接 |
| `MAP-07` | 3 城 | V 级第二块新增高原省；偏梯级水电与山脊风电 |
| `MAP-08` | 3 城 | V 级第三块新增边疆平衡省；偏风光混合与河谷调峰 |
| `MET-B` | `CITY-METB-01` | V 级终局都会；更高负荷与更高 SV，作为长线扩张的直接回报点 |

---
