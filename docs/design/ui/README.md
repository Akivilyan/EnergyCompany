---
id: ui/README
title: UI Spec 索引
status: draft
version: 0.3.0
sources:
  - docs/design/README.md
supersedes: []
depends_on:
  - ui/00-screen-map
open_questions: []
---

# UI Spec 索引

`docs/design/ui/` 负责屏幕结构、组件树、交互和状态，不重复讲完整玩法规则。

## 主要文档

| 文档 | 对应内容 |
|------|----------|
| `art-direction.md` | UI 美术、场景状态、资产拆分与音频方向 |
| `00-screen-map.md` | 全屏地图与导航关系 |
| `region-main.md` | 区域主界面 |
| `world-map.md` | 全国大地图 |
| `company.md` | 公司屏与相关模态 |
| `construction-flow.md` | 城市建造流程 |
| `tech-tree.md` | 科技树界面 |
| `events.md` | 事件面板与弹窗 |
| `milestones.md` | 关键节点反馈 |
| `onboarding.md` | 引导遮罩 |
| `run-result.md` | 通关 / 破产结果页 |

## 共享约束

- 默认微信小游戏安全区
- 线框以文字和 ASCII 为主
- 组件命名、屏幕 ID 与 Feature 对齐
- 正式 UI / Prefab 批次的视觉与音频基调以 `art-direction.md` 为准
