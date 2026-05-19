# 设计文档编写规范

本文档约束 `docs/design/` 下所有新建文稿。旧目录 `docs/*.md` 仅作搬迁参考，不作为格式标准。

---

## 1. 协作节奏

- **一项任务 ≈ 一次对话**（见 [`TASK-LIST.md`](./TASK-LIST.md)）。
- 每次只完成当前任务产出物；不跨任务批量搬迁旧文档。
- **暂不设独立审核流程**；交付默认为 `draft`，经你口头确认后改为 `locked`。
- 人与 Agent 的协作对话 **从 T02 起**；T01 等基础设施由 Agent 按本规范自行补齐。

---

## 2. 目录与命名

| 类型 | 路径 | 文件名规则 | 示例 |
|------|------|------------|------|
| GDD | `gdd/` | `NN-topic.md`，`NN` 为两位序号 | `gdd/00-vision.md` |
| Feature Spec | `features/` | `topic.md` 或 `NN-topic.md`（仅全局用序号） | `features/construction.md` |
| UI Spec | `ui/` | 与 Feature 同名优先；总览用 `00-` 前缀 | `ui/region-main.md` |
| Data | `data/` | 表名或 `schemas/表名.md` | `data/schemas/region_base.md` |
| Engineering | `engineering/` | `kebab-case.md` | `engineering/vertical-slice-v0.md` |

- 使用 **简体中文** 正文；**ID、字段名、枚举值** 使用 `snake_case` 英文。
- 文件名全小写，单词用连字符 `-`。
- 避免在正文写死游戏名/公司名（除非该任务明确要求定名）。

---

## 3. 文档头（Front matter）

每个新建 `.md` 文件 **必须以 YAML front matter 开头**：

```yaml
---
id: gdd/00-vision          # 唯一 ID，与路径一致
title: 愿景与边界
status: draft              # draft | locked
version: 0.1.0             # 你确认锁定后可 bump
sources:                   # 搬迁来源（旧 docs 章节）
  - docs/game-core-design.md#2
supersedes: []             # 取代的旧文件路径；无则 []
depends_on:                # 本设计文档依赖的其他 design 文档
  - gdd/00-vision
open_questions:            # 尚未拍板、留待后续对话
  - 示例：首版是否强制新手引导可跳过
---
```

**status 含义**

| 值 | 含义 |
|----|------|
| `draft` | 初稿或修订中，实现不可视为定案 |
| `locked` | 你已确认；下游 Feature/UI/Data 可据此编写 |

---

## 4. GDD 正文结构

GDD 只写 **玩法与规则**，不写引擎 API、不写具体 UI 像素。

推荐章节（可按主题删减，但顺序尽量保持）：

```markdown
# {标题}

## 概述
（本章解决什么问题，1–3 句）

## 规则
（可分小节）

## 公式与数值
（有则写清变量含义；未定数值用「待表」标注）

## 与其他系统的关系
（列表 + 链接到其它 gdd 文件）

## 首版边界
（明确做什么 / 不做什么）

## 开放问题
（与 front matter 的 open_questions 呼应，正文可展开）
```

**禁止**：在 GDD 里粘贴大段 Feature 验收用例、组件树、TypeScript 伪代码（除非用极简示例说明规则）。

---

## 5. Feature Spec 模板

Feature Spec 面向 **实现与测试**，规则细节 **引用 GDD**，不复制整章。

```markdown
---
id: features/construction
title: 设施建设
status: draft
version: 0.1.0
sources: []
supersedes: []
depends_on:
  - gdd/02-economy.md
  - gdd/05-map-and-slots.md
open_questions: []
---

# 设施建设

## 1. 目标
玩家通过本功能达成什么（一句话）。

## 2. 范围
- **包含**：…
- **不包含**：…

## 3. 触发与入口
| 入口 | 条件 | 导航至 |
|------|------|--------|

## 4. 前置条件
（资金、科技、区域解锁、建设位等）

## 5. 玩家操作
（逐步：选什么 → 确认什么）

## 6. 系统行为与副作用
（状态变更、扣款、入队、写存档字段等）

## 7. 与月度结算的关系
（何时生效、结算管道中的步骤编号，见 `features/00-game-state.md`）

## 8. 数据依赖
（引用 `data/schemas/` 中哪些表/字段；未定则写「待 T3x」）

## 9. 错误与边界
（资金不足、位已满、重复操作等）

## 10. 验收标准
- [ ] Given … When … Then …
- [ ] …

## 11. 相关文档
- GDD：…
- UI：…
```

---

## 6. UI Spec 模板

```markdown
---
id: ui/region-main
title: 地区主界面
status: draft
version: 0.1.0
sources: []
depends_on:
  - features/region-main.md
open_questions: []
---

# 地区主界面

## 1. 屏幕 ID
`screen_region_main`

## 2. 目的
（玩家在屏上完成什么）

## 3. 布局（线框）
（ASCII 或分区描述：顶栏 / 主区 / 底栏 / 悬浮）

## 4. 组件树
- TopBar
  - ResourceMoney
  - ResourceSocialValue
  - DateLabel
- …

## 5. 数据绑定
| 组件 | 数据来源 | 刷新时机 |
|------|----------|----------|

## 6. 交互表
| 控件 | 操作 | 条件 | 结果 |
|------|------|------|------|

## 7. 空态 / 锁定态 / 异常态

## 8. 与其它屏幕导航

## 9. 微信小游戏注意事项
（安全区、按钮热区、字体层级——能写则写）

## 10. 相关文档
```

---

## 7. 交叉引用写法

- 仓库内链接使用相对路径：`[社会价值](./gdd/03-social-value.md)`
- 引用 GDD 规则时用章节锚点：`gdd/03-social-value.md#月度结算`
- Feature 中写「见 GDD §…」时，应同时给出链接，便于跳转。

---

## 8. 开放问题与决策记录

- 未决事项写入 front matter `open_questions`，正文 **开放问题** 节可展开。
- 你在对话中拍板后：从 `open_questions` 删除或标为已决，并在该文档 **变更记录** 表中记一行。

每个文档末尾可选：

```markdown
## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-19 | 初稿 |
```

---

## 9. 与旧文档的关系

- 搬迁时只摘 **与当前任务相关** 的段落，并按本规范改写，不整页复制。
- `sources` 必须列出旧文件路径与章节，便于日后核对。
- 新稿 `locked` 之前，旧 `docs/game-core-design.md` 等 **保持只读参考**，不删除。

---

## 10. 已确认的流水线决策（2026-05-19）

| 项 | 决策 |
|----|------|
| 任务粒度 | 一项 = 一次对话 |
| GDD 拆分 | 保持 T02–T11 十个主题文件，不合并 |
| 新手引导 | **必须**；独立任务 T11a / T24a / T35a |
| Playable v0 | **后续对话共定**（T41） |
| 协作起点 | 人与 Agent 从 **T02** 开始；T01 已完成 |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-05-19 | 初版（T01 交付） |
