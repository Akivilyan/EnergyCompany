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

## 按需入口

| 用途 | 文件 |
|------|------|
| 当前产品状态与任务 | `engineering/PROJECT-TASK-BOARD.md` |
| 玩法规则 | `gdd/README.md` |
| 功能验收规格 | `features/README.md` |
| UI 规格 | `ui/README.md` |
| 配置规格 | `data/README.md` |
| 工程边界 | `engineering/architecture.md` |

## UI 推进顺序

当前 UI 工作按三段推进：

1. 先完成成品级 UI 架构壳：页面层级、资源插槽、状态绑定、交互分区和 placeholder 视觉。
2. 再进行正式美术资源设计与补充：场景图、图标、设施图、科技点图片、弹窗和通用 UI 资产。
3. 最后制作游戏引导：引导依赖稳定 UI 结构，避免先做后返工。

具体当前模块、范围和验收命令以 `engineering/PROJECT-TASK-BOARD.md` 为准。

## 说明

- 当前开发不维护独立历史流水文档；历史看 Git
- 判断“当前版本做到哪、当前做什么、下一步做什么”时，读 `engineering/PROJECT-TASK-BOARD.md`
- 若设计文档与旧记录冲突，以 `docs/design/` 当前文档为准
