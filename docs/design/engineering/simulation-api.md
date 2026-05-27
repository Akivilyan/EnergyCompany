---
id: engineering/simulation-api
title: 模拟层接口（GameState / 结算函数 / 单测策略）
status: draft
version: 0.1.0
sources:
  - docs/design/engineering/architecture.md
  - docs/design/features/00-game-state.md
  - docs/design/features/supply-calculation.md
  - docs/design/features/social-value-settlement.md
  - docs/design/data/schemas/company-level-and-run.md
supersedes: []
depends_on:
  - engineering/architecture
  - features/00-game-state
  - features/supply-calculation
  - features/social-value-settlement
open_questions:
  - `rollback_to_snapshot` 是否在 v0 暴露给外层（当前默认仅测试/调试使用）
---

# 模拟层接口（GameState / 结算函数 / 单测策略）

## 1. 目标

为 T44 固化模拟层 API 契约，保证：

- `core` 可在 Node 环境独立运行；
- `modules` 与 `ui` 只通过稳定接口读写单局状态；
- 月度结算（M1-M14）可复现、可回归测试、可追踪错误码。

本文只定义接口和行为契约，不绑定具体引擎实现。

---

## 2. API 设计原则

- **纯函数优先**：输入 `state + config + ports`，输出新状态与报告，不做隐式 I/O。
- **单一入口**：写操作统一走 `dispatch`；时间推进统一走 `settleNextMonth`。
- **确定性**：核心结算使用整数与固定舍入规则；随机由 `RngPort` 注入。
- **可回放**：结算输出 `SettlementReport`，便于日志、回放、快照测试。
- **前后兼容**：`GameState.version` 必填，支持后续存档迁移。

---

## 3. 核心类型（TypeScript 草案）

```ts
export type RunPhase =
  | "main_menu"
  | "run_setup"
  | "run_playable"
  | "month_settling"
  | "run_result";

export type PlayableSubPhase =
  | "navigating"
  | "editing"
  | "advance_pending"
  | "blocked";

export interface GameState {
  version: number;
  runId: string;
  phase: RunPhase;
  playableSubPhase: PlayableSubPhase | null;

  currentMonth: number;
  funds: number; // int
  companyLevel: number; // 1..5
  socialValueCurrent: number; // int

  doctrineId: "tech" | "renewable" | "hydro" | "thermal" | "tutorial";
  difficultyId: "simple" | "normal";
  campaignId: string;

  bankruptConsecutiveMonths: number;
  runResult: null | "victory" | "bankrupt";

  // 索引化子状态（示意）
  cities: Record<string, CityRuntime>;
  facilities: Record<string, FacilityRuntime>;
  gridLinks: Record<string, GridLinkRuntime>;
  researches: Record<string, ResearchRuntime>;
  loans: Record<string, LoanRuntime>;
  events: Record<string, EventRuntime>;

  adsRemaining: number;
  onboarding: OnboardingRuntime;
}

export interface OnboardingRuntime {
  isTutorialRun: boolean;
  currentStepId: string | null;
  tutorialDoctrineCleared: boolean;
}
```

说明：

- `GameState` 必须 JSON 可序列化；
- 所有金额、工期、供能、社会价值按 int 存储；
- `phase` 与 `playableSubPhase` 对齐 `features/00-game-state.md` 状态机。

---

## 4. 命令与错误码契约

## 4.1 命令联合类型（节选）

```ts
export type Command =
  | { type: "open_screen"; screenId: string; targetId?: string }
  | { type: "queue_construction"; cityId: string; facilityId: string; tier: number }
  | { type: "cancel_construction"; queueItemId: string }
  | { type: "queue_grid_link"; fromNode: string; toNode: string; linkType: "region" | "trunk" }
  | { type: "start_research"; techId: string }
  | { type: "cancel_research"; researchId: string }
  | { type: "apply_loan"; loanId: string }
  | { type: "claim_ad_reward"; adType: "cash" | "speedup" | "shield"; targetId?: string }
  | { type: "advance_onboarding" }
  | { type: "skip_onboarding" };
```

## 4.2 结果模型

```ts
export interface SimOk<T> {
  ok: true;
  value: T;
  warnings?: SimWarning[];
}

export interface SimErr {
  ok: false;
  error: SimErrorCode;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export type SimResult<T> = SimOk<T> | SimErr;
```

## 4.3 标准错误码（v0）

```ts
export type SimErrorCode =
  | "invalid_phase"
  | "blocked_by_tutorial"
  | "not_unlocked"
  | "insufficient_funds"
  | "not_found"
  | "conflict_in_progress"
  | "invalid_command_payload"
  | "config_missing"
  | "state_invariant_broken";
```

---

## 5. 核心函数签名（定稿）

## 5.1 `dispatch`：处理单次写操作

```ts
export interface DispatchInput {
  state: GameState;
  command: Command;
  config: ConfigRepo;
  ports: SimPorts;
}

export interface DispatchOutput {
  state: GameState;
  domainEvents: DomainEvent[];
}

export function dispatch(input: DispatchInput): SimResult<DispatchOutput>;
```

行为约束：

- 仅处理单命令，不推进月份；
- 失败不改状态（语义上等价原子失败）；
- 所有副作用以 `domainEvents` 形式返回给 `modules` 消费。

## 5.2 `settleNextMonth`：执行 M1-M14

```ts
export interface SettleInput {
  state: GameState;
  config: ConfigRepo;
  ports: SimPorts;
}

export interface SettleOutput {
  state: GameState;
  report: SettlementReport;
}

export function settleNextMonth(input: SettleInput): SimResult<SettleOutput>;
```

行为约束：

- 仅当 `phase=run_playable` 且未被规则锁时可执行；
- 严格按 M1 -> M14 顺序，不允许跳步；
- M13/M14 命中后进入 `run_result`；
- 失败返回 `SimErr`，并携带失败步骤上下文。

## 5.3 `serialize/deserialize`：存档边界

```ts
export interface SerializedStateEnvelope {
  schemaVersion: number;
  savedAtUnixMs: number;
  state: GameState;
}

export function serializeState(state: GameState): SimResult<SerializedStateEnvelope>;
export function deserializeState(
  envelope: SerializedStateEnvelope,
  config: ConfigRepo
): SimResult<GameState>;
```

行为约束：

- `deserialize` 必须做版本与基本不变量校验；
- 不变量失败返回 `state_invariant_broken`；
- 存档迁移逻辑允许后续以 `migrateState(vN -> vN+1)` 扩展。

---

## 6. SettlementReport 结构（M1-M14 对齐）

```ts
export type SettlementStepId =
  | "M1_construction_progress"
  | "M2_grid_progress"
  | "M3_research_progress"
  | "M4_supply_recalc"
  | "M5_income_settlement"
  | "M6_opex_settlement"
  | "M7_fuel_settlement"
  | "M8_loan_settlement"
  | "M9_social_value_settlement"
  | "M10_company_level_check"
  | "M11_events_apply"
  | "M12_milestones_emit"
  | "M13_bankrupt_check"
  | "M14_victory_check";

export interface SettlementStepReport {
  stepId: SettlementStepId;
  ok: boolean;
  summary: string;
  metrics: Record<string, number>;
}

export interface SettlementReport {
  runId: string;
  monthFrom: number;
  monthTo: number;
  steps: SettlementStepReport[];
  domainEvents: DomainEvent[];
  result: "continue" | "victory" | "bankrupt";
}
```

要求：

- `steps.length` 正常情况下固定 14；若中断需记录中断点；
- `summary` 用于 UI 里程碑提示与日志排障；
- `metrics` 至少包含资金、SV、供能满足率摘要字段。

---

## 7. Ports（外部依赖注入）

```ts
export interface RngPort {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export interface ClockPort {
  nowUnixMs(): number;
}

export interface LoggerPort {
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, extra?: Record<string, unknown>): void;
}

export interface SimPorts {
  rng: RngPort;
  clock: ClockPort;
  logger: LoggerPort;
}
```

说明：

- v0 事件主轴为固定灾害月表，`rng` 主要为后续随机事件池预留；
- 核心层不直接持有存储/广告端口，相关 I/O 在 `modules/infra` 处理。

---

## 8. 不变量（必须守护）

- 资金、供能、社会价值、工期等关键量始终为整数；
- `companyLevel` 只升不降；
- `phase=month_settling` 时不可再次触发推月；
- 队列条目引用的 `city_id/facility_id/tech_id` 必须在配置中存在；
- `adsRemaining` 不可小于 0；
- `runResult != null` 时禁止继续派发写操作命令。

---

## 9. 单测策略（v0 必做）

## 9.1 测试分层

1. **纯函数单测（核心）**：`dispatch`、`settleNextMonth`、公式函数。  
2. **快照回归（结算）**：给定初始 state + config，断言 `SettlementReport` 与关键状态字段。  
3. **契约测试（模块边界）**：断言 `modules` 仅调用公开 API，不绕过 `core`。  

## 9.2 必测清单

- M1-M14 顺序不可变且每步执行一次；
- M4 供能并网岛比例分配与边界（`demand<=0`, `available<0`）；
- M9/M10 覆盖写入、单月连升、只升不降；
- M13 破产与 M14 通关的终局切换；
- 命令失败原子性（失败前后 state 哈希一致）；
- 存档反序列化不变量校验。

## 9.3 固定种子与夹具

- 测试默认 `seed=42`（即使 v0 固定灾害，也保持接口一致性）；
- 提供 `makeTestState()`、`makeTestConfig()` 工厂；
- 所有快照测试使用 `truncate_to_int` 结算模式，避免浮点漂移。

---

## 10. 与 T45 的衔接

T45 实现任务拆分应直接引用以下工作包：

1. 建立 `core/types` 与 `GameState` 基础结构；
2. 实现 `dispatch` 最小命令集（建造、研发、借贷、广告）；
3. 实现 `settleNextMonth` 骨架 + M1-M14 空实现；
4. 先落 M4/M9/M10/M13/M14 的可测最小闭环；
5. 接入 `serialize/deserialize` 与版本校验；
6. 建立快照测试基线。

---

## 11. 验收标准（T44）

- [ ] 提供 `GameState`、`Command`、`SettlementReport` 的稳定类型草案；
- [ ] 明确 `dispatch` 与 `settleNextMonth` 的函数签名与错误码；
- [ ] 约束 M1-M14 报告结构，支持调试与回归；
- [ ] 明确端口注入边界，保证 `core` 无引擎/平台依赖；
- [ ] 给出可执行的单测策略与必测清单。

---

## 12. 相关文档

- [模块划分与依赖](./architecture.md)
- [全局游戏状态与月度结算](../features/00-game-state.md)
- [供能计算](../features/supply-calculation.md)
- [社会价值结算](../features/social-value-settlement.md)
- [公司等级与单局参数字段](../data/schemas/company-level-and-run.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-28 | T44 初稿：定义模拟层类型、函数签名、错误码与单测策略 |
