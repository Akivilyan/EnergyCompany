---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 0.3.0
sources:
  - docs/design/TASK-LIST.md
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
supersedes: []
depends_on:
  - engineering/implementation-tasks
open_questions: []
---

# 项目级任务看板

本文件只保留当前阶段、当前任务、下一步和近期日志。完整长流水历史已退出主阅读路径，见 `archive/project-task-board-history.md` 与 Git 历史。

## 1. 当前阶段

- 当前阶段：开发准备
- 当前策略：先固定当前产品真相、阶段完成定义与文档真相，再进入后续开发

## 2. 当前任务

- 任务 ID：`DEV-READY-01`
- 标题：开发前真相固化（当前产品范围 / 阶段完成定义 / 主看板回写）
- 状态：`doing`
- 开始时间：2026-06-17
- 完成定义：
  - `OPS-01` 与 `T51` 的当前真相已回写到主文档
  - 当前产品范围、已完成事实、非阻塞遗留与下一开发重点有单一入口
  - 后续开发开始前，不再需要靠历史流水判断“现在到底做到哪了”

## 3. 当前工程摘要

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48–T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | done |
| OPS-01 文档与规则收敛 | done |
| 开发前真相固化 | doing |

## 4. 下一步

1. 锁定当前产品真相与阶段完成定义
2. 以当前真相页为准，决定下一开发批次
3. 收口仍未 `locked` 的关键 GDD 章节
4. 回到实现与验证闭环

## 5. 近期日志

| 日期 | 结论 | 变更文件 | 验证 |
|------|------|----------|------|
| 2026-06-04 | 收口 `T50-CLOSE`：客户端 HUD 聚合验证可用 | `src/app/clientHudSmoke.ts` `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `docs/design/engineering/cocos-client-setup.md` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-09 | 启动 `OPS-01`：收敛项目规则入口，整理工具箱与项目专用协作能力 | `README.md` `AGENTS.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档/规则整理，无需跑测试 |
| 2026-06-17 | Codex 接手：补接手上下文，准备把项目规则从 Cursor 体系迁回正式文档 | `docs/design/engineering/codex-handoff.md` `README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 文档收敛：重写入口、压缩任务与看板、建立归档层并准备删除旧 Cursor 规则目录 | `README.md` `AGENTS.md` `docs/design/README.md` `docs/design/META.md` `docs/design/LEGACY.md` `docs/design/TASK-LIST.md` `docs/design/engineering/*.md` `docs/design/archive/*` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 回写主真相：依据既有工作历史与当前复核，将 `OPS-01` 标记完成、将 `T51` 从主看板层确认为已完成，并进入开发前真相固化 | `docs/design/engineering/PROJECT-TASK-BOARD.md` `docs/design/current-product-truth.md` `README.md` `docs/design/README.md` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/codex-project-rules.md` `docs/design/engineering/codex-handoff.md` | 仅文档整理，无需跑测试 |

## 6. 阶段摘要

- `T45`：模拟核心、主要屏幕壳层、回归脚本、存档与广告 stub 已完成
- `T48–T49`：应用装配、客户端挂载、配置同步、存档恢复已完成
- `T50`：开发 HUD、导航、公司/科技/事件/区域入口已完成
- `T51`：已完成微信小游戏构建路径与真机冒烟收口；主看板此前未回写，现已补齐
- `OPS-01`：已完成协作入口、规则文档与历史归档收敛
- 当前重点：在进入下一轮开发前，固定“当前产品真相”与“阶段完成定义”

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 压缩主看板，仅保留当前状态、阶段摘要与近期日志 |
| 0.3.0 | 2026-06-17 | 回写 `T51` 与 `OPS-01` 完成状态，新增开发前真相固化任务 |
