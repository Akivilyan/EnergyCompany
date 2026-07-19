# UI Spec 索引

`docs/design/ui/` 负责屏幕层级、玩家可见行为、交互状态与视觉基准，不重复讲完整玩法规则或保存旧客户端壳层历史。

## 文档状态

| 文档 | 状态 | 对应内容 |
|------|------|----------|
| `product-prototype-design-brief.md` | 当前基准 | 产品原型默认短上下文、视觉与交互底线、资产生产顺序 |
| `art-direction.md` | 当前基准 | UI 美术、图标、建筑、场景层级、资产拆分与音频合同 |
| `assets/icons/icon-manifest-v2.md` | 图标阶段完成 | 24 枚 128px 轻量运行时候选、命名、语义、尺寸预算与保留稿边界 |
| `assets/buildings/building-visual-contract-v1.md` | 已确认 | 真实设施视觉清单、A′ / L3 镜头光照、占地 / 锚点合同与代表组验收记录 |
| `assets/buildings/representative-v1/README.md` | 已确认 | 风电·I、光伏·I、火电·I 的 512px 母图、独立阴影、256px 缩略图与清单 |
| `city-flow-gameplay-contract.md` | 当前玩法合同 | 城市建设、推月、灾害的玩家可见事实与规则分歧 |
| `construction-flow.md` | 当前流程合同 | 点空位后的建设流程与状态 |
| `month-settlement-flow.md` | 当前流程合同 | 下一月后的常态结算、关键反馈队列与返回态 |
| `events.md` | 当前流程合同 | 事件入口、灾害详情与持续压力反馈 |
| `00-screen-map.md` | 导航合同 | 屏幕层级与返回关系；具体布局仍需按正式设计复核 |
| `region-main.md` | 待重设计 / 行为合同 | 区域页目的、数据与行为；不含有效布局 |
| `world-map.md` | 待重设计 / 行为合同 | 世界地图目的、数据与行为；不含有效布局 |
| `company.md` | 待重设计 / 行为合同 | 公司页玩家可见数据与业务动作；不含有效布局 |
| `tech-tree.md` | 待重设计 / 行为合同 | 科技页状态与业务动作；不含有效布局 |
| `onboarding.md` | 待重设计 / 行为合同 | 通用引导行为；正式步骤等待首局原型稳定 |
| `milestones.md` | 待重设计 / 行为合同 | 关键节点反馈类型与排队关系 |
| `run-result.md` | 待重设计 / 行为合同 | 通关与破产结果信息 |

## 共享约束

- 默认微信小游戏安全区
- 组件命名、屏幕 ID 与 Feature 对齐
- 正式 UI / Prefab 批次的视觉与音频基调以 `art-direction.md` 为准
- 标记为“待重设计 / 行为合同”的文档只提供玩法输入，不得用其中历史布局反推正式页面
