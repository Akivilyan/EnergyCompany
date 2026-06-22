# Agent 协作说明（Energy Company）

> 每个新 Agent 会话先读本文件。

## 项目一句话

微信小游戏（Cocos Creator 3.x + TypeScript）+ 纯 TS 模拟核心。规则真理在 `src/sim/`，UI/Cocos 只编排，不直改状态。

## 硬约束

### 1. Git 节奏

- 每完成一个清晰的功能性子步骤，立即本地 `git commit`
- 用户说阶段完成、到阶段节点、或明确要求时，再 `git push`
- 不等用户提醒才 commit
- 不把无关文件混进同一 commit
- 未经要求不 `force push`

### 2. 最小验证

| 改动类型 | 至少运行 |
|----------|----------|
| `src/sim/`、`src/modules/`、`tests/` | `npm test` |
| TS 编译相关 | `npm run build` |
| 模块边界 | `npm run lint:boundaries` |
| `docs/design/data/vertical-slice-v0/` | `npm run build:client` |
| Cocos / 客户端 | `npm run verify:client` 或说明手动构建路径 |
| 仅文档 / 看板 | 说明无需跑测试 |

### 2.1 Windows / Codex 执行环境注意事项

- 这台 Windows 机器在 Codex 受限沙箱里，Node 通过 `child_process` 启动项目内原生 `.exe` 时可能报 `spawn EPERM`
- 已确认受影响链路包括 `esbuild` 服务进程，以及依赖它的 `vite` / `vitest` / `tsx` 相关命令
- 典型失败：`npm test` 或 `npm run build:client` 在普通沙箱下报 `node_modules/esbuild/lib/main.js` 或 `node_modules/vite/node_modules/esbuild/lib/main.js` 的 `spawn EPERM`
- 这不是项目测试失败，也不是 Windows 普遍不能跑 esbuild；提权后同一命令可正常通过
- 遇到 `npm test`、`npm run build:client`、`npm run verify:client`、`tsx ...`、`vitest ...`、`vite ...`、`esbuild ...`，需要时直接用 `require_escalated` 重跑，不要把 EPERM 当作业务问题先排查
- `npm run build` 当前走 `tsc`，通常不需要提权；若未来也出现类似子进程/权限错误，再按实际错误提权确认

### 3. 架构禁区

- `src/sim/` 不依赖 `cc.*`
- `src/sim/` 不直接碰存档、平台 SDK、UI 状态
- UI / Cocos 不直接改 `GameState`
- `config` 只读查询，不承载业务流程判断

### 4. 会话收尾

- 改了代码或任务状态，就更新 `docs/design/engineering/PROJECT-TASK-BOARD.md`
- 回复里说明实际验证命令与结果

### 4.1 格式与行尾

- 根目录 `.editorconfig` 与 `.gitattributes` 视为仓库默认格式约束
- 文本文件默认保持 `UTF-8 + LF`
- `*.bat` / `*.cmd` / `*.ps1` 保持 `CRLF`
- 非功能性改动不要顺手重排无关格式，避免制造“只改一行逻辑却整段红绿 diff”噪音

### 5. 回复语言

简体中文。

## 先看哪些文件

| 用途 | 文件 |
|------|------|
| 当前进度 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 实现拆条 | `docs/design/engineering/IMPLEMENTATION-TASKS.md` |
| 协作细则 | `docs/design/engineering/codex-project-rules.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos 联调 | `docs/design/engineering/cocos-client-setup.md` |
