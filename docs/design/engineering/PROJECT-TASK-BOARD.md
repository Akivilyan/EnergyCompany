---
id: engineering/project-task-board
title: 项目级任务看板
status: draft
version: 1.30.0
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

1. 把 V 级后新开的 `MAP-06~08` / `MET-B` 从“能进”推进到“有更强经营差异”
2. 继续把 III～V 级科技从“有节点”推进到“有后续经营分叉”，优先补生态改造与更长经营差异
3. 继续保持 `build` / `test` / `build:client` / `verify:client` 持续可跑
4. 再回头收正式 UI / SDK / 数值收敛

## 5. 近期日志

| 日期 | 结论 | 变更文件 | 验证 |
|------|------|----------|------|
| 2026-06-22 | `FAST-01` 后半程资源禀赋差异子步：把城市配置里的 `wind_resource` / `solar_resource` / `hydro_resource` 从“配置可见”推进到 M4 供能真实生效；风/光/常规水电在 rich 城市按设计获得 ×2 乘区，火电/核电不吃资源乘区，`MET-B` 光伏与 `MAP-07` 水风资源现已形成真实经营差异 | `src/sim/config/configRepo.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm test` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `FAST-01` 生态改造经营分叉子步：补齐 `eco_thermal` / `eco_nuclear` 科技节点，并把 ECO 同步从“文档存在”推进到“模拟层真实生效”；已完工火/核机组现在会在 M3 完成拍或广告秒研后立即环保化，M4 供能环保判定与 M9 社会价值也会据此更新 | `docs/design/data/vertical-slice-v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/settleNextMonth.ts` `src/sim/core/dispatch.ts` `src/sim/types/gameState.ts` `tests/sim/settle.test.ts` `tests/modules/screenTechTree.test.ts` `tests/sim/configBundle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm test` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
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
| 2026-06-19 | `FAST-01` 地图第二批可玩链路子步：把 `regions.json` 正式接入运行时配置，区域页/HUD 从“固定一条 MAP-01 铺线”扩到“可切换候选链路并执行当前候选”，覆盖 `MAP-02` 省内链路与 `CITY-START -> CITY-MAP02-01` 跨区 trunk，更长地图链路已能直接试玩 | `docs/design/data/vertical-slice-v0/regions.json` `src/sim/config/*.ts` `src/modules/screenRegion.ts` `src/app/regionHudController.ts` `src/app/clientHudCapabilities.ts` `src/app/clientHudDisplay.ts` `src/app/cocosClientExports.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `client/cocos/assets/scripts/loadConfigFromResources.ts` `scripts/sync-client-assets.mjs` `client/cocos/assets/resources/config/v0/regions.json*` `tests/modules/screenRegion.test.ts` `tests/app/regionHudController.test.ts` `tests/app/clientHudCapabilities.test.ts` `tests/app/clientHudDisplay.test.ts` `tests/sim/configBundle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-19 | 仓库决断：Cocos Creator `.meta` 属于资源 UUID/导入元数据，项目内应随资源一并入库；补提交流水里遗漏的 `technology_config.json.meta`，避免配置资源目录继续半套入库 | `client/cocos/assets/resources/config/v0/technology_config.json.meta` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 无需额外测试；仅补齐资源元数据入库 |
| 2026-06-19 | `FAST-01` 公司经营第三批可玩链路子步：公司页/HUD 从“固定申请首个已解锁贷款”扩到“显示当前贷款候选、切换候选并按当前候选申请”，与科技/区域 HUD 交互模式对齐；同时补候选摘要文案与 Cocos 按钮显隐，避免有在贷时继续暴露申请入口 | `src/app/companyHudController.ts` `src/app/clientHudDisplay.ts` `src/app/cocosClientExports.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/i18n/messages/*` `tests/app/companyHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-19 | `FAST-01` 城市经营第四批可玩链路子步：城市页/HUD 从“固定只造风电”扩到“显示建造候选、切换候选并按当前候选建造”，把光伏/火电/水电/核电接入开发 HUD；同时在 `dispatch` 补齐建造前置校验，拦截未点亮科技、无河流水电、非核电资格城市与单城超上限建造 | `src/sim/config/configRepo.ts` `src/sim/core/dispatch.ts` `src/app/cityHudController.ts` `src/app/clientHudCapabilities.ts` `src/app/clientHudDisplay.ts` `src/app/clientHudSmoke.ts` `src/app/cocosClientExports.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/i18n/messages/*` `tests/sim/settle.test.ts` `tests/app/cityHudController.test.ts` `tests/app/clientHudCapabilities.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-19 | `FAST-01` 大地图第五批可玩概览子步：新增 `screen_world_map` 运行时快照，把区域解锁、主干线进度和下一解锁阈值接入开发 HUD；同时把 Cocos 开发 HUD 底部导航扩到“公司 / 区域 / 大地图 / 科技”四个主标签，让 demo 具备全局地图进度感 | `src/modules/screenWorldMap.ts` `src/modules/gameContext.ts` `src/app/gameApp.ts` `src/app/screenNavController.ts` `src/app/clientHudDisplay.ts` `src/app/cocosClientExports.ts` `src/ui/gameShell.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/i18n/messages/*` `tests/modules/screenWorldMap.test.ts` `tests/app/clientHudDisplay.test.ts` `tests/app/screenNavController.test.ts` `tests/ui/gameShell.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` |
| 2026-06-19 | `FAST-01` 大地图第六批入口闭环子步：把 `screen_world_map` 从只读概览补成可切换目标并进入对应区域/城市的最小地图入口；同时给导航状态补 `regionId` 上下文，让区域页按当前省份显示候选链路与 trunk 目标，Cocos HUD 新增“切换地图/进入候选”按钮并同步中英文本地化 | `src/app/worldHudController.ts` `src/modules/screenRegion.ts` `src/modules/gameContext.ts` `src/app/gameApp.ts` `src/app/screenNavController.ts` `src/app/clientHudDisplay.ts` `src/app/clientHudCapabilities.ts` `src/app/clientHudSmoke.ts` `src/app/regionHudController.ts` `src/app/cocosClientExports.ts` `src/ui/types.ts` `src/ui/gameShell.ts` `src/ui/gameSceneBridge.ts` `client/cocos/assets/scripts/CityHudPanel.ts` `src/i18n/messages/*` `tests/app/worldHudController.test.ts` `tests/modules/screenRegion.test.ts` `tests/app/screenNavController.test.ts` `tests/app/regionHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-21 | `FAST-01` 大地图第七批经营门槛子步：把外省“等级解锁”和“可经营激活”拆开，MAP-02 城市必须在跨区 trunk 完工后才写入运行态并开放建造；区域 HUD 未接通外省时只显示跨区主干候选，接通后再显示省内铺线候选 | `src/sim/core/settleNextMonth.ts` `src/sim/core/dispatch.ts` `src/modules/screenRegion.ts` `src/app/cityHudController.ts` `tests/sim/settle.test.ts` `tests/modules/screenRegion.test.ts` `tests/app/cityHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-21 | `FAST-01` 后半程试玩扩张子步：补齐贷款档位等级门槛真理层；把公司 IV 级门槛从占位态拉回可达区间，并为 `MET-A` 与 `MAP-03~05` 补最小城市样板；世界地图现已可在 III 级直开 `MET-A` 都市，并在 IV 级进入新增省壳继续铺 trunk / 省内链路 | `src/sim/core/dispatch.ts` `docs/design/data/vertical-slice-v0/company_levels.json` `docs/design/data/vertical-slice-v0/cities.json` `docs/design/data/vertical-slice-v0/README.md` `docs/design/data/vertical-slice-v0/manifest.json` `tests/modules/screenCompany.test.ts` `tests/modules/screenWorldMap.test.ts` `tests/modules/screenRegion.test.ts` `tests/app/worldHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm test` `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-21 | `FAST-01` V 级扩图子步：把公司 V 级门槛从循环依赖态拉回可达区间，补齐 `MAP-06~08` 与 `MET-B` 最小城市样板并同步到客户端资源；世界地图与区域页现已支持 V 级省份 trunk-first 试玩，`MET-B` 也可作为都会直达入口打开 | `docs/design/data/vertical-slice-v0/company_levels.json` `docs/design/data/vertical-slice-v0/regions.json` `docs/design/data/vertical-slice-v0/cities.json` `docs/design/data/vertical-slice-v0/README.md` `docs/design/data/vertical-slice-v0/manifest.json` `client/cocos/assets/resources/config/v0/company_levels.json` `client/cocos/assets/resources/config/v0/regions.json` `client/cocos/assets/resources/config/v0/cities.json` `tests/sim/settle.test.ts` `tests/modules/screenWorldMap.test.ts` `tests/modules/screenRegion.test.ts` `tests/app/worldHudController.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm test` `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-21 | `FAST-01` 经营科技生效子步：把 `eng_bulk_procure` / `eng_ops_contract` / `eng_risk_reserve` / `eng_green_pr` 接入真实建造与月结效果；城市 HUD 现会显示集中采购后的折后造价，灾害减损 / 运维减负 / 纯绿城社会价值加成也已进入模拟层，顺手修正了 `storage_system_2/3` 误触发储能倍率的问题 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `src/sim/systems/debuff.ts` `src/app/cityHudController.ts` `tests/sim/settle.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm test` `cmd.exe /c npm run build` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `FAST-01` 电网科技生效子步：把 `grid_regional` 从配置占位推进为真实铺线成本折扣；`queue_grid_link` 现在按已点亮电网科技计算成本，区域快照与 HUD 会显示折后候选线路成本，点亮后基础铺线从 8 资金降至 6 资金 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/dispatch.ts` `src/sim/index.ts` `src/modules/screenRegion.ts` `src/app/regionHudController.ts` `src/app/clientHudDisplay.ts` `src/i18n/messages/*` `tests/sim/settle.test.ts` `tests/modules/screenRegion.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `FAST-01` 主干电网科技扩张子步：新增 `grid_backbone` 并把铺线成本从“统一价”细化为“区域线 / 主干线分别计算”；`grid_regional` 只影响省内链路，`grid_backbone` 只影响 trunk，区域快照、开发 HUD 与真实扣费现在都会按候选链路类型显示 8→6 的对应折扣 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/dispatch.ts` `src/modules/screenRegion.ts` `src/app/regionHudController.ts` `tests/sim/settle.test.ts` `tests/modules/screenRegion.test.ts` `tests/modules/screenTechTree.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | 仓库格式约束补齐：新增根目录 `.editorconfig`，并把“默认 UTF-8 + LF、脚本文件保留 CRLF、避免顺手改无关格式”写回协作规则与会话约束；同时把 `.editorconfig` / `.gitattributes` 也纳入 `.gitattributes` 固定为 LF，降低 Windows 环境下的假脏与整段红绿 diff 噪音 | `.editorconfig` `.gitattributes` `AGENTS.md` `docs/design/engineering/codex-project-rules.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅工程/文档约束整理，无需跑测试 |
| 2026-06-22 | `FAST-01` 后半程科技树与城市建造等级子步：补齐 `wind/solar/thermal/hydro` III～V、`storage_system_2/3` 与 `nuclear_2/3` 节点；同时把“科技点亮 → 城市 HUD 候选升到当前最高 tier → 建造与已完工机组自动同步 tier”这条链路接通，让后半程科技直接反映到建造与供能压力 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/dispatch.ts` `src/sim/core/settleNextMonth.ts` `src/app/cityHudController.ts` `tests/sim/settle.test.ts` `tests/modules/screenTechTree.test.ts` `tests/app/cityHudController.test.ts` `tests/app/clientHudDisplay.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `FAST-01` 核电后续经营分叉子步：新增 `nuclear_ops`，并把 modifier 运维效果从“只有全局运维”扩展为“全局运维 + 指定机组运维”叠加；V 级后核电路线现在能通过核电运维规程单独降低核电月运维，而不影响风电等其它机组 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `FAST-01` 储能科技口径收口：按 `04-energy-supply` / `07-tech` / `technology-tree` 恢复“仅 `storage_system_1` 提供 `storage_mult = 2`，`storage_system_2/3` 只做 IV/V tier 闸门”；同时补配置测试，锁住 `storage_system_2/3` 不得再携带 `storage_mult` 字段 | `docs/design/data/vertical-slice-v0/technology_config.json` `client/cocos/assets/resources/config/v0/technology_config.json` `src/sim/core/technologyEffects.ts` `src/sim/core/settleNextMonth.ts` `tests/sim/settle.test.ts` `tests/sim/configBundle.test.ts` `docs/design/engineering/PROJECT-TASK-BOARD.md` | `cmd.exe /c npm run build` `cmd.exe /c npm test` `cmd.exe /c npm run lint:boundaries` `cmd.exe /c npm run build:client` `cmd.exe /c npm run verify:client` 通过 |
| 2026-06-22 | `OPS-01` 规则收紧：把“项目落地必须遵从设计文档；若发现文档错漏、冲突或更优方案，必须先停下来与用户核对，不允许擅自发挥违背设计文档”写入 `AGENTS.md` 与 `codex-project-rules.md`，作为后续 Agent 默认硬约束 | `AGENTS.md` `docs/design/engineering/codex-project-rules.md` `docs/design/engineering/PROJECT-TASK-BOARD.md` | 仅文档/规则整理，无需跑测试 |

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
| 1.11.0 | 2026-06-19 | 补记 `FAST-01` 地图第二批可玩链路子步：区域 HUD 支持切换并执行 `MAP-02` / trunk 候选链路，`regions.json` 正式接入运行时与客户端配置 |
| 1.12.0 | 2026-06-19 | 补记仓库决断：Cocos `.meta` 作为项目资源元数据保留入库，并补齐 `technology_config.json.meta` |
| 1.13.0 | 2026-06-19 | 补记 `FAST-01` 公司经营第三批可玩链路子步：公司 HUD 支持贷款候选切换与按当前候选申请 |
| 1.14.0 | 2026-06-19 | 补记 `FAST-01` 城市经营第四批可玩链路子步：城市 HUD 支持建造候选切换与按当前候选建造，并补齐核心建造前置校验 |
| 1.15.0 | 2026-06-19 | 补记 `FAST-01` 大地图第五批可玩概览子步：新增 `screen_world_map` 开发 HUD 页与四主标签导航 |
| 1.16.0 | 2026-06-19 | 补记 `FAST-01` 大地图第六批入口闭环子步：世界地图 HUD 支持切换并进入候选目标，区域页带 `regionId` 上下文显示对应省份链路 |
| 1.17.0 | 2026-06-21 | 补记 `FAST-01` 大地图第七批经营门槛子步：外省城市需跨区 trunk 完工后才激活为可经营城市 |
| 1.18.0 | 2026-06-21 | 补记 `FAST-01` 后半程试玩扩张子步：贷款档位补等级门槛，III→IV 试玩链路扩到 `MET-A` 与 `MAP-03~05` |
| 1.19.0 | 2026-06-21 | 补记 `FAST-01` V 级扩图子步：V 门槛可达，`MAP-06~08` 与 `MET-B` 进入可试玩配置包与客户端资源 |
| 1.20.0 | 2026-06-21 | 补记 `FAST-01` 经营科技生效子步：集中采购/运维外包/风险准备金/绿色品牌进入真实结算与 HUD 摘要 |
| 1.21.0 | 2026-06-22 | 补记 `FAST-01` 电网科技生效子步：`grid_regional` 降低真实铺线成本并显示到区域 HUD |
| 1.22.0 | 2026-06-22 | 补记 `FAST-01` 主干电网科技扩张子步：新增 `grid_backbone`，并按区域线 / 主干线分别计算科技折扣 |
| 1.23.0 | 2026-06-22 | 补记仓库格式约束补齐：新增 `.editorconfig`，并把行尾/最小 diff 约束写回协作规则 |
| 1.24.0 | 2026-06-22 | 补记 `FAST-01` 后半程科技树与城市建造等级子步：扩展 III～V 科技节点，并接通最高 tier 建造与已完工机组自动同步 |
| 1.25.0 | 2026-06-22 | 补记 `FAST-01` 核电后续经营分叉子步：新增 `nuclear_ops`，支持指定机组运维 modifier |
| 1.26.0 | 2026-06-22 | 误记 `storage_system_2/3` 进入真实供能倍率结算；该口径已在 `1.27.0` 按设计文档更正 |
| 1.27.0 | 2026-06-22 | 补记 `FAST-01` 储能科技口径收口：恢复 `storage_system_2/3` 仅作 tier 闸门，并补配置防回归测试 |
| 1.28.0 | 2026-06-22 | 补记 `OPS-01` 规则收紧：新增“实现必须遵从设计文档，发现错漏或更优方案需先与用户核对”硬约束 |
| 1.29.0 | 2026-06-22 | 补记 `FAST-01` 生态改造经营分叉子步：`eco_thermal` / `eco_nuclear` 进入真实 ECO 同步与结算链路 |
| 1.30.0 | 2026-06-22 | 补记 `FAST-01` 后半程资源禀赋差异子步：城市风/光/水 rich 标签进入 M4 真实供能乘区 |
