# 数值、成就与商业化配置规划

## 1. 文档定位

本文档只讨论数据配置层：
- 数值表怎么拆
- 应该做成哪些文件
- 成就和负责人系统如何配置
- 行业里更稳妥的落地方式是什么

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
- 抽卡记录
- 付费订单

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
  event_pool.xlsx
  achievements.xlsx
  directors.xlsx
  gacha_pool.xlsx
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
  event_pool.json
  achievements.json
  directors.json
  gacha_pool.json
```

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
- `unlock_company_level`

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

### 4.4 电网配置表 `grid_links`
建议字段：
- `link_type`
- `name`
- `fixed_power_loss`
- `build_cost_total`
- `build_months`
- `unlock_tech_id`

建议首版固定值：
- 区域链路：`1MW`
- 主干链路：`1GW`

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
- `unlock_social_value`

### 4.8 事件池表 `event_pool`
建议字段：
- `event_id`
- `name`
- `event_type`
- `duration_months`
- `trigger_rule`
- `effect_type`
- `effect_value`
- `flavor_text`

## 5. 社会价值数值结构

建议每个区域的社会价值在数据层拆成：
- `base_social_value`
- `supply_value_cap`
- `green_value_cap`

推荐规则：
- `supply_value_cap = base_social_value * 0.8`
- `green_value_cap = base_social_value * 0.2`

示例：
- 农村：100 -> 80 + 20
- 小城市：500 -> 400 + 100
- 大城市：3000 -> 2400 + 600

这样能直接表达：
- 未配环保火电满供只能拿到 80%
- 清洁供能或带环保火电可以吃满 100%

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

年度报告建议汇总以下数据：
- 年度总建设费用
- 年度总研发费用
- 年度总运营费用
- 年度总收入
- 年度净结果
- 年度新增社会价值
- 年度新增清洁供能社会价值
- 被竞争公司夺走或夺回的区域

## 8. 成就配置

### 8.1 建议做成独立表 `achievements`
建议字段：
- `achievement_id`
- `name`
- `description`
- `category`
- `condition_type`
- `condition_value`
- `reward_type`
- `reward_value`
- `icon_id`

### 8.2 成就分类建议
- 科技类
- 经营类
- 地图类
- 挑战类
- 隐藏类

### 8.3 你已经提出的成就可直接入表
- `璀璨的放射`
  - 条件：完成核电站关键科技研发
- `卖油的娘子水梳头`
  - 条件：连续 12 个月资金低于某阈值
- `两都一十三区`
  - 条件：全地图所有区域建立供能覆盖

### 8.4 成就数值建议
成就奖励不要给强数值。

建议只给：
- 头像框
- 称号
- 图鉴点亮
- 小额非核心资源

原因：
- 成就应服务于目标感和回放价值
- 不应绑架主经营平衡

## 9. 战略支撑负责人系统配置

### 9.1 配置表 `directors`
建议字段：
- `director_id`
- `name`
- `rarity`
- `class_type`
- `base_effect_type`
- `base_effect_value`
- `star_cap`
- `shard_required`
- `exclusive_tag`

### 9.2 稀有度
当前建议保留三档：
- A
- S
- SSS

### 9.3 类型
- 建设
- 科研
- 财务

### 9.4 升星规则
- A：最高 5 星
- S：最高 4 星
- SSS：最高 3 星

建议数据表达：
- A 和 S 只能用本体升星
- SSS 可用本体或碎片合成

### 9.5 SSS 碎片规则
建议：
- `5` 个 SSS 碎片合成 1 个 SSS 负责人

原因：
- 门槛足够低，玩家有明确积累感
- 不会把系统做得过重

## 10. 抽卡池配置

### 10.1 配置表 `gacha_pool`
建议字段：
- `pool_id`
- `item_type`
- `item_id`
- `rarity`
- `weight`
- `is_pity_target`

### 10.2 卡池规则建议
- 10 抽保底 1 个 S 或以上
- 50 抽保底 1 个 SSS 本体

### 10.3 概率建议
这里给一个可执行的首版方案：
- A 级本体：84%
- S 级本体：10%
- SSS 碎片：5%
- SSS 本体：1%

这样满足两个目标：
- SSS 碎片概率约为 S 的一半
- 常规抽取中仍保留直接出 SSS 的极小概率

### 10.4 十连与付费对应
用户提出的方向可以直接保留：
- 10 元 = 10 抽

这部分是商业决策，不属于玩法平衡本体，但要在配置层独立出来，方便后续调整。

## 11. 首充礼包配置

建议做成独立表 `first_purchase_offers`。

建议字段：
- `offer_id`
- `price`
- `reward_type`
- `reward_value`
- `extra_slot`
- `ad_free`

可录入的首版方案：
- 6 元：S 级负责人
- 30 元：SSS 级负责人 + 负责人栏位 +1
- 60 元：免广告 + SSS 级负责人 + 负责人栏位 +1

## 12. 为什么建议“文件夹 + 多张表”，而不是一个大文件

原因很直接：
- 区域、设施、科技、事件、成就、卡池不是一个维度的数据
- 全塞进一个表，后期必然不可维护
- 分表后逻辑清晰，程序导出也简单

所以当前最稳妥的行业做法是：
- 设计层：一个配置文件夹
- 每个系统一张表
- 构建时导出为 JSON

## 13. 当前结论

当前阶段建议你把数值与配置工作落成：
- 一个 `design-data/` 文件夹
- 10 张左右 Excel 配置表
- 程序端统一导出 JSON

其中三张最优先：
- `technology_tree.xlsx`
- `facility_config.xlsx`
- `region_base.xlsx`

因为这三张表决定了：
- 玩家能建什么
- 建设花多少钱
- 地图差异是否成立
