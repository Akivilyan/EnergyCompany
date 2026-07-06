# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。协作规则写入根目录 `AGENTS.md`；执行结果写入 Git commit 与最终回复；历史查 Git。

模块完成后只改三处：当前模块状态、下一个模块状态、当前工程状态。不写流水、最近进展或变更记录。

## 当前产品定位

- 平台：微信小游戏
- 客户端：`Cocos Creator 3.x + TypeScript`
- 规则真理：`src/sim/`
- 当前目标：在已跑通玩法闭环与 UI 壳的基础上，先完成 UI 架构解耦收口，再进入美术资源设计与补充，最后补游戏引导。

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
- 当前模块：`UI-REBUILD-FOUNDATION-01`
- 模块标题：UI 架构瘦身与解耦基础
- 状态：`done`
- 开始时间：2026-07-06

## 当前模块完成定义

### `UI-REBUILD-FOUNDATION-01` UI 架构瘦身与解耦基础

目标：冻结旧 `CityHudPanel` 单体增长路径，建立 `ScreenHost` / `ScreenPanel` 分层与公共 UI 控件基础，让新增屏幕 UI、按钮和展示字段只修改对应 screen 目录或 display builder，不再牵动全局 HUD 单体。

输入：

- 当前 Cocos `GameRoot` / `CityHudPanel` / `hudLayout` / `uiShellStageSpec`
- 当前 `clientHudDisplay` / HUD controller / screen module 输出

输出：

- `CityHudPanel` 降级为启动、导航、城市视觉底层和全局壳宿主。
- Company、Tech、RunResult、Event、World、Region、City 迁移为独立 `ScreenPanel`。
- 屏幕按钮通过 screen action/viewModel/panel 分层组织，不再在 `CityHudPanel` 手写堆叠。
- `clientHudDisplay` 降级为 display registry 入口，各屏展示 builder 按目录拆分。
- `uiShellStageSpec` 保留为壳层 slot/token manifest，不承载屏幕行为。

不做：

- 不新增玩法。
- 不调数值。
- 不产最终美术资源。
- 不做游戏引导。
- 不接真实广告收益/IAP。

验收：

- `npm run check:cocos-ts`
- `npm run verify:client:fast`
- `npm run build`
- `npm test`
- `npm run lint:boundaries`

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
| UI-REBUILD-FOUNDATION-01 UI 架构瘦身与解耦基础 | done |

## 模块队列

| 模块 | 状态 | 切换条件 |
|------|------|----------|
| `UI-SHELL-LONG-01` 成品级 UI 架构壳 | done | 验收通过后进入 UI 美术资源设计与补充 |
| `UI-REBUILD-FOUNDATION-01` UI 架构瘦身与解耦基础 | done | 验收通过后恢复游戏实现与资源补充 |
| UI 美术资源设计与补充 | ready | UI 壳稳定后启动，需要用户审美术方向与资源质量 |
| 游戏引导模块 | pending | UI 壳与主要美术资源稳定后启动 |

## 下一步

基于已解耦的 screen panel 和 display builder 恢复游戏实现推进；新增 UI 只进入对应 screen 目录、HUD controller 或 display builder，避免回到 `CityHudPanel` 单体补丁路径。
