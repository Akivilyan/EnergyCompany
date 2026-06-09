---
id: engineering/cursor-toolbox
title: Cursor 工具箱（项目专用）
status: draft
version: 0.1.0
sources:
  - AGENTS.md
  - .cursor/README.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/cocos-client-setup.md
  - package.json
supersedes: []
depends_on:
  - engineering/architecture
  - engineering/cocos-client-setup
open_questions:
  - 后续优先补哪些项目专用 skills / MCP
---

# Cursor 工具箱（项目专用）

> 这份清单只收 **Energy Company 专用** 的协作能力。  
> 通用能力请看同级 `cursor-workbench` 中的 [通用工具箱](../../../../cursor-workbench/docs/toolbox/common-toolbox.md)。

## 1. 目标

把当前微信小游戏项目需要的工具、rules、skills、MCP 与脚本入口单独列清，避免和通用基座混写。

## 2. 当前已有的项目专用能力

### 2.1 Rules

| 文件 | 作用 |
|------|------|
| `.cursor/rules/session-discipline.mdc` | 分功能 commit、阶段 push、看板更新 |
| `.cursor/rules/project-context.mdc` | 当前仓库结构与默认命令 |
| `.cursor/rules/verification.mdc` | 改动后的最小验证 |
| `.cursor/rules/sim-architecture.mdc` | `src/sim` / `src/modules` / `tests` 边界 |
| `.cursor/rules/cocos-wechat.mdc` | Cocos 与微信开发者工具联调 |

### 2.2 文档入口

| 用途 | 文件 |
|------|------|
| Agent 一页硬约束 | `AGENTS.md` |
| Cursor 规则说明 | `.cursor/README.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos 构建与联调 | `docs/design/engineering/cocos-client-setup.md` |
| 当前阶段与续航 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |

### 2.3 项目脚本

| 命令 | 用途 |
|------|------|
| `npm test` | sim / modules 回归 |
| `npm run build` | TS 编译 |
| `npm run lint:boundaries` | import 边界检查 |
| `npm run build:client` | 配置同步到 client |
| `npm run verify:client` | Cocos 客户端聚合验证 |
| `npm run check:cocos-preview` | 探测预览页是否起来 |
| `npm run sim:*` | 各类 CLI 冒烟与闭环检查 |

## 3. 下一批建议补充的项目专用 Skills

这些不适合放在通用层，应该先在本项目里落地：

### 高优先级

| Skill | 目的 |
|------|------|
| `wechat-build-debug` | 微信开发者工具慢启动、CLI 唤起、端口/进程排查 |
| `cocos-verify` | Cocos 相关改动后自动选择 `build:client` / `verify:client` / `check:cocos-preview` |
| `task-board-sync` | 每轮结束统一更新 `PROJECT-TASK-BOARD.md` |
| `sim-change-guard` | 改 `src/sim/` 时强制提醒边界、测试与命令选择 |

### 中优先级

| Skill | 目的 |
|------|------|
| `config-sync-check` | 改 `docs/design/data/vertical-slice-v0/` 后同步与验证 |
| `hud-playtest-check` | 开发 HUD / 客户端交互改动后的最小冒烟 |
| `ops-phase-close` | 阶段支撑任务（如 OPS-01）收口时的统一检查与提交整理 |

## 4. 下一批建议补充的项目专用 MCP

本项目目前更需要的是“能减少上下文沟通”的 MCP，而不是堆太多外部系统。

### 建议优先

| MCP | 作用 | 备注 |
|-----|------|------|
| GitHub | 看 PR、Issue、CI、评论 | 通用但对当前项目高价值 |
| Browser | 如果后续 Web 调试页或文档页面需要自动验证 | 条件启用 |

### 暂缓

| MCP | 原因 |
|-----|------|
| 微信小游戏专用 MCP | 当前更适合本地 CLI + 日志，暂未见成熟通用 MCP |
| 数据库类 MCP | 当前项目并不依赖数据库 |
| 任务系统类 MCP | 目前以仓库文档和看板为主，未形成刚需 |

## 5. 通用 vs 项目专用的分界

以下内容应继续放在项目层，而不是回写到通用基座：

- `client/cocos/` 相关命令与目录
- 微信开发者工具 `cli.bat`、构建输出目录
- `PROJECT-TASK-BOARD.md` 的更新策略
- `ui/cocos -> modules -> sim <- config` 这套项目架构
- `sim:city-loop`、`verify:client`、`check:cocos-preview` 等脚本名

## 6. 下一阶段建议

当前 `OPS-01` 收口完成后，下一阶段建议拆成两步：

1. 先补 **项目专用 skills**
2. 再决定是否接 **少量高价值 MCP**

顺序不要反过来，因为当前最大的痛点仍然是“协作习惯与任务收口”，不是远端工具不够多。
