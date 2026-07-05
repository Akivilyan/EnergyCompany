# 核心表字段说明（T37）

本目录是 Data 层的字段真理源，供 T38/T39 直接引用。目录与导出流程见 [`../README.md`](../README.md)（T36）。

## 文件清单

- `region-and-city.md`：地区、城市、资源标签、需求基线。
- `facility-and-grid.md`：设施配置、tier 行、电网线损配置。
- `company-level-and-run.md`：公司等级门槛、难度修正、起始参数。
- `events-and-campaign.md`：随机事件与固定灾害轴（`campaign_disasters`）。
- `doctrine-meta.md`：方针熟练度（`doctrine_meta_table`）与通关增量规则。

## 命名与约束（本目录统一）

- 储能科技 ID 使用 `storage_system_1`～`storage_system_3`。
- 显示名与 tech_id 分离：显示名始终用「储能系统·I～III」。
- 数值结算按 GDD 约定：允许配置小数，结算层仅保留整数。
