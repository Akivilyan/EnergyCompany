---
id: engineering/architecture
title: 模块划分与依赖（core / config / ui / modules）
status: draft
version: 0.1.0
sources:
  - docs/design/engineering/stack.md
  - docs/design/engineering/vertical-slice-v0.md
  - docs/design/features/00-game-state.md
supersedes: []
depends_on:
  - engineering/stack
  - engineering/vertical-slice-v0
  - features/00-game-state
open_questions:
  - v0 是否需要单独拆出 `net/`（当前默认离线单机，不单列）
---

# 模块划分与依赖（core / config / ui / modules）

## 1. 目标

定义工程实现的模块边界与依赖方向，确保：

- 规则模拟可脱离引擎独立测试；
- UI 改动不污染核心结算逻辑；
- 配置表可替换且不改业务代码。

本文件是 T43 的实现边界基线，T44 将在此基础上定义函数签名与测试策略。

---

## 2. 顶层分层

```text
ui -> modules -> core(sim) <- config
            \-> infra
app 负责装配（composition root）
```

说明：

- `core(sim)`：唯一的规则真理源，处理命令与月结。
- `config`：规则输入（表数据）；仅提供查询，不执行业务副作用。
- `modules`：编排层；承接 UI 意图并调用 `core` 与 `infra`。
- `ui`：展示与交互，不直接写存档、不直接改 `GameState`。
- `infra`：存档、广告、埋点等外部能力，均以端口接口注入。

---

## 3. 目录与职责

## 3.1 `core/`（模拟核心）

职责：

- 定义 `GameState`、领域事件、命令处理与 M1-M14 结算主流程；
- 维护严格整数结算与确定性执行；
- 输出可序列化结果（供存档/回放/测试）。

约束：

- 不可依赖引擎 API（如 `cc.*`）；
- 不可直接访问本地存储或平台 SDK；
- 不可读取 UI 组件状态。

## 3.2 `config/`（配置访问层）

职责：

- 承载导表生成的 JSON；
- 提供 `ConfigRepo` 查询接口（按 id / 枚举 / 条件）；
- 提供 schema 校验与版本识别信息。

约束：

- 只读；
- 不做业务决策（例如“够不够钱”应在 `core`）；
- 不耦合具体界面流程。

## 3.3 `modules/`（业务编排层）

职责：

- 将 UI 操作映射为领域命令（如建造、研发、推月）；
- 组织 `core` 调用顺序与事务边界；
- 对接 `infra`（存档持久化、广告触发、埋点上报）。

约束：

- 不重复实现结算公式；
- 不持有长期业务真相（真相在 `core` / 存档快照）；
- 不绕过 `core` 直接改配置或状态。

## 3.4 `ui/`（视图层）

职责：

- 渲染屏幕与组件；
- 采集用户输入；
- 展示来自 `modules` 的 ViewModel 与反馈事件。

约束：

- 禁止直接改 `GameState`；
- 禁止直接读写 `config/generated` 原始表；
- 禁止直接调用平台存档接口。

## 3.5 `app/`（装配与生命周期）

职责：

- 组合依赖（config/core/modules/infra/ui）；
- 管理启动、场景切换、小游戏生命周期；
- 注入环境实现（真机 SDK / stub）。

---

## 4. 依赖规则（强约束）

## 4.1 允许依赖矩阵

| From \ To | app | ui | modules | core | config | infra |
|-----------|-----|----|---------|------|--------|-------|
| app | - | 允许 | 允许 | 允许 | 允许 | 允许 |
| ui | 禁止 | - | 允许 | 禁止 | 禁止 | 禁止 |
| modules | 禁止 | 禁止 | - | 允许 | 允许 | 允许 |
| core | 禁止 | 禁止 | 禁止 | - | 允许（只读接口） | 禁止 |
| config | 禁止 | 禁止 | 禁止 | 禁止 | - | 禁止 |
| infra | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | - |

## 4.2 反模式（禁止）

- `ui` 直接调用 `core.settleNextMonth`；
- `core` 直接写 `localStorage` / 微信 API；
- `modules` 拷贝一份供能或社会价值公式；
- `config` 里放业务“流程开关”并在运行时动态改结构。

---

## 5. 关键数据流

## 5.1 命令流（玩家操作）

`ui action -> modules command handler -> core.dispatch(command) -> new state + domain events -> modules -> ui refresh`

## 5.2 推月流（月度结算）

`ui next_month -> modules.runNextMonth -> core.settleNextMonth -> settlement report -> modules persist/log -> ui milestones`

## 5.3 配置流（启动装配）

`config/generated/*.json -> config loader + schema validate -> ConfigRepo -> injected into core/modules`

---

## 6. 跨模块契约（T44 前置）

为降低后续改动成本，先固定三类契约：

1. **命令契约**：`Command` 为判别联合类型，所有写操作都通过 `dispatch`。  
2. **快照契约**：`GameState` 必须可 JSON 序列化，含 `version` 字段。  
3. **报告契约**：`SettlementReport` 记录 M1-M14 每步输出摘要，供 UI 与测试复用。  

T44 将给出具体 TypeScript 签名、错误码和测试模板。

---

## 7. v0 落地切分建议

按风险与依赖顺序推进：

1. `core + config`：先跑通单城建造与 M1-M10。
2. `modules`：接入存档端口与基础命令路由。
3. `ui`：接 `city / company / tech` 三个关键屏的最小交互。
4. `infra`：广告与 IAP 先 stub，再替换真机实现。

---

## 8. 验收标准（T43）

- [ ] `core` 在 Node 测试环境可独立运行，不依赖引擎。
- [ ] `ui` 到 `core` 的所有写操作均经 `modules` 转发。
- [ ] 配置替换（同 schema）不需要修改 `core` 代码。
- [ ] `next_month` 调用路径唯一，且仅由 `modules` 触发。
- [ ] 关键依赖方向可通过 lint/脚本检查发现违规引用。

---

## 9. 相关文档

- [技术选型定稿](./stack.md)
- [Playable v0 垂直切片](./vertical-slice-v0.md)
- [全局状态机与月度结算](../features/00-game-state.md)
