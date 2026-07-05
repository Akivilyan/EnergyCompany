---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 1.177.0
sources:
  - docs/design/TASK-LIST.md
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
depends_on:
  - engineering/implementation-tasks
open_questions: []
---

# 项目级任务看板

本文件只记录当前模块、当前状态和下一步。规则写入 `codex-project-rules.md`；执行结果写入 Git commit 与最终回复；历史查 Git 或归档。

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
| FAST-01 Demo 路线矩阵 | done |
| UI-PREFAB-01 城市页样张 | doing |

## 下一步

1. 完成 `UI-PREFAB-01`：城市页正式 UI / Prefab 样张模块，交付资产槽位、状态 token、静态预检与验证结果。
2. 保持 demo 路线矩阵常绿：`sim:playtest-bundle` 作为完整 demo 回归入口。
3. 后续模块独立交付：数值收敛、提示精修、广告 SDK 真机链路。
