# Agent 协作说明（Energy Company）

> 每个新 Agent 会话先读本文件；随后按 `docs/design/engineering/codex-project-rules.md` 的阅读顺序继续。

## 项目一句话

微信小游戏（Cocos Creator 3.x + TypeScript）+ 纯 TS 模拟核心。规则真理在 `src/sim/`，UI/Cocos 只编排，不直改状态。

## 最高约束

- 推进方式：默认按“模块交付”工作；模块必须可运行、可验证、可交接，不按碎片步骤推进。
- 架构边界：`src/sim/` 不依赖 `cc.*`、存档、平台 SDK、UI 状态；UI/Cocos 不直接改 `GameState`；`config` 只读查询，不承载业务流程判断。
- 设计文档：实现必须遵从设计文档；遇到设计冲突、逻辑错漏、未定义空白，且 Agent 无法自行断定或无法解决时，停下来向用户汇报差异点与影响。
- Git：模块完成、准备交接或需要锁定回滚点时本地 commit；用户明确要求时才 push；不混入无关文件，不 force push。
- 验证：以本地命令结果为准；失败先自修复，无法修复再汇报阻塞；跳过验证必须说明风险。
- 文档写入：各文档只记录自己的主体责任，禁止交叉记录规则、流水、历史或入口清单。
- 回复语言：简体中文，过程更新简洁，收尾说明改动、验证与风险。

## 单一职责

| 文件 | 主体责任 |
|------|----------|
| `AGENTS.md` | 会话启动入口与最高约束 |
| `docs/design/engineering/codex-project-rules.md` | 协作、验证、Git、环境与文档写入规则 |
| `docs/design/engineering/PROJECT-TASK-BOARD.md` | 当前模块、当前状态、下一步 |

更细规则、阅读顺序、验证命令和 Windows/Codex 执行环境注意事项，统一维护在 `docs/design/engineering/codex-project-rules.md`。
