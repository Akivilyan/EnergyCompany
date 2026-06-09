# Agent 协作说明（Energy Company）

> **每个新 Agent 会话必须先读本文件。** 用户不应重复说明下列约定。

## 项目一句话

微信小游戏（Cocos Creator 3.x + TypeScript）+ **纯 TS 模拟核心**。规则真理在 `src/sim/`，UI/Cocos 只编排，不直改状态。

## 核心约定

### 1. Git 节奏

- **每完成一个清晰的功能性子步骤** → 立即本地 `git commit`（只含该步骤相关文件）
- **用户说阶段完成 / 看板阶段节点 / 明确要求 push** → `git push` 到远端
- **不要**等用户说「提交一下」才 commit；**不要**把无关文件混进同一 commit
- **不要**在用户未要求时 force push

### 2. 会话结束

- 若改动了代码或任务状态 → 更新 [docs/design/engineering/PROJECT-TASK-BOARD.md](docs/design/engineering/PROJECT-TASK-BOARD.md) 的「当前任务」与「会话日志」
- 说明验证命令及结果

### 3. 最小验证

| 改动类型 | 至少运行 |
|----------|----------|
| sim/core/modules | `npm test` |
| TS 编译相关 | `npm run build` |
| 模块边界 | `npm run lint:boundaries` |
| 配置表 / sync | `npm run build:client` + 相关 verify |
| Cocos 客户端 | `npm run verify:client` 或说明手动构建路径 |

### 4. 架构禁区

- `src/sim/` 不依赖 `cc.*`、不碰存档/SDK
- UI/Cocos 不直接改 `GameState`
- 改 `docs/design/data/vertical-slice-v0/` 后考虑 `npm run build:client`

## 规则入口

- always-apply 规则：`.cursor/rules/session-discipline.mdc`、`project-context.mdc`、`verification.mdc`
- 按文件触发：`.cursor/rules/sim-architecture.mdc`、`cocos-wechat.mdc`
- 说明文件：`.cursor/README.md`

## 文档入口

| 用途 | 文件 |
|------|------|
| 当前进度 | [PROJECT-TASK-BOARD.md](docs/design/engineering/PROJECT-TASK-BOARD.md) |
| 任务拆条 | [IMPLEMENTATION-TASKS.md](docs/design/engineering/IMPLEMENTATION-TASKS.md) |
| 模块边界 | [architecture.md](docs/design/engineering/architecture.md) |
| Cocos 联调 | [cocos-client-setup.md](docs/design/engineering/cocos-client-setup.md) |
| 通用 Agent 模板 | 上级目录 [cursor-workbench](../cursor-workbench/README.md) |

## 外部工具

- 构建输出：`client/cocos/build/wechatgame`
- CLI 报 `open` 成功 ≠ 窗口已显示；2.x 首次可能慢启动 3～5 分钟
- 排查：清僵尸进程 → 确认服务端口 → 手动 `cli.bat open --project <绝对路径>`

## 回复语言

简体中文。
