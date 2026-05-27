# First-Round Batch Simulation Report

Method: heuristic proxy simulation (not runtime game engine).

> 中文注释：`batch` 表示调参批次（每批只改 3~4 个参数）。
> 中文注释：`A/B/C` 是三种策略：A=不看广告，B=保守救急广告，C=激进加速广告。
> 中文注释：本报告用于比较调参方向，不替代引擎实跑验收。

## baseline
- passRate(A/B/C): 42.2% / 77.7% / 94.0%
- avgAds(A/B/C): 3.40 / 3.17 / 4.62 (overall 3.73)
- avgDuration(A/B/C): 83.8 / 80.8 / 74.1 (overall 79.6)
- targetCheck: A=false, B=false, C=true, ads=true, duration=true

## batch-1
- passRate(A/B/C): 52.2% / 87.2% / 98.7%
- avgAds(A/B/C): 2.16 / 1.92 / 3.40 (overall 2.49)
- avgDuration(A/B/C): 81.4 / 78.0 / 71.1 (overall 76.9)
- targetCheck: A=false, B=true, C=true, ads=false, duration=true

## batch-2
- passRate(A/B/C): 45.7% / 77.3% / 96.7%
- avgAds(A/B/C): 3.07 / 2.80 / 4.26 (overall 3.38)
- avgDuration(A/B/C): 81.2 / 78.3 / 71.2 (overall 76.9)
- targetCheck: A=false, B=false, C=true, ads=true, duration=true

## batch-3
- passRate(A/B/C): 41.7% / 66.0% / 78.2%
- avgAds(A/B/C): 3.47 / 4.24 / 6.11 (overall 4.61)
- avgDuration(A/B/C): 86.3 / 83.6 / 76.8 (overall 82.2)
- targetCheck: A=false, B=false, C=false, ads=true, duration=true

## batch-4
- passRate(A/B/C): 44.8% / 83.2% / 97.3%
- avgAds(A/B/C): 3.39 / 3.16 / 4.62 (overall 3.72)
- avgDuration(A/B/C): 83.7 / 80.7 / 73.8 (overall 79.4)
- targetCheck: A=false, B=true, C=true, ads=true, duration=true

## combined-b1-b2-b3-b4
- passRate(A/B/C): 60.7% / 88.7% / 95.5%
- avgAds(A/B/C): 1.86 / 2.63 / 4.52 (overall 3.00)
- avgDuration(A/B/C): 81.6 / 78.6 / 71.8 (overall 77.3)
- targetCheck: A=true, B=true, C=true, ads=true, duration=true
