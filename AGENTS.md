# Agent 协作说明（Energy Company）

> 每个新 Agent 会话先读本文件，再读 `docs/design/engineering/PROJECT-TASK-BOARD.md`。其他设计、架构、Cocos 文档按任务需要读取，不作为默认必读链路。

## 项目一句话

微信小游戏（Cocos Creator 3.x + TypeScript）+ 纯 TS 模拟核心。规则真理在 `src/sim/`，UI/Cocos 只编排，不直改状态。

## 文档职责

| 文件 | 只记录 | 禁止记录 |
|------|--------|----------|
| `AGENTS.md` | Agent 协作、验证、Git、环境、文档写入规则 | 当前任务进展、项目流水、版本历史表 |
| `docs/design/engineering/PROJECT-TASK-BOARD.md` | 当前阶段、当前模块、当前状态、下一步 | 规则细则、入口清单、最近进展流水、变更记录 |
| Git commit / 最终回复 | 实际改动、验证命令、验证结果、风险 | 需要长期维护的项目规则 |
| 归档文档 | 必须保留的长历史 | 当前态或执行规则 |

写入原则：

- 一个事实只放一个主体文档；其他文档最多引用，不复制。
- 当前态写看板，规则写 `AGENTS.md`，执行结果写 commit 和最终回复。
- 看板不维护“最近进展摘要”和“变更记录”；需要历史时查 Git 或归档。
- 新增文档前先判断是否已有主体文档能承接，避免再造并行信息源。

## 模块交付协议

默认按模块交付，不按聊天步骤推进。模块是一次可运行、可验证、可交接的工作单元。

每个模块必须明确：

- 目标：要交付的用户可感知行为或工程能力
- 输入：依赖的设计文档、配置、接口或前置模块
- 输出/API：对外行为、数据结构、入口或 UI 变化
- 范围：涉及文件和不涉及文件
- 验证：证明模块成立的命令、脚本或明确的无需验证说明

执行约束：

- 一个模块完成前，不切到下一个模块。
- 中途不做碎片化确认，不靠 `next` / `go` 推进。
- 除阻塞、权限问题、设计冲突、用户明确要求外，不把半成品过程当作交付。
- 验证失败先自行定位并修复；修不了再汇报阻塞。
- 交付输出只保留模块名、是否完成、验证命令与结果、接口/行为变化、未完成事项或风险。

## 设计与架构边界

- 实现必须遵从设计文档；不把“顺手优化”直接写进代码。
- 若发现设计文档冲突、逻辑错漏、未覆盖场景，且 Agent 无法自行断定或无法解决，先停下来整理差异，再和用户核对。
- 未经用户确认，不得直接偏离文档落地。
- `src/sim/` 禁止依赖 `cc.*`、本地存储、平台 SDK、UI 状态。
- `src/modules/` 做编排，不复制结算公式。
- `src/ui/` / `client/cocos/` 不直接改 `GameState`。
- `config` 只读查询，不做流程判断。

## Git 规则

- 默认按模块提交，不按每个微小子步骤提交。
- 一个模块可以包含多个紧密相关的小改动；模块完成、准备交接或需要锁定回滚点时再 commit。
- 独立风险较高、需要单独回滚的改动拆小 commit。
- 不把无关文件混进同一 commit。
- 用户明确要求时才 push。
- 未经要求不 force push。

## 验证规则

模块收口、准备提交、准备交接，或改动触及高风险共享逻辑时，按下表选择验证：

| 改动 | 至少运行 |
|------|----------|
| `src/sim/`、`src/modules/`、`tests/` | `npm test` |
| 类型、入口装配、编译风险高 | `npm run build` |
| 层间引用或边界 | `npm run lint:boundaries` |
| `docs/design/data/vertical-slice-v0/` | `npm run build:client` |
| `client/cocos/`、客户端脚本、HUD、场景日常改动 | `npm run verify:client:fast` |
| 客户端阶段收口、真机前置、微信包排障 | `npm run verify:client` |
| 预览页探测 | `npm run check:cocos-preview` |
| 仅文档 / 看板 / 规则 | 说明无需跑测试 |

执行原则：

- 只跑和模块改动相关的集合。
- 失败则修到通过，或明确说明阻塞。
- 若跳过验证，最终回复必须说明未跑项与风险。

## Windows / Codex 环境

- PowerShell 读取中文 Markdown 时必须显式指定 UTF-8，例如 `Get-Content -Raw -Encoding UTF8 AGENTS.md`。
- Codex 受限沙箱里，Node 通过 `child_process` 启动项目内原生 `.exe` 时可能报 `spawn EPERM`。
- 遇到 `npm test`、`npm run build:client`、`npm run build:client:watch`、`npm run verify:client:fast`、`npm run verify:client`、`tsx ...`、`vitest ...`、`vite ...`、`esbuild ...` 的 `spawn EPERM`，直接用 `require_escalated` 重跑。
- `npm run build` 当前走 `tsc`，通常不需要提权；若未来也出现类似子进程/权限错误，再按实际错误提权确认。

## 常用专项

- 改 `docs/design/data/vertical-slice-v0/` 后，至少跑 `npm run build:client`。
- Cocos / HUD 日常改动，默认先跑 `npm run verify:client:fast`。
- 真机前置或微信包排障，跑 `npm run verify:client`。
- 文本文件默认保持 `UTF-8 + LF`；`*.bat` / `*.cmd` / `*.ps1` 保持 `CRLF`。
- 回复语言为简体中文；过程更新简洁，收尾说明改动、验证与风险。
