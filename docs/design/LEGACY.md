---
id: design/legacy
title: 旧文档归档说明
status: draft
version: 0.2.0
sources:
  - docs/game-core-design.md
  - docs/game-core-design-整合摘要.md
  - docs/game-core-design-设计演变摘要.md
  - docs/balance-data-structure.md
  - docs/tech-tree-design.md
  - docs/technical-and-tooling-plan.md
supersedes: []
depends_on:
  - gdd/README
  - features/README
  - ui/README
  - data/README
  - engineering/IMPLEMENTATION-TASKS
open_questions: []
---

# 旧文档归档说明

## 1. 结论

- 当前权威来源：`docs/design/`
- 旧 `docs/*.md`：只读历史参考
- 实现、测试、任务拆条不再以旧文作为唯一依据

## 2. 归档状态

| 状态 | 含义 |
|------|------|
| `superseded` | 已被 `docs/design/` 接管 |
| `reference-only` | 仅作索引或背景参考 |
| `partial-reference` | 主体已迁移，少量背景仍可追溯 |

## 3. 映射表

| 旧文档 | 状态 | 当前替代 |
|--------|------|----------|
| `docs/game-core-design.md` | `superseded` | `gdd/README.md`、`features/README.md`、`ui/README.md` |
| `docs/game-core-design-整合摘要.md` | `reference-only` | `gdd/00-vision.md`、`gdd/README.md` |
| `docs/game-core-design-设计演变摘要.md` | `partial-reference` | `gdd/00-vision.md` |
| `docs/balance-data-structure.md` | `superseded` | `data/README.md`、`data/schemas/README.md`、`data/CHECKLIST.md` |
| `docs/tech-tree-design.md` | `superseded` | `gdd/07-tech.md`、`features/tech-tree.md`、`data/technology-tree.md`、`ui/tech-tree.md` |
| `docs/technical-and-tooling-plan.md` | `superseded` | `engineering/stack.md`、`engineering/architecture.md`、`engineering/simulation-api.md`、`engineering/IMPLEMENTATION-TASKS.md` |

## 4. 使用原则

- 需要改规则时，只改 `docs/design/`
- 需要查历史背景时，可读旧文，但应同步查看当前替代文档
- 若新旧文冲突，以 `docs/design/` 为准

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 改为纯归档说明，移除当前流程叙事 |
