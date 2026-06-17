---
id: gdd/01-core-loop
title: 核心循环与时间
status: locked
version: 0.4.0
sources:
  - docs/game-core-design.md#3
  - docs/game-core-design.md#4
  - docs/game-core-design.md#5
supersedes: []
depends_on:
  - gdd/00-vision
open_questions:
  - 大型工程竣工是否继续使用全屏弹窗
---

# 核心循环与时间

## 概述

本章定义界面层级、玩家主循环、月度推进与月结步骤。公司界面承担经营与借贷，不再保留独立“年度战略界面”。

## 界面关系

```text
screen_world_map
  -> screen_region
    -> screen_city_detail

screen_world_map
  -> screen_city_detail (都)

screen_city_detail
  <-> screen_tech_tree
  <-> screen_company
```

规则：

- `screen_city_detail` 是最常驻留的操作界面，也是默认 `下一月` 主入口
- 区进入 `screen_region`，都直接进入 `screen_city_detail`
- 科技树与公司界面可在任意月份进入

## 玩家主循环

1. 在大地图选区或都
2. 在区域内组网，或进入城市建设
3. 需要时进入科技树或公司界面
4. 在城市界面点击 `下一月`
5. 处理月结反馈、升级、事件或终局
6. 回到可操作状态继续经营

## 时间推进

| 规则 | 说明 |
|------|------|
| 基本单位 | 月 |
| 静态操作 | 浏览、建设、研发、查看公司时不流逝时间 |
| 主动推进 | 通过 `下一月` 推进 1 个游戏月 |
| 借贷 | 任意月份可申请，同一时间仅 1 笔未还清贷款 |

## 月度结算

| 步骤 | 内容 |
|------|------|
| M1 | 设施建设推进 |
| M2 | 电网施工推进 |
| M3 | 科研推进 |
| M4 | 供能重算 |
| M5 | 收入结算 |
| M6 | 运营成本 |
| M7 | 原材料成本 |
| M8 | 贷款还款 |
| M9 | 社会价值重算 |
| M10 | 升级检视 |
| M11 | 事件倒计时与生效 |
| M12 | 关键反馈判定 |
| M13 | 破产检视 |
| M14 | 通关检视 |

## 反馈规则

### 全屏反馈

- 公司升级
- 灾害类事件
- 重大政策 / 市场干预事件
- 大型战略工程竣工（当前默认保留）

### 界面内提示

- 科技研发完成
- 供能满足率达到 100%

## 首版边界

- 保留：五类界面、推月、贷款、升级、事件与终局判定
- 不保留：独立年度战略界面、固定月度经营结果弹窗

## 相关文档

- `02-economy.md`
- `03-social-value.md`
- `06-grid.md`
- `09-year-end-and-monetization.md`
- `11-replayability.md`

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.4.0 | 2026-06-17 | 压缩重复说明，保留界面关系、主循环、月结与反馈规则 |
