# 设计文档重建 · 任务列表

> **用法**：从上到下执行；每项设计为 **1 次对话** 可完成的工作量。  
> **协作**：人与 Agent 从 **T02** 起逐项敲定；T01 由 Agent 按 [`META.md`](./META.md) 自行完成。  
> **原则**：只迁当前任务所需内容；旧 `docs/` 不删不改，直到新稿 `locked` 后再归档。  
> **审核**：暂不设独立审核流程。

**状态图例**：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 已完成 · `[-]` 跳过/合并

---

## 阶段 0 · 基础设施（本阶段）

| ID | 状态 | 任务 | 产出物 | 依赖 |
|----|------|------|--------|------|
| T00 | [x] | 建立 `docs/design/` 目录与本任务列表 | 本文件、`README.md` | — |
| T01 | [x] | **文档规范**：命名、front matter 模板、Feature/UI Spec 统一小节模板 | [`META.md`](./META.md) | T00 |

---

## 阶段 1 · GDD 层（玩法真理源）

> 目标：一份可读、可引用的 GDD 套件，取代臃肿的 `game-core-design.md` 单文件。

| ID | 状态 | 任务 | 产出物 | 主要摘录来源 | 依赖 |
|----|------|------|--------|--------------|------|
| T02 | [x] | **愿景与边界**：定位、保留/舍弃清单、设计目标、平台范围 | `gdd/00-vision.md` | 旧 GDD §1–2、§19；整合摘要「设计支柱」 | T01 |
| T03 | [x] | **核心循环与时间**：四层结构总览、月度推进、自动结算清单、关键节点弹出规则 | `gdd/01-core-loop.md` | 旧 GDD §3（总览）、§4–5 | T02 |
| T04 | [x] | **资源与经济**：资金用途、建设按月扣费/工期、地理成本、化石能源标签 | `gdd/02-economy.md` | 旧 GDD §6–7 | T02 |
| T05 | [x] | **社会价值与公司等级**：月度重算公式、扣减、等级只升不降、区域解锁 | `gdd/03-social-value.md` | 旧 GDD §8–9 | T04 |
| T06 | [x] | **供能与能源类型**：供能满足率、有效供能因素、风/光/火电环保规则 | `gdd/04-energy-supply.md` | 旧 GDD §10–11 | T04 |
| T07 | [x] | **地图与建设位**：2都8区、区域差异化、建设位策略意义 | `gdd/05-map-and-slots.md` | 旧 GDD §12–13 | T02 |
| T08 | [x] | **电网**：区域内/主干、固定损耗、战略工程、特高压前置 | `gdd/06-grid.md` | 旧 GDD §14 | T06, T07 |
| T09 | [x] | **科技研发**：规模原则、付费/取消规则、并行、重大节点列表 | `gdd/07-tech.md` | 旧 GDD §15 + `tech-tree-design.md` 原则部分 | T05 |
| T10 | [x] | **事件系统**：定位、作用维度、正负示例、与 UI 入口关系 | `gdd/08-events.md` | 旧 GDD §16 | T03 |
| T11 | [x] | **公司经营与商业化**：公司界面快照、贷款梯度、岗位/IAP/激励广告 | `gdd/09-year-end-and-monetization.md` | 旧 GDD §17–18 | T04, T05 |
| T11b | [x] | **重玩性与经营方针（locked）**：四方针、两难度、lit 预算、灾害战役通关、破产 | `gdd/11-replayability.md` | 用户 2026-05-23～24 | T03, T07, T08, T10 |
| T11a | [x] | **新手引导与教程**：教学方针关卡、8 步遮罩、可跳过/重玩/打勾 | `gdd/10-onboarding.md` | 旧 GDD 零散 UI 提示 + 与用户共定 | T02, T03 |
| T12 | [x] | **GDD 索引页**：各章链接、术语指向、与 Feature Spec 映射表 | `gdd/README.md` | 全文校对 | T02–T11, T11a, T11b |

---

## 阶段 2 · Feature Spec 层（可验收功能）

> 目标：每个系统一份规格，实现与测试可直接对照；规则细节 **引用 GDD 章节**，不重复大段叙述。

| ID | 状态 | 任务 | 产出物 | 依赖 GDD |
|----|------|------|--------|----------|
| T13 | [x] | **全局**：游戏状态机、命令枚举（玩家可发起的操作）、`下一月` 结算管道步骤表 | `features/00-game-state.md` | §01 |
| T14 | [x] | **地区主界面**：进入条件、顶栏、主区、悬浮按钮、`下一月` | `features/region-main.md` | §01, §03 |
| T15 | [x] | **设施建设**：选址、造价/工期、在建队列、完工生效、拆除（若有） | `features/construction.md` | §02, §04, §05 |
| T16 | [x] | **供能计算**：月度重算输入输出、有效供能修正项、满足率展示 | `features/supply-calculation.md` | §04, §06 |
| T17 | [x] | **社会价值结算**：分地区公式、公司汇总、扣减、等级检视 | `features/social-value-settlement.md` | §03 |
| T18 | [x] | **公司管理**：经营快照、近月流水、借贷、岗位、等级进度 | `features/company-management.md` | §03, §09 |
| T19 | [x] | **全国大地图**：选区、解锁/灰显、战略工程入口、联通展示 | `features/world-map.md` | §05, §06 |
| T20 | [x] | **区域电网与主干**：建链、损耗、接入条件、跨区限制 | `features/grid-network.md` | §06 |
| T21 | [x] | **科技树**：研发流程、取消返还、并行、解锁效果挂载点 | `features/tech-tree.md` | §07 |
| T22 | [x] | **事件**：实例生命周期、倒计时、效果类型、与结算顺序 | `features/events.md` | §08 |
| T23 | [-] | ~~年度战略~~ → **合并 T18**（无年报） | — | §09 |
| T24 | [x] | **商业化**：激励广告三类、10 次/局、CFO/工程总监 IAP | `features/monetization.md` | §09 |
| T24a | [x] | **新手引导**：引导步骤 ID、触发条件、完成/跳过、存档标记 | `features/onboarding.md` | `gdd/10-onboarding.md` |
| T25 | [x] | **Feature 索引**：系统列表、优先级（MVP / 后续）、GDD 交叉引用 | `features/README.md` | T13–T24, T24a |

---

## 阶段 3 · UI Spec 层（界面与交互）

| ID | 状态 | 任务 | 产出物 | 依赖 |
|----|------|------|--------|------|
| T26 | [x] | **屏幕地图**：全屏 ID 列表、层级、入口/出口、对应 Feature | `ui/00-screen-map.md` | T25 |
| T27 | [x] | **地区主界面** 线框 + 组件树 + 交互表 | `ui/region-main.md` | T14, T26 |
| T28 | [x] | **全国大地图** | `ui/world-map.md` | T19, T26 |
| T29 | [x] | **公司管理 / 社会价值明细** | `ui/company.md` | T18, T26 |
| T30 | [x] | **建设流程**（选型、确认、在建列表） | `ui/construction-flow.md` | T15, T26 |
| T31 | [x] | **科技树界面** | `ui/tech-tree.md` | T21, T26 |
| T32 | [x] | **事件面板与事件弹窗** | `ui/events.md` | T22, T26 |
| T33 | [-] | ~~年度战略 / 年报~~ → **合并 T29** | — | T18, T26 |
| T34 | [x] | **关键节点插画/弹窗**（升级、竣工、供能 100% 等） | `ui/milestones.md` | T03, T26 |
| T35a | [x] | **新手引导 UI**：遮罩、高亮、手指提示、步骤条、跳过确认 | `ui/onboarding.md` | T24a, T26 |
| T35 | [x] | **UI 索引**：微信小游戏安全区、通用组件（顶栏、按钮、Toast 策略） | `ui/README.md` | T26–T35a |

---

## 阶段 4 · Data 层（配置与样例）

| ID | 状态 | 任务 | 产出物 | 主要摘录来源 | 依赖 |
|----|------|------|--------|--------------|------|
| T36 | [x] | **配置总览**：目录约定、Excel→JSON 流程、表清单 | `data/README.md` | `balance-data-structure.md` §2–3 | T12 |
| T37 | [x] | **核心表字段说明**（region / facility / company_level / event 等） | `data/schemas/*.md` | `balance-data-structure.md` §4+ | T36 |
| T38 | [x] | **科技树配置说明** + 与 `gdd/07-tech` 对齐的节点表结构 | `data/technology-tree.md` | `tech-tree-design.md` | T09, T37 |
| T39 | [x] | **垂直切片数据包**：范围随 T41 共定；占位数值 | `data/vertical-slice-v0/` | 策划待定 | T37, T25, **T41** |
| T40 | [x] | **数据验收清单**：缺省值、ID 规范、与 Feature 字段对齐检查表 | `data/CHECKLIST.md` | — | T37–T39 |

---

## 阶段 5 · Code 层（工程与实现接口）

| ID | 状态 | 任务 | 产出物 | 主要摘录来源 | 依赖 |
|----|------|------|--------|--------------|------|
| T41 | [x] | **垂直切片范围（Playable v0）**：必做系统、明确不做、体验目标（**与用户共定**） | `engineering/vertical-slice-v0.md` | — | T25 |
| T42 | [x] | **技术选型定稿**：引擎、语言、目录结构、配置加载方式 | `engineering/stack.md` | `technical-and-tooling-plan.md` | T41 |
| T43 | [x] | **模块划分与依赖**：core / config / ui / modules 边界 | `engineering/architecture.md` | 同上 | T42 |
| T44 | [x] | **模拟层接口**：GameState、月度结算函数签名、单测策略 | `engineering/simulation-api.md` | Feature 00、supply、social-value | T13, T16, T17, T43 |
| T45 | [x] | **实现里程碑**：v0 编码任务拆条（供 Agent 逐对话执行） | `engineering/IMPLEMENTATION-TASKS.md` | — | T41–T44, T39 |

---

## 阶段 6 · 收尾

| ID | 状态 | 任务 | 产出物 | 依赖 |
|----|------|------|--------|------|
| T46 | [x] | **旧文档归档说明**：哪些已 superseded、只读参考路径 | `docs/design/LEGACY.md` | 全部 GDD/Feature/UI locked |
| T47 | [-] | **（可选）** 删除或移动旧 `docs/*.md` 至 `docs/archive/` | 用户确认后执行（本仓库无可迁移旧文件，按不适用跳过） | T46 |

---

## 建议的对话节奏

| 里程碑 | 包含任务 | 大约对话次数 |
|--------|----------|--------------|
| M1 能写 GDD | T02–T12, T11a | 12 |
| M2 能开工 Feature | T13–T25, T24a | 14 |
| M3 能画 UI / 原型 | T26–T35, T35a | 11 |
| M4 能灌表 | T36–T40 | 5 |
| M5 能写代码 | T41–T45 | 5 |
| M6 旧档退役 | T46–T47 | 1–2 |

**Playable v0** 范围在 **T41** 与你共定后再写进 `engineering/vertical-slice-v0.md` 与 `data/vertical-slice-v0/`；此前不在任务列表中写死「单区域 / 无事件」等假设。

编码启动时机（参考，非硬性）：GDD 索引 + 核心 Feature + 主界面 UI + T41 定稿 + 切片数据包就绪后，可启动 v0 实现（细节见 T45）。

---

## 已确认决策（2026-05-19）

| 项 | 决策 |
|----|------|
| 任务粒度 | 一项 = 一次对话 |
| GDD 拆分 | 保持 T02–T11 十个主题文件，不合并 |
| 新手引导 | **必须**；GDD **T11a** + Feature **T24a** + UI **T35a** |
| Playable v0 | **T41 已定稿**（`engineering/vertical-slice-v0.md`）；数据占位 `data/vertical-slice-v0/` |
| 审核 | 暂不使用 |
| 协作起点 | **T02**（T01 已完成） |
| T10 `08-events` | **locked**（v0.3.0）：四类效果、≤3 并发、等级缩放、灾害考试 |
| T11b `11-replayability` | **draft**（v0.6.0）：meta **% 建设 / 水电高 mult+核电**；科技 **80→60%、−1～−3 月** |
| T11 `09-year-end-and-monetization` | **locked**（v1.0.0）：工程总监、3 在建、单研发队列、激励 **10 次/局**（免广告不追加） |
| T05 `03-social-value` | **locked**（v1.0.0）：满足率×环保系数；M9 覆盖可降；MAP 解锁；无 80/20 双轨 |
| T11a `10-onboarding` | **locked**（v1.0.0）：教学方针独立关、7 步遮罩、完成打勾、四方针无遮罩 |
| 破产 / 重玩性 | **T11b 已写初稿**；具体整数表留 T37 |
| Playable v0 方针/难度 | 首版可仅 **1 方针 + 1 难度**；架构预留 `doctrine` / `difficulty` 字段 |
| 当前推进重心（2026-05-28） | **先 coding 后数值**：优先完成核心架构与可玩闭环（T45 P0 / M0-M8）；数值调优转为“主体可玩后”再集中迭代 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-19 | 初版任务列表（T00 完成） |
| 2026-05-19 | 用户确认决策；新增 T11a / T24a / T35a；T01 完成；Playable v0 改为 T41 共定 |
| 2026-05-22 | T06 完成：`gdd/04-energy-supply.md` 初稿 |
| 2026-05-22 | T07 完成：`gdd/05-map-and-slots.md` 初稿（2都8区、建设位、占位清单） |
| 2026-05-22 | T08 完成：`gdd/06-grid.md` v0.4.0（并网岛、线损尺度、特高压门控、超级水电节点） |
| 2026-05-22 | T08 修订：IV 级可铺主干+特高压前线损；科技完成自动升档；设施科技同步（05/04/META） |
| 2026-05-22 | T09 完成：`gdd/07-tech.md` AoE2 式科技树、解锁/点亮、绿色与储能闸门 |
| 2026-05-22 | T09 修订：四线·I～V、储能卡档、减压科技；III=1都2区；04 储能出力 |
| 2026-05-22 | T07/05：可经营区大地图连通；网状邻接 MAP-01～08 |
| 2026-05-23 | T10 完成：`gdd/08-events.md` 初稿（大理石式起伏、M11、UI 入口、eng_risk_reserve） |
| 2026-05-23 | T10 修订 v0.2.0：四类效果、≤3 并发、等级缩放、灾害考试与失败导向 |
| 2026-05-23 | T10 **locked**（`gdd/08-events.md` v0.3.0）；破产/重玩性留待下轮 |
| 2026-05-24 | T11b 初稿：`gdd/11-replayability.md`；02 整数资金+破产；07 lit 预算；08 灾害战役 |
| 2026-05-24 | T11b v0.1.1：lit=14、风光开局 storage_system+storage_system_1；META 配置可写 %、结算取整 |
| 2026-05-26 | T11 **locked**（`gdd/09-year-end-and-monetization.md` v1.0.0）；07-tech 移除 `eng_fast_build` |
| 2026-05-26 | T05 **locked**（`gdd/03-social-value.md` v1.0.0） |
| 2026-05-26 | T11a 进行中：`gdd/10-onboarding.md` v0.1.0 初稿 |
| 2026-05-26 | T11a v0.2.0：8 步、遮罩独占、仅 tech 方针强制链 |
| 2026-05-26 | T11a v0.3.0：独立「教学」方针关卡、完成打勾、四方针无遮罩 |
| 2026-05-26 | T11a **locked**（`gdd/10-onboarding.md` v1.0.0） |
| 2026-05-26 | T11b v0.2.0：用户确认 E/B；固定灾害术语与 10 场月表；起始资金；08-events 术语同步 |
| 2026-05-26 | T11b v0.3.0：研发 50%；4 场/72 月、12 月预警；熟练度上限 3；备考加重不单独判负 |
| 2026-05-26 | T11b v0.4.0：熟练度 3 才研发 50%/-1；meta 四路线定稿；终局 84 月 |
| 2026-05-26 | T11b v0.5.0：L1 核心 meta、线性步长；灾害参差月表、按 tier 预警 |
| 2026-05-26 | T11b v0.6.0：风光/化石 **%** 建设减免；科技 80→60%、−1～−3 月；水电核电线+高 mult |
| 2026-05-27 | T11b v0.6.3：储能科技 `tech_id` 统一为 `storage_system_1～3`（与 07/04/08 对齐） |
| 2026-05-27 | T11b **locked**（`gdd/11-replayability.md` v0.6.3） |
| 2026-05-27 | T37 完成：新增 `data/schemas/` 核心字段说明（region/city、facility/grid、company/run、events/campaign、doctrine_meta） |
| 2026-05-27 | T38 完成：新增 `data/technology-tree.md`，定义 `technology_config` 字段、储能系统 ID 约束与校验清单 |
| 2026-05-27 | T37/T38 细化：`nuclear_2/3` 固定为单厂升 tier；灾害改现金+持续 debuff（收益/建造/科研）且不扣 SV；城市需求改四类范围档位 |
| 2026-05-27 | 地图架构调整：每省行政单位改为 **6–8**（且仅 1 中心城）；八省组合差异化；补充两都供能范围建议 |
| 2026-05-27 | T12 完成：`gdd/README.md` 索引、术语表、Feature/Data 映射 |
| 2026-05-27 | T13 完成：新增 `features/00-game-state.md`（状态机、命令枚举、M1–M14 结算表） |
| 2026-05-27 | T14 完成：新增 `features/region-main.md`（区域入口、组网操作、结算关系、验收） |
| 2026-05-27 | T15 完成：新增 `features/construction.md`（建设校验、分期扣费、在建/完工/取消） |
| 2026-05-27 | T16 完成：新增 `features/supply-calculation.md`（设施/电网/城市三层供能重算） |
| 2026-05-27 | T17 完成：新增 `features/social-value-settlement.md`（M9 汇总、M10 升级、只升不降） |
| 2026-05-27 | T18 完成：新增 `features/company-management.md`（经营快照、借贷、岗位、激励入口） |
| 2026-05-27 | T19 完成：新增 `features/world-map.md`（节点导航、灰显解锁、战略入口） |
| 2026-05-27 | T20 完成：新增 `features/grid-network.md`（区域/主干建链、线损档位、自动升档） |
| 2026-05-27 | T21 完成：新增 `features/tech-tree.md`（单队列研发、取消返还、效果挂载） |
| 2026-05-27 | T22 完成：新增 `features/events.md`（生命周期、M11 调度、固定灾害轴） |
| 2026-05-27 | T42 完成：新增 `engineering/stack.md`（微信小游戏 + 配置驱动模拟层；Unity 适配审稿结论） |
| 2026-05-27 | T43 完成：新增 `engineering/architecture.md`（core/config/ui/modules 边界与依赖矩阵） |
| 2026-05-28 | T44 完成：新增 `engineering/simulation-api.md`（GameState、dispatch/settleNextMonth、错误码、单测策略） |
| 2026-05-28 | T45 完成：新增 `engineering/IMPLEMENTATION-TASKS.md`（M0-M8 里程碑与 T45-01~16 编码拆条） |
| 2026-05-28 | T46 完成：新增 `LEGACY.md`（旧 docs 文档 superseded/reference 映射与使用规则） |
| 2026-05-28 | T47 跳过：仓库内无可迁移旧 `docs/*.md` 文件（归档迁移不适用） |
| 2026-05-28 | 用户确认阶段策略：先以 coding 健壮性与可玩闭环为第一优先，数值精调延后到主体架构搭好后集中进行 |
| 2026-05-28 | 新增项目级编码任务看板：`engineering/PROJECT-TASK-BOARD.md`（用于会话中断续航与实时进度记录） |
| 2026-05-28 | T45-06 阶段收口：新增 `queue_grid_link` 与 M2 链路完工，M4 改为按连通分岛分配供能；看板切换当前任务到 T45-07 |
| 2026-05-28 | T45-07 推进：新增 M10/M13/M14 边界回归用例（等级不降、破产重置、目标月胜利触发） |
| 2026-05-28 | T45-07 推进：`settleNextMonth` 新增配置守卫（最终灾害/破产阈值/目标月/等级表），并补 `config_missing` 异常路径测试 |
| 2026-05-28 | T45-07 推进：新增状态不变量校验（`state_invariant_broken`）与命令解锁防御（城市/科研），错误返回补充上下文字段 |
| 2026-05-28 | T45-07 推进：新增 `run_playable.blocked` 命令拦截与 `run_result` 命令拒绝回归测试，状态机异常路径继续收口 |
| 2026-05-29 | T45-07 推进：新增 `blocked` 白名单策略（仅 onboarding 命令放行），并补 blocked 放行/拒绝回归测试 |
