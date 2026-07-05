# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。协作规则写入根目录 `AGENTS.md`；执行结果写入 Git commit 与最终回复；历史查 Git。

模块完成后只改三处：当前模块状态、下一个模块状态、当前工程状态。不写流水、最近进展或变更记录。

## 当前产品定位

- 平台：微信小游戏
- 客户端：`Cocos Creator 3.x + TypeScript`
- 规则真理：`src/sim/`
- 当前目标：在已跑通玩法闭环的基础上，先搭完整成品级 UI 架构壳，再进入美术资源设计与补充，最后补游戏引导。

## 当前版本范围

已纳入当前版本：

- 单局按月推进的经营闭环
- 城市建设、区域铺线、科技研发、公司经营、固定灾害轴、终局判定
- `src/sim/` 规则闭环、`src/modules/` 编排层、`client/cocos/` 客户端壳层
- 微信小游戏构建路径、客户端聚合验证、真机冒烟路径

当前不作为 UI 壳模块阻塞项：

- 最终美术资源定稿
- 真正接入微信激励广告 SDK
- 大规模数值精调
- 对含糊设计数据的逐项精磨

## 当前阶段

- 阶段：模块交付制推进
- 当前模块：`UI-SHELL-LONG-01`
- 模块标题：成品级 UI 架构壳
- 状态：`ready`
- 开始时间：2026-07-05

## 当前模块完成定义

### `UI-SHELL-LONG-01` 成品级 UI 架构壳

目标：不追求最终美术，但按未来成品 UI 搭完整页面架构、资源插槽、状态绑定和交互分区，让后续正式图片、图标、科技点资源可以替换进入，而不是推倒重做。

输入：

- `docs/design/ui/art-direction.md`
- `docs/design/ui/00-screen-map.md`
- `docs/design/ui/construction-flow.md`
- `docs/design/ui/company.md`
- `docs/design/ui/tech-tree.md`
- `docs/design/ui/region-main.md`
- `docs/design/ui/world-map.md`
- `docs/design/ui/events.md`
- `docs/design/ui/run-result.md`
- 当前 Cocos `GameRoot` / `CityHudPanel` / `hudLayout` / scene registry

输出：

- 启动入口壳：开始新游戏、继续、清档重开、当前存档提示。
- 城市页壳：背景层、建筑插槽、电网层、状态反馈层、资源栏、城市状态卡、建设操作区、底部导航。
- 公司页壳：公司概览、现金流、贷款、广告激励、升级目标区块。
- 科技页壳：科技分支、节点占位、当前研发、候选研发、加速入口。
- 区域页壳：城市节点、线路、候选铺线、在建/完成状态。
- 大地图壳：区域节点、解锁状态、主干线、候选目标。
- 灾害/事件壳：全屏弹窗、确认按钮、影响说明、恢复建议。
- 结果页壳：胜负结果、路线摘要、重开入口。
- 通用 UI 基础：按钮样式、面板样式、图标占位、资源位命名、状态 token。

不做：

- 不新增玩法。
- 不调数值。
- 不产最终美术资源。
- 不做游戏引导。
- 不接真实广告收益/IAP。

验收：

- `npm run check:cocos-ts`
- `npm run verify:client:fast`
- 涉及入口装配或共享包时补 `npm run build`

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
| PLAYTEST-UI-01 试玩可交付 UI 首屏 | done |
| UI-SHELL-LONG-01 成品级 UI 架构壳 | ready |

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

### 6. `PLAYTEST-UI-01` 试玩可交付 UI 首屏

状态：`done`

目标：把开发 HUD 的首屏城市页推进到普通试玩者可读、能知道下一步该点什么的状态。

输入：

- `docs/design/ui/art-direction.md`
- `docs/design/ui/00-screen-map.md`
- `docs/design/ui/construction-flow.md`
- 当前 Cocos `CityHudPanel` / `hudLayout`

输出：

- 城市页顶部资源栏更紧凑。
- 城市状态卡过滤开发态导航信息，只保留候选建造、建造建议、灾害轴、压力拆解、科技解法等可行动信息。
- 保持现有按钮能力与规则状态一致，不改变玩法命令。

不做：

- 不新增玩法。
- 不调数值。
- 不做全屏幕正式 Prefab 重做。

验收：

- `npm run check:cocos-ts`
- `npm run verify:client:fast`

切换条件：首屏试玩反馈明确后，进入下一批 UI 分层或具体屏幕 UI 模块。

### 7. `UI-SHELL-LONG-01` 成品级 UI 架构壳

状态：`ready`

目标：不追求最终美术，但按未来成品 UI 搭完整页面架构、资源插槽、状态绑定和交互分区，让后续正式图片、图标、科技点资源可以替换进入，而不是推倒重做。

输入：

- `docs/design/ui/art-direction.md`
- `docs/design/ui/00-screen-map.md`
- `docs/design/ui/construction-flow.md`
- `docs/design/ui/company.md`
- `docs/design/ui/tech-tree.md`
- `docs/design/ui/region-main.md`
- `docs/design/ui/world-map.md`
- `docs/design/ui/events.md`
- `docs/design/ui/run-result.md`
- 当前 Cocos `GameRoot` / `CityHudPanel` / `hudLayout` / scene registry

输出：

- 启动入口壳：开始新游戏、继续、清档重开、当前存档提示。
- 城市页壳：背景层、建筑插槽、电网层、状态反馈层、资源栏、城市状态卡、建设操作区、底部导航。
- 公司页壳：公司概览、现金流、贷款、广告激励、升级目标区块。
- 科技页壳：科技分支、节点占位、当前研发、候选研发、加速入口。
- 区域页壳：城市节点、线路、候选铺线、在建/完成状态。
- 大地图壳：区域节点、解锁状态、主干线、候选目标。
- 灾害/事件壳：全屏弹窗、确认按钮、影响说明、恢复建议。
- 结果页壳：胜负结果、路线摘要、重开入口。
- 通用 UI 基础：按钮样式、面板样式、图标占位、资源位命名、状态 token。

不做：

- 不新增玩法。
- 不调数值。
- 不产最终美术资源。
- 不做游戏引导。
- 不接真实广告收益/IAP。

验收：

- `npm run check:cocos-ts`
- `npm run verify:client:fast`
- 涉及入口装配或共享包时补 `npm run build`

切换条件：UI 壳全链路验收通过后，进入 UI 美术资源设计与补充；美术资源阶段完成后，再进入游戏引导模块。

## 下一步

推进 `UI-SHELL-LONG-01`。该模块允许长程连续实施，中途仅在设计冲突、资源策略冲突、权限问题或技术阻塞时停下来确认；完成后再进入 UI 资源设计与补充，最后做游戏引导。
