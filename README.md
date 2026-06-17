# Energy Company

微信小游戏项目：`Cocos Creator 3.x + TypeScript` 客户端，`src/sim/` 为纯 TS 模拟核心与规则真理源。

## 当前阶段

- 当前主线：`T51` 真机问题收口
- 当前协作收口：真机问题清单、阶段完成定义与主看板状态回写
- 开发原则：先保证可玩闭环与边界稳定，再做数值精调

## 必看入口

| 用途 | 文件 |
|------|------|
| 硬约束 | `AGENTS.md` |
| 当前产品真相 | `docs/design/current-product-truth.md` |
| Codex 协作规则 | `docs/design/engineering/codex-project-rules.md` |
| 当前任务与近期进展 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 设计总览 | `docs/design/README.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| Cocos / 微信联调 | `docs/design/engineering/cocos-client-setup.md` |
| Codex 接手上下文 | `docs/design/engineering/codex-handoff.md` |

## 最小命令

```bash
npm install
npm test
npm run build
npm run lint:boundaries
npm run verify:client
```

按改动类型选择更小命令，规则见 `docs/design/engineering/codex-project-rules.md`。

## 文档导航

| 目录 | 作用 |
|------|------|
| `docs/design/gdd/` | 玩法规则与系统边界 |
| `docs/design/features/` | 面向实现与验收的功能规格 |
| `docs/design/ui/` | 屏幕结构、组件与交互 |
| `docs/design/data/` | 配置结构、字段说明、切片数据 |
| `docs/design/engineering/` | 工程约束、实现拆条、联调与看板 |

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

新会话无需重复说明提交策略、验证方式与架构边界。
