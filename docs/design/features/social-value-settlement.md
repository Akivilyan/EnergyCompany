# 社会价值结算

## 1. 目标

定义 M9（社会价值重算）与 M10（公司升级检视）的可实现规则，确保社会价值、升级进度与地图/科技解锁的一致性。

## 2. 范围

- **包含**：按城结算公式、公司汇总、覆盖写入、升级判定、等级只升不降。
- **不包含**：公司界面布局与展示细节（T18/T29）、具体门槛整数配表（Data 层）。

## 3. 触发与入口

| 触发 | 时机 | 执行位置 |
|------|------|----------|
| `next_month` | M9：社会价值重算；M10：升级检视 | 月结管道 |

M9/M10 仅在月结执行，不允许玩家手动单独触发。

## 4. 前置条件

| 条件 | 说明 |
|------|------|
| M4 完成 | 已有每城 `satisfaction_rate_city`、`city_fully_eco_supply` |
| 可经营城市集合已确定 | 包含区内各城与都节点 |
| 公司等级与门槛表可用 | 需可读取 `social_value_threshold_next` |

## 5. 玩家操作

玩家无直接操作。本功能由 `next_month` 自动执行；玩家仅在月结后看到结果（顶栏与公司界面进度变化）。

## 6. 系统行为与副作用

### 6.1 M9 按城重算并汇总

每座可经营城市 `city`：

```text
eco_cap_factor_city = 1.0 if city_fully_eco_supply else 0.8
green_pr_mult = 1.05 if eng_green_pr lit AND city_fully_eco_supply else 1.0

city_sv_raw = city_base_social_value
           × satisfaction_rate_city
           × eco_cap_factor_city
           × green_pr_mult

city_sv_int = floor_by_rule(city_sv_raw)
```

公司汇总：

```text
social_value_current = Σ city_sv_int   // 覆盖写入
```

规则约束：
- 社会价值为**当月快照**，不是历史累积。
- 供能/环保变差会导致 `social_value_current` 下降。
- 都节点按单城计 1 条记录参与汇总。

### 6.2 M10 升级检视

```text
while social_value_current >= social_value_threshold_next(current_level):
    company_level += 1
```

规则约束：
- 升级后 `social_value_current` 不扣门槛、不清零。
- 支持单月连升多级。
- 公司等级只升不降；已解锁内容不回退。

## 7. 与月度结算的关系

| 结算步骤 | 关系 |
|----------|------|
| M4 | 提供满足率与全环保判定输入 |
| M9 | 本功能第一阶段：按城重算并写 `social_value_current` |
| M10 | 本功能第二阶段：升级判定与等级更新 |
| M11+ | 事件与后续步骤读取最新等级状态 |

## 8. 数据依赖

| 数据域 | 字段（示意） | 用途 |
|--------|--------------|------|
| 城市配置 | `city_id`, `city_base_social_value`, `region_id` | 城市基础社会价值 |
| 供能快照 | `satisfaction_rate_city`, `city_fully_eco_supply` | M9 因子输入 |
| 科技状态 | `eng_green_pr_lit` | 绿色公关乘区 |
| 公司状态 | `company_level`, `social_value_current` | 写回与升级 |
| 等级阈值 | `social_value_threshold_next` | M10 判定门槛 |

## 9. 错误与边界

| 场景 | 处理 |
|------|------|
| 城市配置缺失 `city_base_social_value` | 该城按 0 处理并记录诊断日志 |
| 满足率越界 | 先 clamp 到 [0,1] 再计算 |
| 极端负面导致汇总下降 | 允许；仅影响 `social_value_current`，不降级 |
| 单月跨多级门槛 | 循环升级直到不满足门槛 |

## 10. 验收标准

- [ ] Given 两座城市各有有效供能结果，When 执行 M9，Then `social_value_current` 等于两城 `city_sv_int` 之和且为覆盖写入。
- [ ] Given 某城满足率 100% 但本市有未环保火/核，When 执行 M9，Then 该城按 `eco_cap_factor=0.8` 计入。
- [ ] Given 某城全环保且 `eng_green_pr` 已点亮，When 执行 M9，Then 该城额外乘 `1.05`。
- [ ] Given `social_value_current` 连续超过两个等级门槛，When 执行 M10，Then 支持单月连升并保持社会价值不清零。
- [ ] Given 次月经营下滑导致社会价值回落，When 执行 M9/M10，Then `social_value_current` 下降但 `company_level` 不回退。

## 11. 相关文档

- GDD：
  - [社会价值与公司等级](../gdd/03-social-value.md)
  - [供能与能源类型](../gdd/04-energy-supply.md)
  - [科技研发](../gdd/07-tech.md)
- Feature：
  - [全局游戏状态与月度结算](./00-game-state.md)
  - [供能计算](./supply-calculation.md)
  - `features/company-management.md`（T18）
