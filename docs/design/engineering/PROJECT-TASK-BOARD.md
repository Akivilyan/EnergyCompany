# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。长期顺序见 `DEVELOPMENT-STRATEGY.md`，协作规则见根目录 `AGENTS.md`，历史查 Git。

## 当前产品状态

- 平台与技术：微信小游戏，Cocos Creator 3.8.8 + TypeScript。
- 规则基础：`src/sim/` 是规则真理源；`src/modules/` 提供业务编排和玩家动作入口。
- 设计基础：城市视觉方向、正式图标、风电/光伏/火电代表建筑和城市建设浏览器设计原型均已保留。
- 客户端状态：旧程序化 HUD、全页面临时壳、专项 CLI 和重复静态验收已删除；Cocos 只保留干净工程配置，尚无正式可玩场景。
- 开发方式：按七个玩家垂直切片顺序推进；每次只完成一条真实操作流程，不同时铺开后续页面和资产。

## 当前模块

- 模块：`DIRECTION-RESET-01`
- 标题：旧工程壳清理与垂直切片方向重置
- 状态：`done`

### 完成边界

- 保留规则、业务模块、配置真理源、存档/生命周期/广告端口和最小客户端装配。
- 保留 `docs/design/ui/` 中全部生成设计素材、正式合同和浏览器设计原型。
- 删除旧 Cocos 场景与全页面程序化 HUD、`GameShell/SceneBridge`、专项路线/Spike/静态 HUD 验收、重复客户端配置副本及其同义测试。
- 当前方向以 `DEVELOPMENT-STRATEGY.md` 的七个垂直切片为准；旧壳形状和旧 CLI 不再构成兼容目标。

## 下一步

- 模块：`PLAYABLE-CORE-01`
- 标题：城市建设与月结反馈垂直切片
- 状态：`pending`

### 目标

在正式 Cocos 城市场景中完成：进入城市 → 点选建设位 → 比较风电/光伏/火电 → 确认建设 → 推进月份 → 完工 → 看懂资金、预计每回合净资金变化、供能和公司 EXP 月结变化 → 明确下一步。

### 输入

- `docs/design/ui/city-playable-slice-design-brief.md`
- `docs/design/ui/art-direction.md`
- `docs/design/ui/city-flow-gameplay-contract.md`
- `docs/design/ui/construction-flow.md`
- `docs/design/ui/month-settlement-flow.md`
- `docs/design/ui/concepts/city-top-hud-funds-supply-exp-contract-v2.md`
- `docs/design/ui/assets/buildings/building-visual-contract-v1.md`
- `docs/design/ui/assets/buildings/representative-v1/`
- `docs/design/features/construction.md`
- `docs/design/features/supply-calculation.md`

### 范围

- 一个城市、现有三栋代表建筑、真实建设队列与月结。
- 城市 HUD 只承载当前资金、可靠的 `recurringFundsDeltaEstimate`、累计月份与供能状态。
- 公司 EXP 不常驻城市 HUD；只在月结反馈中展示 before / after / delta。
- 使用真实 `src/modules → src/sim` 路径，不建立 UI 可写业务状态。
- 390×844 为主尺寸，430×932 做响应式复核。

### 不做

- 不实现公司页、科技树、区域地图、全国地图、超级水电或完整事件系统。
- 不新增建筑、地图和批量美术资产。
- 不恢复旧程序化 HUD、通用页面壳、专项 CLI 或静态 token 验收。
- 不把浏览器设计原型继续扩成正式客户端。

### 验收

- Cocos 中一条真实点击路线可从建设位走到设施生效后的月结反馈。
- 设施完工当月不参与供能，下一月 M4 才参与，并有玩家可理解的反馈。
- 资金、预计每回合净变化、供能和 EXP 的口径来自规则/模块真理源。
- 两种目标尺寸无重叠、截断和明显误触；主操作与状态变化一眼可读。
- 自动验证按 `AGENTS.md` 执行，并保留 Cocos 预览截图与点击证据。
