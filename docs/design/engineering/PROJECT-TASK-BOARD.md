---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 0.2.0
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

- 当前阶段：`T51` 微信小游戏构建与真机冒烟
- 当前策略：先稳定闭环与客户端联调，再做数值精调

## 2. 当前任务

- 任务 ID：`OPS-01`
- 标题：协作基座收口（Codex 接手 / 项目规则 / 文档入口去重）
- 状态：`doing`
- 开始时间：2026-06-09
- 完成定义：
  - 入口收敛为 `README.md` + `AGENTS.md` + `codex-project-rules.md`
  - 旧 Cursor 规则目录退场
  - 看板与任务历史退出主阅读路径
  - 关键设计页完成一轮职责收敛

## 3. 当前工程摘要

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48–T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | doing |
| 文档入口收敛 | doing |

## 4. 下一步

1. 完成文档收敛与旧 Cursor 规则目录删除
2. 做一次仓库内引用自检
3. 更新看板并结束 `OPS-01`
4. 回到 `T51` 真机构建与冒烟

## 5. 近期日志

| 日期 | 结论 | 变更文件 | 验证 |
|------|------|----------|------|
| 2026-06-04 | 收口 `T50-CLOSE`：客户端 HUD 聚合验证可用 | `src/app/clientHudSmoke.ts` `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `docs/design/engineering/cocos-client-setup.md` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-09 | 启动 `OPS-01`：收敛项目规则入口，整理工具箱与项目专用协作能力 | `README.md` `AGENTS.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档/规则整理，无需跑测试 |
| 2026-06-17 | Codex 接手：补接手上下文，准备把项目规则从 Cursor 体系迁回正式文档 | `docs/design/engineering/codex-handoff.md` `README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 文档收敛：重写入口、压缩任务与看板、建立归档层并准备删除旧 Cursor 规则目录 | `README.md` `AGENTS.md` `docs/design/README.md` `docs/design/META.md` `docs/design/LEGACY.md` `docs/design/TASK-LIST.md` `docs/design/engineering/*.md` `docs/design/archive/*` | 仅文档整理，无需跑测试 |

## 6. 阶段摘要

- `T45`：模拟核心、主要屏幕壳层、回归脚本、存档与广告 stub 已完成
- `T48–T49`：应用装配、客户端挂载、配置同步、存档恢复已完成
- `T50`：开发 HUD、导航、公司/科技/事件/区域入口已完成
- `OPS-01`：正在把协作入口和历史文档收敛到更干练的结构

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 压缩主看板，仅保留当前状态、阶段摘要与近期日志 |
