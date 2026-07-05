# Energy Company

微信小游戏项目：`Cocos Creator 3.x + TypeScript` 客户端，`src/sim/` 为纯 TS 模拟核心与规则真理源。

## 当前状态

- 推进方式：模块交付制
- 当前状态与模块：见 `docs/design/engineering/PROJECT-TASK-BOARD.md`
- Agent 规则：见 `AGENTS.md`

## 新会话入口

1. `AGENTS.md`
2. `docs/design/engineering/PROJECT-TASK-BOARD.md`

其他文档按任务需要读取：

| 任务 | 文档 |
|------|------|
| 设计总览 | `docs/design/README.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos / 微信联调 | `docs/design/engineering/cocos-client-setup.md` |

## 常用命令

```bash
npm.cmd install
npm.cmd run doctor
npm.cmd test
npm.cmd run build
npm.cmd run lint:boundaries
npm.cmd run verify:client:fast
npm.cmd run verify:client
```

若 PowerShell 遇到 `npm.ps1` 执行策略拦截，优先改用 `npm.cmd`。

命令选择规则见 `AGENTS.md`。涉及 Cocos / 微信排障时，再读 `docs/design/engineering/cocos-client-setup.md`。

## 代码结构

| 路径 | 说明 |
|------|------|
| `src/sim/` | 纯 TS 模拟核心，不依赖引擎 |
| `src/modules/` | 业务编排层，UI 只调用这一层 |
| `src/app/` | CLI 冒烟、装配与客户端入口 |
| `src/ui/` | 引擎无关 UI 壳层与场景桥接 |
| `src/infra/` | 存档、生命周期、广告等外部能力 |
| `client/cocos/` | Cocos 工程 |
