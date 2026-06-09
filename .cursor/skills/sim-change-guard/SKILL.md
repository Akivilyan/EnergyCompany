---
name: sim-change-guard
description: 约束 src/sim、src/modules 与相关测试改动的边界、验证和最小实现范围。Use when touching GameState、dispatch、settle、src/sim、src/modules、tests/sim、tests/modules or when a task changes simulation semantics.
---

# Sim Change Guard

## 先确认边界

默认依赖方向是 `ui/cocos -> modules -> sim <- config`。

开始改动前，至少检查这些约束是否会被破坏：

- `src/sim/` 禁止引入 `cc.*`
- `src/sim/` 禁止直接碰存档、平台 SDK、UI 状态
- UI / Cocos 禁止直接改 `GameState`
- `config` 负责只读查询，不承载业务流程判断

## 改动策略

1. 先做最小改动，不顺手重构无关逻辑。
2. 涉及语义变化时，优先补 `tests/sim/` 或 `tests/modules/`。
3. 如果只是 UI 需求变化，优先落在 `src/modules/` 或 `src/app/`，不要把展示逻辑塞回 `src/sim/`。
4. 如果拿不准该改哪层，优先守住既有边界，而不是图省事跨层直连。

## 最小验证

- 改 `src/sim/`、`src/modules/`、`tests/`：跑 `npm test`
- 动到 import 边界或层间引用：加跑 `npm run lint:boundaries`
- 动到类型、入口装配或编译风险较高的定义：加跑 `npm run build`

## 回复要求

结束时至少说明：

1. 本次改动是否守住架构边界
2. 跑了哪些验证
3. 是否还有未覆盖的风险点

## 不要做

- 不把 Cocos 或平台逻辑塞进 `src/sim/`
- 不跳过最小测试
- 不把“为了过测试”的临时耦合留在正式路径里
