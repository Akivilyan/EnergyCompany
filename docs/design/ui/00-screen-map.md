# 屏幕地图

全项目 **屏幕 ID** 注册表：层级、入口/出口、对应 Feature、与顶层状态机关系。线框与组件树在各屏 UI 任务（T27–T35a）中展开。

---

## 1. 顶层状态 ↔ 屏幕

| 状态 ID（[00-game-state](../features/00-game-state.md)） | 主屏幕 | 说明 |
|----------------------------------------------------------|--------|------|
| `main_menu` | `screen_main_menu` | 新游戏 / 继续 / 设置 |
| `run_setup` | `screen_new_game` → `screen_new_game_doctrine` | 难度 → 方针（含教学） |
| `run_playable` | 地图栈 + 全局屏（见 §2） | 可操作主循环 |
| `month_settling` | **保持** 推月前屏；叠 `overlay_settling` | 禁止输入；可显示进度 |
| `run_result` | `screen_run_result` | 通关 / 破产 / 教学跳过 |

---

## 2. 地图栈层级（`run_playable`）

```text
screen_world_map
  ├─[选省]→ screen_region
  │            └─[选城]→ screen_city_detail  ← 下一月主入口
  └─[选都]→ screen_city_detail（跳过 region）

screen_city_detail ──全局──→ screen_tech_tree | screen_company
                ←返回── screen_region | screen_world_map
```

| 屏幕 ID | 名称 | 进入条件 | 主要出口 | Feature |
|---------|------|----------|----------|---------|
| `screen_world_map` | 全国大地图 | II+ 解锁 MAP-01 等；教学局 **隐藏** | 选省→region；选都→city；返回 city | [world-map](../features/world-map.md) |
| `screen_region` | 区域（省内） | 从大地图选 **省** | 选城→city；返回 world | [region-main](../features/region-main.md)、[grid-network](../features/grid-network.md) |
| `screen_city_detail` | 城市详细建设 | 起始城 / region / world 都节点 | 下一月；科技/公司；返回上层 | [region-main](../features/region-main.md)、[construction](../features/construction.md) |

**规则**：**都** 无 `screen_region`；**区** 必经 region（GDD 01）。

---

## 3. 全局屏幕（与地图栈平级）

| 屏幕 ID | 名称 | 进入 | 出口 | 解锁 | Feature |
|---------|------|------|------|------|---------|
| `screen_tech_tree` | 科技树 | 顶栏/底栏按钮；`open_screen` | `back_screen` → 上下文 | 公司 **≥ II**；I 级无入口 | [tech-tree](../features/tech-tree.md) |
| `screen_company` | 公司管理 | 同上 | `back_screen` | 教学步 `onb_06` 前 **遮罩锁** | [company-management](../features/company-management.md)、[monetization](../features/monetization.md) |

任意可操作月可进入（除教学白名单限制）；**不推进时间**。

---

## 4. 流程屏幕（非地图栈）

| 屏幕 ID | 名称 | 进入 | 出口 | Feature |
|---------|------|------|------|---------|
| `screen_main_menu` | 主菜单 | 启动 | 新游戏 / 继续 | 00-game-state |
| `screen_new_game` | 新游戏·难度 | 主菜单·新游戏 | 下一步→doctrine；取消→menu | [11-replayability](../gdd/11-replayability.md) |
| `screen_new_game_doctrine` | 方针选择 | 难度确认 | 确认→city 或教学链；返回→难度 | [onboarding](../features/onboarding.md)、11 |
| `screen_run_result` | 局末结算 | M13/M14/跳过教学 | 再开一局→setup；主菜单 | 00-game-state、11 |

---

## 5. 叠加层 / 模态（非独立导航栈）

| 叠加 ID | 类型 | 触发 | 阻塞 | UI 任务 | Feature |
|---------|------|------|------|---------|---------|
| `overlay_settling` | 全屏轻遮罩 | `next_month` | 是 | T26 通用 | 00-game-state |
| `overlay_onboarding` | 引导遮罩 | 教学局步骤 | 是（白名单点击） | T35a | [onboarding](../features/onboarding.md) |
| `modal_build_list` | 模态 | 城市空位 | 否 | T30 | construction |
| `modal_build_confirm` | 模态 | 建造列表选设施 | 否 | T30 | construction |
| `panel_construction_queue` | 侧栏/底 sheet | 城市·在建 | 否 | T30 | construction |
| `panel_events` | 底部 sheet | 城市·事件按钮 | 否 | T32 | [events](../features/events.md) |
| `modal_event_fullscreen` | 全屏 | 灾害/显著政策 | 只读确认 | T32 | events |
| `modal_loan_apply` | 模态 | 公司·借贷 | 否 | T29 | company-management |
| `modal_ad_reward_pick` | 模态 | 公司·激励 | 否 | T29 | monetization |
| `modal_skip_onboarding` | 确认框 | 引导·跳过 | 是 | T35a | onboarding |
| `modal_company_level_up` | 全屏 | M10 升级 | 只读 | T34 | social-value-settlement |
| `overlay_codex` | 全屏/大页 | 帮助 **?** | 否 | T35a | onboarding |
| `toast_supply_100` 等 | Toast | M4/M3 条件 | 否 | T34 | 01-core-loop |

教学局：`overlay_onboarding` 优先级低于 `modal_event_fullscreen`（大事件先播，引导暂停）。

---

## 6. 导航矩阵（`open_screen` / `back_screen`）

| From | Action | To | 条件 |
|------|--------|-----|------|
| `screen_main_menu` | 新游戏 | `screen_new_game` | — |
| `screen_new_game` | 确认 | `screen_new_game_doctrine` | — |
| `screen_new_game_doctrine` | 确认·四方针 | `screen_city_detail` | `doctrine != tutorial` |
| `screen_new_game_doctrine` | 确认·教学 | `screen_city_detail` + `overlay_onboarding` | `doctrine == tutorial` |
| `screen_city_detail` | 科技 | `screen_tech_tree` | level≥II；非 blocked |
| `screen_city_detail` | 公司 | `screen_company` | 非 blocked |
| `screen_city_detail` | 返回 | `screen_region` \| `screen_world_map` | 上下文 |
| `screen_region` | 返回 | `screen_world_map` | — |
| `screen_world_map` | 选省 | `screen_region` | 已解锁 |
| `screen_world_map` | 选都 | `screen_city_detail` | 已解锁 |
| `screen_*` | `back_screen` | 导航栈上一屏 | 记录 `from_screen` |
| 任意 playable | `next_month` | 同屏 + `overlay_settling` → 回 playable | 非 settling |

`back_screen` **不** 弹出模态；先关模态再退栈。

---

## 7. 常驻入口（多屏共享）

| 控件 ID | 出现屏幕 | 目标 |
|---------|----------|------|
| `btn_next_month` | **仅** `screen_city_detail` | `next_month` |
| `btn_tech_tree` | city、region、world、company（可选） | `screen_tech_tree` |
| `btn_company` | 同上 | `screen_company` |
| `btn_world_map` | city、region | `screen_world_map` |
| `btn_events` | city（主）；region/world（摘要） | `panel_events` |
| `btn_help` | city | `overlay_codex` |
| `hud_funds_sv_month` | city、region、world、tech、company | 只读 |

---

## 8. Playable v0 暴露建议（见 engineering/vertical-slice-v0.md）

| 屏幕/入口 | v0 建议 |
|-----------|---------|
| `screen_new_game_doctrine` | UI 可先仅 **tech** + **simple**；教学入口建议保留 |
| `screen_world_map` / `screen_region` | 按战役进度逐步解锁；可简化美术 |
| `screen_tech_tree` | 必须（tech 方针） |
| `modal_ad_reward_pick` | 可占位；IAP 商店可藏 |
| `overlay_onboarding` | 教学路径建议保留 |

---

## 9. 相关文档

- GDD：[核心循环与时间](../gdd/01-core-loop.md)、[新手引导](../gdd/10-onboarding.md)
- Feature：[索引](../features/README.md)、[00-game-state](../features/00-game-state.md)
- UI 子任务：T27 region、T28 world、T29 company、T30 construction、T31 tech、T32 events、T34 milestones、T35a onboarding
