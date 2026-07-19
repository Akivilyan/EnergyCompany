# PRODUCT-PROTOTYPE-01 设计简报

> 用途：产品原型与页面设计的默认短上下文入口。设计新状态时先读本文与 `city-flow-gameplay-contract.md`；只有本文明确要求回查时，才打开原始 GDD、Feature 或数值表。
>
> 基准版本：2026-07-19；当前视觉基准为 `concepts/city-scene-first-glass-direction-v4.png`。

## 1. 产品与体验目标

- 平台：微信小游戏；竖屏轻策略经营；Cocos Creator 3.x + TypeScript。
- 主尺寸：390×844；响应式复核：430×932。
- 玩家身份：能源公司经营者，在资金、供能、社会价值与灾害压力之间做长期取舍。
- 时间：玩家操作时静止；只由城市页 `下一月` 主动推进一个月。
- 首局主流程：新游戏 → 选择方针 → 建设 → 推月 → 理解变化 → 处理压力 → 明确下一目标。
- 每个页面必须回答：当前目标是什么、主操作是什么、动作后发生什么、下一步去哪里。

## 2. 信息架构

```text
screen_world_map
  ├─ 省 → screen_region → 城市 → screen_city_detail
  └─ 都 → screen_city_detail

screen_city_detail
  ├─ screen_tech_tree
  ├─ screen_company
  ├─ panel_events
  └─ 下一月 → 月结反馈队列 → 返回可操作态 / screen_run_result
```

- 城市页是默认停留页与唯一 `下一月` 主入口。
- 世界、区域、城市都采用“场景即主界面”；科技、公司可使用完整管理面板。
- 返回遵循进入路径；先关闭叠加层，再退出当前屏幕。
- 同一时刻只突出一个主操作。

## 3. 当前视觉语言

### 场景

- 明亮、自然、未来、希望；高明度正午日照，天空蓝、湖蓝、薄荷绿、暖黄。
- 场景必须先被看成可观察、可点按的新能源城市，而不是移动 App 仪表盘。
- 建筑以轮廓和主色区分：风电蓝白黄、光伏钴蓝青、火电珊瑚橙、核电琥珀橙、储能紫青、水电/电网湖蓝青绿黄。
- 阴影短、软、浅蓝灰；深色机械结构只作小面积点缀。

### HUD

- 常驻只保留：资金、社会价值、月份、关键预警、极少数高频入口与一个主操作。
- 资源栏、主按钮、上下文浮层使用乳白/浅冰蓝半透明玻璃；玻璃必须有稳定承载层，不依赖实时背景模糊。
- 图标使用高饱和彩色实体符号、白色外描边、圆润轮廓、轻微同色投影和短柔光倒影。
- 不常驻底部标签栏、大块经营卡、图表、设施名称牌或设施详情。

### 光晕层级

| 层级 | 表现 |
|------|------|
| 静态信息 | 仅边缘高光 |
| 可点击对象 | 弱光与清晰轮廓 |
| 当前选中对象 | 明确环形光 + 形状/尺度变化 |
| 主操作 | 暖黄高光 |
| 风险 / 完成 | 短时脉冲，并有图形或文字冗余 |

空位、选中建筑、主按钮和安全边框不能长期同等明亮。

## 4. 场景页交互原则

- 默认浏览态把大部分屏幕留给场景；设施、空位、城市节点先在场景中表达可点状态。
- 点选后才渐进披露名称、数值与操作；优先使用底部 sheet、紧凑浮层或锚定气泡。
- 点空位：空位保持可见并进入选中态；建设 sheet 不应完全遮住选址与周边设施。
- 点设施：只展示该设施的状态与相关操作，不顺带铺开公司经营信息。
- `下一月`：高频、稳定、无需每次确认；进入短暂不可交互结算态。
- 常态月结不弹固定经营结果框；资源变化、项目完成与供能变化使用场景内和 HUD 内轻反馈。
- 灾害、公司升级、重大政策/市场与大型工程完成才进入阻断式反馈队列。

## 5. 组件与状态命名

| 组件 | 核心状态 |
|------|----------|
| `TopResourceCapsule` | default / delta-positive / delta-negative / risk |
| `BuildSlot` | empty / selectable / selected / building / operational / blocked |
| `FacilityCandidate` | default / selected / unavailable / recommended |
| `BottomContextSheet` | compact / half / expanded / blocked |
| `PrimaryAction` | enabled / pressed / loading / disabled / risk |
| `ConstructionMarker` | queued / progressing / completed |
| `MonthReceipt` | normal / progress / completion / warning |
| `EventBadge` | upcoming / active / unread |
| `FullscreenFeedback` | level-up / event / major-completion / terminal |

共享组件必须使用状态变体，不为每个数值组合复制静态页面。

## 6. 尺寸与可访问性底线

- 正文约 16sp 以上；重要数值 20–24sp 以上；避免细字重。
- 主要触控区至少约 48×48dp；可见图标可以更小，但热区不能更小。
- 相邻热区至少约 8dp 间隔；单手主操作位于安全区内的右下或底部稳定位置。
- 动态背景上的文字必须放在稳定玻璃/实色承载层上。
- 风险、锁定、完成不得只靠颜色；同时使用图标、形状或短文本。
- 动效优先淡入、轻缩放与局部高光；单段通常 150–300ms；提供减弱动态时的瞬时替代。
- 390×844 与 430×932 都必须无重叠、截断和不可达热区。

## 7. 当前两条关键流程

1. 点空建设位：选位 → 浏览可建设施 → 比较关键后果 → 确认 → 资金与场景立即反馈 → 回到城市。
2. 点击下一月：锁定输入 → 月结 → 轻量常态反馈或关键反馈队列 → 明确事件影响 → 回到城市并显示下一步压力。

详细玩法输入、命令、数值示例和规则隔离见 `city-flow-gameplay-contract.md`；详细页面状态分别见 `construction-flow.md`、`month-settlement-flow.md` 与 `events.md`。

当前高保真样张：

- [`concepts/city-build-flow-hifi-v1.png`](./concepts/city-build-flow-hifi-v1.png)：选择设施 / 确认建设。
- [`concepts/city-month-event-flow-hifi-v2.png`](./concepts/city-month-event-flow-hifi-v2.png)：普通月结反馈 / 正常场景下的灾害数值警示。

## 8. 明确不做

- 不继续微调现有 Cocos 临时壳，不从旧节点层级反推正式 UI。
- 不把 v4 中叶片、人物等占位图标直接定义为正式入口。
- 不为视觉完整度新增玩法规则、虚构货币、评分或事件选择分支。
- 不把内部 M1–M14 技术步骤逐条展示给玩家。
- 不把每月结算变成强制报表弹窗。
- 不为灾害制作雨雪、洪水、雾霾、全局罩色或受灾建筑等场景变体；只使用资金 / 倍率警示、事件图标和玻璃信息层。
- 不制作全部设施、事件和插画资产；只做验证流程与组件拆分所需代表状态。

## 9. 回查路由

默认不通读整套文档；仅在下列问题出现时回查：

| 问题 | 回查来源 |
|------|----------|
| 页面层级、返回路径 | `00-screen-map.md`、`gdd/01-core-loop.md` |
| 建设合法性、费用、工期 | `features/construction.md`、`src/sim/core/dispatch.ts` |
| 供能与社会价值公式 | `features/supply-calculation.md`、`features/social-value-settlement.md` |
| 月结顺序与可用输出 | `src/sim/core/settleNextMonth.ts`、`src/sim/types/settlement.ts` |
| 灾害字段与确认队列 | `src/modules/screenEventsPanel.ts`、`campaign_disasters.json` |
| 视觉资产与完整风格 | `art-direction.md` 与 v4 基准图 |
