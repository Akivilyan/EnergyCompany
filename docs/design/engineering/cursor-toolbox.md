---
id: engineering/cursor-toolbox
title: Cursor 工具箱（项目专用）
status: draft
version: 0.1.3
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
  - Browser 是否会在后续 Web 调试页阶段升级为项目级默认 MCP
  - GitHub MCP 启用后，哪些只读查询应从 `gh` CLI 迁移过去
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

## 3. 项目专用 Skills

这些不适合放在通用层，应继续在本项目内维护。

### 第一批已落地（高优先级）

| Skill | 状态 | 目的 | 落点 |
|------|------|------|------|
| `wechat-build-debug` | done | 微信开发者工具慢启动、CLI 唤起、端口/进程排查 | `.cursor/skills/wechat-build-debug/SKILL.md` |
| `cocos-verify` | done | Cocos 相关改动后选择 `build:client` / `verify:client` / `check:cocos-preview` | `.cursor/skills/cocos-verify/SKILL.md` |
| `task-board-sync` | done | 每轮结束统一更新 `PROJECT-TASK-BOARD.md` | `.cursor/skills/task-board-sync/SKILL.md` |
| `sim-change-guard` | done | 改 `src/sim/` / `src/modules/` 时提醒边界、测试与命令选择 | `.cursor/skills/sim-change-guard/SKILL.md` |

### 第二批已落地（常用中优先级）

| Skill | 状态 | 目的 | 落点 |
|------|------|------|------|
| `config-sync-check` | done | 改配置表后执行同步与最小验证，避免漏跑 `build:client` | `.cursor/skills/config-sync-check/SKILL.md` |
| `hud-playtest-check` | done | HUD / 客户端交互改动后的最小冒烟路径选择 | `.cursor/skills/hud-playtest-check/SKILL.md` |
| `ops-phase-close` | done | 阶段支撑任务（如 OPS-01）收口时统一检查入口、看板和工具状态 | `.cursor/skills/ops-phase-close/SKILL.md` |
| `github-pr-ci` | done | GitHub PR / CI / 评论相关的项目工作流与摘要节奏 | `.cursor/skills/github-pr-ci/SKILL.md` |

### 当前技能数量

当前项目专用 skills 共 `8` 个，仍在可控范围内；暂不继续扩低频项。

### 暂缓（低频或还没形成稳定路径）

| Skill | 目的 |
|------|------|
| `browser-page-check` | 若未来出现稳定 Web 调试页 / 文档页自动验证，再补独立 skill |

## 4. 项目专用 MCP 候选

本项目目前更需要的是“能减少上下文沟通”的 MCP，而不是堆太多外部系统。

### 第一批高优先级候选

| MCP | 状态 | 主要场景 | 为什么是高优先级 | 接入前提 |
|-----|------|----------|------------------|----------|
| GitHub | planned | 看 PR、Issue、CI、评论；阶段收口时查远端反馈 | 仓库后续会进入 PR / CI / 评论闭环，信息价值高于其他外部系统 | 当前先用 `gh` CLI；当项目开始频繁处理 PR / CI 时接入 MCP |
| Browser | candidate | Web 调试页、文档页、预览页的自动验证 | 若后续出现稳定的浏览器验证路径，可减少手工点检 | 只有当页面自动化验证成为重复动作时再纳入默认工具链 |

### GitHub 接入策略

当前仓库还没有 GitHub MCP 可直接使用，因此采用“两步走”：

1. 现在：
   - 用 `gh` CLI 处理 PR、Issue、CI、评论摘要
   - 通过 `github-pr-ci` skill 固化查询节奏，避免每次手写流程
2. 未来启用 GitHub MCP 后：
   - 优先把“只读查询类”迁到 MCP
   - 写操作仍保持谨慎，继续按显式请求执行

### Browser 接入策略

当前仓库虽然已有浏览器 MCP，但还不把它当作项目级默认工具：

- 只有在出现稳定、重复的页面验证路径时，才从“可用”升级为“默认”
- 当前仍以 `verify:client`、`check:cocos-preview` 和本地 CLI 为主

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

## 6. 当前收口结论

当前建议保留的“常用项目专用 tools”已经覆盖：

- 模拟层改动边界守卫
- 配置同步
- Cocos / HUD 最小验证
- 微信开发者工具排障
- 看板同步
- 阶段支撑任务收口
- GitHub PR / CI 摘要工作流

低频项先不补，避免技能目录继续膨胀。

## 7. 下一阶段建议

当前 `OPS-01` 收口完成后，下一阶段建议拆成两步：

1. 保持现有项目专用 skills 稳定使用，观察是否真有缺口
2. 再决定是否接入 **少量高价值 MCP**

顺序不要反过来，因为当前最大的痛点仍然是“协作习惯与任务收口”，不是远端工具不够多。
