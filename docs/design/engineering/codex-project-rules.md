---
id: engineering/codex-project-rules
title: Codex 项目规则
status: draft
version: 1.1.0
sources:
  - AGENTS.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/cocos-client-setup.md
depends_on:
  - engineering/architecture
open_questions: []
---

# Codex 项目规则

本文件是协作、验证、Git、环境与文档写入规则的唯一细则来源。`AGENTS.md` 只保留最高约束；`PROJECT-TASK-BOARD.md` 只保留当前模块状态。

## 1. 阅读顺序

新会话默认按需读取：

1. `AGENTS.md`
2. `docs/design/engineering/codex-project-rules.md`
3. `docs/design/engineering/PROJECT-TASK-BOARD.md`
4. `docs/design/current-product-truth.md`
5. `docs/design/engineering/architecture.md`
6. `docs/design/engineering/cocos-client-setup.md`（仅 Cocos / 微信相关）

不要在其他文档重复维护本清单。

## 2. 文档写入职责

| 文件 | 只记录 | 禁止记录 |
|------|--------|----------|
| `AGENTS.md` | 会话启动说明、最高约束、三份核心文档职责 | 详细验证表、进展流水、变更记录、长阅读清单 |
| `codex-project-rules.md` | 协作规则、模块交付规则、验证选择、Git 规则、环境注意事项、文档写入规则 | 当前任务进展、项目流水、版本历史表 |
| `PROJECT-TASK-BOARD.md` | 当前阶段、当前模块、当前状态、下一步 | 规则细则、入口清单、最近进展流水、变更记录 |
| Git commit / 最终回复 | 实际改动、验证命令、验证结果、风险 | 需要长期维护的项目规则 |
| 归档文档 | 必须保留的长历史 | 当前态或执行规则 |

写入原则：

- 一个事实只放一个主体文档；其他文档最多引用，不复制。
- 当前态写看板，规则写规则文件，执行结果写 commit 和最终回复。
- 看板不再维护“最近进展摘要”和“变更记录”；需要历史时查 Git 或归档。
- 规则文件不维护版本流水表；版本号可在 frontmatter 更新，但变更原因由 commit 承接。
- 新增文档前先判断是否已有主体文档能承接，避免再造并行信息源。

## 3. 模块交付协议

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

设计冲突处理：

- 默认按设计文档实现，不把“顺手优化”直接写进代码。
- 若发现设计文档冲突、逻辑错漏、未覆盖场景，且 Agent 无法自行断定或无法解决，先停下来整理差异，再和用户核对。
- 若想到更优方案，只能作为建议提出；未经用户确认，不得直接偏离文档落地。
- 文档与现状实现冲突时，先以文档为准修正实现；除非用户明确要求反向改文档。

## 4. Git 规则

- 默认按模块提交，不按每个微小子步骤提交。
- 一个模块可以包含多个紧密相关的小改动；模块完成、准备交接或需要锁定回滚点时再 commit。
- 独立风险较高、需要单独回滚的改动拆小 commit。
- 不把无关文件混进同一 commit。
- 用户明确要求时才 push。
- 未经要求不 force push。

## 5. 验证规则

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
- 若为了速度跳过某项验证，最终回复必须说明未跑项与风险。

## 6. 架构边界

主线依赖：

```text
ui/cocos -> modules -> sim <- config
app 负责装配
infra 通过端口注入
```

边界提醒：

- `src/sim/`：禁止 `cc.*`、本地存储、平台 SDK、UI 状态
- `src/modules/`：做编排，不复制结算公式
- `src/ui/` / `client/cocos/`：不直接改 `GameState`
- `config`：只读查询，不做流程判断

## 7. 常用守则

### sim 改动

- 优先做最小改动，不顺手跨层重构。
- 涉及语义变化时，先补 `tests/sim/` 或 `tests/modules/`。
- 如果只是展示需求变化，优先落在 `src/modules/` 或 `src/app/`。

### 配置同步

- 改 `docs/design/data/vertical-slice-v0/` 后，至少跑 `npm run build:client`。
- 日常连续改配置时可开 `npm run build:client:watch`。
- 若配置影响客户端联调，先补 `npm run verify:client:fast`。
- 阶段收口或真机前置，再跑 `npm run verify:client`。

### 客户端验证

- Cocos / HUD 日常改动，默认先跑 `npm run verify:client:fast`。
- `npm run verify:client` 保留为 full：含存档恢复、事件恢复与微信包新鲜度检查。
- 需要探测编辑器预览是否起来，再跑 `npm run check:cocos-preview`。

### 客户端同步

- `npm run build:client` 默认增量同步：重打共享包，只复制内容变化的 v0 JSON。
- `npm run build:client:bundle` 只重打共享包，适合只改 `src/`。
- `npm run build:client:config` 只同步配置，适合只改 v0 JSON。
- `npm run build:client:watch` 用于连续编码，不作为收口命令。
- `npm run build:client:clean` 用于 Cocos 资源缓存异常、shared 包疑似陈旧或收口前确认。
- `--skip-bundle` / `--skip-config` 只用于明确知道另一侧未变化的本地加速，禁止作为提交前验证口径。

## 8. Windows / Codex 环境

- PowerShell 读取中文 Markdown 时必须显式指定 UTF-8，例如 `Get-Content -Raw -Encoding UTF8 AGENTS.md`。
- Codex 受限沙箱里，Node 通过 `child_process` 启动项目内原生 `.exe` 时可能报 `spawn EPERM`。
- 已确认受影响链路包括 `esbuild` 服务进程，以及依赖它的 `vite` / `vitest` / `tsx` 相关命令。
- 遇到 `npm test`、`npm run build:client`、`npm run build:client:watch`、`npm run verify:client:fast`、`npm run verify:client`、`tsx ...`、`vitest ...`、`vite ...`、`esbuild ...` 的 `spawn EPERM`，直接用 `require_escalated` 重跑。
- `npm run build` 当前走 `tsc`，通常不需要提权；若未来也出现类似子进程/权限错误，再按实际错误提权确认。

## 9. 格式与行尾

- 根目录 `.editorconfig` 与 `.gitattributes` 一起作为默认格式约束。
- 文本文件默认保持 `UTF-8 + LF`。
- `*.bat` / `*.cmd` / `*.ps1` 保持 `CRLF`。
- 非功能性改动不要顺手重排无关格式。

## 10. 微信构建与联调

关键路径：

- 工程：`client/cocos/`
- 构建输出：`client/cocos/build/wechatgame`

联调注意：

- 微信开发者工具需开启 CLI / 服务端口。
- `cli.bat open` 成功不代表窗口立刻显示。
- 2.x 首次启动可能需要 3 到 5 分钟预热。
- 先清理僵尸 `wechatdevtools` 进程，再重试。

手动排查顺序：

1. 确认 `npm run verify:client` 通过
2. 确认构建输出目录存在
3. 确认微信工具 CLI 可调用
4. 再手动 `open --project <绝对路径>`
