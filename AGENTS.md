# Agent 协作说明（Energy Company）

> 每个新 Agent 会话先读本文件。

## 项目一句话

微信小游戏（Cocos Creator 3.x + TypeScript）+ 纯 TS 模拟核心。规则真理在 `src/sim/`，UI/Cocos 只编排，不直改状态。

## 硬约束

### 1. Git 节奏

- 默认按“开发批次”提交：一个批次可以包含多个紧密相关的小改动，批次收口、阶段节点或准备交接时再本地 `git commit`
- 只有独立风险较高、需要单独回滚的改动，才拆成更小 commit
- 用户说阶段完成、到阶段节点、或明确要求时，再 `git push`
- 不等用户提醒才 commit，但 commit 粒度服从当前快线批次，而不是每走一小步就提交
- 不把无关文件混进同一 commit
- 未经要求不 `force push`

### 2. 验证节奏

- 当前默认采用快线节奏：先连续推进到一个较大的可玩/可验节点，再集中验证
- 开发批次中途不因每个小改动反复编译、测试；除非改动已经阻塞继续开发，或出现明显语法/边界风险
- 批次收口、阶段节点、准备提交、准备交接、或改动触及高风险共享逻辑时，再按下表选择验证
- 若为了速度跳过某项验证，最终回复必须明确说明“未跑”和对应风险

| 改动类型 | 至少运行 |
|----------|----------|
| `src/sim/`、`src/modules/`、`tests/` | `npm test` |
| TS 编译相关 | `npm run build` |
| 模块边界 | `npm run lint:boundaries` |
| `docs/design/data/vertical-slice-v0/` | `npm run build:client` |
| Cocos / 客户端日常改动 | `npm run verify:client:fast` |
| Cocos / 客户端阶段收口、真机前置、微信包排障 | `npm run verify:client` 或说明手动构建路径 |
| 仅文档 / 看板 | 说明无需跑测试 |

### 2.1 Windows / Codex 执行环境注意事项

- PowerShell 读取中文 Markdown 时必须显式指定 UTF-8，例如 `Get-Content -Raw -Encoding UTF8 AGENTS.md`；不要用默认编码读取 `AGENTS.md` / 设计文档，避免中文乱码
- 这台 Windows 机器在 Codex 受限沙箱里，Node 通过 `child_process` 启动项目内原生 `.exe` 时可能报 `spawn EPERM`
- 已确认受影响链路包括 `esbuild` 服务进程，以及依赖它的 `vite` / `vitest` / `tsx` 相关命令
- 典型失败：`npm test` 或 `npm run build:client` 在普通沙箱下报 `node_modules/esbuild/lib/main.js` 或 `node_modules/vite/node_modules/esbuild/lib/main.js` 的 `spawn EPERM`
- 这不是项目测试失败，也不是 Windows 普遍不能跑 esbuild；提权后同一命令可正常通过
- 遇到 `npm test`、`npm run build:client`、`npm run build:client:watch`、`npm run verify:client:fast`、`npm run verify:client`、`tsx ...`、`vitest ...`、`vite ...`、`esbuild ...`，需要时直接用 `require_escalated` 重跑，不要把 EPERM 当作业务问题先排查
- `npm run build` 当前走 `tsc`，通常不需要提权；若未来也出现类似子进程/权限错误，再按实际错误提权确认

### 3. 架构禁区

- `src/sim/` 不依赖 `cc.*`
- `src/sim/` 不直接碰存档、平台 SDK、UI 状态
- UI / Cocos 不直接改 `GameState`
- `config` 只读查询，不承载业务流程判断

### 3.1 设计文档约束

- 项目落地必须遵从设计文档，不允许开发过程中擅自发挥并违背既有设计口径
- 实现前若发现设计文档之间存在冲突、逻辑错漏、未定义空白，或代码侧出现更优设计思路，必须先停下来和用户核对
- 未经用户明确确认，不得自行把“我认为更合理”的方案直接落到代码、配置、数值或流程中
- 如文档与现状实现冲突，默认以当前设计文档为准；需要偏离文档时，先提出差异点与影响，再等用户拍板

### 4. 会话收尾

- 改了当前阶段、当前任务、下一步，就更新 `docs/design/engineering/PROJECT-TASK-BOARD.md`
- 执行流水、验证命令、版本记录由 Git commit 与最终回复承接，不再维护单独日志文档
- 回复里说明实际验证命令与结果

### 4.1 格式与行尾

- 根目录 `.editorconfig` 与 `.gitattributes` 视为仓库默认格式约束
- 文本文件默认保持 `UTF-8 + LF`
- `*.bat` / `*.cmd` / `*.ps1` 保持 `CRLF`
- 非功能性改动不要顺手重排无关格式，避免制造“只改一行逻辑却整段红绿 diff”噪音

### 5. 回复语言

简体中文。

### 5.1 回复简洁度

- 执行任务过程中的中间更新保持简洁，只说明当前动作、关键发现或阻塞，不展开心路历程
- 不输出冗长原理解释、步骤复盘或客套话，除非用户明确要求解释
- 任务收尾仍需给出必要说明：改了什么、验证命令与结果、未完成事项或风险
- 代码修改说明聚焦实际差异；无需整文件重述，除非用户明确要求

## 先看哪些文件

| 用途 | 文件 |
|------|------|
| 当前状态与下一步 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 实现拆条 | `docs/design/engineering/IMPLEMENTATION-TASKS.md` |
| 协作细则 | `docs/design/engineering/codex-project-rules.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos 联调 | `docs/design/engineering/cocos-client-setup.md` |
