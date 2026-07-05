---
id: data/README
title: 配置总览
status: draft
version: 1.0.0
sources:
  - docs/design/gdd/README.md#与-data-层映射
supersedes: []
depends_on:
  - gdd/README
  - data/schemas/README
open_questions: []
---

# 配置总览

Data 层描述 **表结构、字段、ID 规范** 与 **策划 → 游戏** 的交付物形态。玩法规则仍以 GDD / Feature 为准；本目录只回答「配什么、怎么导、放哪」。

---

## 1. 目录约定

```text
docs/design/data/
  README.md                 ← 本文件
  CHECKLIST.md              ← 数据验收清单
  technology-tree.md        ← 科技树表结构
  schemas/                  ← 核心表字段说明
    README.md
    region-and-city.md
    facility-and-grid.md
    company-level-and-run.md
    events-and-campaign.md
    doctrine-meta.md
  vertical-slice-v0/        ← Playable v0 数据包（见 engineering/vertical-slice-v0.md）
```

**运行时 JSON**（实现阶段，路径 T42 定）建议：

```text
{game_root}/config/
  regions.json
  cities.json
  facilities.json
  company_levels.json
  run_config.json
  events.json
  campaign_disasters.json
  doctrine_meta.json
  technology.json
  ad_rewards.json
  loan_tiers.json
  tutorial_run_config.json
  onboarding_steps.json
```

首版可采用 **单表单文件**；关联表用外键 ID 引用，不在 JSON 内嵌对象图。

---

## 2. ID 与命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 主键 | `snake_case` 英文 | `region_id`, `facility_id`, `event_id` |
| 地区 | `MAP-xx` / `MET-A` | `MAP-01`, `MET-A` |
| 城市 | `CITY-*` | `CITY-START` |
| 科技 | 与 [technology-tree.md](./technology-tree.md) 一致 | `wind_2`, `storage_system_1` |
| 事件 | `event_*` / 灾害 `disaster_*` | 待表内统一 |
| 枚举值 | 小写英文 | `simple`, `renewable`, `lit` |
| 显示名 | 配置字段 `display_name`（中文） | 与 ID 分离 |

**禁止**：在 ID 中使用中文、空格、或依赖显示名作逻辑键。

---

## 3. 数值与类型

| 规则 | 说明 |
|------|------|
| 配置可写小数 | 如 `cost_multiplier: 1.15` |
| 结算整数 | `settlement_rounding_mode = truncate_to_int`（见 `run_config`） |
| 金额单位 | **万元** 整数（与 GDD 02 一致） |
| 月份 | 从 1 起计的 **游戏内月**；战役轴用 `trigger_month` |

---

## 4. Excel → JSON 流程（策划交付）

```text
策划 Excel（主表）
    → 导出脚本（校验 ID、外键、必填）
    → config/*.json
    → 加载时 Schema 校验（T44 实现）
```

| 步骤 | 责任 | 产出 |
|------|------|------|
| 1. 改表 | 策划 | `.xlsx` 或 CSV（可多表一簿） |
| 2. 校验 | 导出脚本 | 错误报告（重复 ID、悬空引用） |
| 3. 导出 | CI / 本地命令 | `config/*.json` |
| 4. 验收 | 对照 [CHECKLIST](./CHECKLIST.md) | PR 通过 |

导出脚本不作为当前模块前置；本目录只约定字段与文件清单。

### 建议工作簿分页（与 schemas 对应）

| Sheet 名 | 输出 JSON | 字段说明 |
|----------|-----------|----------|
| region_base | `regions.json` | [region-and-city](./schemas/region-and-city.md) |
| city_base | `cities.json` | 同上 |
| facility_config | `facilities.json` | [facility-and-grid](./schemas/facility-and-grid.md) |
| grid_backbone | `grid_backbone.json` | 同上 |
| company_level | `company_levels.json` | [company-level-and-run](./schemas/company-level-and-run.md) |
| run_config | `run_config.json` | 同上 |
| difficulty | `difficulty_modifiers.json` | 同上 |
| events | `events.json` | [events-and-campaign](./schemas/events-and-campaign.md) |
| campaign_disasters | `campaign_disasters.json` | 同上 |
| doctrine_meta | `doctrine_meta.json` | [doctrine-meta](./schemas/doctrine-meta.md) |
| technology | `technology.json` | [technology-tree.md](./technology-tree.md) |
| loan_tiers | `loan_tiers.json` | GDD 09 / Feature company |
| ad_rewards | `ad_rewards.json` | Feature monetization |
| tutorial_run | `tutorial_run_config.json` | Feature onboarding |
| onboarding_steps | `onboarding_steps.json` | UI onboarding `highlight_target` |

---

## 5. 表清单与 GDD / Feature 映射

| 配置域 | Schema 文档 | 主要 GDD | 主要 Feature |
|--------|---------------|----------|--------------|
| 地图城市 | region-and-city | 05 | region-main, world-map |
| 设施电网 | facility-and-grid | 02, 04, 06 | construction, grid-network, supply |
| 等级开局 | company-level-and-run | 03, 11 | 00-game-state, social-value |
| 事件战役 | events-and-campaign | 08, 11 | events |
| 方针 meta | doctrine-meta | 11 | tech-tree（方针预算） |
| 科技树 | technology-tree | 07 | tech-tree |
| 借贷激励 | loan_tiers, ad_rewards（待补 schema 节） | 09 | company, monetization |
| 教学 | tutorial_run_config, onboarding_steps | 10 | onboarding |

---

## 6. 版本与变更

- 配置 JSON 建议带 `config_version`（semver 或日期）。
- 破坏性改 ID：**禁止** 静默重命名；须 migration 说明或存档兼容策略（T44）。

---

## 7. 相关文档

- [schemas 索引](./schemas/README.md)
- [数据验收清单](./CHECKLIST.md)
- GDD 索引 [gdd/README.md](../gdd/README.md)
