---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 1.56.0
sources:
  - docs/design/TASK-LIST.md
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
supersedes: []
depends_on:
  - engineering/implementation-tasks
open_questions: []
---

# 项目级任务看板

本文件只回答“当前在干什么、下一步做什么”。执行流水、验证记录与版本记录由 Git 历史和提交说明承接；更早历史见 `archive/project-task-board-history.md` 与 Git 历史。

## 1. 当前阶段

- 当前阶段：`FAST-01` Playable Demo 快线
- 当前策略：冻结非阻塞小问题，把开发重心从 `vertical-slice-v0` 最小验证切到“更完整 demo 内容落地”
- 当前重点：优先扩内容，而不是继续打磨非阻塞小问题

## 2. 当前任务

- 任务 ID：`FAST-01`
- 标题：Playable Demo 快线落地（从 v0 最小裁剪闭环推进到更完整、可持续试玩的 demo）
- 状态：`doing`
- 开始时间：2026-06-18
- 完成定义：
  - 不再被真机/微信工具的小问题阻塞主线
  - 明确下一批要补齐的可玩内容范围，而不是继续停在最小验证态
  - 至少形成一个可执行的后续开发批次：地图扩张、公司等级扩张、科技内容扩张、UI 正式化排期

## 3. 当前工程摘要

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48–T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | done |
| FAST-01 Demo 快线 | doing |
| OPS-01 文档与规则收敛 | done |
| 开发前真相固化 | done |

## 4. 下一步

1. 继续把 V 级后新开的 `MAP-06~08` / `MET-B` 从“有差异提示”推进到“有差异化经营压力”
2. 继续把 III～V 级科技从“有节点”推进到“有后续经营分叉”，优先补生态改造与更长经营差异
3. 继续保持 `build` / `test` / `build:client` / `verify:client:fast` / `verify:client` 持续可跑
4. 再回头收正式 UI / SDK / 数值收敛
5. 继续精简工程文档：入口文档保留当前状态与决策信息，流水由 Git 承接

## 5. 最近进展摘要

| 日期 | 摘要 |
|------|------|
| 2026-06-30 | `FAST-01` 为区域/大地图 HUD 增加经营路线摘要：先接主干、补缺口、本地风光、火电兜底、核电锚点、超水电受入、高效占槽 |
| 2026-06-29 | `FAST-01` 为区域/大地图 HUD 增加经营压力标签：高负荷、供给缺口、主干优先、槽位紧、无水电、化石转型、核电选址 |
| 2026-06-29 | `FAST-01` 为科技树/HUD 增加效果摘要：生态改造、贷款档位、绿色品牌、灾害减压等节点可直接显示经营分叉 |
| 2026-06-29 | `FAST-01` 为区域/大地图 HUD 增加推荐建设路线：`MAP-06~08` / `MET-B` 按资源、火电、核电、水电条件显示差异化经营打法 |
| 2026-06-29 | 删除 `PROJECT-LOG.md`：执行流水、验证记录和版本记录改由 Git commit 与最终回复承接 |

## 6. 文档分工

| 用途 | 文件 |
|------|------|
| 当前状态与下一步 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 完整长历史 | `docs/design/engineering/archive/project-task-board-history.md` |
| 可执行任务模板 | `docs/design/engineering/IMPLEMENTATION-TASKS.md` |
| 协作与验证规则 | `docs/design/engineering/codex-project-rules.md` |

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.50.0 | 2026-06-29 | 拆分主看板职责：主看板只保留当前状态、下一步和最近摘要 |
| 1.51.0 | 2026-06-29 | 删除 `PROJECT-LOG.md` 入口：流水和验证记录改由 Git 历史与提交说明承接 |
| 1.52.0 | 2026-06-29 | 记录 `eng_cashflow` 经营科技落地 |
| 1.53.0 | 2026-06-29 | 记录区域/大地图推荐建设路线落地 |
| 1.54.0 | 2026-06-29 | 记录科技树/HUD 效果摘要落地 |
| 1.55.0 | 2026-06-29 | 记录区域/大地图经营压力标签落地 |
| 1.56.0 | 2026-06-30 | 记录区域/大地图经营路线摘要落地 |
