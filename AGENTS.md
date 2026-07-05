# Agent 协作说明（Energy Company）

> 新会话只需默认读取本文件和 `docs/design/engineering/PROJECT-TASK-BOARD.md`；其他文档按当前模块需要读取。

## 项目边界

- 微信小游戏：`Cocos Creator 3.x + TypeScript` 客户端，`src/sim/` 是纯 TS 规则真理源。
- `src/sim/` 禁止依赖 `cc.*`、存档、平台 SDK、UI 状态。
- `src/modules/` 做业务编排，不复制结算公式。
- `src/ui/` / `client/cocos/` 不直接改 `GameState`。
- `config` 只读查询，不承载业务流程判断。

## 模块交付

- 默认按看板里的大模块推进；一个模块完成前不切下一个模块。
- 模块必须有目标、输入、输出/API、范围、不做项和验收命令。
- 中途不做碎片化确认，不靠 `next` / `go` 推进。
- 除阻塞、权限问题、设计冲突、用户明确要求外，不把半成品当交付。
- 验证失败先自行修复；修不了再汇报阻塞。
- 交付输出只保留：模块名、完成情况、验证命令与结果、行为/API 变化、未完成事项或风险。

## 设计处理

- 实现必须遵从设计文档，不把“顺手优化”直接落代码。
- 遇到设计冲突、逻辑错漏、未定义空白，且 Agent 无法自行断定或无法解决时，停下来向用户说明差异和影响。
- 未经用户确认，不得偏离设计文档落地。

## 文档写入

- 当前态、当前模块、下一步只写 `PROJECT-TASK-BOARD.md`。
- 协作规则只写 `AGENTS.md`。
- 执行结果、验证结果和风险写 Git commit 与最终回复。
- 不维护最近进展摘要、变更记录、历史流水或重复入口清单；历史查 Git。

## Git

- 默认按模块提交；模块完成、准备交接或需要锁定回滚点时 commit。
- 独立风险高、需要单独回滚的改动拆小 commit。
- 不混入无关文件。
- 用户明确要求时才 push。
- 不 force push。

## 验证

| 改动 | 至少运行 |
|------|----------|
| `src/sim/`、`src/modules/`、`tests/` | `npm test` |
| 类型、入口装配、编译风险高 | `npm run build` |
| 层间引用或边界 | `npm run lint:boundaries` |
| `docs/design/data/vertical-slice-v0/` | `npm run build:client` |
| `client/cocos/`、HUD、客户端脚本 | `npm run verify:client:fast` |
| 客户端阶段收口 / 真机前置 / 微信包排障 | `npm run verify:client` |
| 预览页探测 | `npm run check:cocos-preview` |
| 仅文档 / 看板 / 规则 | 说明无需跑测试 |

- 只跑和模块改动相关的集合。
- 若跳过验证，最终回复必须说明未跑项与风险。

## Windows / Codex

- PowerShell 读中文 Markdown 必须显式 `-Encoding UTF8`。
- 普通沙箱里 `npm test`、`npm run build:client`、`npm run verify:client:fast`、`npm run verify:client`、`tsx`、`vitest`、`vite`、`esbuild` 可能因 `spawn EPERM` 失败；遇到该类错误直接 `require_escalated` 重跑。
- `npm run build` 当前走 `tsc`，通常不需要提权。

## 回复

简体中文。过程更新简洁；收尾说明改了什么、验证命令与结果、未完成事项或风险。
