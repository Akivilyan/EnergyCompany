---
id: engineering/project-task-board
title: 项目状态与任务看板
status: draft
version: 2.0.0
sources:
  - docs/design/gdd/00-vision.md
  - docs/design/gdd/01-core-loop.md
open_questions: []
---

# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。协作规则写入根目录 `AGENTS.md`；执行结果写入 Git commit 与最终回复；历史查 Git。

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
- 当前模块：`UI-PREFAB-01`
- 模块标题：正式 UI / Prefab 城市页样张模块交付
- 状态：`doing`
- 开始时间：2026-07-04

## 当前模块完成定义

- 城市页正式 UI 样张具备稳定的背景、设施、电网、状态、面板、图标与交互槽位层级。
- 运行时状态 token 与静态预检覆盖关键资产槽位和交互状态。
- 模块交付时给出输入、输出/API、验证命令与结果。
- 广告 SDK、数值平衡与提示精修保持后置模块，不混入当前模块。

## 当前工程状态

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48-T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | done |
| Demo 七条核心试玩路线 | done |
| UI-PREFAB-01 城市页样张 | doing |

## 下一步

1. 完成 `UI-PREFAB-01`：城市页正式 UI / Prefab 样张模块，交付资产槽位、状态 token、静态预检与验证结果。
2. 保持 demo 路线矩阵常绿：`sim:playtest-bundle` 作为完整 demo 回归入口。
3. 后续模块独立交付：数值收敛、提示精修、广告 SDK 真机链路。
