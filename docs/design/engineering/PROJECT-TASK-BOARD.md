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
- 状态：`done`
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
| UI-SHELL-LONG-01 成品级 UI 架构壳 | done |

## 模块队列

| 模块 | 状态 | 切换条件 |
|------|------|----------|
| `UI-SHELL-LONG-01` 成品级 UI 架构壳 | done | 验收通过后进入 UI 美术资源设计与补充 |
| UI 美术资源设计与补充 | ready | UI 壳稳定后启动，需要用户审美术方向与资源质量 |
| 游戏引导模块 | pending | UI 壳与主要美术资源稳定后启动 |

## 下一步

推进 `UI-SHELL-LONG-01`。该模块允许长程连续实施，中途仅在设计冲突、资源策略冲突、权限问题或技术阻塞时停下来确认；完成后再进入 UI 资源设计与补充，最后做游戏引导。
