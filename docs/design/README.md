# 设计文档总览

`docs/design/` 只保留会指导当前或未来实现的权威内容。已完成任务的拆条、接口草案、阶段流水和重复验收表不保留，历史查 Git。

## 真理层

| 目录 / 文件 | 负责回答 |
|-------------|----------|
| `gdd/` | 游戏为什么这样设计、规则是什么 |
| `features/` | 单个功能的输入、输出、边界和验收 |
| `ui/00-screen-map.md` | 屏幕、导航和全局叠层关系 |
| `ui/art-direction.md` | 视觉与资产方向 |
| `ui/` 其余文档 | 修改对应页面时的交互意图；不是默认阅读材料 |
| `data/` | 配置字段、ID 与当前 JSON 数据 |
| `engineering/architecture.md` | 代码依赖和写入边界 |
| `engineering/DEVELOPMENT-STRATEGY.md` | 长期开发阶段与范围冻结 |
| `engineering/PLAYTEST-PLAN.md` | 可玩性、节奏与数值验证方法 |
| `engineering/PROJECT-TASK-BOARD.md` | 当前产品状态、当前模块、下一步 |
| `engineering/cocos-client-setup.md` | Cocos / 微信联调与排障 |

## 阅读方式

新会话默认只读根目录 `AGENTS.md` 和项目看板。执行模块时，再按看板“输入”读取对应文档；不要通读全部设计文档后才开始工作。

实现玩法规则时先看对应 Feature，再下钻 GDD；修改屏幕时读 screen map、art direction 和对应页面文档；修改数据时读对应 schema 与 JSON。

## 冲突处理

- GDD 与 Feature 冲突：停下确认，不自行选择方便实现的一方。
- 文档与当前代码不同：若文档描述锁定玩法，按设计冲突处理；若只是旧接口/旧任务号，以当前 TypeScript 和测试为准并清理旧描述。
- 自动化与真实预览不同：自动化仍需通过，但玩家可见问题优先修复，不能把结构通过写成产品完成。
