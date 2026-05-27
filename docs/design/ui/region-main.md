---
id: ui/region-main
title: 地区主界面
status: draft
version: 0.1.0
sources:
  - docs/design/features/region-main.md
  - docs/design/gdd/01-core-loop.md#区域界面-screen_region
  - docs/design/ui/00-screen-map.md
supersedes: []
depends_on:
  - features/region-main
  - ui/00-screen-map
  - features/grid-network
open_questions:
  - 区域供能摘要是否显示线损后数值（与 T20 联调）
---

# 地区主界面

## 1. 屏幕 ID

`screen_region`

上下文参数：`current_region_id`（如 `MAP-01`）。

## 2. 目的

玩家在 **单一省壳** 内查看城市节点与区域电网，选择城市进入建设，或发起 **区内** 城市间铺线。

## 3. 布局（线框）

```text
┌──────────────────────────────────────────────┐
│ TopBar: 资金 | 社会价值 | 年月    [世界地图] │
├──────────────────────────────────────────────┤
│ RegionTitle + 区域供能摘要条（可选二级指标）    │
├──────────────────────────────────────────────┤
│                                              │
│     [城A]────链路施工中────[城B]              │
│        \                    /                │
│         [城C]  (只读灰)                      │
│                                              │
│  图例：可操作 / 只读 / 选中 / 施工中           │
│                                              │
├──────────────────────────────────────────────┤
│ [事件]  [科技]  [公司]          (无下一月)    │
└──────────────────────────────────────────────┘
```

- **主区**：区域拓扑图（节点 + 已有/在建链路）。
- **无** 右下角 `下一月`（主入口仅在 `screen_city_detail`）。
- 选两城后浮出 **建线确认条**（见 §6）。

## 4. 组件树

- `RegionScreen`
  - `TopBar`（与城/地图屏共享 HUD 规范，T35）
    - `FundsLabel` ← `funds`
    - `SocialValueLabel` ← `social_value_current`
    - `MonthLabel` ← `current_month`
    - `BtnWorldMap` → `screen_world_map`
  - `RegionHeader`
    - `RegionName` ← `region_id` 本地化
    - `RegionSupplySummary` ← `region_supply_total` / `region_demand_total`
  - `RegionMapCanvas`
    - `CityNode[]`
      - 状态：`operable` | `readonly` | `selected` | `under_construction_hint`
    - `GridLinkLayer`
      - `LinkEdge`：built / building / planned-preview
  - `LinkBuildBar`（条件显示）
    - `LinkPreviewStats`（费用、工期、线损预估）
    - `BtnConfirmLink` / `BtnCancelPick`
  - `BottomNav`
    - `BtnEvents` → `panel_events`
    - `BtnTech` → `screen_tech_tree`（II+）
    - `BtnCompany` → `screen_company`
  - `ToastHost`

## 5. 数据绑定

| 组件 | 数据来源 | 刷新时机 |
|------|----------|----------|
| `FundsLabel` 等顶栏 | run 核心 | 任意写操作后、月结后 |
| `CityNode` 状态 | `city_id`, `unlock_company_level`, `company_level` | 进入屏、M10 后 |
| `LinkEdge` | `grid_link_queue` + 已建成表 | 进入屏、M2 后、建线成功 |
| `RegionSupplySummary` | M4 缓存 | 月结后、进入屏 |
| `LinkPreviewStats` | 选中起终点 + 配表 | 选点变化时 |

## 6. 交互表

| 控件 | 操作 | 条件 | 结果 |
|------|------|------|------|
| `CityNode` | 单击 | `operable` | `open_screen(city)` → `screen_city_detail` |
| `CityNode` | 单击 | `readonly` | 打开城市 **只读** 摘要气泡（无建设入口） |
| `CityNode` | 长按/二次点选 | 建线模式 | 设为起点/终点；起终点齐全显示 `LinkBuildBar` |
| `BtnConfirmLink` | 点击 | 资金、拓扑合法 | `queue_grid_link`；关闭预览条 |
| `BtnCancelPick` | 点击 | — | 清空起终点选择 |
| `BtnWorldMap` | 点击 | 非 tutorial blocked | `screen_world_map` |
| `BtnTech` / `BtnCompany` | 点击 | II+ / 非 blocked | 对应全局屏 |
| `LinkEdge`（施工中） | 点击 | — | 展示工期、取消入口（若 T20 允许取消） |

## 7. 空态 / 锁定态 / 异常态

| 态 | 表现 |
|----|------|
| 区内仅 1 城可操作 | 其余节点 `readonly`；建线入口隐藏或提示「需第二座城市」 |
| 资金不足 | `BtnConfirmLink` 灰显 + Toast `insufficient_funds` |
| 跨区域选点 | Toast「仅可在同一区域内建线」 |
| `month_settling` | 全屏 `overlay_settling`；本屏输入禁用 |
| 教学遮罩 | 按 [onboarding](../features/onboarding.md) 白名单禁用导航 |

## 8. 与其它屏幕导航

| 方向 | 目标 |
|------|------|
| 进入 | `screen_world_map` 选省；`screen_city_detail` 返回（同省） |
| 离开 | `screen_city_detail`（选城）；`screen_world_map`（顶栏） |
| 不经过 | **都** 节点（大地图直达 city） |

见 [00-screen-map](./00-screen-map.md) §2。

## 9. 微信小游戏注意事项

- 顶栏与底栏避开 **安全区**（刘海/底部横条）；热区 ≥ 44×44 pt 等效。
- 区域图支持 **双指缩放/拖曳**；节点点击与拖动画布手势分离（避免误触）。
- 建线确认条固定贴底，避免被系统手势条遮挡。

## 10. 相关文档

- Feature：[地区主界面](../features/region-main.md)、[区域电网](../features/grid-network.md)
- GDD：[核心循环](../gdd/01-core-loop.md)、[电网](../gdd/06-grid.md)
- UI：[屏幕地图](./00-screen-map.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T27 初稿：线框、组件树、交互表与导航 |
