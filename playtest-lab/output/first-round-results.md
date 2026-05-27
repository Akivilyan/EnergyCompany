# First-Round Batch Simulation Report

Method: heuristic proxy simulation (not runtime game engine).

> 中文注释：本报告来自“代理仿真器”，不是游戏引擎的真实对局结果。  
> 中文注释：用于比较 batch 调参方向是否合理，不用于直接替代引擎验收。

## 如何阅读（中文）

- `passRate(A/B/C)`：三种策略的估算通关率（A 不看广告，B 保守看广告，C 激进加速）。
- `avgAds(A/B/C)`：三策略平均广告次数；`overall` 为三者平均值。
- `avgDuration(A/B/C)`：三策略平均局时长（分钟）；`overall` 为三者平均值。
- `targetCheck`：是否命中目标线（`true` 命中，`false` 未命中）。

## baseline
- passRate(A/B/C): 42.2% / 77.7% / 94.0%
- avgAds(A/B/C): 3.40 / 3.17 / 4.62 (overall 3.73)
- avgDuration(A/B/C): 83.8 / 80.8 / 74.1 (overall 79.6)
- targetCheck: A=false, B=false, C=true, ads=true, duration=true

## batch-1
- passRate(A/B/C): 47.2% / 81.0% / 98.3%
- avgAds(A/B/C): 2.88 / 2.63 / 4.12 (overall 3.21)
- avgDuration(A/B/C): 82.9 / 79.5 / 72.6 (overall 78.3)
- targetCheck: A=false, B=true, C=true, ads=true, duration=true

## batch-2
- passRate(A/B/C): 43.7% / 75.0% / 94.2%
- avgAds(A/B/C): 3.33 / 3.06 / 4.52 (overall 3.64)
- avgDuration(A/B/C): 83.0 / 80.1 / 73.0 (overall 78.7)
- targetCheck: A=false, B=false, C=true, ads=true, duration=true

## batch-3
- passRate(A/B/C): 42.0% / 77.5% / 92.2%
- avgAds(A/B/C): 3.41 / 3.32 / 4.84 (overall 3.86)
- avgDuration(A/B/C): 84.0 / 81.3 / 74.5 (overall 80.0)
- targetCheck: A=false, B=false, C=true, ads=true, duration=true

## batch-4
- passRate(A/B/C): 42.2% / 80.5% / 96.7%
- avgAds(A/B/C): 3.39 / 3.16 / 4.62 (overall 3.72)
- avgDuration(A/B/C): 83.7 / 80.7 / 73.8 (overall 79.4)
- targetCheck: A=false, B=true, C=true, ads=true, duration=true

## 当前结论（中文）

- Batch-1 对托底效果最好（B 达标，且广告次数/时长在目标区间）。
- A 仍显著偏难（各 batch 下 A 均未命中目标通关率区间）。
- C 普遍偏强，后续应继续限制“加速后碾压”。
