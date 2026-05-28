# Energy Company（设计 + 模拟核心）

当前仓库以 **设计文档** 与 **可测试 TypeScript 模拟层** 为主，目标平台为微信小游戏（Cocos + TS）。

## 快速开始

```bash
npm install
npm test
npm run sim:demo
npm run lint:boundaries
```

## 目录

| 路径 | 说明 |
|------|------|
| `docs/design/` | GDD / Feature / UI / Data / Engineering |
| `src/sim/` | 纯 TS 模拟核心（无引擎依赖） |
| `src/modules/` | 业务编排（UI 应只调此层） |
| `src/app/` | CLI 冒烟入口 |
| `playtest-lab/` | 代理仿真方向筛选（非引擎实跑） |
| `tests/sim/` | 模拟层单测 |

## 推进文档

- [v0 实现任务拆条](docs/design/engineering/IMPLEMENTATION-TASKS.md)
- [灾害数值政策（debuff 锁定）](docs/design/engineering/v0-disaster-balance-policy.md)
- [全经济调参面板](docs/design/engineering/v0-balance-knob-surface.md)
- [每周节奏](docs/design/engineering/v0-weekly-rhythm.md)
