# 城市首个可玩切片设计简报

> 用途：`PLAYABLE-CORE-01` 的默认 UI 短上下文。只覆盖城市建设与月结反馈，不定义后续公司、科技和地图页面布局。

## 1. 玩家路线

进入城市 → 点选建设位 → 比较风电/光伏/火电 → 确认建设 → 查看在建状态 → 推进月份 → 完工 → 看懂资金、供能和 EXP 月结变化 → 明确下一步。

## 2. 目标尺寸

- 主尺寸：390×844。
- 响应式复核：430×932。
- 正文约 16sp 以上；重要数值 20–24sp 以上。
- 主要触控区至少约 48×48dp，相邻热区保留可靠间隔。

## 3. 城市场景与 HUD

- 大部分屏幕留给可观察、可点按的城市，不做经营仪表盘或常驻底部标签栏。
- 顶部使用双层一体状态栏：当前资金、可靠的预计每回合净资金变化、累计月份、有效供能/需求。
- `recurringFundsDeltaEstimate` 只能来自规则/模块查询；暂时不能可靠提供时显示 `—`，不得拿上月实际值冒充。
- 公司 EXP 不常驻城市 HUD；月结回执可显示 before / after / delta，完整进度留给公司成长切片。
- 同一时刻只突出一个主操作。

## 4. 建设交互

- 点选空位后，空位保持可见并进入选中态。
- 候选只使用已确认的风电·I、光伏·I、火电·I 代表资产。
- 候选展示建设费、工期、运行费和预期产能量，不复制规则公式。
- 提交成功后立即反馈资金扣款与在建状态；失败时保留选择并解释原因。
- 设施完工当月不参与供能，下一月 M4 才参与；反馈必须让玩家理解这个时点。

## 5. 月结反馈

- `下一月` 是城市页稳定主操作，不需要每次二次确认。
- 常态结果使用 HUD delta、建设进度和紧凑月结回执，不弹固定经营报表。
- 本切片只需要一次供能不足类经营压力反馈，不接完整事件系统。
- 玩家返回可操作态后必须知道刚发生什么以及下一步能做什么。

## 6. 视觉基准

- 使用 `art-direction.md` 的明亮正午新能源城市、半透明玻璃、彩色白描边图标和分级光晕。
- 建筑使用 A′ 高机位弱透视与 L3 近顶部正午光。
- 正式资产只取 `assets/buildings/representative-v1/` 和 `assets/icons/icon-manifest-v2.md` 已锁定内容。
- 不制作灾害天气、完整城市组合、区域或世界地图资产。

## 7. 状态组件

| 组件 | 当前切片状态 |
|------|--------------|
| `BuildSlot` | empty / selectable / selected / building / operational / blocked |
| `FacilityCandidate` | default / selected / unavailable |
| `BottomContextSheet` | candidate-list / confirmation / blocked |
| `PrimaryAction` | enabled / pressed / loading / disabled |
| `ConstructionMarker` | queued / progressing / completed |
| `MonthReceipt` | normal / progress / completion / warning |

共用组件只在当前路线真实使用；不为后续页面预建变体。

## 8. 不做

- 不恢复旧 Cocos 程序化 HUD 或页面全集壳。
- 不实现公司页、科技树、区域、全国地图、超级水电和完整事件系统。
- 不新增货币、评分、事件选择或其它玩法规则。
- 不把内部 M1–M14 技术步骤逐条展示给玩家。
- 不扩充建筑、图标和地图资产。

## 9. 回查路由

| 问题 | 来源 |
|------|------|
| 玩家可见状态与月结事实 | `city-flow-gameplay-contract.md` |
| 建设流程 | `construction-flow.md`、`../features/construction.md` |
| 月结反馈 | `month-settlement-flow.md` |
| HUD 数据口径 | `concepts/city-top-hud-funds-supply-exp-contract-v2.md` |
| 视觉与资产 | `art-direction.md`、`assets/buildings/building-visual-contract-v1.md` |
