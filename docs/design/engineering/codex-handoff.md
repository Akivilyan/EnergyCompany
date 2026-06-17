---
id: engineering/codex-handoff
title: Codex 接手上下文
status: draft
version: 0.1.0
sources:
  - AGENTS.md
  - .cursor/README.md
  - .cursor/rules/session-discipline.mdc
  - .cursor/rules/project-context.mdc
  - .cursor/rules/verification.mdc
  - docs/design/engineering/PROJECT-TASK-BOARD.md
  - docs/design/engineering/architecture.md
  - docs/design/engineering/cocos-client-setup.md
  - docs/design/engineering/cursor-toolbox.md
  - package.json
supersedes: []
depends_on:
  - engineering/project-task-board
  - engineering/architecture
  - engineering/cocos-client-setup
open_questions:
  - `settleNextMonth` 实现当前按 M2/M3/M1/M4... 执行，和文档中 M1->M14 顺序表述不完全一致；后续应确认这是有意调整还是需要补回归。
---

# Codex 接手上下文

这份文档给 Codex 会话使用，目标是承接 Cursor 期间沉淀的规则、进度和工程地图。它不替代 `AGENTS.md`；硬约束仍以 `AGENTS.md` 和 `.cursor/rules/` 为准。

---

## 1. 接手结论

- 项目形态：微信小游戏（Cocos Creator 3.x + TypeScript）+ 纯 TypeScript 模拟核心。
- 当前阶段：看板显示为 `T51` 微信小游戏构建与真机冒烟；当前协作任务仍是 `OPS-01` 协作基座收口。
- 架构主线：`ui/cocos -> modules -> sim <- config`，`app` 是装配根，`infra` 通过端口注入。
- 规则真理：`src/sim/`；UI/Cocos 不能直接改 `GameState`，也不能绕过 `modules` 调核心写操作。
- 协作节奏：每完成一个清晰功能子步骤本地 `git commit`；阶段节点或用户明确要求时再 `git push`。
- 本轮接手策略：保留 Cursor 规则和 skills 作为历史资产，在工程文档层新增 Codex 可读的项目地图，减少后续重复探索。

---

## 2. 入口文件

| 用途 | 文件 |
|------|------|
| Agent 硬约束 | `AGENTS.md` |
| Cursor 规则结构 | `.cursor/README.md` |
| 当前进度和会话日志 | `docs/design/engineering/PROJECT-TASK-BOARD.md` |
| 任务拆条历史 | `docs/design/engineering/IMPLEMENTATION-TASKS.md` |
| 架构边界 | `docs/design/engineering/architecture.md` |
| 模拟 API 契约 | `docs/design/engineering/simulation-api.md` |
| Cocos/微信联调 | `docs/design/engineering/cocos-client-setup.md` |
| 项目专用工具箱 | `docs/design/engineering/cursor-toolbox.md` |

---

## 3. 代码地图

| 路径 | 当前职责 | 接手注意 |
|------|----------|----------|
| `src/sim/` | 纯 TS 模拟核心：状态、命令、月结、序列化、配置访问 | 不依赖 `cc.*`、存档、SDK、UI 状态 |
| `src/modules/` | 屏幕/业务编排：把 UI 意图转成 sim 命令，组织持久化、广告、埋点 | 不重复实现核心公式 |
| `src/app/` | CLI 冒烟、客户端装配、HUD controller、Cocos 验证入口 | 客户端相关改动通常要跑 `verify:client` |
| `src/ui/` | 引擎无关 UI shell、场景桥接 | UI shell 走 `modules/app` 暴露的接口 |
| `src/infra/` | 微信存储、生命周期、广告端口实现 | 通过接口注入，不回流进 `src/sim/` |
| `src/i18n/` | 简中/英文文案与 locale 运行时 | 微信环境避免依赖不兼容 Web API |
| `client/cocos/` | Cocos 工程与开发 HUD 脚本 | `build/`、`library/`、`temp/` 不手改 |
| `docs/design/data/vertical-slice-v0/` | v0 配置源 JSON | 改后至少跑 `npm run build:client` |
| `tests/` | sim/modules/app/ui/infra/i18n 分层测试 | 改语义先补对应层测试 |

---

## 4. 已落地能力

### 模拟核心

- `createInitialState` 生成可序列化 `GameState`。
- `dispatch` 支持建造、铺线、研发、取消研发、借贷、广告奖励、教学推进/跳过。
- `settleNextMonth` 输出 14 项 `SettlementReport` 步骤，并处理供能、收入、运营成本、贷款、SV、升级、灾害、破产、胜利。
- `serializeState` / `deserializeState` 已接入存档边界和不变量校验。

### 编排与客户端

- `RunController` 是主要状态编排入口，提供命令、推月、轨迹和结算历史。
- `createGameBootstrap` 统一组装 `GameApp`、`GameShell` 和可选 `GameSceneBridge`。
- `mountGameClient` 是 Cocos/小游戏挂载入口，负责配置注入、自动读档和 `wx.onHide` 自动存档。
- Cocos 当前有 `GameRoot`、`CityHudPanel`、`CocosSceneHost`、`loadConfigFromResources` 等开发 HUD 组件。

### 工具与 skills

`.cursor/skills/` 已有 8 个项目专用 skills：`wechat-build-debug`、`cocos-verify`、`task-board-sync`、`sim-change-guard`、`config-sync-check`、`hud-playtest-check`、`ops-phase-close`、`github-pr-ci`。

Codex 不需要“调用 Cursor skill”，但应继承其中的检查清单：按改动类型选验证命令、更新看板、守住边界、阶段完成再 push。

---

## 5. 常用命令

| 命令 | 用途 |
|------|------|
| `npm test` | sim/modules/app/ui/infra/i18n 回归 |
| `npm run build` | TypeScript 编译 |
| `npm run lint:boundaries` | 检查 `src/sim` 边界 |
| `npm run build:client` | 同步配置和客户端共享包 |
| `npm run verify:client` | 客户端聚合验证，不打开 Cocos |
| `npm run check:cocos-preview` | 探测 Cocos 预览 HTTP |
| `npm run sim:playtest-bundle` | 聚合玩法冒烟 |

验证选择按最小相关原则执行：仅文档整理说明无需跑测试；碰 sim/modules 跑 `npm test`；碰配置源跑 `build:client`；碰 Cocos/client 跑 `verify:client`。

---

## 6. 当前风险与待确认

- `settleNextMonth` 代码顺序是 M2、M3、M1、M4...；文档和看板多处写 M1->M14 固定顺序。后续若改月结，需要先查测试是否已经接受当前顺序，再决定修文档还是修实现。
- 当前 UI 仍是开发 HUD，不是最终 Prefab/UI 美术；`cocos-client-setup.md` 明确 T50 HUD 已收口，T51 重点是真机构建与冒烟。
- 微信广告仍是 stub/预研形态，真实 SDK 接入属于后续任务。
- `PROJECT-TASK-BOARD.md` 历史日志很长，后续只追加，不重写旧记录。

---

## 7. 后续推进计划

1. 收口 `OPS-01`：确认 Codex 接手文档、README 入口、看板日志稳定后，可把协作基座任务标记为完成或 partial。
2. 回到 `T51`：按 `cocos-client-setup.md` 执行 `npm run verify:client`，然后进入 Cocos 构建微信小游戏与真机冒烟。
3. 做一次月结顺序审计：围绕 `settleNextMonth` 顺序建立明确结论，避免文档和实现继续分叉。
4. 若真机冒烟稳定，再拆下一阶段：真实广告 SDK、Prefab 化 UI、截图化冒烟留档或数值精调。

---

## 8. 新会话启动清单

每次 Codex 新会话先做：

1. 读 `AGENTS.md`。
2. 看 `PROJECT-TASK-BOARD.md` 的「当前任务」和最近两条「会话日志」。
3. 如果涉及 Cocos/微信，读 `cocos-client-setup.md`。
4. 如果涉及 sim/modules，读 `architecture.md` 和相关测试。
5. 先查 `git status --short`，再动手。
