# 设计文档体系（重建中）

本目录是游戏设计文档的**新权威来源**。旧目录 [`../`](../) 下的文件保留作参考，逐步废弃；内容经任务拆解后迁入此处。

## 流水线

```text
GDD → Feature Spec → UI Spec → Data → Code
```

| 阶段 | 目录 | 作用 |
|------|------|------|
| GDD | `gdd/` | 玩法真理源：边界、循环、规则、公式（不写实现） |
| Feature Spec | `features/` | 按系统可验收的功能规格（输入/输出/前置/副作用） |
| UI Spec | `ui/` | 屏幕流、线框、组件与交互表 |
| Data | `data/` | 表结构、字段说明、垂直切片样例数据 |
| Code | `engineering/` | 工程模块、垂直切片范围、与实现的接口约定 |

## 怎么用

1. 编写规范见 [`META.md`](./META.md)；任务顺序见 [`TASK-LIST.md`](./TASK-LIST.md)。
2. **每次对话只做一个任务**；由 Agent 引导，从旧 `docs/` 摘录并改写，不一次性搬迁。
3. 新文档使用 `META.md` 中的 front matter（`status`: draft / locked 等）。
4. **下一项协作任务：T02**（愿景与边界）。

## 旧文档对照（搬迁来源，非权威）

| 旧文件 | 主要迁入目标 |
|--------|----------------|
| `game-core-design.md` | `gdd/` 各章 |
| `game-core-design-整合摘要.md` | 仅作搬迁索引，不单独成稿 |
| `game-core-design-设计演变摘要.md` | 必要时写入 `gdd/00-vision.md` 附录或 changelog |
| `balance-data-structure.md` | `data/` |
| `tech-tree-design.md` | `gdd/08-tech.md` + `features/tech-tree.md` |
| `technical-and-tooling-plan.md` | `engineering/` |
