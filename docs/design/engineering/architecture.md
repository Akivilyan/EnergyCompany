# 工程边界

## 目标

规则脱离 Cocos 独立验证，客户端只表达玩家意图与结果，平台能力可替换。旧页面壳和旧适配层不构成兼容目标。

## 当前分层

```text
client/cocos
     |
     v
 src/app（装配与客户端入口）
     |
     v
 src/modules --------> src/infra
     |
     v
  src/sim <-------- config JSON（只读输入）
```

| 路径 | 职责 | 禁止 |
|------|------|------|
| `src/sim/` | `GameState`、命令、结算、序列化、规则查询 | `cc.*`、存档、平台 SDK、UI 状态 |
| `src/modules/` | 将玩家意图编排为 sim 命令，对接 infra，提供只读快照 | 复制结算公式、制造第二套业务真相 |
| `src/app/` | composition root、客户端挂载、存档/生命周期装配、必要开发入口 | HUD 格式化、页面业务、专项路线堆积 |
| `client/cocos/` | Cocos 场景、Prefab、组件、输入、适配与反馈 | 直接写 `GameState`、重算业务规则 |
| `src/infra/` | 存档、广告、生命周期等外部能力 | 反向依赖客户端或业务流程 |

## 唯一状态写入路径

```text
玩家操作
  -> Cocos action
  -> modules screen / service
  -> RunController.runCommand 或 runNextMonth
  -> sim.dispatch / settleNextMonth
  -> 新 GameState + report/events
  -> modules 只读快照
  -> Cocos refresh
```

Cocos 可以保存短期交互状态，例如当前选中地块、打开的 sheet 和动画阶段；业务资金、设施、队列、月份、等级和解锁只能来自规则状态。

## 配置边界

- `docs/design/data/vertical-slice-v0/` 是当前配置真理源。
- `build:client` 生成 Cocos 运行时副本；生成副本不提交 Git。
- 是否够钱、是否解锁、结算顺序和供能分配属于 `src/sim/`。
- TypeScript 契约以源码为准，不维护重复 API 草案。

## 客户端切片边界

- 每个切片只暴露当前玩家路线需要的 action 和只读 ViewModel。
- 不提前建立全页面通用壳、全局 HUD 能力聚合或页面全集 registry。
- 不为后续切片保留空页面、假按钮、占位状态和专项 CLI。
- 共用组件只在第二个真实使用者出现时抽取。

## 结构验收

- `npm run build`
- `npm run lint:boundaries`
- `npm run build:client`

玩家可见切片还必须提供真实 Cocos 预览、目标尺寸截图和点击路线。
