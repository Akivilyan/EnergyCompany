---
name: ops-phase-close
description: 用于阶段支撑任务或协作基座任务收口时，统一检查工具箱、规则入口、看板和验证说明是否同步。Use when closing OPS tasks such as OPS-01, when the user asks for阶段收口, or when docs/rules/skills/toolbox changes need one final consistency pass.
---

# OPS Phase Close

## 适用场景

- 当前任务是类似 `OPS-01` 的协作基座 / 阶段支撑任务
- 本轮改动集中在规则、skills、README、工具箱、看板
- 需要做一次“收口检查”，避免信息散落

## 收口清单

1. 核对入口是否一致：
   - `AGENTS.md`
   - `.cursor/README.md`
   - `docs/design/engineering/cursor-toolbox.md`
2. 核对看板是否同步：
   - `当前任务` 仍只保留 1 个 `doing`
   - `会话日志` 已追加本轮记录
   - `version` 与 `变更记录` 已更新
3. 核对工具状态是否清晰：
   - 已落地的 skills 要能在 `.cursor/skills/` 找到
   - 暂缓项不要误写成 done
   - MCP 候选要写清“什么时候值得接”
4. 只在必要时补验证说明：
   - 仅规则 / 文档 / skills 整理，可明确写“无需跑测试”
   - 不要为了收口额外扩大到无关验证

## 输出要求

最后总结只需覆盖：

1. 这轮收口完成了什么
2. 还有哪些项明确暂缓
3. 是否需要用户显式授权 `commit`

## 不要做

- 不为了阶段收口硬切任务
- 不重写历史记录
- 不把低频项包装成当前刚需
