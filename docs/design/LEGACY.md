---
id: design/legacy
title: 旧文档归档说明（Superseded / 只读参考）
status: draft
version: 0.1.0
sources:
  - docs/design/README.md
  - docs/design/TASK-LIST.md
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
open_questions:
  - 是否在 T47 将已被完全替代的旧文档统一移动到 `docs/archive/`
---

# 旧文档归档说明（Superseded / 只读参考）

## 1. 目的

本文件定义旧 `docs/` 文档在当前阶段的归属状态，避免实现阶段继续引用过时规则。

结论：

- **权威来源**：`docs/design/`。
- **旧文档策略**：当前全部保留为只读参考，不删除、不改写。

---

## 2. 归档状态定义

| 状态 | 含义 |
|------|------|
| `superseded` | 玩法/规格已由 `docs/design/` 完整接管，旧文仅作历史记录 |
| `reference-only` | 作为搬迁索引或历史背景保留，不作为实现依据 |
| `partial-reference` | 主要内容已迁移，但仍可用于历史追溯或补充背景 |

---

## 3. 旧文档清单与映射

| 旧文档 | 当前状态 | 主要替代文档（`docs/design/`） | 说明 |
|--------|----------|---------------------------------|------|
| `docs/game-core-design.md` | `superseded` | `gdd/README.md` + `features/README.md` + `ui/README.md` | 玩法与系统规格已拆分接管，不再作为规则真理源 |
| `docs/game-core-design-整合摘要.md` | `reference-only` | `gdd/00-vision.md`、`gdd/README.md` | 保留为搬迁索引与对照，不单独维护 |
| `docs/game-core-design-设计演变摘要.md` | `partial-reference` | `gdd/00-vision.md`（必要时附录/变更记录） | 可用于追溯设计演进，不作为当前实现依据 |
| `docs/balance-data-structure.md` | `superseded` | `data/README.md` + `data/schemas/README.md` + `data/CHECKLIST.md` | 数据结构与验收规范已迁移 |
| `docs/tech-tree-design.md` | `superseded` | `gdd/07-tech.md` + `features/tech-tree.md` + `data/technology-tree.md` + `ui/tech-tree.md` | 科技规则、配置、UI 与验收已分层替代 |
| `docs/technical-and-tooling-plan.md` | `superseded` | `engineering/stack.md` + `engineering/architecture.md` + `engineering/simulation-api.md` + `engineering/IMPLEMENTATION-TASKS.md` | 工程选型、边界、接口与里程碑已接管 |

---

## 4. 使用规则（实现阶段）

- 新增/修订设计时，优先修改 `docs/design/` 对应层级文档。
- 如旧文与新文冲突，以 `docs/design/` 为准。
- 代码实现、测试用例、任务拆分不得再以旧文作为唯一依据。
- 需要历史背景时可引用旧文，但应同时附上当前替代文档链接。

---

## 5. T47 准备项（可选执行）

在执行 T47 前建议先完成：

1. 确认本文件清单无遗漏；  
2. 确认团队已统一以 `docs/design/` 为权威；  
3. 再决定是否移动 `superseded` 文档到 `docs/archive/`。  

---

## 6. 相关文档

- [设计文档体系总览](./README.md)
- [任务列表](./TASK-LIST.md)
- [GDD 索引](./gdd/README.md)
- [Feature 索引](./features/README.md)
- [UI 索引](./ui/README.md)
- [Data 总览](./data/README.md)
- [工程实现里程碑](./engineering/IMPLEMENTATION-TASKS.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-28 | T46 初稿：明确旧文档 superseded/reference 状态与映射关系 |
