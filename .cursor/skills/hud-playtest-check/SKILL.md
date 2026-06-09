---
name: hud-playtest-check
description: 为开发 HUD、客户端交互和导航改动选择最小客户端冒烟路径。Use when touching HUD controllers, client/cocos scripts, navigation flow, GameRoot, CityHudPanel, verify:client, sim:cocos-hud-close, or client interaction smoke tests.
---

# HUD Playtest Check

## 目标

客户端交互改动后，优先选择最短的可用冒烟链路，而不是一上来跑整套手工联调。

## 默认命令选择

1. 大多数 HUD / 交互改动，先跑：

```bash
npm run verify:client
```

2. 如果你只想确认 HUD 闭环，而不需要带上完整持久化链路，可优先考虑：

```bash
npm run sim:cocos-hud-close
```

3. 如果改动涉及 client 资源同步、挂载或恢复，再补：

```bash
npm run sim:client-sync-spike
```

4. 如果用户明确提到预览页没起来、浏览器页、HTTP 探测，再补：

```bash
npm run check:cocos-preview
```

## 选择规则

- `HUD 控制器 / GameRoot / CityHudPanel / 导航文案`：默认 `verify:client`
- `只想快速看 T50 HUD 验收链`：可选 `sim:cocos-hud-close`
- `涉及 hide/remount/读档恢复`：加 `sim:client-sync-spike`
- `涉及浏览器预览可达性`：加 `check:cocos-preview`
- 若同时改到 `src/app/`、`src/modules/` 的逻辑层，按需补 `npm test`

## 回复格式

用短结论说明：

1. 改动属于哪类客户端链路
2. 选择了哪条最小冒烟路径
3. 命令结果与剩余风险

## 不要做

- 不把所有客户端命令一次性全跑
- 不跳过与本次交互路径直接相关的冒烟
- 不把 `verify:client` 与真实 Cocos 编辑器手工预览混为一谈
