---
id: design/current-product-truth
title: 当前产品真相与阶段完成定义
status: draft
version: 0.2.0
sources:
  - docs/design/gdd/00-vision.md
  - docs/design/gdd/01-core-loop.md
  - docs/design/gdd/03-social-value.md
  - docs/design/gdd/11-replayability.md
  - docs/design/engineering/PROJECT-TASK-BOARD.md
  - docs/design/engineering/cocos-client-setup.md
  - docs/design/engineering/architecture.md
supersedes: []
depends_on:
  - gdd/00-vision
  - gdd/01-core-loop
  - engineering/project-task-board
open_questions: []
---

# 当前产品真相与阶段完成定义

这份文档只回答三个问题：

1. 当前版本到底要做什么
2. 当前版本已经做到什么程度
3. 什么状态才算一个阶段真的完成

若本页与历史流水冲突，以本页和当前 `docs/design/` 文档为准。

## 1. 当前产品定位

- 平台：微信小游戏
- 客户端：`Cocos Creator 3.x + TypeScript`
- 规则真理：`src/sim/`
- 当前目标：先守住可玩闭环、规则边界和客户端联调，再进入后续开发与数值收敛

## 2. 当前版本范围

### 已纳入当前版本

- 单局按月推进的经营闭环
- 城市建设、区域铺线、科技研发、公司经营、固定灾害轴、终局判定
- `src/sim/` 规则闭环、`src/modules/` 编排层、`client/cocos/` 开发 HUD 客户端壳层
- 微信小游戏构建路径、客户端聚合验证、真机冒烟路径

### 当前不作为阻塞项

- Prefab 化正式 UI 资源
- 真正接入微信激励广告 SDK
- 大规模数值精调
- 超出当前切片范围的新系统扩展

## 3. 当前已完成事实

### 规则与工程骨架

- `T45` P0 闭环已完成：模拟核心、月结主流程、主要屏幕壳层、存档与广告 stub 已落地
- `T48–T49` 已完成：应用装配、客户端挂载、配置同步、自动读档与 `wx.onHide` 存档恢复已接通
- `T50` 已完成：开发 HUD、导航、公司/科技/事件/区域入口已完成，并已纳入 `verify:client`

### 客户端与微信链路

- `verify:client` 已作为客户端聚合验证入口
- `client/cocos/` 已具备微信小游戏构建路径
- 已做到：可构建微信小游戏包，并已在真机上启动跑起基础链路
- 未完成：真机仍存在待修问题，`T51` 不能视为完成阶段

### 文档与协作入口

- `README.md` 作为总入口
- `AGENTS.md` 作为硬约束
- `docs/design/engineering/codex-project-rules.md` 作为项目协作规则
- `.cursor/` 已退出当前体系；历史仅保留在归档和 Git 记录中

## 4. 当前阶段完成定义

### `OPS-01` 完成定义

以下条件同时满足，`OPS-01` 才算完成：

- 入口收敛为 `README.md`、`AGENTS.md`、`codex-project-rules.md`
- `.cursor/` 已退出当前主路径
- 主看板、设计摘要、历史归档职责清晰
- 后续新会话不再依赖旧 Cursor 规则体系

当前状态：已完成。

### `T51` 完成定义

以下条件同时满足，`T51` 才算完成：

- `npm run verify:client` 可覆盖客户端聚合验证
- Cocos 客户端具备微信小游戏构建路径
- 真机上的已知问题已收口，不再存在“能跑起但关键行为异常”的遗留
- 真机冒烟至少覆盖：
  - 冷启动进入主场景
  - 推进 2 到 3 月后切后台再进入，存档恢复正确
  - 公司 2 级后可进入区域并铺线
  - 推至灾害月时可出现并确认全屏反馈

当前状态：未完成。当前只可确认“已构建并在真机跑起”，但真机问题尚未收口。

## 5. 当前非阻塞遗留

- 开发 HUD 仍是代码绘制壳层，不是最终 Prefab UI
- 微信激励广告仍为 stub / 预研占位
- 部分核心 GDD 章节仍是 `draft`，尤其是供能与科技两章
- 月结步骤叙述在个别文档之间仍有口径统一空间
- 真机仍有待修问题，阻塞 `T51` 阶段完成

除最后一条外，其余问题可在后续开发中继续推进；真机问题则属于当前阶段阻塞项。

## 6. 下一开发重点

1. 先定位并收口 `T51` 真机遗留问题
2. 以真机问题清单为准，补验证、修实现、回写看板
3. `T51` 收口后，再回到关键 `draft` GDD 与后续开发批次
4. 再考虑正式 UI 资源、广告真接入与数值收敛

## 7. 使用原则

- 判断“现在做到哪了”，先看本页
- 判断“当前在干什么”，看 `engineering/PROJECT-TASK-BOARD.md`
- 判断“规则真相是什么”，看 `gdd/`、`features/`、`ui/` 对应页

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-06-17 | 首版：固定当前产品范围、已完成事实与阶段完成定义 |
| 0.2.0 | 2026-06-17 | 按用户纠偏修正 `T51` 状态：已构建并在真机跑起，但仍未完成收口 |
