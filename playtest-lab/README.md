# playtest-lab

本目录是首轮平衡调参的本地实验区（由 Agent 自维护）。

## 运行方式

在仓库根目录执行：

```bash
node playtest-lab/run-first-round-batches.mjs
```

## 输出文件

- `playtest-lab/output/first-round-results.json`（脚本运行后生成，不提交）
  - 中文注释：机器可读明细，适合后续脚本继续分析。

## 说明（重要）

- 这是**启发式代理仿真**，不是游戏运行时引擎实跑。
- 作用是先比较“调参方向”和“副作用”，帮助筛选下一轮候选参数。
- 真正的玩法结论仍需后续接入引擎实跑或人工对局验证。
