---
id: engineering/implementation-tasks
title: v0 实现里程碑任务拆条
status: draft
version: 0.4.0
sources:
  - docs/design/engineering/vertical-slice-v0.md
  - docs/design/engineering/stack.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/simulation-api.md
supersedes: []
depends_on:
  - engineering/vertical-slice-v0
  - engineering/stack
  - engineering/architecture
  - engineering/simulation-api
open_questions: []
---

# v0 实现里程碑任务拆条

本文件保留仍可直接指导编码的里程碑与任务模板，不再承担历史进展记录职责。当前执行状态见 `PROJECT-TASK-BOARD.md`。

## 1. 里程碑

| 里程碑 | 目标 | 对应体验点 |
|--------|------|------------|
| M0 | 工程骨架可运行 | E2 |
| M1 | 模拟核心最小闭环 | E2 |
| M2 | 月结关键步骤可测 | E2 / E6 |
| M3 | 城市主流程联调 | E2 |
| M4 | 等级与区域解锁 | E3 / E4 |
| M5 | 科技与灾害轴 | E3 / E5 |
| M6 | 公司经营与终局 | E6 |
| M7 | 新手与主流程收口 | E1 |
| M8 | 平台收尾与回归 | E1–E6 |

## 2. P0 必做任务

### M0 工程骨架

- `T45-01` 建立目录与边界护栏
- `T45-02` 完成 `ConfigRepo` 最小实现

### M1 核心状态与命令入口

- `T45-03` 定义 `GameState` 与初始化
- `T45-04` 建立 `dispatch` 基础框架

### M2 月结主流程

- `T45-05` 建立 `settleNextMonth` 骨架
- `T45-06` 落地 M4 供能重算
- `T45-07` 落地 M9 / M10 / M13 / M14

### M3–M4 主流程联调

- `T45-08` 建立 `modules` 命令编排层
- `T45-09` 完成城市页最小闭环
- `T45-10` 完成等级解锁与 region 流程

### M5–M6 科技、灾害、经营、终局

- `T45-11` 科技树单队列
- `T45-12` 固定灾害轴与事件面板
- `T45-13` 公司屏、借贷、终局页

### M7–M8 新手、平台、回归

- `T45-14` 教学局与引导遮罩
- `T45-15` 存档与恢复
- `T45-16` 广告 stub 与全链路回归

## 3. P1 增强项

- `T45-P1-01` `overlay_codex` 简版词条
- `T45-P1-02` 埋点与事件日志结构化导出
- `T45-P1-03` 跨区主干逻辑预埋
- `T45-P1-04` 真实广告 SDK 预研

## 4. 单任务执行模板

1. 选定 1 个任务 ID
2. 完成最小实现
3. 补对应测试或冒烟
4. 跑最小验证
5. 如当前态变化，更新 `PROJECT-TASK-BOARD.md`
6. 完成清晰子步骤后本地 commit

## 5. 风险控制

| 风险 | 应对 |
|------|------|
| 核心接口频繁返工 | 先冻结主结构，优先加字段 |
| UI 侵入核心 | 用边界检查与 code review 阻断 |
| 数值回归难定位 | 保留 `SettlementReport` 与固定回归路径 |
| 任务过大拖慢推进 | 立即再拆更小子任务 |

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 压缩为当前可执行里程碑，移除历史进展叙事 |
| 0.3.0 | 2026-06-29 | 执行模板同步看板职责：当前态写看板，流水与验证曾拆入独立日志 |
| 0.4.0 | 2026-06-29 | 删除单独日志步骤：流水与验证改由 Git commit 和最终回复承接 |
