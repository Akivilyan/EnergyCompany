# 项目状态与任务看板

本文件只记录当前产品状态、当前模块和下一步。长期顺序见 `DEVELOPMENT-STRATEGY.md`，协作规则见根目录 `AGENTS.md`，历史查 Git。

## 当前产品状态

- 平台与技术：微信小游戏，Cocos Creator 3.8.8 + TypeScript。
- 规则基础：`src/sim/` 是规则真理源；`src/modules/` 提供业务编排和玩家动作入口。
- 设计基础：城市视觉方向、正式图标、风电/光伏/火电代表建筑和城市建设浏览器设计原型均已保留。
- 客户端状态：正式 Cocos 城市场景已可从建设位完成三方案比较、建设、施工推进和完工月结；390×844 与 430×932 玩家可见证据已保留。
- 开发方式：按七个玩家垂直切片顺序推进；每次只完成一条真实操作流程，不同时铺开后续页面和资产。

## 当前模块

- 模块：`PLAYABLE-CORE-01`
- 标题：城市建设与月结反馈垂直切片
- 状态：`done`

### 完成边界

- 正式 `CityPlayable.scene` 通过 `src/modules → src/sim` 完成：进入城市 → 选择建设位 → 比较风电/光伏/火电 → 确认建设 → 查看在建 → 推进月份 → 完工。
- 城市建设位绑定进入规则状态；月结反馈展示资金、可靠的每回合净资金估算、供能和公司 EXP before / after / delta。
- 设施完工当月立即参与供能；目标路线第 4 月同月显示供能 `+220 MW`、公司 EXP `+2` 和每回合净资金 `+202`。
- 复用既有正式图标和风电·I、光伏·I、火电·I 资产；未新增公司页、科技树、地图层级、建筑类型或通用页面壳。

## 下一步

- 模块：`PLAYABLE-CORE-02`
- 标题：公司成长与解锁主干
- 状态：`pending`

### 目标

经营城市 → M9 重算公司 EXP 快照 → M10 达到门槛升级 → 展示新解锁内容 → 对应入口刷新。

### 输入

- `docs/design/engineering/DEVELOPMENT-STRATEGY.md`
- `docs/design/ui/company.md`
- `docs/design/features/company-management.md`
- `docs/design/data/schemas/company-level-and-run.md`
- `docs/design/ui/concepts/city-top-hud-funds-supply-exp-contract-v2.md`

### 范围

- 公司 EXP 按月覆盖重算，不作为累计货币；当前值可下降，但等级与已解锁内容不回退。
- 只交付一条代表性 I → II 升级与入口刷新路线，并自动覆盖 I–V 解锁矩阵。
- 复用现有城市切片作为经营入口，继续使用真实 `src/modules → src/sim` 状态。

### 不做

- 不进入科技研发、区域地图、电网、灾害、全国地图或超级水电切片。
- 不新增独立“科技点”货币，不提前铺完整公司管理系统或批量资产。

### 验收

- Cocos 中一条真实路线可从经营月结走到代表性公司升级、新解锁展示与入口刷新。
- 明确展示 EXP 快照重算、等级不回退及解锁结果；规则与模块口径一致。
- 自动验证按 `AGENTS.md` 执行，并保留目标尺寸截图与真实点击证据。
