# 正式图标资产清单 v2

> 状态：图标阶段已收口。运行时候选统一位于 `runtime/`；概念稿、256px 旧母版、色键图和高分辨率源图不进入小游戏包。

## 1. 轻量运行时合同

- 功能 / 资源图标统一交付 128×128 RGBA PNG；适用于约 40—64px 的 HUD、按钮和状态显示。
- 32 / 48 / 64px 文件只放在 `preview/runtime-v1/` 做缩小辨识验收，不作为三套运行时资源导入。
- 当前 24 枚运行时 PNG 合计约 254KB，图标阶段预算上限为 512KB；后续新增图标必须由已确认页面或玩法语义驱动。
- 选中、禁用、按下等纯交互状态优先由描边、颜色、遮罩和小状态叠加实现，不复制整张 PNG；只有科技节点现有三态和清洁供能两种语义状态保留独立文件。
- 128px 图标约占 64KB 解码 RGBA 内存；不得把 `source/` 中千像素设计源当作运行时纹理。
- 图标可在后续 Cocos 阶段合入 512 / 1024px 图集；UI 图标默认不预生成 Mipmap，除非真机验证证明需要。

## 2. 文件清单

### 通用功能

| 文件 | 锁定语义 |
|------|----------|
| `runtime/common/icon-calendar-v1.png` | 日历 A：月份、持续月数、时间信息 |
| `runtime/common/icon-instant-v1.png` | 即时 A：一次性即时影响 |
| `runtime/common/icon-detail-v1.png` | 详情 A：查看详情或展开信息 |
| `runtime/common/icon-turn-income-v1.png` | 回合收入 B：预计 / 结算回合资金变化 |
| `runtime/common/icon-continuous-decrease-v1.png` | 持续减少 A：持续负向影响 |
| `runtime/common/icon-confirm-v1.png` | 确认 A：玩家确认动作，不兼作完成状态 |

### 资源

| 文件 | 锁定语义 |
|------|----------|
| `runtime/resources/icon-funds-v1.png` | 当前资金、成本、收入 |
| `runtime/resources/icon-energy-v1.png` | 电力 / 有效供能 |
| `runtime/resources/icon-company-exp-v1.png` | 公司经验 `EXP`；不进入城市 HUD |

### 高频动作与状态

| 文件 | 锁定语义 |
|------|----------|
| `runtime/action-state/icon-build-v1.png` | 建设 B：橙色锤子 |
| `runtime/action-state/icon-upgrade-v1.png` | 升级 A：青绿上箭头 + 微光点 |
| `runtime/action-state/icon-lock-v1.png` | 锁定 A：紫色挂锁 |
| `runtime/action-state/icon-complete-v1.png` | 完成 A：绿色终点旗 + 微光点 |
| `runtime/action-state/icon-warning-v1.png` | 通用警告 A：珊瑚红三角叹号 |

### 等级 I—V

| 文件 | 锁定语义 |
|------|----------|
| `runtime/level/icon-level-01-blue-v1.png` | 等级 I，蓝 |
| `runtime/level/icon-level-02-green-v1.png` | 等级 II，绿 |
| `runtime/level/icon-level-03-yellow-v1.png` | 等级 III，黄 |
| `runtime/level/icon-level-04-orange-v1.png` | 等级 IV，橙 |
| `runtime/level/icon-level-05-red-v1.png` | 等级 V，红 |

### 科技节点

| 文件 | 锁定语义 |
|------|----------|
| `runtime/tech-point/icon-tech-point-normal-v1.png` | 科技节点常态 |
| `runtime/tech-point/icon-tech-point-selected-v1.png` | 科技节点选中态 |
| `runtime/tech-point/icon-tech-point-locked-v1.png` | 科技节点锁定态 |

文件名保留历史 `tech-point` 以维持资产引用；玩家语义是科技节点状态，不是独立可消费货币。

### 清洁供能

| 文件 | 锁定语义 |
|------|----------|
| `runtime/clean-supply/icon-clean-supply-fully-clean-v1.png` | 完全清洁：绿叶 + 对勾 |
| `runtime/clean-supply/icon-clean-supply-needs-improvement-v1.png` | 待改善：黄叶 + 感叹号 |

## 3. 设计源与保留方案

- 当前正式预览：`preview/functional-icon-runtime-final-preview-v1.png`；实际 32 / 48 / 64px 并排验收见 `preview/functional-icon-runtime-size-preview-v1.png`。
- 对比稿和未选方案继续保存在 `../../concepts/`，包括吊钩、安全帽、阶梯升级、阻断锁、完成章、警报灯、灰叶、斜杠叶与内嵌叉号；它们不是当前运行时资源。
- `level/`、`tech-point/` 和 `source/` 中旧版 / 高分辨率文件只作为设计母版与可追溯来源。
- `scripts/design/export-functional-icons.py` 可重复导出 128px 运行时 PNG、32 / 48 / 64px 预览和综合预览，不参与游戏运行。

## 4. 暂缓语义

负荷、清洁能源占比、贷款、广告、公司 / 科技页面入口、具体灾害类型全集、建筑 / 设施类别、城市 / 区域 / 世界节点均未进入当前运行时清单；只有相应页面与玩法语义正式锁定后才允许新增。

## 5. 本阶段边界

本阶段只交付设计资产与轻量运行时候选，不包含 Cocos 节点、Prefab、图集配置、压缩纹理配置或客户端代码。最终图集与真机纹理格式在 Cocos 实现阶段按构建包体和真机内存验证决定。
