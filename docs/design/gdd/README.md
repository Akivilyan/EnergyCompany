---
id: gdd/README
title: GDD 索引
status: draft
version: 0.1.0
sources:
  - docs/design/TASK-LIST.md#T12
supersedes: []
depends_on:
  - gdd/00-vision
  - gdd/01-core-loop
  - gdd/02-economy
  - gdd/03-social-value
  - gdd/04-energy-supply
  - gdd/05-map-and-slots
  - gdd/06-grid
  - gdd/07-tech
  - gdd/08-events
  - gdd/09-year-end-and-monetization
  - gdd/10-onboarding
  - gdd/11-replayability
open_questions:
  - 04/05/06/07 四章锁定后，将本索引 status 升为 locked
---

# GDD 索引

`docs/design/gdd/` 是玩法规则的**权威来源**：只写边界、循环、公式与系统关系，不写引擎 API、不写像素级 UI。编写与引用规范见 [`../META.md`](../META.md)；任务节奏见 [`../TASK-LIST.md`](../TASK-LIST.md)。

**下游**：Feature Spec（`features/`）引用本章编号，不整段复制 GDD；具体字段见 [`../data/schemas/`](../data/schemas/)。

---

## 章节一览

| 序号 | 文档 | 主题 | status | version | 一句话 |
|------|------|------|--------|---------|--------|
| 00 | [愿景与边界](./00-vision.md) | 定位、平台、首版保留/舍弃 | locked | 0.3.9 | 产品边界与骨架总览 |
| 01 | [核心循环与时间](./01-core-loop.md) | 五类界面、推月、M1–M14 管道 | locked | 0.3.6 | 玩家在哪些屏操作、每月发生什么 |
| 02 | [资源与经济](./02-economy.md) | 资金、建设费/工期、地理成本、破产 | locked | 0.3.1 | 钱从哪来、花在哪、何时 Game Over |
| 03 | [社会价值与公司等级](./03-social-value.md) | M9/M10、按城公式、I–V 解锁 | locked | 1.0.1 | 社会价值 = 升级进度；等级只升不降 |
| 04 | [供能与能源类型](./04-energy-supply.md) | 满足率、有效供能、环保判定 | draft | 0.6.5 | 城市供能条与能源类型规则 |
| 05 | [地图与建设位](./05-map-and-slots.md) | 2都8区、差异化、通用建设位 | draft | 0.3.6 | 大地图拓扑与选址策略 |
| 06 | [电网](./06-grid.md) | 区域线/主干、线损、特高压 | draft | 0.5.2 | 组网、损耗与跨区限制 |
| 07 | [科技研发](./07-tech.md) | AoE2 式科技树、解锁/点亮 | draft | 0.3.8 | 研发队列与设施自动同步 |
| 08 | [事件系统](./08-events.md) | 四类效果、并发、灾害考试 | locked | 0.3.2 | 大理石式起伏与 UI 入口 |
| 09 | [公司经营与商业化](./09-year-end-and-monetization.md) | 公司快照、贷款、IAP/广告 | locked | 1.0.0 | 无独立年报；战略在公司屏 |
| 10 | [新手引导与教程](./10-onboarding.md) | 教学方针关、8 步遮罩 | locked | 1.0.0 | 首局教学；四方针无遮罩 |
| 11 | [重玩性与方针](./11-replayability.md) | 四方针、两难度、通关/破产 | locked | 0.6.3 | meta 路线与固定灾害战役 |

**阅读顺序（新读者）**：00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 11 → 10（引导可最后读）。

**锁定进度**：8 章 locked、4 章 draft（04/05/06/07）。draft 章下游 Feature 可写骨架，验收数值以 locked 为准或标注「待 GDD 锁定」。

---

## 月度结算管道（M 步骤）

权威表见 [01-core-loop § 月度结算管道](./01-core-loop.md#月度结算管道)。速查：

| 步骤 | 内容 | 主章节 |
|------|------|--------|
| M1 | 设施建设推进 | [02](./02-economy.md) |
| M2 | 电网施工推进 | [06](./06-grid.md) |
| M3 | 科研项目推进 | [07](./07-tech.md) |
| M4 | 供能重算 | [04](./04-energy-supply.md) |
| M5–M7 | 收入 / 运营成本 / 原材料 | [02](./02-economy.md) |
| M8 | 贷款还款 | [09](./09-year-end-and-monetization.md) |
| M9–M10 | 社会价值重算与升级检视 | [03](./03-social-value.md) |
| M11 | 事件倒计时与生效 | [08](./08-events.md) |
| M12 | 关键节点反馈 | [01](./01-core-loop.md) |
| M13–M14 | 破产 / 通关检视 | [02](./02-economy.md#破产)、[11](./11-replayability.md) |

实现侧「结算管道步骤表」将写入 `features/00-game-state.md`（T13）。

---

## 术语索引

下列词条在正文中的**定义章节**为准；此处仅作导航。

### 时间与流程

| 术语 | 含义 | 见 |
|------|------|-----|
| **下一月** | 玩家主动推进 1 个游戏月；主入口在城市建设屏 | [01 § 时间推进](./01-core-loop.md#时间推进规则) |
| **M1–M14** | 月度结算管道步骤编号 | [01 § 月度结算管道](./01-core-loop.md#月度结算管道) |
| **静态操作 + 按月推进** | 不做每月固定经营结果全屏弹窗 | [00](./00-vision.md)、[01 § 月度反馈](./01-core-loop.md#月度反馈策略) |

### 界面与地图

| 术语 | 含义 | 见 |
|------|------|-----|
| **`screen_world_map`** | 全国大地图 | [01 § 界面体系](./01-core-loop.md#界面体系五类) |
| **`screen_region`** | 省壳选城（**都** 跳过） | [01](./01-core-loop.md)、[05 § 大地图拓扑](./05-map-and-slots.md#大地图拓扑) |
| **`screen_city_detail`** | 城市详细建设界面 | [01](./01-core-loop.md)、[05 § 建设位](./05-map-and-slots.md#建设位系统) |
| **`screen_tech_tree` / `screen_company`** | 科技树 / 公司管理 | [01](./01-core-loop.md) |
| **2 都 + 8 区** | `MET-A/B` + `MAP-01`…`08` | [05](./05-map-and-slots.md)、[03 § 行政抽象](./03-social-value.md#行政抽象源于现实扁平化) |
| **可经营区连通** | 已解锁节点在大地图邻接图上单连通 | [05 § 可经营区必须大地图相连](./05-map-and-slots.md#可经营区必须大地图相连已决) |

### 经济与建设

| 术语 | 含义 | 见 |
|------|------|-----|
| **`funds`** | 公司资金（存档整数） | [02](./02-economy.md)、[META §12 数值原则](../META.md#12-数值原则整数优先) |
| **通用建设位** | 城内固定槽；点空位建造 | [05 § 建设位系统](./05-map-and-slots.md#建设位系统) |
| **`build_slot_count`** | 每城通用位上限 | [05](./05-map-and-slots.md)、[`data/schemas/region-and-city`](../data/schemas/region-and-city.md) |
| **临水 `has_river`** | 常规水电选址条件 | [05](./05-map-and-slots.md)、[04](./04-energy-supply.md) |
| **超级水电** | 全图限量 2 槽，不占城内通用位 | [05 § 战略级全图槽](./05-map-and-slots.md)、[06](./06-grid.md) |

### 供能与社会价值

| 术语 | 含义 | 见 |
|------|------|-----|
| **供能满足率** | 城市有效供能 / 需求；驱动供能条 | [04 § 供能满足率](./04-energy-supply.md#供能满足率) |
| **有效供能** | 经资源标签、线损、方针乘区等修正后的出力 | [04 § 有效供能](./04-energy-supply.md#有效供能) |
| **`social_value_current`** | 公司当前社会价值；顶栏与升级共用 | [03 § 唯一核心数值](./03-social-value.md#唯一核心数值实现) |
| **环保上限系数** | 非全环保城 SV 乘 0.8；全环保 1.0 | [03 § 城市社会价值公式](./03-social-value.md#城市社会价值公式按城市) |
| **公司等级 I–V** | 只升不降；解锁区域/科技档 | [03 § 全图与公司等级](./03-social-value.md#全图与公司等级-iv) |
| **`is_eco`** | 设施是否计为环保供能 | [04 § 环保供能判定](./04-energy-supply.md#环保供能判定社会价值用) |

### 电网与科技

| 术语 | 含义 | 见 |
|------|------|-----|
| **区域线 / 主干** | 省内组网 vs 跨区特高压链路 | [06](./06-grid.md) |
| **解锁 / 点亮** | 可启动研发 / 研发完成；设施 **点亮后自动同步** | [07](./07-tech.md)、[META §10 设计参考](../META.md#10-设计参考长期) |
| **`facility_build_tier_max`** | 某设施线当前可建最高 tier | [05 § 科技等级与建造](./05-map-and-slots.md#科技等级建造列表与科技驱动同步) |
| **`storage_system_1～3`** | 储能科技链 ID（与 04/08/11 对齐） | [07](./07-tech.md)、[`data/technology-tree.md`](../data/technology-tree.md) |

### 事件、方针与胜负

| 术语 | 含义 | 见 |
|------|------|-----|
| **四类事件效果** | 一次性现金 / 持续 debuff / 供能修正 / 其它（见 08 正文） | [08](./08-events.md) |
| **≤3 并发** | 同时激活的随机事件实例上限 | [08](./08-events.md) |
| **`campaign_disasters`** | 固定月灾害轴（通关条件） | [08](./08-events.md)、[11](./11-replayability.md)、[`events-and-campaign`](../data/schemas/events-and-campaign.md) |
| **`doctrine` / `difficulty`** | 经营方针 / 难度；影响建设%、研发、灾害表 | [11](./11-replayability.md)、[`doctrine-meta`](../data/schemas/doctrine-meta.md) |
| **教学方针** | 独立新手关；8 步遮罩 | [10](./10-onboarding.md) |
| **破产 M13** | 连续负资金月 | [02](./02-economy.md)、[01 M13](./01-core-loop.md#月度结算管道) |

### 商业化

| 术语 | 含义 | 见 |
|------|------|-----|
| **激励广告 10 次/局** | 三类用途共享上限；免广告不追加 | [09](./09-year-end-and-monetization.md) |
| **工程总监 IAP** | 第三在建队列等（见 09） | [09](./09-year-end-and-monetization.md) |

---

## 与 Feature Spec 映射（计划）

Feature 目录尚未建立；下表对应 [`TASK-LIST`](../TASK-LIST.md) 阶段 2，供 T13–T25 编写时对照。

| Feature 文件（计划） | 任务 | 主要 GDD | 次要 GDD |
|----------------------|------|----------|----------|
| `features/00-game-state.md` | T13 | [01](./01-core-loop.md) | [02](./02-economy.md)、[11](./11-replayability.md) |
| `features/region-main.md` | T14 | [01](./01-core-loop.md) | [03](./03-social-value.md)（顶栏 SV） |
| `features/construction.md` | T15 | [02](./02-economy.md)、[05](./05-map-and-slots.md) | [04](./04-energy-supply.md)、[07](./07-tech.md) |
| `features/supply-calculation.md` | T16 | [04](./04-energy-supply.md) | [06](./06-grid.md) |
| `features/social-value-settlement.md` | T17 | [03](./03-social-value.md) | [04](./04-energy-supply.md) |
| `features/company-management.md` | T18 | [03](./03-social-value.md)、[09](./09-year-end-and-monetization.md) | [01](./01-core-loop.md) |
| `features/world-map.md` | T19 | [05](./05-map-and-slots.md) | [06](./06-grid.md)、[03](./03-social-value.md) |
| `features/grid-network.md` | T20 | [06](./06-grid.md) | [05](./05-map-and-slots.md) |
| `features/tech-tree.md` | T21 | [07](./07-tech.md) | [05](./05-map-and-slots.md) |
| `features/events.md` | T22 | [08](./08-events.md) | [01](./01-core-loop.md)（M11） |
| `features/monetization.md` | T24 | [09](./09-year-end-and-monetization.md) | — |
| `features/onboarding.md` | T24a | [10](./10-onboarding.md) | [01](./01-core-loop.md) |
| `features/README.md` | T25 | 全文索引 | — |

**已合并**：原「年度战略」Feature → `company-management`（无独立年报，见 [09](./09-year-end-and-monetization.md)）。

---

## 与 Data 层映射

| GDD 主题 | 配置 / 字段说明 |
|----------|-----------------|
| 地图、城市、建设位 | [`data/schemas/region-and-city.md`](../data/schemas/region-and-city.md) |
| 设施、tier、电网线损 | [`data/schemas/facility-and-grid.md`](../data/schemas/facility-and-grid.md) |
| 公司等级、开局、难度 | [`data/schemas/company-level-and-run.md`](../data/schemas/company-level-and-run.md) |
| 随机事件、灾害战役 | [`data/schemas/events-and-campaign.md`](../data/schemas/events-and-campaign.md) |
| 方针 meta、熟练度 | [`data/schemas/doctrine-meta.md`](../data/schemas/doctrine-meta.md) |
| 科技树表结构 | [`data/technology-tree.md`](../data/technology-tree.md) |

配置总览与 Excel→JSON 流程见 [`../data/README.md`](../data/README.md)（T36）。

---

## 与旧文档对照

| 旧文件（`docs/`，只读参考） | 迁入 GDD |
|------------------------------|----------|
| `game-core-design.md` §1–2, §19 | [00](./00-vision.md) |
| §3–5 | [01](./01-core-loop.md) |
| §6–7 | [02](./02-economy.md) |
| §8–9 | [03](./03-social-value.md) |
| §10–11 | [04](./04-energy-supply.md) |
| §12–13 | [05](./05-map-and-slots.md) |
| §14 | [06](./06-grid.md) |
| §15 + `tech-tree-design.md` 原则 | [07](./07-tech.md) |
| §16 | [08](./08-events.md) |
| §17–18 | [09](./09-year-end-and-monetization.md) |

归档说明待 **T46**（`LEGACY.md`）。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T12：章节索引、术语导航、Feature/Data 映射表 |
