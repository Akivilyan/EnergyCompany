# v0 每周推进节奏（功能 + 数值双轨）

---

## 每周目标（固定）

| 轨道 | 产出 | 验收 |
|------|------|------|
| **功能** | 完成 2~3 个 T45 子任务 | `npm test` 通过 + 相关冒烟 |
| **数值** | 1 轮 batch（3~4 参数） | runlog + 代理/引擎对比结论 |

---

## 周一：计划

- [ ] 从 [IMPLEMENTATION-TASKS.md](./IMPLEMENTATION-TASKS.md) 勾选本周 T45 ID
- [ ] 从 [v0-balance-knob-surface.md](./v0-balance-knob-surface.md) 选定本轮调参类别（A/B/C/D）
- [ ] 确认本轮 **不修改** `debuff_duration_months`

## 周二~周四：实现

- [ ] 编码 + 单测（`tests/sim/`）
- [ ] `npm run lint:boundaries`
- [ ] 若动表：`ConfigRepo` 能加载且 `sim:demo` 无报错

## 周五：回归

- [ ] `node playtest-lab/run-first-round-batches.mjs`（方向筛选）
- [ ] `npm run sim:demo`（核心闭环）
- [ ] 填写 [v0-balance-runlog-template.md](./v0-balance-runlog-template.md)
- [ ] Git 提交：功能与数值分 commit（可选）

---

## 双周复盘（每 2 周）

1. E1~E6 体验点完成度（见 [vertical-slice-v0.md](./vertical-slice-v0.md)）
2. A/B/C 目标线命中率（见 [v0-balance-target-lines.md](./v0-balance-target-lines.md)）
3. 是否从「代理仿真主导」切换到「引擎实跑主导」

---

## 本周记录（模板）

```text
周次：2026-W__
功能完成：T45-__
数值批次：batch-__（改了哪 3~4 个字段）
A/B/C 结论：
下周动作：
```
