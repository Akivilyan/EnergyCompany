---
id: ui/region-main
title: 地区主界面
status: draft
version: 0.2.0
sources:
  - docs/design/features/region-main.md
  - docs/design/ui/00-screen-map.md
supersedes: []
depends_on:
  - features/region-main
  - ui/00-screen-map
open_questions:
  - 区域供能摘要是否展示线损后二级指标
---

# 地区主界面

## 1. 屏幕 ID

`screen_region`

## 2. 目的

玩家在单一区域内查看城市节点、已有/在建链路，选择城市进入建设，或发起区内铺线。

## 3. 布局

```text
┌──────────────────────────────────────────────┐
│ TopBar: 资金 | 社会价值 | 年月    [世界地图] │
├──────────────────────────────────────────────┤
│ 区域标题 + 区域供能摘要                      │
├──────────────────────────────────────────────┤
│                                              │
│     [城A]────施工中────[城B]                  │
│        \                 /                    │
│         [城C](只读)                           │
│                                              │
├──────────────────────────────────────────────┤
│ [事件] [科技] [公司]           (无下一月)    │
└──────────────────────────────────────────────┘
```

## 4. 组件

- `TopBar`
- `RegionHeader`
- `RegionMapCanvas`
  - `CityNode[]`
  - `GridLinkLayer`
- `LinkBuildBar`
- `BottomNav`
- `ToastHost`

## 5. 关键交互

| 控件 | 操作 | 结果 |
|------|------|------|
| `CityNode` | 点击可操作节点 | 进入 `screen_city_detail` |
| `CityNode` | 点击只读节点 | 显示只读摘要 |
| 两个城市节点 | 进入建线选择 | 显示 `LinkBuildBar` |
| `BtnConfirmLink` | 确认 | 下达 `queue_grid_link` |
| `BtnWorldMap` | 点击 | 返回 `screen_world_map` |
| `BtnTech` / `BtnCompany` | 点击 | 进入对应全局屏 |

## 6. 状态

| 状态 | 表现 |
|------|------|
| 仅 1 城可操作 | 隐藏建线入口 |
| 资金不足 | 建线确认不可用 |
| `month_settling` | 输入禁用，显示结算遮罩 |
| 教学遮罩 | 按引导白名单限制操作 |

## 7. 微信注意事项

- 顶栏与底栏避开安全区
- 节点热区不小于 44x44
- 地图拖拽与点选手势分离

## 8. 相关文档

- `../features/region-main.md`
- `../features/grid-network.md`
- `./00-screen-map.md`
