---
id: ui/run-result
title: 终局结果界面
status: draft
version: 0.2.0
sources:
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
  - docs/design/features/00-game-state.md
supersedes: []
depends_on:
  - features/00-game-state
  - ui/00-screen-map
open_questions: []
---

# 终局结果界面

## 1. 屏幕 ID

`screen_run_result`

## 2. 目的

展示 `victory/bankrupt` 终局快照，并明确进入结果态后不可继续执行运行态命令。

## 3. 壳层契约（T45-13）

`screenRunResult` 最小壳层接口：

- `getSnapshot(): RunResultSnapshot | null`
  - 非结果态返回 `null`
  - 结果态返回：
    - `month`
    - `runResult`（`victory` / `bankrupt`）
    - `funds`
    - `companyLevel`
    - `socialValue`
    - `disastersTriggeredCount`
    - `finalDisasterTriggered`
    - `terminalRoute`
      - `metBUnlocked`
      - `metBConnected`
      - `metBSupplyGapMw`
      - `superHydroFinishedSlots`
      - `superHydroConnectedOutputMw`
      - `superHydroTotalOutputMw`
    - `canRunPlayableCommands=false`

## 4. 交互约束

- 进入 `run_result` 后，`dispatch` 必须拒绝运行态命令（返回 `invalid_phase`）。
- `sim:result-loop` 冒烟要求覆盖：
  - victory 分支：触发最终灾害并达目标月后进入 `run_result`
  - bankrupt 分支：连续负资金达阈值后进入 `run_result`

## 5. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-29 | T45-13 初稿：补 `screenRunResult` 最小壳层契约与终局命令禁用约束 |
| 0.2.0 | 2026-07-03 | FAST-01：结果页补终局路线摘要，显示 MET-B、超级水电接网与最终灾害状态 |
