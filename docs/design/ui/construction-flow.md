---
id: ui/construction-flow
title: 建设流程（城市屏）
status: draft
version: 0.1.0
sources:
  - docs/design/features/construction.md
  - docs/design/gdd/01-core-loop.md#城市详细建设界面-screen_city_detail
supersedes: []
depends_on:
  - features/construction
  - ui/00-screen-map
open_questions: []
---

# 建设流程（城市屏）

## 1. 屏幕与叠加 ID

- 父屏：`screen_city_detail`
- 叠加：`modal_build_list`、`modal_build_confirm`、`panel_construction_queue`

## 2. 目的

城市内 **选位 → 选型 → 确认 → 在建管理**；承载 **`下一月`** 主入口与供能/科技完成 **内提示**。

## 3. 城市屏布局（线框）

```text
┌──────────────────────────────────────────────┐
│ 资金 | 社会价值 | 年月          [?帮助]      │
├──────────────────────────────────────────────┤
│ 供能条 ████████░░ 78%   [科技完成条-内提示]   │
├──────────────────────────────────────────────┤
│                                              │
│   [位1:空] [位2:在建火3月] [位3:风电运营]      │
│   [位4:空] ...                               │
│                                              │
├──────────────────────────────────────────────┤
│[事件][科技][公司][地图]     [在建(2)]        │
│                              [ 下一月 ▶ ]    │
└──────────────────────────────────────────────┘
```

## 4. 组件树（城市 + 建设模态）

- `CityDetailScreen`
  - `TopBar` + `SupplyBar`（100% 时徽章态，**不弹窗**）
  - `BuildSlotGrid` → `BuildSlot`（empty / building / operational）
  - `InlineHintStrip`（研发完成等）
  - `BottomBar`：`BtnNextMonth`（主 CTA）、`BtnQueue`、`BtnNav*`
- `ModalBuildList`（点空位）
  - `FacilityRow[]`（仅最高可建 tier）
- `ModalBuildConfirm`
  - 费用、工期、运维、产能；`BtnConfirm` / `BtnCancel`
- `PanelConstructionQueue`
  - `QueueItemRow`（进度、取消）

## 5. 交互表

| 控件 | 条件 | 结果 |
|------|------|------|
| 空 `BuildSlot` | 非 settling | 打开 `modal_build_list` |
| `FacilityRow` | 选址合法 | `modal_build_confirm` |
| `BtnConfirm` | 校验通过 | `queue_construction`；关模态 |
| `BtnNextMonth` | 非 blocked | `next_month` |
| `QueueItem` 取消 | 规则允许 | `cancel_construction` |
| 供能 100% | M4 后 | `SupplyBar` 达标样式（见 milestones） |

## 6. 异常态

| 场景 | UI |
|------|-----|
| 位满 | 空位不可点 / Toast `slot_full` |
| 全局在建满 | 确认钮灰显 `construction_queue_full` |
| 非临水建水电 | 列表项灰显 `invalid_site` |
| `freeze_build` | 空位不可点；在建列表仍可见 |

## 7. 导航

主入口屏；返回 region 或 world（取决于进城路径）。

## 8. 微信小游戏

- **`下一月`** 右下角大按钮，避开安全区。
- 建造模态 **底部 sheet** 优先于居中框（单手友好）。

## 9. 相关文档

- Feature：[construction](../features/construction.md)
- UI：[milestones](./milestones.md)（供能 100% 内提示）
