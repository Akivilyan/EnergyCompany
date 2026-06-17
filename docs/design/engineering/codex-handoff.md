---
id: engineering/codex-handoff
title: Codex 接手上下文
status: draft
version: 0.2.0
sources:
  - AGENTS.md
  - docs/design/engineering/codex-project-rules.md
  - docs/design/engineering/PROJECT-TASK-BOARD.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/cocos-client-setup.md
  - package.json
supersedes: []
depends_on:
  - engineering/codex-project-rules
  - engineering/project-task-board
  - engineering/architecture
open_questions:
  - `settleNextMonth` 代码顺序与部分文档中的 M1->M14 叙述是否需要再统一说明
---

# Codex 接手上下文

这份文档给 Codex 会话使用，作用是快速接手项目工程地图与当前风险。规则入口已经收敛，优先读 `AGENTS.md` 与 `codex-project-rules.md`。

## 1. 接手结论

- 项目形态：微信小游戏客户端 + 纯 TS 模拟核心
- 规则真理：`src/sim/`
- 架构主线：`ui/cocos -> modules -> sim <- config`
- 当前阶段：`T51` 真机问题收口
- 当前协作结果：文档入口已收敛，项目规则不再依赖旧 Cursor 规则目录

## 2. 必读文件

| 用途 | 文件 |
|------|------|
| 硬约束 | `AGENTS.md` |
| 当前产品真相 | `docs/design/current-product-truth.md` |
| 协作规则 | `docs/design/engineering/codex-project-rules.md` |
| 当前任务 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos 联调 | `docs/design/engineering/cocos-client-setup.md` |

## 3. 代码地图

| 路径 | 当前职责 |
|------|----------|
| `src/sim/` | 状态、命令、月结、序列化、配置访问 |
| `src/modules/` | 屏幕/业务编排，连接 sim 与外部能力 |
| `src/app/` | CLI、客户端装配、验证入口 |
| `src/ui/` | 引擎无关 UI 壳层与场景桥接 |
| `src/infra/` | 存档、生命周期、广告等平台适配 |
| `client/cocos/` | Cocos 工程与开发 HUD |

## 4. 已落地能力

- `dispatch`、`settleNextMonth`、`serializeState` / `deserializeState` 已落地
- `RunController` 与各主要屏幕壳层已可联调
- `mountGameClient`、自动读档、`wx.onHide` 存档、开发 HUD 已接入
- `npm run verify:client` 可覆盖客户端聚合验证

## 5. 当前风险

- 当前阶段的首要风险是真机问题未收口；不要把“已构建并跑起”误判为“阶段完成”
- 月结步骤顺序的文档口径仍需后续再统一
- 当前客户端仍偏开发 HUD，不是最终 UI 资源形态
- 微信激励广告仍是 stub / 预研接入状态

## 6. 新会话最小动作

1. 看 `git status --short`
2. 读 `AGENTS.md`
3. 读 `current-product-truth.md`
4. 读 `PROJECT-TASK-BOARD.md`
5. 按任务决定是否补读 `architecture.md` 或 `cocos-client-setup.md`

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 改为以 `AGENTS.md` 与 `codex-project-rules.md` 为主入口，去除对旧 Cursor 规则目录的依赖 |
