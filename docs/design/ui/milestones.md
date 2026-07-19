# 关键节点反馈

跨屏 **反馈组件** 注册表（非独立导航屏）。

## 1. 全屏弹窗（`modal_*`）

| ID | 触发 | 内容 | 按钮 |
|----|------|------|------|
| `modal_company_level_up` | M10 升级 | 新等级、解锁摘要（区域/科技） | 确认 A |
| `modal_event_fullscreen` | 灾害 / 显著政策 | 见 [events](./events.md) | 确认 A |
| `modal_mega_project_complete` | 超大水电/核电完工 | 工程名、影响摘要 | 确认 A |

**排队**：非终局月份同月 `modal_company_level_up` 优先，其后为新灾害 / 显著事件与重大工程；终局只保留与胜负直接相关的一张因果反馈，再进入结果页。完整规则见 [month-settlement-flow](./month-settlement-flow.md)。

## 2. 界面内提示（不弹窗）

| ID | 触发 | 挂载位置 | 表现 |
|----|------|----------|------|
| `toast_tech_lit` | M3 点亮 | `screen_city_detail` `InlineHintStrip` | 条带 + 节点名，3s 可关 |
| `badge_supply_100` | 城 `supply_ratio>=1` | `SupplyBar` | 绿色满条/角标「100%」 |
| `toast_construction_done` | 设施完工 | 城市场景对象 + `inline_month_receipt` | 对象短脉冲 + 合并速报，可追溯 |

## 3. 组件规范

- **阻断反馈**：城市背景保持正常色彩与光照；底部使用稳定乳白 / 浅冰蓝玻璃承载影响信息，不使用全局降饱和、纯黑重遮罩或事件专属场景变体。
- **内提示**：不阻断点击；同月最多显示一条合并 `inline_month_receipt`；与 `overlay_onboarding` 并存时让位给遮罩。

## 4. 明确不做

- 每月经营结果全屏（GDD 已定）
- 科技完成 / 供能 100% **全屏插画**

## 5. 相关文档

- GDD：[01-core-loop](../gdd/01-core-loop.md)
- UI：[construction-flow](./construction-flow.md)、[events](./events.md)
