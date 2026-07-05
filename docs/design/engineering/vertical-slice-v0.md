---
id: engineering/vertical-slice-v0
title: Playable v0 垂直切片范围
status: draft
version: 0.1.0
sources:
  - docs/design/gdd/11-replayability.md#playable-v0内测垂直切片
  - docs/design/gdd/00-vision.md
  - docs/design/gdd/10-onboarding.md
  - docs/design/features/README.md
  - 用户确认 2026-05-27（按 Agent 默认裁剪，基本满意）
supersedes: []
depends_on:
  - features/README
  - gdd/11-replayability
  - data/README
open_questions:
  - 首局可玩时长目标待 playtest 后修订（当前为设计假设）
---

# Playable v0 垂直切片范围

**Playable v0** = 可在微信小游戏环境跑通的一条 **内测闭环**，用于验证核心循环与战役轴，**不是** 正式首发功能全集。

权威玩法仍以 GDD / Feature 为准；本文只定义 **v0 代码与数据裁剪**。

---

## 1. 体验目标（成功标准）

| # | 目标 | 可观测结果 |
|---|------|------------|
| E1 | 新玩家能走完 **教学关** 或跳过并开 **tech + simple** 正式局 | 教学 7 步或方针屏仅两选项 |
| E2 | **单城 → 推月 → 建设 → 供能/SV 变化** 可感知 | 顶栏资金/SV/供能条随 `next_month` 变化 |
| E3 | **II 级** 可开科技树并完成 **至少 1 次** 单队列研发 | 节点 `researching → lit`，城市内提示 |
| E4 | **MAP-01 全省** 解锁后可 **第二城 + 区域铺线** | `screen_region` 可建 1 条区内线 |
| E5 | **固定灾害轴** 至少经历 **第 1 场**（22 月）与预警 UI | 全屏灾害弹窗 + 事件面板 |
| E6 | 可 **破产** 或 **撑到 86 月终局** 进入 `screen_run_result` | M13 / M14 状态机 |

**设计假设（待 playtest）**：熟悉玩家 **45～90 分钟** 可触达 II 级并见到首场灾害；**不要求** v0 完成全图 V 级经营。

---

## 2. 新局默认（与 GDD 一致）

| 项 | v0 值 |
|----|--------|
| 方针 UI | 仅 **`tech`** + **`simple`**（`renewable` / `hydro` / `thermal` / `normal` **代码保留、UI 隐藏**） |
| 教学 | **保留**：方针屏 **「教学」** + `overlay_onboarding` |
| 开局城 | `CITY-START`（`MAP-01` 中心城） |
| 起始资金 | **140** 万（90 + 简单 +50） |
| 方针熟练度 | 固定 **`doctrine_meta_level = 1`**（tech 路线） |
| 战役 | `campaign_id = main_v0`；灾害 **22 / 41 / 63 / 86** |
| 随机事件池 | **不接入** M11 权重抽取（见 §4 不做） |

---

## 3. 必做系统（In scope）

### 3.1 核心

| 模块 | Feature | v0 范围 |
|------|---------|---------|
| 状态机 / 推月 | 00-game-state | `main_menu` → `run_setup` → `run_playable` → `month_settling` → `run_result`；M1–M14 **全步骤** |
| 城市建造 | construction + construction-flow UI | `screen_city_detail`；空位建 ·I 设施；全局 **3** 在建；取消全额退（Feature 暂定） |
| 供能 / SV | supply-calculation, social-value-settlement | M4/M9/M10；供能 100% **内提示** |
| 公司屏 | company-management + company UI | 快照、6 月流水、**借贷**（单笔）、岗位 **只读 baseline** |
| 科技树 | tech-tree + tech-tree UI | **II 级起**入口；单队列；tech 方针 **无 lit 顶** |
| 事件 | events + events UI | **仅** `campaign_disasters` 固定 4 场；`panel_events` + 灾害全屏 |
| 新手 | onboarding + onboarding UI | 教学局 + 弱提示 **tip_ads / tip_loan** 等可先做 2～3 条 |
| 存档 | 00-game-state | 单局继续；profile：`tutorial_doctrine_cleared` |

### 3.2 地图（渐进解锁，数据按全战役表）

| 等级 | v0 必须可测 | 界面 |
|------|-------------|------|
| I | `CITY-START` | city |
| II | `MAP-01` 全省（区域多城） | region + city |
| III+ | 按 [03-social-value](../gdd/03-social-value.md) 表解锁 `MET-A`、`MAP-02`… | world + region |

**大地图 `screen_world_map`**：必做；未解锁 **灰显**；不要求 v0 美术终稿。

### 3.3 电网（最小集）

| 项 | v0 |
|----|-----|
| 区域内城市间链路 | **必做**（`queue_grid_link`，M2） |
| 跨区主干 | **逻辑预留**；v0 **可不接 UI 入口** |
| 超级水电 / 战略槽 | **不做** |

### 3.4 商业化（最小集）

| 项 | v0 |
|----|-----|
| `ads_remaining` + 三类激励 | **逻辑 + 公司屏入口**；SDK 可 **stub**（开发按钮直达成功回调） |
| 插屏 / 横幅 | **可 stub 或关闭** |
| IAP / 工程总监 | **UI 隐藏**；`purchase_iap` **接口预留** |

### 3.5 平台

- **微信小游戏**；顶栏/底栏 **安全区**（见 `ui/README.md`）。
- 无账号联机、无云存档要求（本地存档即可）。

---

## 4. 明确不做（Out of scope for v0）

| 项 | 说明 |
|----|------|
| 四方针 / 一般难度 **UI 暴露** | 字段与表保留 |
| `policy` / `market` **随机事件池** | M11 不抽随机；代码可留空分支 |
| 跨区 **主干** 建链 UI | 表字段可留 |
| **超级水电 / 核电战略槽** 大地图工程 | 不做 |
| **IAP 商店**、工程礼包、免广告购买 | 不做 |
| 真实 **广告 SDK** 变现联调 | 可后接；v0 用 stub |
| 方针 **局外熟练度** 存档成长 UI | v0 固定 L1；不写档升级也可 |
| 收购、成就 | GDD 首版不做 |
| 完整 **58 城** 数值精算 | 用 [`vertical-slice-v0`](../data/vertical-slice-v0/) 占位；全表 T37 后补 |
| 像素终稿 / 全量插画 | 占位 UI + 可选 milestones 纯文案 |

---

## 5. 屏幕与 Feature 裁剪对照

| 屏幕 / 叠加 | v0 |
|-------------|-----|
| `screen_main_menu` / `screen_new_game*` | 必做 |
| `screen_city_detail` + 建造模态 | 必做 |
| `screen_region` | 必做（II 起） |
| `screen_world_map` | 必做（灰显解锁） |
| `screen_tech_tree` | 必做（II 起） |
| `screen_company` | 必做 |
| `panel_events` / `modal_event_fullscreen` | 必做 |
| `overlay_onboarding` | 必做 |
| `overlay_codex` | **可简化为 1～2 页** 或延后 |
| `modal_mega_project_complete` | 不做（无战略工程） |

---

## 6. 数据包

- 路径：[`data/vertical-slice-v0/`](../data/vertical-slice-v0/)
- 性质：**占位整数**，供模拟层与 UI 联调；**不** 代表最终平衡。
- 全量表就绪后：由导出脚本替换 `config/`，或 diff 合并。

---

## 7. 实现顺序建议（→ T45）

1. **模拟核心**：M1–M14 空载 + `run_config` + 单城设施  
2. **城市 UI + 推月**  
3. **SV / 升级 / MAP-01 解锁**  
4. **区域电网 + region 屏**  
5. **科技树 II + 研发**  
6. **固定灾害 4 场 + 事件 UI**  
7. **公司 / 借贷 / 破产通关**  
8. **教学遮罩 + 方针屏**  
9. **大地图灰显解锁**  
10. **激励广告 stub + 存档**

---

## 8. 相关文档

- GDD：[11-replayability](../gdd/11-replayability.md)、[10-onboarding](../gdd/10-onboarding.md)
- Feature：[README](../features/README.md)
- UI：[00-screen-map](../ui/00-screen-map.md)
- Data：[vertical-slice-v0](../data/vertical-slice-v0/README.md)、[CHECKLIST](../data/CHECKLIST.md)
