---
id: engineering/cursor-toolbox
title: 项目工具清单
status: draft
version: 0.2.0
sources:
  - docs/design/engineering/codex-project-rules.md
  - docs/design/engineering/cocos-client-setup.md
  - package.json
supersedes: []
depends_on:
  - engineering/codex-project-rules
open_questions: []
---

# 项目工具清单

本文件保留项目专用命令与工具入口，不再依赖 Cursor 规则体系。协作约束与验证选择见 `codex-project-rules.md`。

## 1. 常用命令

| 命令 | 用途 |
|------|------|
| `npm test` | sim / modules / app / ui 回归 |
| `npm run build` | TypeScript 编译 |
| `npm run lint:boundaries` | 层间引用检查 |
| `npm run build:client` | 配置与客户端共享资源同步 |
| `npm run verify:client` | 客户端聚合验证 |
| `npm run check:cocos-preview` | 探测 Cocos 预览页 |
| `npm run sim:*` | 各类 CLI 冒烟脚本 |

## 2. 外部工具

| 工具 | 用途 |
|------|------|
| Cocos Creator 3.8.8 | 客户端工程编辑与构建 |
| 微信开发者工具 | 微信小游戏预览与真机调试 |
| `gh` CLI | GitHub PR / CI / 评论查询 |

## 3. 常用文档

| 用途 | 文件 |
|------|------|
| 协作规则 | `docs/design/engineering/codex-project-rules.md` |
| 当前任务 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 客户端联调 | `docs/design/engineering/cocos-client-setup.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 去 Cursor 化，保留项目专用命令、外部工具与入口清单 |
