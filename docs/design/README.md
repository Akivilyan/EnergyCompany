# 设计文档总览

`docs/design/` 是当前项目的权威设计文档目录。玩法规则、功能规格、UI 结构、配置说明和工程约束都以这里为准。

## 结构

| 目录 | 作用 |
|------|------|
| `gdd/` | 玩法规则、系统边界、核心流程 |
| `features/` | 面向实现与验收的功能规格 |
| `ui/` | 屏幕结构、组件树、交互状态 |
| `data/` | 配置结构、字段说明、切片数据 |
| `engineering/` | 工程约束、实现拆条、联调与看板 |

## 推荐阅读顺序

1. `gdd/00-vision.md`
2. `gdd/01-core-loop.md`
3. `features/README.md`
4. `ui/README.md`
5. `data/README.md`
6. `engineering/architecture.md`

## 当前权威入口

| 用途 | 文件 |
|------|------|
| 文档规范 | `META.md` |
| 旧文档映射 | `LEGACY.md` |
| 设计阶段摘要 | `TASK-LIST.md` |
| 当前工程进展 | `engineering/PROJECT-TASK-BOARD.md` |

## 说明

- 旧 `docs/*.md` 仅保留为历史参考
- 当前开发不再依赖设计迁移任务流程
- 若设计文档与旧记录冲突，以 `docs/design/` 当前文档为准
