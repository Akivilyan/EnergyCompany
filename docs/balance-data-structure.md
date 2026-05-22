# 数值与商业化配置规划

## 1. 文档定位

本文档只讨论数据配置层：
- 数值表怎么拆
- 应该做成哪些文件
- 事件、公司等级、区域解锁与总监岗位（IAP）如何配置
- 行业里更稳妥的落地方式是什么

与 [`game-core-design.md`](./game-core-design.md) 对齐：**无成就系统**、**无抽卡**；社会价值**按月结算**；商业化**首发仅广告**，后续仅两档一次性买断礼包。

## 2. 推荐的配置管理方式

当前阶段不建议上数据库做玩法配置。

推荐方式：
- 设计阶段：`Excel`
- 版本管理：导出为 `JSON`
- 程序读取：从 `JSON` 加载

原因：
- 策划改表效率最高
- 微信小游戏足够轻
- 比数据库更容易调和审查

数据库只适合后续做：
- 用户存档
- 排行榜
- **付费订单 / IAP 解锁状态**（财务总监、技术总监、去广告等）
- 广告相关统计（若需要）

不适合用来承载静态玩法配置。

## 3. 建议的配置文件结构

建议后续把配置表拆成一个独立目录，例如：

```text
design-data/
  region_base.xlsx
  region_nodes.xlsx
  facility_config.xlsx
  grid_links.xlsx
  technology_tree.xlsx
  acquisition_targets.xlsx
  loan_tiers.xlsx
  company_level_thresholds.xlsx
  event_pool.xlsx
  executive_roles.xlsx
  iap_offers.xlsx
```

程序导出目录建议：

```text
assets/config/
  region_base.json
  region_nodes.json
  facility_config.json
  grid_links.json
  technology_tree.json
  acquisition_targets.json
  loan_tiers.json
  company_level_thresholds.json
  event_pool.json
  executive_roles.json
  iap_offers.json
```

**不纳入首版配置目录**：`achievements`、`gacha_pool`、多稀有度负责人收集表等（与当前玩法边界一致）。

## 4. 必要数值表

### 4.1 区域基础表 `region_base`
每个区域一行。

建议字段：
- `region_id`
- `name`
- `region_type`
- `is_metropolis`
- `base_social_value`
- `build_cost_modifier`
- `operation_cost_modifier`
- `fossil_energy_tag`
- `wind_tag`
- `solar_tag`
- `default_color`
- `unlock_company_level`（达到该**公司等级**后，本区方可进入**可经营**状态；具体区名与地图容量待定，见玩法文档第 9 章示例骨架）

### 4.2 区域节点表 `region_nodes`
描述区域内的中心城市、农村、边区单位。

建议字段：
- `node_id`
- `region_id`
- `name`
- `node_type`
- `base_demand_mw`
- `wind_slot_count`
- `solar_slot_count`
- `special_facility_slot_count`
- `is_core_city`

### 4.3 设施配置表 `facility_config`
每个设施一行。

建议字段：
- `facility_id`
- `name`
- `facility_type`
- `build_cost_total`
- `build_months`
- `monthly_build_cost`
- `monthly_operating_cost`
- `nominal_output_mw`
- `requires_environmental_module`
- `requires_storage`
- `unlock_tech_id`

### 4.4 电网线损常数 `grid_loss_config` + 链路表 `grid_links`

线损规则见 `docs/design/gdd/06-grid.md`。推导后 **取整** 写入配置：

```text
ordinary_city_reference_demand_mw = round( core_reference_demand_mw × ordinary_city_demand_ratio )
// ordinary_city_demand_ratio ∈ [1/3, 1/2]

loss_regional_mw  = round( ordinary_city_reference_demand_mw / 4 )
loss_backbone_mw  = round( ordinary_city_reference_demand_mw )
```

`grid_loss_config` 建议字段：`core_reference_demand_mw`、`ordinary_city_demand_ratio`、`ordinary_city_reference_demand_mw`、`loss_regional_mw`、`loss_backbone_mw`。

`grid_links` 建议字段：
- `link_type`（`regional` | `backbone`）
- `name`
- `loss_mw`（运行时从 `grid_loss_config` 按类型读取，或表内冗余取整值）
- `build_cost_total`
- `build_months`
- `unlock_tech_id`

### 4.5 科技树配置表 `technology_tree`
建议字段：
- `tech_id`
- `name`
- `branch`
- `tier`
- `research_cost_total`
- `research_months`
- `prerequisites`
- `unlock_type`
- `unlock_value`

### 4.6 收购目标表 `acquisition_targets`
建议字段：
- `target_id`
- `name`
- `category`
- `scale_tier`
- `buyout_cost`
- `effect_type`
- `effect_value`
- `unlock_company_level`

### 4.7 贷款表 `loan_tiers`
建议字段：
- `loan_id`
- `principal`
- `interest_rate_annual`
- `term_years`
- `unlock_company_level`
- `unlock_social_value`（可选，与等级阈值二选一或并用，由策划定）

### 4.8 公司等级阈值表 `company_level_thresholds`
与公司等级、区域解锁、贷款档位挂钩。

建议字段：
- `company_level`
- `cumulative_social_value_min`（累计社会价值达到此值且月度检视通过则升至该级；**只升不降**）
- `regions_unlocked_count` 或 `unlock_region_ids`（二选一：用数量由程序按表排序发放，或显式列出 `region_id` 列表；地图定稿后再填具体区名）
- `notes`（策划备注，不导出或导出时忽略）

### 4.9 事件池表 `event_pool`
与玩法文档第 16 章对齐：首版优先 **资金投入**、**资金收入**、**研发加快/减慢**；原材料、施工进度等慎用。

建议字段：
- `event_id`
- `name`
- `event_type`（如 `policy` / `market` / `disaster`）
- `duration_months`
- `trigger_rule`
- `effect_type`（如 `build_cost_mult`、`income_mult`、`research_months_delta`、`operating_cost_mult`、`one_time_cash` 等）
- `effect_value`
- `target_scope`（全局 / 指定能源类型 / 指定科技分支等，可选）
- `flavor_text`

## 5. 社会价值数值结构

建议每个区域的社会价值在数据层拆成：
- `base_social_value`
- `supply_value_cap`（= `base_social_value * 0.8`）
- `green_value_cap`（= `base_social_value * 0.2`）

**月度结算**（每次 `下一月` 后，对每个**已解锁可经营**地区）：
- `monthly_supply = supply_value_cap * current_supply_satisfaction_rate`
- `monthly_green = green_value_cap * clean_supply_ratio`

其中：
- `current_supply_satisfaction_rate`：当月供能满足率（0–1）
- `clean_supply_ratio`：清洁供能占比（未配环保火电不计入清洁）

当月公司社会价值增量 = 各已经营地区 `monthly_supply + monthly_green` 之和；允许为**负**（例如供能率骤降），累加到**累计社会价值**。

示例基准：
- 农村：100 → 80 + 20
- 小城市：500 → 400 + 100
- 大城市：3000 → 2400 + 600

这样能直接表达：
- 未配环保火电满供只能拿到约 80% 的理论上限
- 清洁供能或带环保火电可吃满 100%

**存档 / UI 建议额外字段**（运行时，非静态表）：
- `cumulative_social_value`
- `company_level`（历史最高等级，不随累计值回落而降级）
- `progress_to_next_level`（相对下一级阈值的进度，用于经验条展示）

## 6. 能源规则的数值落点

### 6.1 太阳能
需要在配置表中直接表达日照差异。

建议字段：
- `solar_efficiency_normal = 0.5`
- `solar_efficiency_rich = 0.75`
- `storage_bonus = 0.25`

### 6.2 火电环保
建议字段：
- `environmental_module_cost`
- `environmental_module_build_months`
- `counts_as_clean_supply = true/false`

### 6.3 化石能源标签
建议地区表中使用：
- `fossil_energy_tag = true/false`

效果：
- 火电月运营成本乘以地区修正系数

## 7. 年度经营数值

年度报告建议汇总以下数据（社会价值由 **12 次月度结算** 累加或按月列表展示）：
- 年度总建设费用
- 年度总研发费用
- 年度总运营费用
- 年度总收入
- 年度净结果
- **全年社会价值净变动**（供给 + 绿色分项可选）
- **各月社会价值明细**（可选列，便于复盘）

## 8. 总监岗位与 IAP 配置（后续版本）

首发无内购时，程序可仅用 `executive_roles` 定义**未购买时的 baseline**，或整表在 IAP 开放后再读。

### 8.1 岗位效果表 `executive_roles`
全游戏仅两个可购买岗位 + 无抽卡、无升星、无碎片。

建议字段：
- `role_id`（如 `cfo`、`cto`）
- `name`（财务总监、技术总监）
- `slot_key`（公司管理界面岗位键）
- `effect_type` / `effect_value`（可多行或 JSON 列表达多项加成）
- `requires_iap_offer_id`（空表示免费 baseline 或无此岗位）

能力方向（与玩法文档一致）：
- **财务总监**：贷款、收购、原材料、现金流相关
- **技术总监**：研发周期、研发费用相关（建设类是否并入技术总监或 baseline，待定）

### 8.2 买断礼包表 `iap_offers`
建议字段：
- `offer_id`
- `price_cny`
- `grant_role_id`（可空）
- `ad_free`（boolean）
- `repeatable`（首版两档均为 `false`，一次性买断）

首版规划录入（后续版本开放支付时启用）：
- `6` 元：解锁 **财务总监** 岗位
- `30` 元：解锁 **技术总监** 岗位 + **去广告**

**不配置**：60 元档、十连抽、卡池权重、保底、碎片合成、负责人稀有度与升星。

## 9. 为什么建议“文件夹 + 多张表”，而不是一个大文件

原因很直接：
- 区域、设施、科技、事件、等级阈值、IAP 不是一个维度的数据
- 全塞进一个表，后期必然不可维护
- 分表后逻辑清晰，程序导出也简单

所以当前最稳妥的行业做法是：
- 设计层：一个配置文件夹
- 每个系统一张表
- 构建时导出为 JSON

## 10. 当前结论

当前阶段建议把数值与配置工作落成：
- 一个 `design-data/` 文件夹
- 约 **10 张** Excel 配置表（无成就表、无抽卡表）
- 程序端统一导出 JSON

其中三张最优先：
- `technology_tree.xlsx`
- `facility_config.xlsx`
- `region_base.xlsx`（含 `unlock_company_level`；具体区名与解锁列表待地图定稿后填充）

其次建议尽早定稿：
- `company_level_thresholds.xlsx`（等级 ↔ 累计社会价值 ↔ 可经营区域）
- `event_pool.xlsx`（资金 / 收入 / 研发节奏三类为主）

因为上述表决定了：
- 玩家能建什么、花多少钱
- 地图与区域差异是否成立
- 每月社会价值与等级节奏是否可玩
- 事件能否提供足够的经营起伏
