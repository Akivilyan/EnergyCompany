---
name: cocos-verify
description: 为 Cocos、客户端装配、配置同步相关改动选择最小验证命令。Use when touching client/cocos、HUD 控制器、gameClient 装配、verify:client、build:client、check:cocos-preview 或微信小游戏联调路径。
---

# Cocos Verify

## 目标

为客户端相关改动选择“足够小但不漏检”的验证组合，避免每次都全量乱跑。

## 选择顺序

1. 先判断改动类型：
   - 仅文档、看板、规则：说明无需跑测试
   - `docs/design/data/vertical-slice-v0/`：至少跑 `npm run build:client`
   - `client/cocos/`、`src/app/` 下客户端装配/HUD/preview 相关：至少跑 `npm run verify:client`
   - 需要确认预览页是否起来，或用户提到 preview/预览窗口：加跑 `npm run check:cocos-preview`
2. 再补仓库基础验证：
   - 改了 `src/app/`、`src/modules/`、`src/sim/` 的 TS 逻辑：按需补 `npm test`
   - 改了类型或编译风险较高的入口：按需补 `npm run build`
   - 动了依赖边界或 import 路径：按需补 `npm run lint:boundaries`
3. 默认选择最小闭环，不无故扩大到整套命令。

## 推荐组合

- 配置表同步：`npm run build:client`
- Cocos 脚本或场景：`npm run verify:client`
- 客户端装配 + TS 逻辑：`npm test` + `npm run verify:client`
- 预览联调问题：`npm run check:cocos-preview`

## 回复格式

输出三件事即可：

1. 为什么选这些命令
2. 实际运行了哪些命令
3. 每条命令的结果

## 不要做

- 不把 `build:client` 说成完整客户端构建
- 不因为是客户端改动就默认全量跑所有命令
- 不漏报未执行的验证项
