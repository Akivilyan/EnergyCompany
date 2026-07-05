# 事件面板与弹窗

## 1. 屏幕与叠加 ID

- `panel_events`（城市/区域/地图底栏入口）
- `modal_event_fullscreen`（灾害 / 显著政策市场）

## 2. 目的

查看 scheduled/active/expired 事件；大事件 **全屏只读确认**（不阻塞结算管道完成后操作）。

## 3. 面板线框（`panel_events`）

```text
┌─ 事件 ──────────────── [×] ─┐
│ 即将到来                    │
│  · 寒潮预警  还有 3 月       │
│ 进行中 (2/3 槽)             │
│  · 燃料涨价  剩 2 月         │
│ 已结束                      │
│  · …                        │
└─────────────────────────────┘
```

**形态**：底部 **半屏 sheet**（T26 open question 定稿为此）。

## 4. 全屏弹窗线框

```text
┌──────────────────────────────────────────────┐
│           [插画区 - 可选]                     │
│           灾害 / 政策标题                     │
│           摘要 · 影响说明（只读）              │
│                                              │
│              [ 知道了 ]                       │
└──────────────────────────────────────────────┘
```

- **灾害**：一律全屏。
- **政策/市场**：仅「显著干预」时全屏；其余面板内展示。
- 同月与公司升级弹窗：**先升级**（T34），事件排队。

## 5. 组件树

- `EventPanelSheet`
  - `EventSection` × 3（upcoming / active / expired）
  - `EventRow`（icon, title, countdown, intensity）
- `EventFullscreenModal`
  - `EventArt`（可选）
  - `EventCopy`
  - `BtnAcknowledge`（只读，不关游戏逻辑）

## 6. 交互表

| 控件 | 结果 |
|------|------|
| `BtnEvents` |  toggle `panel_events` |
| `EventRow` active | 展开 debuff 摘要 |
| `BtnAcknowledge` | 关闭弹窗；标记 M12 已展示 |
| 结算中 | 面板不可打开新操作；已排队弹窗 M12 后显示 |

## 7. 与引导优先级

`modal_event_fullscreen` > `overlay_onboarding`（引导暂停）。

## 7.1 壳层错误码与文案键

`screenEventsPanel` 返回 `uiErrorCode + uiCopy(messageKey/actionKey)`，UI 按键取文案，不解析底层字符串。

| `uiErrorCode` | `messageKey` | `actionKey` | 建议交互 |
|---|---|---|---|
| `event_not_found` | `events_panel.error.event_not_found` | `events_panel.action.refresh_list` | 提示事件 ID 不存在，刷新面板 |
| `event_not_active` | `events_panel.error.event_not_active` | `events_panel.action.refresh_list` | 该事件尚未触发或已结束，刷新面板 |
| `no_pending_modal` | `events_panel.error.no_pending_modal` | `events_panel.action.close_panel` | 无待确认弹窗，允许关闭 |
| `action_failed` | `events_panel.error.action_failed` | `events_panel.action.retry` | 兜底错误，提示重试 |

## 7.2 全屏弹窗内容键契约

`screenEventsPanel.getPendingFullscreenModal()` 返回待确认事件与文案键，UI 通过 key 拉取标题/摘要/影响文案。

| 字段 | 规则 | 示例 |
|---|---|---|
| `titleKey` | `events.modal.{event_id}.title` | `events.modal.disaster_exam_1.title` |
| `summaryKey` | `events.modal.{event_id}.summary` | `events.modal.disaster_exam_1.summary` |
| `impactKey` | `events.modal.{event_id}.impact` | `events.modal.disaster_exam_1.impact` |
| `acknowledgeButtonKey` | 普通灾害：`events.modal.action.acknowledge`；最终灾害：`events.modal.action.acknowledge_final` | `events.modal.action.acknowledge_final` |

说明：

- 当 `pendingFullscreen` 为空时，壳层返回 `null`，UI 不展示全屏事件弹窗。
- 事件文案 key 统一按配置中的 `event_id` 生成，不依赖硬编码映射表。

## 7.3 多场叠加与优先级契约

`screenEventsPanel.getSnapshot()` 在 `active` 基础上提供分槽展示与确认队列，避免多场事件同月时 UI 自行重排。

| 字段 | 说明 |
|---|---|
| `activeSlotLimit` | 固定为 `3`，对应面板“进行中 (x/3 槽)”文案 |
| `visibleActive` | 当前月可视槽位内事件（最多 3 条） |
| `hiddenActive` | 超出槽位的事件（折叠/“更多”） |
| `activeOverflowCount` | `hiddenActive.length`，用于角标与提示 |
| `pendingFullscreenQueue` | 待确认全屏弹窗队列，`pendingFullscreen` 取首项 |

排序优先级（高 -> 低）：

1. 最终灾害优先（`isFinal=true`）
2. `examTier` 高优先
3. `triggerMonth` 早优先
4. `seq` 小优先（兜底稳定排序）

## 8. 微信小游戏

- 全屏弹窗 **单按钮** 大热区；插画可静态图压缩。
- 面板列表虚拟滚动（事件多时）。

## 9. 相关文档

- Feature：[events](../features/events.md)
- UI：[milestones](./milestones.md)
