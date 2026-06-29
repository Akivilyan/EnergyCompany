# Energy Company

微信小游戏项目：`Cocos Creator 3.x + TypeScript` 客户端，`src/sim/` 为纯 TS 模拟核心与规则真理源。

## 当前阶段

- 当前主线：`FAST-01` Playable Demo 快线落地
- 当前协作收口：冻结非阻塞小问题，优先把可玩内容从 `vertical-slice-v0` 最小裁剪态推进到更完整 demo
- 开发原则：先扩内容和可玩时长，再回头做正式 UI、真 SDK 与数值精调

## 必看入口

| 用途 | 文件 |
|------|------|
| 硬约束 | `AGENTS.md` |
| 当前产品真相 | `docs/design/current-product-truth.md` |
| Codex 协作规则 | `docs/design/engineering/codex-project-rules.md` |
| 当前任务与下一步 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 执行日志与验证记录 | `docs/design/engineering/PROJECT-LOG.md` |
| 设计总览 | `docs/design/README.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos / 微信联调 | `docs/design/engineering/cocos-client-setup.md` |
| Codex 接手上下文 | `docs/design/engineering/codex-handoff.md` |

## 最小命令

```bash
npm.cmd install
npm.cmd run doctor
npm.cmd test
npm.cmd run build
npm.cmd run lint:boundaries
npm.cmd run verify:client:fast
npm.cmd run verify:client
```

若在 PowerShell 中遇到 `npm.ps1` 执行策略拦截，优先改用 `npm.cmd`；仓库内脚手架均按此兼容。

推荐在 Codex 会话中优先使用：

```bash
cmd.exe /c npm run doctor
cmd.exe /c npm run doctor:full
```

说明：
- `doctor`：检查项目主链路工具与外部 GUI 路径。
- `doctor:full`：串行跑 `doctor`、`build`、`lint:boundaries`、`test`、`verify:client`，用于区分环境故障与仓库现有代码错误。
- `verify:client:fast`：日常客户端快验，覆盖工程预检与 HUD 冒烟。
- `verify:client`：阶段收口 / 真机前置 / 微信包排障使用。

按改动类型选择更小命令，规则见 `docs/design/engineering/codex-project-rules.md`。

## 文档导航

| 目录 | 作用 |
|------|------|
| `docs/design/gdd/` | 玩法规则与系统边界 |
| `docs/design/features/` | 面向实现与验收的功能规格 |
| `docs/design/ui/` | 屏幕结构、组件与交互 |
| `docs/design/data/` | 配置结构、字段说明、切片数据 |
| `docs/design/engineering/` | 工程约束、实现拆条、联调、看板与执行日志 |

## 代码结构

| 路径 | 说明 |
|------|------|
| `src/sim/` | 纯 TS 模拟核心，不依赖引擎 |
| `src/modules/` | 业务编排层，UI 只调用这一层 |
| `src/app/` | CLI 冒烟、装配与客户端入口 |
| `src/ui/` | 引擎无关 UI 壳层与场景桥接 |
| `src/infra/` | 存档、生命周期、广告等外部能力 |
| `client/cocos/` | Cocos 工程 |

## 协作入口

- 开新会话先读 `AGENTS.md`
- 涉及“当前版本到底做到哪、什么算阶段完成”时读 `docs/design/current-product-truth.md`
- 涉及实现边界、验证选择、微信排障时读 `docs/design/engineering/codex-project-rules.md`
- 涉及当前状态与下一步时读 `docs/design/engineering/PROJECT-TASK-BOARD.md`
- 涉及最近做了什么、验证怎么跑时读 `docs/design/engineering/PROJECT-LOG.md`

新会话无需重复说明提交策略、验证方式与架构边界。
