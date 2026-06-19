---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 1.10.0
sources:
  - docs/design/TASK-LIST.md
  - docs/design/engineering/IMPLEMENTATION-TASKS.md
supersedes: []
depends_on:
  - engineering/implementation-tasks
open_questions: []
---

# 项目级任务看板

本文件只保留当前阶段、当前任务、下一步和近期日志。完整长流水历史已退出主阅读路径，见 `archive/project-task-board-history.md` 与 Git 历史。

## 1. 当前阶段

- 当前阶段：`FAST-01` Playable Demo 快线
- 当前策略：冻结非阻塞小问题，把开发重心从 `vertical-slice-v0` 最小验证切到“更完整 demo 内容落地”

## 2. 当前任务

- 任务 ID：`FAST-01`
- 标题：Playable Demo 快线落地（从 v0 最小裁剪闭环推进到更完整、可持续试玩的 demo）
- 状态：`doing`
- 开始时间：2026-06-18
- 完成定义：
  - 不再被真机/微信工具的小问题阻塞主线
  - 明确下一批要补齐的可玩内容范围，而不是继续停在最小验证态
  - 至少形成一个可执行的后续开发批次：地图扩张、公司等级扩张、科技内容扩张、UI 正式化排期

## 3. 当前工程摘要

| 区块 | 状态 |
|------|------|
| T45 P0 闭环 | done |
| T48–T50 客户端装配与开发 HUD | done |
| T51 真机构建与冒烟 | done |
| FAST-01 Demo 快线 | doing |
| OPS-01 文档与规则收敛 | done |
| 开发前真相固化 | done |

## 4. 下一步

1. 把当前 v0 裁剪项与“更完整 demo”差距列清楚
2. 先定下一批直接做的功能，不再把时间耗在非阻塞小问题上
3. 优先推进地图、公司等级、科技内容和更长经营链路
4. 保持最小验证持续可跑
5. 正式 UI / SDK / 数值收敛放到后面批次

## 5. 近期日志

| 日期 | 结论 | 变更文件 | 验证 |
|------|------|----------|------|
| 2026-06-04 | 收口 `T50-CLOSE`：客户端 HUD 聚合验证可用 | `src/app/clientHudSmoke.ts` `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `docs/design/engineering/cocos-client-setup.md` | `npm run verify:client` + `npm test` 通过 |
| 2026-06-09 | 启动 `OPS-01`：收敛项目规则入口，整理工具箱与项目专用协作能力 | `README.md` `AGENTS.md` `docs/design/engineering/cursor-toolbox.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档/规则整理，无需跑测试 |
| 2026-06-17 | Codex 接手：补接手上下文，准备把项目规则从 Cursor 体系迁回正式文档 | `docs/design/engineering/codex-handoff.md` `README.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 文档收敛：重写入口、压缩任务与看板、建立归档层并准备删除旧 Cursor 规则目录 | `README.md` `AGENTS.md` `docs/design/README.md` `docs/design/META.md` `docs/design/LEGACY.md` `docs/design/TASK-LIST.md` `docs/design/engineering/*.md` `docs/design/archive/*` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 回写主真相：依据既有工作历史与当前复核，将 `OPS-01` 标记完成、将 `T51` 从主看板层确认为已完成，并进入开发前真相固化 | `docs/design/engineering/PROJECT-TASK-BOARD.md` `docs/design/current-product-truth.md` `README.md` `docs/design/README.md` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/codex-project-rules.md` `docs/design/engineering/codex-handoff.md` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 用户纠偏：`T51` 并未完成，只能确认“已构建并在真机跑起”，仍有待修问题；据此将当前阶段切回真机问题收口 | `docs/design/engineering/PROJECT-TASK-BOARD.md` `docs/design/current-product-truth.md` `README.md` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/codex-handoff.md` | 仅文档整理，无需跑测试 |
| 2026-06-17 | 环境收口：修复 PowerShell 下 `npm` 可用性，补齐 Python/py，固化 Cocos 与微信开发者工具入口，并安装 `playwright`/`screenshot` skill | `package.json` `scripts/doctor.mjs` `scripts/open-cocos.mjs` `scripts/open-wechat-devtools.mjs` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `npm -v` `npx --version` `python --version` `py --version` `npm run doctor` 通过 |
| 2026-06-17 | 前置脚手架复核：重启后确认 Codex 会话下裸 `npm` 仍受 PowerShell 执行策略影响，统一改为 `cmd.exe /c npm ...` 作为稳态入口；补 `doctor:full` 区分环境问题与仓库现有编译错误 | `README.md` `package.json` `scripts/doctor.mjs` `scripts/doctor-full.mjs` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run doctor` 通过；`cmd.exe /c npm run doctor:full` 显示 `test`/`lint:boundaries`/`verify:client` 通过，`build` 因现有 TS 语法错误失败 |
| 2026-06-17 | 仓库健康修复：清掉 `build` 里的 CLI 语法/strict 噪音，补本地 Node 类型 shim、灾害配置缺口并把误放到 `src/` 的测试移回 `tests/`，恢复本地健康检查全绿 | `src/app/regionLoopCli.ts` `src/app/regressionCli.ts` `src/sim/config/configRepo.ts` `src/types/node-shim.d.ts` `tests/app/clientHudCapabilities.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 子步骤：补开发 HUD 能力门控，未解锁时隐藏区域铺线与科技操作按钮，避免真机出现“功能未开但按钮仍显示/可点”的误导反馈 | `src/app/clientHudCapabilities.ts` `src/app/cocosClientExports.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `tests/app/clientHudDisplay.test.ts` `tests/app/clientHudCapabilities.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 子步骤：把“灾害待确认时切后台，再进入后仍保留弹层且可确认”纳入客户端聚合验证，锁住灾害月冒烟与 `onHide` 存档恢复的交叉风险 | `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `src/app/clientSyncSpikeCli.ts` `tests/app/cocosHudCloseCheck.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 真机截图反馈：修复公司页 HUD 上半区文案重叠，收敛公司/区域/科技页提示行数，并让 Cocos 文本在固定区域内缩小而不是扩高覆盖 | `src/app/clientHudDisplay.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 构建链路修正：定位到微信工具仍在跑旧 `build/wechatgame` 产物，新增 `verify:client` 对微信包内 `CityHudPanel` 过期编译的检测，并补清缓存重建说明 | `src/app/cocosHudCloseCheck.ts` `src/app/cocosHudCloseRunner.ts` `src/app/verifyClientCli.ts` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` 通过；`cmd.exe /c npm run verify:client` 预期失败并提示 `wechat-build:fresh-city-hud-panel`，需清理 Cocos 缓存后重建微信包 |
| 2026-06-18 | `T51` 微信半包诊断：确认新工作区路径正确，但 Cocos 3.8.8 本次构建日志出现 `SIGTERM in task build-script` 后仍误报 success，实际缺 `src/polyfills.bundle.js`、`src/system.bundle.js`、`src/import-map.js`；新增启动模块完整性检测 | `src/app/cocosHudCloseCheck.ts` `tests/app/cocosHudCloseCheck.test.ts` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` 通过；`cmd.exe /c npm test -- tests/app/cocosHudCloseCheck.test.ts` 通过；`cmd.exe /c npm run verify:client` 预期失败并提示 `wechat-build:startup-modules` |
| 2026-06-18 | `T51` 半包诊断收紧：确认项目历史上可正常构建并真机运行，当前问题收敛为 Codex 工作区最近一次 Cocos 构建被 `SIGTERM` 打断后留下半包；`verify:client` 增加最新微信构建日志检查 | `src/app/cocosHudCloseCheck.ts` `tests/app/cocosHudCloseCheck.test.ts` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` 通过；`cmd.exe /c npm test -- tests/app/cocosHudCloseCheck.test.ts` 通过；`cmd.exe /c npm run verify:client` 预期失败并同时提示 `wechat-build:last-build-log` 与 `wechat-build:startup-modules` |
| 2026-06-18 | `T51` 验证门槛修正：删除旧 `build/wechatgame` 后，不再让历史 `SIGTERM` 日志阻塞 `verify:client`；后续只在微信包存在时检查最新构建日志与启动模块完整性 | `src/app/cocosHudCloseCheck.ts` `tests/app/cocosHudCloseCheck.test.ts` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` 通过；`cmd.exe /c npm test -- tests/app/cocosHudCloseCheck.test.ts` 通过；`cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 微信包恢复：重新构建后启动模块与 `assets/main/index.js` 均已存在，`verify:client` 调整为 `SIGTERM` 仅在启动模块缺失时阻塞；当前转入微信开发者工具 Console 运行期报错排查 | `src/app/cocosHudCloseCheck.ts` `tests/app/cocosHudCloseCheck.test.ts` `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` 通过；`cmd.exe /c npm test -- tests/app/cocosHudCloseCheck.test.ts` 通过；`cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | `T51` 运行期冒烟入口固化：把冷启动、公司升 2 级、区域/队列、月份推进、灾害确认、自动存档恢复整理成可直接执行的最小手工用例，并要求将微信开发者工具 Console 红错单独导出为文本日志 | `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档整理，无需跑测试 |
| 2026-06-18 | `T51` 运行期反馈回写：用户确认真机与微信开发者工具主链路一致可跑，日志未见运行时崩溃；当前看到的 `conflict_in_progress` / `research_queue_full` / `loan_already_active` 属于预期业务拒绝，另将“关掉再开仍保留进度”明确为 `slot-main` 自动读档 + `onHide` 自动存档的预期表现 | `docs/design/engineering/cocos-client-setup.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-18 | 主线切换：结合最新真机反馈，确认当前瓶颈主要是 `vertical-slice-v0` 的内容裁剪，而不是阻塞性运行时故障；因此把主线从 `T51` 真机收口切到 `FAST-01` Playable Demo 快线，后续优先扩公司等级、地图区域、科技内容与更长经营链路 | `README.md` `docs/design/current-product-truth.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档整理，无需跑测试 |
| 2026-06-18 | 工程清理：补充根目录 `.tmp/` 到 `.gitignore`，避免 Codex 临时文件继续污染工作区；本轮仅提交忽略规则与看板回写，不动用户当前未提交的 Cocos 本地设置改动 | `.gitignore` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅工程配置整理，无需跑测试 |
| 2026-06-18 | 仓库卫生修正：确认 `client/cocos/settings/v2/packages/*.json` 属于 Cocos 官方建议入库的 `settings/` 目录，不做 `gitignore`；新增 `.gitattributes` 固定文本与 JSON 行尾，减少 Windows/Cocos 触发的假脏状态 | `.gitattributes` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅工程配置整理，无需跑测试 |
| 2026-06-18 | `FAST-01` 子步骤：补齐最小科技配置表并把科技研发从硬编码单节点改成配置驱动；科技页现在可暴露可研/锁定节点列表，II 级默认演示节点改为 `wind_2`，客户端同步链路也补进 `technology_config.json` | `docs/design/data/vertical-slice-v0/technology_config.json` `docs/design/data/vertical-slice-v0/manifest.json` `client/cocos/assets/resources/config/v0/technology_config.json` `scripts/sync-client-assets.mjs` `src/sim/config/*.ts` `src/sim/core/dispatch.ts` `src/modules/screenTechTree.ts` `src/app/techHudController.ts` `tests/sim/*.test.ts` `tests/modules/screenTechTree.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm test` 通过 |
| 2026-06-19 | `FAST-01` 第二个科技内容扩张子步：科技页/HUD 从“固定默认开研”扩到“显示可研候选、切换候选并按所选节点开研”；同时补候选摘要文案与客户端 HUD 按状态复用第三按钮（空闲时切换候选，在研时广告加速） | `src/modules/screenTechTree.ts` `src/app/techHudController.ts` `src/app/clientHudDisplay.ts` `src/app/cocosClientExports.ts` `src/i18n/messages/*` `client/cocos/assets/scripts/CityHudPanel.ts` `tests/modules/screenTechTree.test.ts` `tests/app/techHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |

## 6. 阶段摘要

- `T45`：模拟核心、主要屏幕壳层、回归脚本、存档与广告 stub 已完成
- `T48–T49`：应用装配、客户端挂载、配置同步、存档恢复已完成
- `T50`：开发 HUD、导航、公司/科技/事件/区域入口已完成
- `T51`：已完成构建路径、真机启动与最小冒烟；后续若有真机专属问题按缺陷单处理
- `FAST-01`：当前主线，目标是尽快把 demo 从 v0 最小裁剪态推进到更完整可玩内容
- `OPS-01`：已完成协作入口、规则文档与历史归档收敛
- 当前重点：优先扩内容而不是继续打磨非阻塞小问题

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.2.0 | 2026-06-17 | 压缩主看板，仅保留当前状态、阶段摘要与近期日志 |
| 0.3.0 | 2026-06-17 | 回写 `T51` 与 `OPS-01` 完成状态，新增开发前真相固化任务 |
| 0.4.0 | 2026-06-17 | 按用户纠偏恢复 `T51` 为当前阶段，改为真机问题收口 |
| 0.5.0 | 2026-06-17 | 补记仓库健康修复：恢复 `build`/`test`/`verify:client` 全绿，继续以 `T51` 为当前阶段 |
| 0.6.0 | 2026-06-18 | 补记 `T51` 子步骤：开发 HUD 按真实解锁状态门控区域/科技按钮 |
| 0.7.0 | 2026-06-18 | 补记 `T51` 子步骤：客户端验证覆盖灾害待确认切后台恢复 |
| 0.8.0 | 2026-06-18 | 补记 `T51` 真机截图反馈：公司页 HUD 上半区重叠修复 |
| 0.9.0 | 2026-06-18 | 补记 `T51` 构建链路修正：检测微信包旧编译产物 |
| 1.0.0 | 2026-06-18 | 补记 `T51` 微信半包诊断：检测 `game.js` 启动模块缺失 |
| 1.1.0 | 2026-06-18 | 补记 `T51` 半包诊断收紧：检测最新 Cocos 构建日志 SIGTERM |
| 1.2.0 | 2026-06-18 | 补记 `T51` 验证门槛修正：微信包不存在时跳过旧构建日志 |
| 1.3.0 | 2026-06-18 | 补记 `T51` 微信包恢复：启动模块完整且 `verify:client` 通过 |
| 1.4.0 | 2026-06-18 | 补记 `T51` 运行期冒烟入口固化：整理最小手工用例与日志回传要求 |
| 1.5.0 | 2026-06-18 | 补记 `T51` 运行期反馈回写：主链路可跑，日志所见为预期业务拒绝，自动续局属预期存档行为 |
| 1.6.0 | 2026-06-18 | 主线切换到 `FAST-01` Playable Demo 快线：真机不再作为统一阻塞项，优先推进内容扩张 |
| 1.7.0 | 2026-06-18 | 补记工程清理：忽略根目录 `.tmp/`，避免临时文件污染工作区 |
| 1.8.0 | 2026-06-18 | 补记仓库卫生修正：新增 `.gitattributes` 固定行尾，并明确保留 Cocos `settings/` 入库 |
| 1.9.0 | 2026-06-18 | 补记 `FAST-01` 首个内容扩张子步：科技最小链路改为配置驱动并同步到客户端资源 |
| 1.10.0 | 2026-06-19 | 补记 `FAST-01` 第二个科技内容扩张子步：科技页/HUD 支持多候选切换与按所选节点开研 |
