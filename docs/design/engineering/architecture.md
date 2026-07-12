# 工程边界

## 目标

让规则可脱离 Cocos 独立验证，让客户端只表达玩家意图与结果，让平台能力可替换。

## 当前分层

```text
client/cocos + src/ui
          |
          v
      src/modules
       /      \
      v        v
 src/sim     src/infra
      ^
      |
 config JSON（只读输入）

src/app 负责装配、客户端适配和开发工具
```

| 路径 | 职责 | 禁止 |
|------|------|------|
| `src/sim/` | `GameState`、命令、结算、序列化、规则查询 | `cc.*`、存档、平台 SDK、UI 状态 |
| `src/modules/` | 将 UI 意图编排为 sim 命令，对接 infra | 复制结算公式、直接制造长期业务真相 |
| `src/ui/` | 引擎无关导航与场景桥 | 直接修改 `GameState`、读取平台 SDK |
| `client/cocos/` | Cocos 渲染、输入、屏幕适配 | 直接写 `GameState`、重算业务规则 |
| `src/infra/` | 存档、广告、生命周期等外部能力 | 反向依赖 UI 或业务流程 |
| `src/app/` | composition root、客户端 controller/display、必要开发工具 | 成为第二套业务规则层 |

## 唯一写入路径

```text
玩家操作
  -> screen action / controller
  -> modules
  -> RunController.runCommand
  -> sim.dispatch 或 settleNextMonth
  -> 新 GameState + report/events
  -> view model / display
  -> Cocos refresh
```

所有状态写入都必须经过模拟层命令或月结。展示层可以读取快照，不得持有另一份可写业务状态。

## 配置边界

- JSON 是只读规则输入；加载后通过 `ConfigRepo` 查询。
- “是否够钱、是否解锁、结算先后”等流程判断在 `src/sim/`。
- 同 schema 替换配置不应要求修改规则代码。
- 当前 TypeScript 契约以 `src/sim/types/`、`src/sim/config/configRepo.ts` 和导出入口 `src/sim/index.ts` 为准，不再维护重复 API 草案。

## 客户端边界

- `CityHudPanel` 只承担全局壳、导航宿主和城市视觉底层；屏幕业务进入对应 `screens/<screen>/`。
- screen panel 负责布局与输入，action 负责调用客户端入口，view model 负责展示数据。
- display builder 只做格式化，不做规则判断。
- slot/token manifest 是资源和层级约定，不是产品完成证据。

## 结构验收

- `npm run build`
- `npm run lint:boundaries`
- 客户端改动按 `AGENTS.md` 运行对应客户端验证

玩家可见模块还必须满足 `AGENTS.md` 的产品验收；结构命令全部通过也不能替代真实预览。
