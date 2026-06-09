# Cursor 配置（本仓库）

## 三层入口

| 入口 | 职责 |
|------|------|
| `README.md` | 仓库简介与开发入口 |
| `AGENTS.md` | 新 Agent 必须遵守的一页硬约束 |
| `.cursor/README.md` | 规则结构、加载说明、冲突排查 |

## 规则文件

| 文件 | 作用 |
|------|------|
| `rules/session-discipline.mdc` | 会话纪律、提交/推送节奏、看板更新 |
| `rules/project-context.mdc` | 项目结构、命令、阅读入口 |
| `rules/verification.mdc` | 改完后的最小验证 |
| `rules/sim-architecture.mdc` | `src/sim` / `src/modules` / `tests` 的边界 |
| `rules/cocos-wechat.mdc` | Cocos 与微信工具联调 |

## 入口

根目录 [AGENTS.md](../AGENTS.md) — 每个新 Agent 应先读。  
规则模板与跨项目协作基座在同级目录 [cursor-workbench](../../cursor-workbench/README.md)。

## 工具箱分层

- 通用工具箱：`../cursor-workbench/docs/toolbox/common-toolbox.md`
- 项目专用工具箱：`../docs/design/engineering/cursor-toolbox.md`

## 项目 Skills

项目专用 skills 放在 `.cursor/skills/`：

| Skill | 用途 |
|------|------|
| `wechat-build-debug` | 微信开发者工具慢启动、`cli.bat`、端口/进程排查 |
| `cocos-verify` | Cocos / 客户端改动后的最小验证命令选择 |
| `task-board-sync` | 会话结束时同步 `PROJECT-TASK-BOARD.md` |
| `sim-change-guard` | `src/sim` / `src/modules` 改动边界与验证守卫 |
| `config-sync-check` | 配置表改动后的同步与最小验证 |
| `hud-playtest-check` | HUD / 客户端交互改动后的最小冒烟路径 |
| `ops-phase-close` | 阶段支撑任务 / 协作基座任务收口检查 |
| `github-pr-ci` | GitHub PR / CI / 评论相关的项目工作流 |

若后续继续扩项目专用协作能力，优先补这里，不要回写到通用层。

## 当前结构

- always-apply：`session-discipline.mdc`、`project-context.mdc`、`verification.mdc`
- 按文件触发：`sim-architecture.mdc`、`cocos-wechat.mdc`

## 当前阶段说明

2026-06-09 起，本仓库正在进行一轮 **协作基座收口**：
- 收敛项目规则入口
- 为后续扩充 skills / MCP 做准备
- 完成后再继续扩展工具箱，而不是继续堆临时提示词

## 若 Agent 仍不遵守

1. 确认 Cursor **Project Rules** 已加载（Settings → Rules）
2. **语言偏好**（例如尽量中文）通常不冲突；重点检查 **行为规则**（例如「仅在被要求时 commit」）是否与本项目相反
3. 新会话第一条消息可写：`按 AGENTS.md 和 .cursor/rules 执行，勿重复问我提交策略`
