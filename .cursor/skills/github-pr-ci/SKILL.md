---
name: github-pr-ci
description: 处理本项目的 GitHub 工作流，包括 PR 总结、CI 失败排查、评论跟进与阶段同步。Use when the user mentions GitHub, PR, pull request, CI, checks, review comments, gh CLI, or asks to inspect remote feedback for this repository.
---

# GitHub PR CI

## 当前默认路径

在本项目里，GitHub 相关操作当前默认优先走 `gh` CLI。

如果未来启用 GitHub MCP，再把“只读查看类”逐步迁到 MCP；在此之前，不要假设项目里已经有 GitHub MCP 可用。

## 常见任务

1. 看 PR / Issue / 评论：
   - 优先用 `gh pr view`、`gh pr checks`、`gh issue view`
2. 看 CI 状态：
   - 优先用 `gh pr checks`
   - 若需要更细日志，再继续用 `gh run view`
3. 收口阶段同步：
   - 只摘取和当前任务直接相关的评论、失败检查、阻塞项
   - 不把远端噪声全部搬进上下文

## 推荐节奏

1. 先确认本轮目标是“看状态”还是“要处理问题”
2. 先取摘要，再按需下钻
3. 最后把结论压成短结论：
   - 当前阻塞是什么
   - 谁需要处理
   - 是否影响合并 / push / 下一步

## 项目内优先关注

- PR review comments
- failing checks / CI 红灯
- 与 `verify:client`、边界检查、测试失败直接相关的反馈
- 阶段节点是否已具备 merge-ready 条件

## 不要做

- 不默认抓所有历史 run 日志
- 不在没有明确请求时创建 PR、评论或 push
- 不把 GitHub 状态查询和本地代码修改混成一个大步骤
