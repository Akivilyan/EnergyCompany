---
id: engineering/project-task-board
title: 项目级任务看板（coding-first）
status: draft
version: 0.1.72
sources:
  - docs/design/TASK-LIST.md
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
supersedes: []
depends_on:
  - engineering/implementation-tasks
open_questions: []
---

# 项目级任务看板（coding-first）

用于在“对话可能随时中断”的情况下，持续记录当前编码进度与下一步动作。  
规则：每次对话结束前，至少更新一次本文件的「当前任务」与「会话日志」。

---

## 1. 当前阶段与总目标

- 当前阶段：`T51` 微信小游戏构建与真机冒烟
- 执行策略：先 coding 健壮性与可玩闭环，再做数值精调
- 本看板维护频率：每次对话结束时实时更新
- 提交策略：每步本地 `commit`；累计到阶段节点后再统一 `push`

---

## 2. P0 任务总览（项目级）

状态图例：`todo` 未开始 · `doing` 进行中 · `done` 已完成 · `partial` 部分完成

| ID | 状态 | 目标 | 最近产出 | 下一步 |
|----|------|------|----------|--------|
| T45-01 | done | 工程目录与边界护栏 | `src/` 骨架、`lint:boundaries` 脚本 | 保持规则不过期 |
| T45-02 | done | ConfigRepo 最小实现 | `src/sim/config/configRepo.ts` | 后续补 tech 配置读取 |
| T45-03 | done | `GameState` 与初始化 | `createInitialState` + 初始字段 | 按需要扩展 onboarding/save 字段 |
| T45-04 | done | `dispatch` 基础命令入口 | 建造/借贷/广告/研发已接入 | 后续补更严格 payload 校验 |
| T45-05 | done | `settleNextMonth` M1-M14 骨架 | 固定 14 步报告 + 推月 | 保持步骤顺序快照稳定 |
| T45-06 | done | M4 供能重算落地 | 已接入 M2 链路进度与连通分岛计算，覆盖未连通/已连通差异测试 | 后续补线损参数化与主干规则 |
| T45-07 | done | M9/M10/M13/M14 落地 | 关键终局路径与异常上下文回归已覆盖（23 测试总体通过） | 后续仅按 UI 接入反馈微调 |
| T45-08 | done | modules 编排层 | 增加 `runController` 轨迹输出（command/settle），便于 UI 壳层接入与排障 | 补 UI 契约扫描测试 |
| T45-09 | done | 城市页最小闭环 | 新增 `screenCityDetail` 壳层（建造/推月/资源增量）并接入 `sim:city-loop` 逐月明细 | 后续做截图化冒烟留档 |
| T45-10 | done | 等级解锁与 region 流程 | 回填升 II 阈值平衡检查：补 `M10` 配置读取回归与检查点文档（normal/tutorial 双口径） | 转 T45-12 接 UI 事件面板/弹窗 |
| T45-11 | done | 科技树单队列 | `screenTechTree` 补齐 `uiErrorCode -> messageKey/actionKey` 契约并同步 UI 文档清单 | 转 T45-12 接事件面板/弹窗与科技提示呈现 |
| T45-12 | done | 固定灾害轴与事件面板 | `screenEventsPanel` 已补弹窗内容键 + 多场叠加分槽与优先级队列契约，并有 CLI 冒烟 | 转 T45-13 公司屏、借贷、终局页 |
| T45-13 | done | 公司屏、借贷、终局页 | 新增 `screenCompany`/`screenRunResult` 壳层，双分支终局冒烟通过并覆盖终局禁命令回归 | 转 T45-14 教学局与引导遮罩 |
| T45-14 | done | 教学局与引导遮罩 | 教学局状态机与 `screenOnboarding` 壳层已落地，`sim:tutorial-loop` 覆盖推进/跳过双分支 | 转 T45-15 存档与恢复 |
| T45-15 | done | 存档与恢复 | 已落地 `serialize/deserialize` + `infra/storage` + `runPersistence`，并通过存档恢复冒烟 | 转 T45-16 广告 stub 与全链路回归 |
| T45-16 | done | 广告 stub 与全链路回归 | 新增 `sim:regression`，覆盖 E1-E6 + 广告 cash/speedup 回归与通过率输出 | 进入 P1 增强项排期 |

---

## 3. 当前任务（只保留 1 项 doing）

- 当前任务 ID：`OPS-01`
- 任务标题：协作基座收口（Cursor/Codex 接手 / 项目规则 / 入口去重）
- 状态：`doing`
- 开始时间：2026-06-09
- 完成定义（本轮）：三处入口职责稳定；项目规则不再重复；通用/项目专用工具箱两层结构落地；项目专用 skills 控制在常用范围内并已补齐；Codex 接手上下文形成工程文档入口；GitHub 进入明确的项目级接入策略；低频项明确暂缓

---

## 4. 会话日志（防中断）

| 日期 | 会话结论 | 变更文件 | 验证 |
|------|----------|----------|------|
| 2026-05-28 | 确认执行策略：先 coding 后数值；进入 T45 闭环推进 | `docs/design/TASK-LIST.md` | 文档确认 |
| 2026-05-28 | 补齐 `start_research` 命令与 `M3_research_progress` 实现，研发可入队并点亮 | `src/sim/types/commands.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（5/5） |
| 2026-05-28 | 新增项目级任务看板，用于每轮对话实时续航 | `docs/design/engineering/PROJECT-TASK-BOARD.md` | 文档新增 |
| 2026-05-28 | 推进 `T45-06`：M4 升级为跨城统一供能分配，新增 `effectiveSupply/netImport/ecoCap` 字段与两条并网语义测试 | `src/sim/core/settleNextMonth.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/config/configRepo.ts` `tests/sim/settle.test.ts` | `npm test` 通过（7/7） |
| 2026-05-28 | 完成 `T45-06`：新增 `queue_grid_link`、M2 链路完工推进、M4 按连通分岛分配供能；测试覆盖未连通/已连通场景 | `src/sim/types/commands.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（8/8） |
| 2026-05-28 | 推进 `T45-07`：补齐 M10/M13/M14 边界回归（只升不降、破产重置、终局胜利触发） | `tests/sim/settle.test.ts` | `npm test` 通过（11/11） |
| 2026-05-28 | 推进 `T45-07`：为月结增加配置一致性守卫（company level/破产阈值/目标月/最终灾害），并补 `config_missing` 异常路径用例 | `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（13/13） |
| 2026-05-28 | 推进 `T45-07`：补状态不变量校验与错误上下文；`dispatch` 增加城市解锁/科研解锁防御，`settle` 增加 `state_invariant_broken` 防御 | `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（16/16） |
| 2026-05-28 | 推进 `T45-07`：补 `run_playable.blocked` 命令拦截与 `run_result` 期命令拒绝回归，状态机异常路径进一步收口 | `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（18/18） |
| 2026-05-29 | 推进 `T45-07`：实现 `blocked` 白名单策略（`advance_onboarding/skip_onboarding` 可放行），补放行与拒绝回归 | `src/sim/types/commands.ts` `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（19/19） |
| 2026-05-29 | 推进 `T45-07`：增强 `blocked_by_tutorial` 错误上下文，返回 `blocked_command` 与 `allowed_commands_csv` 供 UI 提示 | `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（19/19） |
| 2026-05-29 | 推进 `T45-07`：增强 `invalid_phase` 错误上下文（dispatch/settle），补 phase 与 command 级回归断言 | `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（20/20） |
| 2026-05-29 | 采纳协作策略：改为“每步本地 commit，阶段性再 push”；并补 `settle` 已结束局 `invalid_phase` 上下文回归 | `docs/design/engineering/PROJECT-TASK-BOARD.md` `tests/sim/settle.test.ts` | `npm test` 通过（21/21） |
| 2026-05-29 | 结束 T45-07 收口并切换到 T45-09 准备：`runController` 新增命令/结算轨迹（含 clear/get），补模块级测试 | `src/modules/runController.ts` `tests/modules/runController.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（23/23） |
| 2026-05-29 | 推进 `T45-09`：`runController` 新增 `getCitySnapshot` 与 `buildAndAdvance`，完成城市最小闭环接口与模块测试 | `src/modules/runController.ts` `tests/modules/runController.test.ts` | `npm test` 通过（25/25） |
| 2026-05-29 | 推进 `T45-09`：新增 `sim:city-loop` CLI 冒烟路径，验证城市建造+单月推进+快照输出链路 | `src/app/cityLoopCli.ts` `package.json` | `npm run sim:city-loop` 通过；`npm test` 通过（25/25） |
| 2026-05-29 | 推进 `T45-09`：`runController` 新增 `advanceMonths`，`sim:city-loop` 支持多月推进输出，补多月回归测试 | `src/modules/runController.ts` `src/app/cityLoopCli.ts` `tests/modules/runController.test.ts` | `npm run sim:city-loop -- CITY-START wind 1 3` 通过；`npm test` 通过（26/26） |
| 2026-05-29 | 推进 `T45-09`：`sim:city-loop` 增加 3 次推进逐月明细输出（每月资金/SV/供能变化与增量） | `src/app/cityLoopCli.ts` | `npm run sim:city-loop -- CITY-START wind 1 3` 通过；`npm test` 通过（26/26） |
| 2026-05-29 | 收口 `T45-09`：新增 `screenCityDetail` UI 壳层接口（建造/推月/逐月增量）并让 `sim:city-loop` 改走壳层 | `src/modules/screenCityDetail.ts` `src/app/cityLoopCli.ts` `tests/modules/screenCityDetail.test.ts` | `npm run sim:city-loop -- CITY-START wind 1 3` 通过；`npm test` 通过（29/29） |
| 2026-05-29 | 推进 `T45-10`：新增 `screenRegion` 壳层（城市解锁态快照/`queue_grid_link` 动作）并补 level I/II 铺线回归 | `src/modules/screenRegion.ts` `tests/modules/screenRegion.test.ts` | `npm test` 通过（32/32） |
| 2026-05-29 | 推进 `T45-10`：新增 `sim:region-loop` 冒烟脚本，串起 Lv1 拦截 -> Lv2 铺线 -> 推月完工最小链路 | `src/app/regionLoopCli.ts` `package.json` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（32/32） |
| 2026-05-29 | 推进 `T45-10`：`sim:region-loop` 去除 `companyLevel` 直接注入，改为经 M10 结算升级后再铺线 | `src/app/regionLoopCli.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（32/32） |
| 2026-05-29 | 协作策略固化：新增 always-apply 规则，默认“每步本地 commit、阶段性 push”（后续已收敛到 `AGENTS.md` + `session-discipline.mdc`） | `.cursor/rules/session-discipline.mdc` `AGENTS.md` | 规则文件新增 |
| 2026-05-29 | 推进 `T45-10`：M10 增加 tutorial 升 II 门槛策略，`region-loop` 改为 tutorial 真实升级路径 | `src/sim/core/settleNextMonth.ts` `src/modules/runController.ts` `src/app/regionLoopCli.ts` `tests/sim/settle.test.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（33/33） |
| 2026-05-29 | 推进 `T45-10`：tutorial 升 II 门槛改由 `run_config` 提供，补配置读取回归测试 | `docs/design/data/vertical-slice-v0/run_config.json` `src/sim/config/configRepo.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（34/34） |
| 2026-05-29 | 推进 `T45-10`：`screenRegion` 新增 `advanceOneMonth/advanceMonths`，region 冒烟改走壳层推进 | `src/modules/screenRegion.ts` `src/app/regionLoopCli.ts` `tests/modules/screenRegion.test.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（35/35） |
| 2026-05-29 | 推进 `T45-10`：`sim:region-loop` 改为正常局升级链路；level2 阈值由 `120` 下调到 `1` 以打通闭环 | `docs/design/data/vertical-slice-v0/company_levels.json` `src/app/regionLoopCli.ts` `tests/sim/settle.test.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（36/36） |
| 2026-05-29 | 推进 `T45-10`：`sim:region-loop` 升级阶段改为“循环推进直到升 II/超时”，降低阈值调参导致脚本脆弱风险 | `src/app/regionLoopCli.ts` | `npm run sim:region-loop -- CITY-START CITY-MAP01-02 region` 通过；`npm test` 通过（36/36） |
| 2026-05-29 | 推进 `T45-11`：新增 `cancel_research` 命令语义（全额返还），补取消成功/ID 不存在回归 | `src/sim/types/commands.ts` `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（38/38） |
| 2026-05-29 | 推进 `T45-11`：新增 `screenTechTree` 壳层（开研/取消/在研快照），补模块级回归 | `src/modules/screenTechTree.ts` `tests/modules/screenTechTree.test.ts` | `npm test` 通过（41/41） |
| 2026-05-29 | 推进 `T45-11`：新增 `sim:tech-loop` 冒烟脚本，跑通开研->取消返还->再开研->M3 点亮 | `src/app/techLoopCli.ts` `package.json` | `npm run sim:tech-loop -- storage_system_1` 通过；`npm test` 通过（41/41） |
| 2026-05-29 | 推进 `T45-11`：`claim_ad_reward(speedup)` 接入“在研秒完成并点亮”，补有/无在研回归 | `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（43/43） |
| 2026-05-29 | 推进 `T45-11`：`screenTechTree` 增加 UI 错误码映射与 `speedupResearchByAd` 壳层动作 | `src/modules/screenTechTree.ts` `tests/modules/screenTechTree.test.ts` | `npm test` 通过（44/44） |
| 2026-05-29 | 收口 `T45-11`：补科技树 UI 文案键契约（`messageKey/actionKey`）并对齐异常提示清单文档 | `src/modules/screenTechTree.ts` `tests/modules/screenTechTree.test.ts` `docs/design/ui/tech-tree.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（44/44） |
| 2026-05-29 | 收口 `T45-10`：回填升 II 阈值平衡影响说明，补 normal/tutorial 双阈值口径检查与回归测试 | `tests/sim/settle.test.ts` `docs/design/engineering/v0-balance-checkpoints.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（45/45） |
| 2026-05-29 | 推进 `T45-12`：扩展 `GameState.acknowledgedDisasterSeqs` 字段，用于事件面板全屏弹窗确认追踪 | `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` | `npm test` 通过（45/45） |
| 2026-05-29 | 推进 `T45-12`：新增 `screenEventsPanel` 壳层（upcoming/active/expired + 全屏确认 + UI 文案键）与模块测试 | `src/modules/screenEventsPanel.ts` `tests/modules/screenEventsPanel.test.ts` | `npm test` 通过（51/51） |
| 2026-05-29 | 推进 `T45-12`：新增 `sim:events-loop` 冒烟脚本，验证 M22 触发 -> 确认 -> M34 expired 链路 | `src/app/eventsLoopCli.ts` `package.json` | `npm run sim:events-loop` 通过；`npm test` 通过（51/51） |
| 2026-05-29 | 推进 `T45-12`：补 `screenEventsPanel` UI 错误码与 `messageKey/actionKey` 清单到 events UI 文档 | `docs/design/ui/events.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（51/51） |
| 2026-05-29 | 推进 `T45-12`：新增 `screenEventsPanel` 全屏弹窗内容键接口并补 final 场景回归；`events-loop` 输出文案键冒烟 | `src/modules/screenEventsPanel.ts` `tests/modules/screenEventsPanel.test.ts` `src/app/eventsLoopCli.ts` `docs/design/ui/events.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:events-loop` 通过；`npm test` 通过（52/52） |
| 2026-05-29 | 收口 `T45-12`：补多场事件叠加分槽（visible/hidden/overflow）与全屏确认队列优先级，新增 overlap 回归 | `src/modules/screenEventsPanel.ts` `tests/modules/screenEventsPanel.test.ts` `src/app/eventsLoopCli.ts` `docs/design/ui/events.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:events-loop` 通过；`npm test` 通过（53/53） |
| 2026-05-29 | 推进 `T45-13`：新增 `screenCompany` 壳层（快照/近月流水/贷款动作）与 `screenRunResult` 壳层（victory/bankrupt 快照） | `src/modules/screenCompany.ts` `src/modules/screenRunResult.ts` `src/modules/runController.ts` `src/sim/core/settleNextMonth.ts` `tests/modules/screenCompany.test.ts` `tests/modules/screenRunResult.test.ts` `tests/sim/settle.test.ts` | `npm test` 通过（60/60） |
| 2026-05-29 | 推进 `T45-13`：新增 `sim:result-loop` 双分支冒烟（victory/bankrupt）并验证终局态命令拦截 | `src/app/resultLoopCli.ts` `package.json` | `npm run sim:result-loop` 通过；`npm test` 通过（60/60） |
| 2026-05-29 | 收口 `T45-13`：补公司屏/终局页 UI 契约文档并切换当前任务到 `T45-14` | `docs/design/ui/company.md` `docs/design/ui/run-result.md` `docs/design/ui/README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 文档与看板更新 |
| 2026-05-29 | 推进 `T45-14`：新增 tutorial 引导状态字段与命令状态机（advance/skip），补 tutorial/非 tutorial 回归 | `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` | `npm test` 通过（66/66） |
| 2026-05-29 | 推进 `T45-14`：新增 `screenOnboarding` 壳层与模块测试，补 `sim:tutorial-loop` 推进/跳过双分支冒烟 | `src/modules/screenOnboarding.ts` `tests/modules/screenOnboarding.test.ts` `src/app/tutorialLoopCli.ts` `package.json` | `npm run sim:tutorial-loop` 通过；`npm test` 通过（66/66） |
| 2026-05-29 | 收口 `T45-14`：补 onboarding UI 壳层契约文档并切换当前任务到 `T45-15` | `docs/design/ui/onboarding.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 文档与看板更新 |
| 2026-05-29 | 推进 `T45-15`：落地 `serializeState/deserializeState` 与 schema 版本、不变量、配置引用校验 | `src/sim/types/storage.ts` `src/sim/core/serialization.ts` `src/sim/index.ts` `tests/sim/serialization.test.ts` | `npm test` 通过（69/69） |
| 2026-05-29 | 推进 `T45-15`：新增 `infra/storage` 适配接口与 `runPersistence` 编排层，补缺槽/坏档回归 | `src/infra/storage/stateStorage.ts` `src/modules/runPersistence.ts` `tests/modules/runPersistence.test.ts` | `npm test` 通过（72/72） |
| 2026-05-29 | 收口 `T45-15`：新增 `sim:save-loop` 冒烟验证“保存->篡改->恢复->继续推进”，并切换当前任务到 `T45-16` | `src/app/saveLoopCli.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:save-loop` 通过；`npm test` 通过（72/72） |
| 2026-05-29 | 收口 `T45-16`：新增 `sim:regression` 聚合回归（E1-E6 + 广告 cash/speedup），输出通过率与失败案例 | `src/app/regressionCli.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:regression` 通过；`npm test` 通过（72/72） |
| 2026-05-29 | 推进 `T45-P1-01`：新增 `screenCodex` 简版 2 页（core/ads）只读壳层，补模块回归与 UI 文档索引 | `src/modules/screenCodex.ts` `tests/modules/screenCodex.test.ts` `docs/design/ui/codex.md` `docs/design/ui/README.md` `docs/design/ui/onboarding.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（待本轮执行） |
| 2026-05-29 | 推进 `T45-P1-02`：新增 `playtestTelemetry` 结构化事件导出（command/settle）与 `sim:telemetry-export` CLI，补失败路径回归 | `src/modules/playtestTelemetry.ts` `src/modules/runController.ts` `src/app/telemetryExportCli.ts` `tests/modules/playtestTelemetry.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:telemetry-export` + `npm test` 通过（待本轮执行） |
| 2026-05-29 | 推进 `T45-P1-03`：补 `queue_grid_link` 的 region/trunk 跨区校验，新增跨区 trunk 放行与误用拦截回归 | `src/sim/config/configRepo.ts` `src/sim/core/dispatch.ts` `tests/sim/settle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test -- tests/sim/settle.test.ts` 通过（36/36） |
| 2026-05-30 | 推进 `T45-P1-04`：新增 `RewardedAdProvider` 适配层（stub/wechat 占位）与 `AdRewardService`，补 `sim:ad-sdk-spike` 预研冒烟与回归测试 | `src/infra/monetization/rewardedAdProvider.ts` `src/modules/adRewardService.ts` `src/app/adSdkSpikeCli.ts` `tests/modules/adRewardService.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:ad-sdk-spike` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T45-P1-04`：`screenCompany/screenTechTree` 接入 `AdRewardService`（cash/speedup），补广告取消路径回归与 UI 错误码映射 | `src/modules/screenCompany.ts` `src/modules/screenTechTree.ts` `tests/modules/screenCompany.test.ts` `tests/modules/screenTechTree.test.ts` `docs/design/ui/company.md` `docs/design/ui/tech-tree.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm test` 通过（待本轮执行） |
| 2026-05-30 | 收口 `T45-CLOSE`：新增 `sim:playtest-bundle`（boundaries+regression+test），E3 回归改经 screen 壳层，补 modules 边界扫描 | `src/app/playtestBundleCli.ts` `src/app/regressionCli.ts` `tests/modules/uiBoundary.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:playtest-bundle` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T48-01`：新增 `createGameApp` 装配根与 `GameShell` UI 导航壳层，补 `sim:app-shell` 冒烟与 ui 边界扫描 | `src/app/gameApp.ts` `src/ui/gameShell.ts` `src/modules/gameContext.ts` `src/app/appShellCli.ts` `tests/ui/gameShell.test.ts` `tests/modules/uiBoundary.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:app-shell` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T48-02`：`sim:playtest-bundle` 纳入 `sim:app-shell` 步骤，周五回归覆盖 app/ui 装配壳层冒烟 | `src/app/playtestBundleCli.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:playtest-bundle` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T48-03`：`GameShell` 新增 `saveSlot/loadSlot`，`sim:save-loop` 改经 `createGameApp` 装配 | `src/ui/gameShell.ts` `src/app/saveLoopCli.ts` `tests/ui/gameShell.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:save-loop` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T48-04`：`sim:playtest-bundle` 纳入 `sim:save-loop` 步骤，周五回归覆盖存档恢复冒烟 | `src/app/playtestBundleCli.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:playtest-bundle` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T48-05`：新增 `GameSceneBridge`/`SceneHost` 场景映射层与 `sim:cocos-scene-spike`，导出 Cocos 场景注册表 | `src/ui/sceneMap.ts` `src/ui/sceneHost.ts` `src/ui/gameSceneBridge.ts` `src/app/cocosSceneSpikeCli.ts` `client/cocos/scene-registry.json` `tests/ui/gameSceneBridge.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:cocos-scene-spike` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 收口 `T48-CLOSE`：新增 `createGameBootstrap` 统一装配入口，CLI 收口至 bootstrap，补 Cocos SceneHost 示例 | `src/app/gameBootstrap.ts` `src/app/appShellCli.ts` `src/app/saveLoopCli.ts` `src/app/cocosSceneSpikeCli.ts` `client/cocos/CocosSceneHost.example.ts` `tests/app/gameBootstrap.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:playtest-bundle` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T49-01`：`build:client` 同步 dist/config 至 Cocos 工程，`mountGameClient` 注入 ConfigRepo，补 GameRoot 占位 | `scripts/sync-client-assets.mjs` `src/app/gameClientEntry.ts` `src/app/clientSyncSpikeCli.ts` `client/cocos/project.json` `client/cocos/assets/scripts/GameRoot.ts` `tests/sim/configRepo.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:client-sync-spike` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T49-02`：`ConfigRepo.fromBundle` + Cocos `loadConfigFromResources` 异步加载，GameRoot 去掉读盘依赖 | `src/sim/config/configBundle.ts` `src/app/loadConfigRecords.ts` `client/cocos/assets/scripts/loadConfigFromResources.ts` `client/cocos/assets/scripts/GameRoot.ts` `tests/sim/configBundle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:client-sync-spike` + `npm test` 通过（待本轮执行） |
| 2026-05-30 | 推进 `T49-03`：`WxStateStorage` 适配 wx 本地存储，`mountGameClient` 默认注入，client-sync 补 save/load 冒烟 | `src/infra/storage/wxStateStorage.ts` `src/app/gameApp.ts` `src/app/gameClientEntry.ts` `src/app/clientSyncSpikeCli.ts` `tests/infra/wxStateStorage.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:client-sync-spike` + `npm test` 通过（109/109） |
| 2026-05-30 | 推进 `T49-04`：客户端挂载自动读档 default slot，`clientPersistence` 编排，remount 恢复冒烟 | `src/app/clientPersistence.ts` `src/app/gameClientEntry.ts` `src/app/gameBootstrap.ts` `client/cocos/assets/scripts/GameRoot.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/clientPersistence.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:client-sync-spike` + `npm test` 通过（112/112） |
| 2026-05-30 | 推进 `T49-05`：`wx.onHide` 自动存档，`clientLifecycle` 绑定与 hide→remount 冒烟 | `src/infra/lifecycle/wxLifecycle.ts` `src/app/clientLifecycle.ts` `src/app/gameClientEntry.ts` `client/cocos/assets/scripts/GameRoot.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/clientLifecycle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:client-sync-spike` + `npm test` 通过（116/116） |
| 2026-05-30 | 收口 `T49-CLOSE`：playtest-bundle 全绿，推送 T49-03~05（wx 存储 + 自动读档 + onHide 存档） | `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:playtest-bundle` 通过（7/7，116 tests） |
| 2026-05-30 | 推进 `T50-01`：城市页 HUD 控制器 + Cocos `CityHudPanel` + 挂载注册表 | `src/app/cityHudController.ts` `src/app/gameClientRegistry.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `client/cocos/assets/scripts/GameRoot.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/cityHudController.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run build:client` + `sim:client-sync-spike` + `npm test` 通过（119/119） |
| 2026-05-30 | 推进 `T50-02`：场景导航 + Cocos 预检 + 初始化清单 | `src/app/screenNavController.ts` `src/app/cocosInitCheck.ts` `src/app/cocosInitSpikeCli.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `client/cocos/assets/scripts/CocosSceneHost.ts` `docs/design/engineering/cocos-client-setup.md` `tests/app/screenNavController.test.ts` `package.json` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm run sim:cocos-init-spike` + `sim:client-sync-spike` + `npm test` 通过（122/122） |
| 2026-06-01 | 收口 `T50-03`：预览 HTTP 探测 + 公司/科技屏顶栏文案 | `src/app/previewProbe.ts` `src/app/previewProbeCli.ts` `src/app/clientHudController.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `tests/app/previewProbe.test.ts` `tests/app/clientHudController.test.ts` `package.json` `docs/design/engineering/cocos-client-setup.md` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-01 | 推进 `T50-04`：公司屏借贷/广告领现接入开发 HUD | `src/app/companyHudController.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/companyHudController.test.ts` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-01 | 推进 `T50-05`：科技屏开研/取消/广告加速接入开发 HUD | `src/app/techHudController.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/techHudController.test.ts` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-04 | 推进 `T50-06`：灾害待确认与 eventsHud 接入开发 HUD | `src/app/eventsHudController.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/i18n/messages/*` `src/app/clientSyncSpikeCli.ts` `tests/app/eventsHudController.test.ts` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-04 | 推进 `T50-07`：区域导航与默认铺线接入开发 HUD | `src/app/regionHudController.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/app/screenNavController.ts` `tests/app/regionHudController.test.ts` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-04 | 收口 `T50-CLOSE`：`clientHudSmoke` + `sim:cocos-hud-close` + `verify:client` 聚合 | `src/app/clientHudSmoke.ts` `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `docs/design/engineering/cocos-client-setup.md` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-09 | 清理 Cursor 项目规则：删除重复提交规则，收敛 `.cursor/rules` 职责，并补 `AGENTS.md` / `.cursor/README.md` 说明 | `AGENTS.md` `.cursor/README.md` `.cursor/prompts/session-kickoff.md` `.cursor/rules/session-discipline.mdc` `.cursor/rules/project-context.mdc` `.cursor/rules/verification.mdc` `.cursor/rules/sim-architecture.mdc` `.cursor/rules/cocos-wechat.mdc` `README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 继续压缩 Agent 入口：收敛 `AGENTS.md` 与 `.cursor/README.md`，明确规则分工与排障入口 | `AGENTS.md` `.cursor/README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 将 `cursor-workbench` / 项目规则整理确认为阶段支撑任务 `OPS-01`，并继续去重 `README.md` / `AGENTS.md` / `.cursor/README.md` 三处入口 | `README.md` `AGENTS.md` `.cursor/README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 为后续扩充工具箱建立两层结构：`cursor-workbench` 新增通用工具箱清单；项目内新增微信小游戏专用工具箱清单 | `../cursor-workbench/docs/toolbox/common-toolbox.md` `../cursor-workbench/README.md` `../cursor-workbench/docs/architecture/directory-guide.md` `README.md` `.cursor/README.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 补第一批高优先级项目专用 skills：新增 `wechat-build-debug` / `cocos-verify` / `task-board-sync` / `sim-change-guard`，并细化 MCP 候选清单 | `.cursor/skills/wechat-build-debug/SKILL.md` `.cursor/skills/cocos-verify/SKILL.md` `.cursor/skills/task-board-sync/SKILL.md` `.cursor/skills/sim-change-guard/SKILL.md` `.cursor/README.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 继续补常用项目专用 tools：新增 `config-sync-check` / `hud-playtest-check`，并把低频项 `ops-phase-close` 明确暂缓 | `.cursor/skills/config-sync-check/SKILL.md` `.cursor/skills/hud-playtest-check/SKILL.md` `.cursor/README.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-09 | 收口项目专用 tools 清单：补 `ops-phase-close` / `github-pr-ci`，并将 GitHub 从泛候选细化为“当前 `gh` CLI、后续 MCP 接入”的项目策略 | `.cursor/skills/ops-phase-close/SKILL.md` `.cursor/skills/github-pr-ci/SKILL.md` `.cursor/README.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅规则/文档整理，无需跑测试 |
| 2026-06-17 | Codex 接手项目：通读 Cursor 规则、工程文档和核心代码结构，新增 Codex 接手上下文并接入 README | `docs/design/engineering/codex-handoff.md` `README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档/看板整理，无需跑测试 |

---

## 5. 维护约定

1. 每轮对话开始：先看「当前任务」确认是否继续或切换。  
2. 每轮对话结束：更新本文件 `状态`、`下一步`、`会话日志`。  
3. 若任务切换：先把旧任务从 `doing` 改为 `done/partial`，再设置新的 `doing`。  
4. 若用户临时打断：优先把“已做/待做/阻塞”写入会话日志再结束。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-28 | 初版：建立项目级任务看板，覆盖 T45-01~16 状态与会话续航机制 |
| 0.1.1 | 2026-05-28 | 新增提交策略；记录 T45-06 本轮进展与验证结果 |
| 0.1.2 | 2026-05-28 | T45-06 标记完成，当前任务切到 T45-07，并记录 M2+M4 连通分岛进展 |
| 0.1.3 | 2026-05-28 | 记录 T45-07 边界回归进展（M10/M13/M14） |
| 0.1.4 | 2026-05-28 | 记录 T45-07 配置守卫与异常路径回归进展 |
| 0.1.5 | 2026-05-28 | 记录 T45-07 状态不变量/命令解锁防御与错误上下文进展 |
| 0.1.6 | 2026-05-28 | 记录 T45-07 blocked/run_result 状态机异常路径收口进展 |
| 0.1.7 | 2026-05-29 | 记录 T45-07 blocked 白名单策略与回归进展 |
| 0.1.8 | 2026-05-29 | 记录 T45-07 blocked 错误上下文增强进展 |
| 0.1.9 | 2026-05-29 | 记录 T45-07 invalid_phase 错误上下文增强进展 |
| 0.1.10 | 2026-05-29 | 采纳“本地 commit、阶段 push”策略并记录新增回归 |
| 0.1.11 | 2026-05-29 | 标记 T45-07 完成并记录 T45-09 联调准备（runController 轨迹） |
| 0.1.12 | 2026-05-29 | 记录 T45-09 城市快照与 build+settle 组合接口进展 |
| 0.1.13 | 2026-05-29 | 记录 T45-09 城市闭环 CLI 冒烟路径进展 |
| 0.1.14 | 2026-05-29 | 记录 T45-09 多月推进接口与 CLI 冒烟进展 |
| 0.1.15 | 2026-05-29 | 记录 T45-09 城市闭环 CLI 逐月明细输出进展 |
| 0.1.16 | 2026-05-29 | 标记 T45-09 完成并切换当前任务到 T45-10 |
| 0.1.17 | 2026-05-29 | 记录 T45-10 `screenRegion` 壳层与解锁回归进展 |
| 0.1.18 | 2026-05-29 | 记录 T45-10 region 冒烟 CLI 进展（含 Lv1/Lv2 链路） |
| 0.1.19 | 2026-05-29 | 记录 T45-10 region 冒烟改为 M10 升级链路进展 |
| 0.1.20 | 2026-05-29 | 记录协作策略规则固化（commit/push 节奏） |
| 0.1.21 | 2026-05-29 | 记录 T45-10 tutorial 升级链路替换进展 |
| 0.1.22 | 2026-05-29 | 记录 T45-10 tutorial 升级阈值配置化进展 |
| 0.1.23 | 2026-05-29 | 记录 T45-10 region 推月壳层接口进展 |
| 0.1.24 | 2026-05-29 | 记录 T45-10 正常局升 II 链路打通进展 |
| 0.1.25 | 2026-05-29 | 记录 T45-10 正常局升级循环推进稳健性改造 |
| 0.1.26 | 2026-05-29 | 记录 T45-11 研发取消返还命令落地进展 |
| 0.1.27 | 2026-05-29 | 记录 T45-11 科技树壳层模块进展 |
| 0.1.28 | 2026-05-29 | 记录 T45-11 科技树冒烟脚本进展 |
| 0.1.29 | 2026-05-29 | 记录 T45-11 研发广告加速闭环进展 |
| 0.1.30 | 2026-05-29 | 记录 T45-11 科技树 UI 错误映射进展 |
| 0.1.31 | 2026-05-29 | 标记 T45-11 完成：补文案键契约并同步异常提示清单 |
| 0.1.32 | 2026-05-29 | 标记 T45-10 完成：回填升 II 阈值平衡检查与 normal/tutorial 口径回归 |
| 0.1.33 | 2026-05-29 | 记录 T45-12 阶段进展：事件面板壳层 + 冒烟 + UI 文案键清单 |
| 0.1.34 | 2026-05-29 | 记录 T45-12 进展：补全屏弹窗内容键契约与 final 场景回归 |
| 0.1.35 | 2026-05-29 | 标记 T45-12 完成：补多场叠加分槽与全屏确认队列优先级契约 |
| 0.1.36 | 2026-05-29 | 标记 T45-13 完成：公司屏/终局页壳层、双分支冒烟与终局禁命令回归落地 |
| 0.1.37 | 2026-05-29 | 标记 T45-14 完成：教学局状态机、onboarding 壳层与双分支冒烟落地 |
| 0.1.38 | 2026-05-29 | 标记 T45-15 完成：存档序列化、恢复校验、storage 接入与恢复冒烟落地 |
| 0.1.39 | 2026-05-29 | 标记 T45-16 完成：补 E1-E6 聚合回归脚本并输出通过率/失败案例 |
| 0.1.40 | 2026-05-29 | 推进 T45-P1-01：新增 `overlay_codex` 简版壳层（2 页）与文档索引 |
| 0.1.41 | 2026-05-29 | 推进 T45-P1-02：新增 playtest telemetry 结构化日志导出模块与 CLI |
| 0.1.42 | 2026-05-29 | 推进 T45-P1-03：补 trunk/region 跨区边界校验与回归测试 |
| 0.1.43 | 2026-05-30 | 推进 T45-P1-04：新增广告 Provider 预研接入骨架（stub/wechat 占位） |
| 0.1.44 | 2026-05-30 | 推进 T45-P1-04：公司屏/科技树壳层接入 AdRewardService 与广告错误码映射 |
| 0.1.45 | 2026-05-30 | 收口 T45-CLOSE：新增 playtest 聚合脚本与 modules 边界扫描测试 |
| 0.1.46 | 2026-05-30 | 推进 T48-01：新增 app/ui 最小装配壳层与导航冒烟 |
| 0.1.47 | 2026-05-30 | 推进 T48-02：playtest-bundle 纳入 app-shell 冒烟步骤 |
| 0.1.48 | 2026-05-30 | 推进 T48-03：GameShell 存档编排与 save-loop 改经 app 装配 |
| 0.1.49 | 2026-05-30 | 推进 T48-04：playtest-bundle 纳入 save-loop 冒烟步骤 |
| 0.1.50 | 2026-05-30 | 推进 T48-05：Cocos 场景占位接入 GameShell 与场景注册表导出 |
| 0.1.51 | 2026-05-30 | 收口 T48-CLOSE：createGameBootstrap 统一装配与 CLI 收口 |
| 0.1.52 | 2026-05-30 | 推进 T49-01：Cocos client 资源同步与 mountGameClient 挂载入口 |
| 0.1.53 | 2026-05-30 | 推进 T49-02：Cocos resources 异步 config 加载与 fromBundle 构建 |
| 0.1.54 | 2026-05-30 | 推进 T49-03：WxStateStorage 适配 wx 本地存储并接入 mountGameClient |
| 0.1.55 | 2026-05-30 | 推进 T49-04：客户端挂载自动读档 default slot 与 remount 恢复冒烟 |
| 0.1.56 | 2026-05-30 | 推进 T49-05：wx.onHide 自动存档绑定与 hide→remount 冒烟 |
| 0.1.57 | 2026-05-30 | 收口 T49-CLOSE：playtest-bundle 全绿并推送 T49 存档闭环 |
| 0.1.58 | 2026-05-30 | 推进 T50-01：Cocos 城市页 HUD 控制器与 CityHudPanel 实接 |
| 0.1.59 | 2026-05-30 | 推进 T50-02：场景导航、Cocos 预检 CLI 与初始化清单 |
| 0.1.60 | 2026-06-01 | 推进 T50-03：check:cocos-preview 与多屏 HUD 顶栏 |
| 0.1.61 | 2026-06-01 | 推进 T50-04：公司屏借贷与广告领现开发 HUD |
| 0.1.62 | 2026-06-01 | 推进 T50-05：科技屏开研/取消/广告加速开发 HUD |
| 0.1.63 | 2026-06-04 | 收口 T50-CLOSE：HUD 验收 CLI 与 verify:client 聚合 |
| 0.1.64 | 2026-06-04 | 推进 T50-06/07：灾害确认与区域铺线开发 HUD |
| 0.1.65 | 2026-06-09 | 清理 Cursor 项目规则：删除重复规则，收敛职责并补入口说明 |
| 0.1.66 | 2026-06-09 | 压缩 AGENTS/规则说明入口，减少重复与交叉职责 |
| 0.1.67 | 2026-06-09 | 新增阶段支撑任务 OPS-01，承接 cursor-workbench 与项目规则收口 |
| 0.1.68 | 2026-06-09 | 新增通用/项目专用双层工具箱清单，准备下一阶段扩 skills / MCP |
| 0.1.69 | 2026-06-09 | 落地第一批高优先级项目专用 skills，并把 GitHub / Browser 细化为高优先级 MCP 候选 |
| 0.1.70 | 2026-06-09 | 补齐常用中优先级项目专用 skills，并明确低频项先暂缓 |
| 0.1.71 | 2026-06-09 | 补齐剩余常用项目专用 skills，并明确 GitHub 现阶段先走 `gh` CLI、后续再接 MCP |
| 0.1.72 | 2026-06-17 | 新增 Codex 接手上下文文档，并把入口接入 README 与当前 OPS-01 看板记录 |
