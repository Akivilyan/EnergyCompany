# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。协作规则写入根目录 `AGENTS.md`；执行结果写入 Git commit 与最终回复；历史查 Git。

模块完成后只改三处：当前模块状态、下一个模块状态、当前工程状态。不写流水、最近进展或变更记录。

## 当前产品定位

- 平台：微信小游戏
- 客户端：`Cocos Creator 3.x + TypeScript`
- 规则真理：`src/sim/`
- 当前目标：落地真正可玩的完整 demo；画面、数据、提示可以粗糙，但主要玩法闭环与核心分支必须可体验。

## 当前版本范围

已纳入当前版本：

- 单局按月推进的经营闭环
- 城市建设、区域铺线、科技研发、公司经营、固定灾害轴、终局判定
- `src/sim/` 规则闭环、`src/modules/` 编排层、`client/cocos/` 客户端壳层
- 微信小游戏构建路径、客户端聚合验证、真机冒烟路径

当前不作为统一阻塞项：

- Prefab 化正式 UI 资源
- 真正接入微信激励广告 SDK
- 大规模数值精调
- 经营提示、压力拆解、HUD 文案精修
- 对含糊设计数据的逐项精磨

## 当前阶段

- 阶段：模块交付制推进
- 当前模块：`WECHAT-RELEASE-01`
- 模块标题：微信包阶段收口与真机验收
- 状态：`done`
- 开始时间：2026-07-05

## 当前模块完成定义

### `WECHAT-RELEASE-01` 微信包阶段收口与真机验收

目标：把完整 demo 的微信包链路收口到“可交给人试玩”的状态。

输入：

- `docs/design/engineering/cocos-client-setup.md`
- `AGENTS.md`
- 当前所有已完成模块

输出：

- `verify:client` 通过。
- 微信构建包启动模块完整。
- 真机冒烟覆盖冷启动、存档恢复、公司 2 级、区域铺线、灾害弹窗、广告回调可用性。
- 记录仍存在的非阻塞 UX / 性能 / 资源问题。

不做：

- 不新增玩法。
- 不再大改数值。
- 不重做 UI 资产。

验收：

- `npm run verify:client`
- 微信开发者工具 / 真机手动冒烟

## 当前工程状态

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48-T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | done |
| Demo 七条核心试玩路线 | done |
| UI-PREFAB-01 城市页样张 | done |
| BALANCE-PLAYTEST-01 数值与节奏 | done |
| UX-GUIDANCE-01 经营压力、提示与反馈 | done |
| MONETIZATION-WECHAT-01 微信激励广告与商业化链路 | done |
| WECHAT-RELEASE-01 微信包阶段收口与真机验收 | done |

## 模块队列

### 1. `UI-PREFAB-01` 正式 UI / Prefab 与城市页可玩样张

状态：`done`

边界：当前模块，完成后再进入数值、提示或广告模块。

切换条件：验收通过后，将当前模块改为 `BALANCE-PLAYTEST-01`。

### 2. `BALANCE-PLAYTEST-01` 完整 demo 数值与试玩节奏收敛

状态：`done`

目标：让七条 demo 路线在粗糙但可玩的数值区间内稳定成立，避免“能跑但不好玩”。

输入：

- `docs/design/engineering/v0-balance-target-lines.md`
- `docs/design/engineering/v0-balance-knob-surface.md`
- `docs/design/engineering/v0-balance-checkpoints.md`
- `docs/design/engineering/v0-disaster-balance-policy.md`
- `docs/design/data/vertical-slice-v0/`
- `playtest-lab/run-first-round-batches.mjs`

输出：

- A/B/C 三类策略的可回归试玩结果。
- 一组可解释的粗调参数：公司 I-V、灾害现金/收入压力、广告现金价值、地图资源分工、路线耗时。
- playtest 脚本或回归入口能复现关键路线结果。
- 数值改动对应配置与验收说明清楚，不靠口头判断。

不做：

- 不追求最终商业化数值。
- 不做 UI 视觉精修。
- 不接真实广告 SDK。

验收：

- `npm test`
- `npm run build:client`
- `npm run sim:playtest-bundle`

切换条件：验收通过后，将当前模块改为 `UX-GUIDANCE-01`。

### 3. `UX-GUIDANCE-01` 经营压力、提示与反馈闭环

状态：`done`

目标：让玩家知道当前为什么卡、下一步该做什么，以及灾害/经营压力/终局结果为什么发生。

输入：

- `docs/design/features/company-management.md`
- `docs/design/features/events.md`
- `docs/design/features/tech-tree.md`
- `docs/design/features/world-map.md`
- `docs/design/ui/company.md`
- `docs/design/ui/events.md`
- `docs/design/ui/milestones.md`
- `docs/design/ui/run-result.md`

输出：

- 公司、科技、城市、区域、大地图、事件、结果页的关键提示闭环。
- 经营压力、科技解法、灾害备考/恢复、终局路线摘要统一口径。
- 文案键、状态 token、按钮能力与实际动作条件一致。
- 相关模块测试覆盖错误态和推荐态。

不做：

- 不改核心数值平衡。
- 不做新的玩法系统。
- 不接真实广告 SDK。

验收：

- `npm test`
- 涉及客户端显示时补 `npm run verify:client:fast`

切换条件：验收通过后，将当前模块改为 `MONETIZATION-WECHAT-01`。

### 4. `MONETIZATION-WECHAT-01` 微信激励广告与商业化链路

状态：`done`

目标：把当前 stub / 预研广告链路推进到微信小游戏可验证的真实激励广告路径，并保持 Node/无 wx 环境可回退。

输入：

- `docs/design/features/monetization.md`
- `docs/design/features/company-management.md`
- `docs/design/ui/company.md`
- `docs/design/engineering/cocos-client-setup.md`
- 现有 `RewardedAdProvider` / `AdRewardService` / Cocos GameRoot 挂载入口

输出：

- 微信 `wx.createRewardedVideoAd` provider。
- 完成、取消、加载失败、SDK 缺失、重复点击的完整状态处理。
- 公司现金广告与科技/建设加速入口统一走异步广告服务。
- 真机/微信开发者工具排障路径清楚；无 wx 环境继续使用 stub。

不做：

- 不实现 IAP 支付。
- 不调广告收益数值。
- 不重做公司屏 UI。

验收：

- `npm test`
- `npm run verify:client`
- 真机或微信开发者工具手动冒烟路径按 `cocos-client-setup.md` 执行并在最终回复说明结果。

切换条件：验收通过后，将当前模块改为 `WECHAT-RELEASE-01`。

### 5. `WECHAT-RELEASE-01` 微信包阶段收口与真机验收

状态：`done`

目标：把完整 demo 的微信包链路收口到“可交给人试玩”的状态。

输入：

- `docs/design/engineering/cocos-client-setup.md`
- `AGENTS.md`
- 当前所有已完成模块

输出：

- `verify:client` 通过。
- 微信构建包启动模块完整。
- 真机冒烟覆盖冷启动、存档恢复、公司 2 级、区域铺线、灾害弹窗、广告回调可用性。
- 记录仍存在的非阻塞 UX / 性能 / 资源问题。

不做：

- 不新增玩法。
- 不再大改数值。
- 不重做 UI 资产。

验收：

- `npm run verify:client`
- 微信开发者工具 / 真机手动冒烟

切换条件：验收通过后，看板进入后续试玩反馈修复模块；没有明确反馈前不新增大模块。

## 下一步

等待试玩反馈修复模块输入；没有明确反馈前不新增大模块。
