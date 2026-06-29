---
id: engineering/codex-project-rules
title: Codex 项目规则
status: draft
version: 0.4.0
sources:
  - AGENTS.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/cocos-client-setup.md
  - docs/design/engineering/PROJECT-TASK-BOARD.md
  - docs/design/engineering/PROJECT-LOG.md
supersedes: []
depends_on:
  - engineering/architecture
  - engineering/project-task-board
  - engineering/project-log
open_questions: []
---

# Codex 项目规则

本文件承接项目级协作建议、验证选择与联调注意事项。硬约束以 `AGENTS.md` 为准，本文件负责把常用判断写短、写清楚。

## 1. 默认阅读顺序

新会话默认按这个顺序读取：

1. `AGENTS.md`
2. `docs/design/current-product-truth.md`
3. `docs/design/engineering/PROJECT-TASK-BOARD.md`
4. `docs/design/engineering/PROJECT-LOG.md`（需要追溯最近执行流水时）
5. `docs/design/engineering/architecture.md`
6. `docs/design/engineering/cocos-client-setup.md`（仅 Cocos / 微信相关）
7. `docs/design/engineering/codex-handoff.md`（需要更完整工程上下文时）

## 2. 架构边界速查

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

## 3. 验证选择

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

- 能跑就跑，不把验证甩给用户
- 失败则修到通过，或明确说明阻塞
- 只跑和改动相关的最小集合

## 4. 常用守则

### 设计文档守则

- 默认按设计文档实现，不把“顺手优化”直接写进代码
- 若发现设计文档冲突、逻辑错漏、未覆盖场景，先停下来整理差异，再和用户核对
- 若想到更优方案，只能作为建议提出；未经用户确认，不得直接偏离文档落地
- 文档与现状实现冲突时，先以文档为准修正实现；除非用户明确要求反向改文档

### sim 改动守则

- 优先做最小改动，不顺手跨层重构
- 涉及语义变化时，先补 `tests/sim/` 或 `tests/modules/`
- 如果只是展示需求变化，优先落在 `src/modules/` 或 `src/app/`

### 配置同步守则

- 改 `docs/design/data/vertical-slice-v0/` 后，至少跑 `npm run build:client`
- 日常连续改配置时可开 `npm run build:client:watch`
- 若配置影响客户端联调，先补 `npm run verify:client:fast`
- 阶段收口或真机前置，再跑 `npm run verify:client`

### 格式与行尾守则

- 根目录 `.editorconfig` 与 `.gitattributes` 一起作为默认格式约束
- 文本文件默认保持 `UTF-8 + LF`
- `*.bat` / `*.cmd` / `*.ps1` 保持 `CRLF`
- 非功能性改动不要顺手重排无关格式，避免制造只改一行逻辑却整段红绿 diff 的噪音

### 客户端验证守则

- Cocos / HUD 日常改动，默认先跑 `npm run verify:client:fast`
- `npm run verify:client` 保留为 full：含存档恢复、事件恢复与微信包新鲜度检查
- 需要探测编辑器预览是否起来，再跑 `npm run check:cocos-preview`

### 客户端同步守则

- `npm run build:client` 默认增量同步：重打共享包，只复制内容变化的 v0 JSON
- `npm run build:client:bundle` 只重打共享包，适合只改 `src/`
- `npm run build:client:config` 只同步配置，适合只改 v0 JSON
- `npm run build:client:watch` 用于连续编码，不作为收口命令
- `npm run build:client:clean` 用于 Cocos 资源缓存异常、shared 包疑似陈旧或收口前确认
- `--skip-bundle` / `--skip-config` 只用于明确知道另一侧未变化的本地加速，禁止作为提交前验证口径

### 看板更新守则

- 当前阶段、当前任务、下一步只写 `PROJECT-TASK-BOARD.md`
- 执行流水、涉及文件、验证结果、版本记录写 `PROJECT-LOG.md`
- `PROJECT-TASK-BOARD.md` 只保留 1 个当前进行中的任务和最近 3 到 5 条摘要

## 5. 微信构建与联调

关键路径：

- 工程：`client/cocos/`
- 构建输出：`client/cocos/build/wechatgame`

联调注意：

- 微信开发者工具需开启 CLI / 服务端口
- `cli.bat open` 成功不代表窗口立刻显示
- 2.x 首次启动可能需要 3 到 5 分钟预热
- 先清理僵尸 `wechatdevtools` 进程，再重试

手动排查顺序：

1. 确认 `npm run verify:client` 通过
2. 确认构建输出目录存在
3. 确认微信工具 CLI 可调用
4. 再手动 `open --project <绝对路径>`

## 6. 常用入口

| 用途 | 文件 |
|------|------|
| 当前版本真相 | `docs/design/current-product-truth.md` |
| 当前状态与下一步 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 执行日志与验证记录 | `docs/design/engineering/PROJECT-LOG.md` |
| 实现拆条 | `docs/design/engineering/IMPLEMENTATION-TASKS.md` |
| 设计总览 | `docs/design/README.md` |
| Cocos 初始化与真机冒烟 | `docs/design/engineering/cocos-client-setup.md` |
| 工程地图 | `docs/design/engineering/codex-handoff.md` |

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-06-17 | 首版：承接原项目规则、验证选择、边界守则与微信联调注意事项 |
| 0.2.0 | 2026-06-22 | 新增设计文档守则：实现必须遵从设计文档，发现错漏或更优方案需先与用户核对 |
| 0.4.0 | 2026-06-29 | 拆分看板与执行日志职责：看板保留当前态，日志承接流水与验证记录 |
