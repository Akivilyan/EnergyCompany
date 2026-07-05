# Feature Spec 索引

`docs/design/features/` 面向实现与验收。规则细节引用 GDD，不重复整章玩法说明。

## 当前核心规格

| 文档 | 作用 |
|------|------|
| `00-game-state.md` | 全局状态、命令、月结管道 |
| `region-main.md` | 区域主界面行为边界 |
| `construction.md` | 建造流程与副作用 |
| `supply-calculation.md` | 供能重算输入输出 |
| `social-value-settlement.md` | SV 重算与升级 |
| `company-management.md` | 公司屏、借贷、快照 |
| `world-map.md` | 大地图入口与解锁 |
| `grid-network.md` | 区域线与主干 |
| `tech-tree.md` | 科技树与研发 |
| `events.md` | 事件与灾害行为 |
| `monetization.md` | 广告与 IAP |
| `onboarding.md` | 新手引导流程 |

## 使用原则

- 实现先看 Feature，再下钻 GDD
- UI 层只补结构和交互，不在 Feature 中展开组件树
- 具体字段和配表去 `data/`
