---
id: engineering/project-task-board
title: 项目级任务看板（coding-first）
status: draft
version: 0.1.2
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
- 提交策略：每个阶段性可验收节点完成后执行 `commit + push`

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
| T45-07 | partial | M9/M10/M13/M14 落地 | SV/升级/破产/通关主路径已接入 | 补边界用例与配置一致性 |
| T45-08 | done | modules 编排层 | `runController` + 统一入口 | 增加 UI 契约扫描测试 |
| T45-09 | todo | 城市页最小闭环 | — | 接 UI 壳层建造+推月 |
| T45-10 | todo | 等级解锁与 region 流程 | — | 先打通 II 级解锁 |
| T45-11 | partial | 科技树单队列 | `start_research` + M3 进度与点亮 | 接 II 级入口与取消返还 |
| T45-12 | partial | 固定灾害轴与事件面板 | M11 固定灾害与 debuff 生效 | 接 UI 事件面板/弹窗 |
| T45-13 | todo | 公司屏、借贷、终局页 | — | 先补终局态禁命令回归 |
| T45-14 | todo | 教学局与引导遮罩 | — | 建教程存档标记 |
| T45-15 | todo | 存档与恢复 | — | 定义 serialize/deserialize |
| T45-16 | todo | 广告 stub 与全链路回归 | 广告 cash stub 已有 | 建 E1-E6 回归脚本 |

---

## 3. 当前任务（只保留 1 项 doing）

- 当前任务 ID：`T45-07`
- 任务标题：M9/M10/M13/M14 边界与配置一致性收口
- 状态：`doing`
- 开始时间：2026-05-28
- 完成定义（本轮）：补齐等级/破产/胜利边界用例与状态机约束

---

## 4. 会话日志（防中断）

| 日期 | 会话结论 | 变更文件 | 验证 |
|------|----------|----------|------|
| 2026-05-28 | 确认执行策略：先 coding 后数值；进入 T45 闭环推进 | `docs/design/TASK-LIST.md` | 文档确认 |
| 2026-05-28 | 补齐 `start_research` 命令与 `M3_research_progress` 实现，研发可入队并点亮 | `src/sim/types/commands.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（5/5） |
| 2026-05-28 | 新增项目级任务看板，用于每轮对话实时续航 | `docs/design/engineering/PROJECT-TASK-BOARD.md` | 文档新增 |
| 2026-05-28 | 推进 `T45-06`：M4 升级为跨城统一供能分配，新增 `effectiveSupply/netImport/ecoCap` 字段与两条并网语义测试 | `src/sim/core/settleNextMonth.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/config/configRepo.ts` `tests/sim/settle.test.ts` | `npm test` 通过（7/7） |
| 2026-05-28 | 完成 `T45-06`：新增 `queue_grid_link`、M2 链路完工推进、M4 按连通分岛分配供能；测试覆盖未连通/已连通场景 | `src/sim/types/commands.ts` `src/sim/types/gameState.ts` `src/sim/core/createInitialState.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` | `npm test` 通过（8/8） |

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
