---
id: engineering/project-task-board
title: 项目级任务看板（coding-first）
status: draft
version: 0.1.33
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

- 当前阶段：`T45` 编码闭环（P0 优先）
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
| T45-12 | partial | 固定灾害轴与事件面板 | 新增 `screenEventsPanel` 壳层（upcoming/active/expired + 全屏确认）与 `sim:events-loop` 冒烟 | 接 UI 事件面板/弹窗呈现层 + 多场叠加策略 |
| T45-13 | todo | 公司屏、借贷、终局页 | — | 先补终局态禁命令回归 |
| T45-14 | todo | 教学局与引导遮罩 | — | 建教程存档标记 |
| T45-15 | todo | 存档与恢复 | — | 定义 serialize/deserialize |
| T45-16 | todo | 广告 stub 与全链路回归 | 广告 cash stub 已有 | 建 E1-E6 回归脚本 |

---

## 3. 当前任务（只保留 1 项 doing）

- 当前任务 ID：`T45-12`
- 任务标题：固定灾害轴与事件面板
- 状态：`doing`
- 开始时间：2026-05-29
- 完成定义（本轮）：接通首场固定灾害 UI 事件面板/弹窗链路

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
| 2026-05-29 | 协作策略固化：新增 always-apply 规则，默认“每步本地 commit、阶段性 push” | `.cursor/rules/commit-push-rhythm.mdc` | 规则文件新增 |
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
