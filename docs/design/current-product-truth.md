---
id: design/current-product-truth
title: 当前产品真相与阶段定义
status: draft
version: 1.0.0
sources:
  - docs/design/gdd/00-vision.md
  - docs/design/gdd/01-core-loop.md
  - docs/design/engineering/PROJECT-TASK-BOARD.md
depends_on:
  - gdd/00-vision
  - gdd/01-core-loop
  - engineering/project-task-board
open_questions: []
---

# 当前产品真相与阶段定义

本文件只回答当前版本要做什么、已经做到什么程度、什么状态算阶段完成。协作规则看 `AGENTS.md`；当前任务看 `engineering/PROJECT-TASK-BOARD.md`；执行历史看 Git。

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

## 当前已完成事实

- `T45` P0 闭环已完成：模拟核心、月结主流程、主要屏幕壳层、存档与广告 stub 已落地。
- `T48-T50` 已完成：应用装配、客户端挂载、配置同步、自动读档、`wx.onHide` 存档恢复、开发 HUD 与导航已接通。
- `T51` 已完成基础链路：微信小游戏构建路径存在，真机可启动基础链路。
- Demo 七条核心试玩路线已纳入 `sim:playtest-bundle`：固定 demo、地图/区域扩张、城市建设分支、公司 I-V、科技分支效果、灾害压力反制、终局路线。

## 当前阶段定义

当前采用模块交付制。阶段推进由 `PROJECT-TASK-BOARD.md` 中的当前模块定义。

当前模块完成后，后续模块保持独立交付：

- 正式 UI / Prefab 城市页样张
- 数值收敛
- 提示精修
- 广告 SDK 真机链路

## 使用原则

- 判断“当前在干什么”：看 `engineering/PROJECT-TASK-BOARD.md`。
- 判断“当前版本范围和阶段定义”：看本文件。
- 判断“怎么协作、怎么验证、怎么写文档”：看根目录 `AGENTS.md`。
- 判断“最近做了什么、验证怎么跑”：看 Git 历史与最近提交说明。
