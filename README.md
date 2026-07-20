# Energy Company

微信小游戏项目：Cocos Creator 3.8.8 + TypeScript。`src/sim/` 是纯 TypeScript 规则真理源，正式客户端按七个玩家垂直切片逐步建设。

## 当前状态

- 规则与业务模块保留。
- 城市视觉、图标、代表建筑和设计原型保留。
- 旧程序化 HUD、旧页面壳、专项 CLI 和重复静态验收已删除。
- Cocos 当前是干净工程骨架，下一模块从正式城市建设切片开始。

当前模块与下一步见 `docs/design/engineering/PROJECT-TASK-BOARD.md`；长期顺序见 `docs/design/engineering/DEVELOPMENT-STRATEGY.md`。

## 新会话入口

1. `AGENTS.md`
2. `docs/design/engineering/PROJECT-TASK-BOARD.md`

其他文档按当前切片需要读取。

## 常用命令

```bash
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run lint:boundaries
npm.cmd run build:client
npm.cmd run tool:cocos
```

PowerShell 遇到 `npm.ps1` 执行策略拦截时使用 `npm.cmd`。

## 代码结构

| 路径 | 说明 |
|------|------|
| `src/sim/` | 纯 TS 规则、结算与序列化 |
| `src/modules/` | 玩家动作编排与只读业务快照 |
| `src/app/` | 最小装配、客户端挂载、存档与生命周期 |
| `src/infra/` | 存档、生命周期、广告等平台端口 |
| `client/cocos/` | Cocos 工程；按当前垂直切片增加正式场景和组件 |
| `docs/design/ui/` | UI 合同、生成设计素材、图标、建筑与设计原型 |
