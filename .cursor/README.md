# Cursor 配置（本仓库）

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

## 通用基座

跨项目模板与 skill 在同级目录 [cursor-workbench](../../cursor-workbench/README.md)。

## 若 Agent 仍不遵守

1. 确认 Cursor **Project Rules** 已加载（Settings → Rules）
2. **语言偏好**（例如尽量中文）通常不冲突；重点检查 **行为规则**（例如「仅在被要求时 commit」）是否与本项目相反
3. 新会话第一条消息可写：`按 AGENTS.md 和 .cursor/rules 执行，勿重复问我提交策略`
