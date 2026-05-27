---
id: ui/world-map
title: 全国大地图
status: draft
version: 0.1.0
sources:
  - docs/design/features/world-map.md
  - docs/design/gdd/01-core-loop.md#大地图界面-screen_world_map
  - docs/design/ui/00-screen-map.md
supersedes: []
depends_on:
  - features/world-map
  - ui/00-screen-map
  - features/grid-network
open_questions:
  - 主干建链为地图内联还是独立全屏（默认地图内浮层，与区域建线一致）
---

# 全国大地图

## 1. 屏幕 ID

`screen_world_map`

## 2. 目的

全国 **2 都 + 8 省** 宏观布局：选区/选都、查看解锁与联通、发起 **跨区主干** 与 **战略工程** 入口。

## 3. 布局（线框）

```text
┌──────────────────────────────────────────────┐
│ TopBar: 资金 | 社会价值 | 年月              │
├──────────────────────────────────────────────┤
│ 图例: 省(区) | 都 | 已解锁 | 灰显 | 施工中    │
├──────────────────────────────────────────────┤
│                                              │
│    [MET-A]····主干施工中····[MAP-03]         │
│         \              /                     │
│      [MAP-01]───[MAP-02]  (灰)               │
│              \                               │
│           [超级水电槽 ★]                      │
│                                              │
├──────────────────────────────────────────────┤
│ [事件]  [科技]  [公司]     [返回城市]（若有）  │
└──────────────────────────────────────────────┘
```

- 节点：**省** `MAP-xx`、**都** `MET-A/B`；未解锁 **灰显不可点**。
- 点击省 → `screen_region`；点击都 → 直达 `screen_city_detail`。
- **无** `下一月` 主按钮。

## 4. 组件树

- `WorldMapScreen`
  - `TopBar`（共享 HUD）
  - `MapLegend`
  - `NationalMapCanvas`
    - `RegionNode`（type=province | capital）
    - `BackboneLinkLayer`
    - `SuperHydroSlotMarker`
  - `BackboneBuildBar`（条件：选中跨区端点）
  - `SuperHydroEntryCard`（条件：槽位可建）
  - `NodeDetailSheet`（点击灰显节点：解锁条件只读）
  - `BottomNav`（事件/科技/公司；可选「回当前城」）
  - `ToastHost`

## 5. 数据绑定

| 组件 | 数据 | 刷新 |
|------|------|------|
| `RegionNode` 态 | `unlock_company_level`, `company_level` | 进入屏、M10 |
| `BackboneLinkLayer` | `backbone_links`, `grid_link_queue` | M2、建链后 |
| `SuperHydroSlotMarker` | `super_hydro_slots` | 科技点亮、完工 |
| 联通摘要（可选角标） | M4 缓存 | 月结后 |

## 6. 交互表

| 控件 | 操作 | 条件 | 结果 |
|------|------|------|------|
| `RegionNode` 省 | 点击 | 已解锁 | `screen_region` |
| `RegionNode` 都 | 点击 | 已解锁 | `screen_city_detail`（该都） |
| `RegionNode` | 点击 | 未解锁 | `NodeDetailSheet`（门槛说明） |
| `BackboneBuildBar` 确认 | 点击 | 科技/资金 OK | `queue_grid_link`（主干） |
| `SuperHydroEntryCard` | 点击 | 槽位空、科技 OK | 战略工程确认流（T20 细化） |
| `BtnBackCity` | 点击 | 有 `current_city_id` | 回该城 city 屏 |

## 7. 空态 / 锁定态 / 异常态

| 态 | 表现 |
|----|------|
| I 级 / 教学局 | 仅 `CITY-START` 相关节点亮；其余灰显；教学可 **隐藏** 大地图入口 |
| 主干科技未解锁 | 主干线不可选；提示 `tech_locked` |
| 战略槽满 | `SuperHydroEntryCard` 灰显 `slot_limit_reached` |

## 8. 导航

见 [00-screen-map](./00-screen-map.md) §2。从 city/region 顶栏「世界地图」进入。

## 9. 微信小游戏

- 全国图默认 **缩小全览**；双指缩放；重要节点最小点击热区。
- 灰显节点仍可点查看解锁条件（避免玩家以为死区）。

## 10. 相关文档

- Feature：[world-map](../features/world-map.md)、[grid-network](../features/grid-network.md)
- GDD：[05-map](../gdd/05-map-and-slots.md)、[06-grid](../gdd/06-grid.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T28 初稿 |
