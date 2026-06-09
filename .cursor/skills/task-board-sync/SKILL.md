---
name: task-board-sync
description: 在本仓库结束一轮有效工作后，同步更新 PROJECT-TASK-BOARD.md 的当前任务、会话日志和版本记录。Use when code/docs/rules/skills have changed, when task status moved, or when the user asks to update the task board.
---

# Task Board Sync

## 目标文件

`docs/design/engineering/PROJECT-TASK-BOARD.md`

## 更新流程

1. 先读当前任务区，确认本轮是在延续现有任务，还是切换到新任务。
2. 保持“只保留 1 项 `doing`”：
   - 若任务未切换，只更新当前任务描述或完成定义
   - 若任务切换，先结束旧任务，再写入新任务
3. 追加一条会话日志，包含：
   - 日期
   - 会话结论
   - 变更文件
   - 验证结果
4. 同步 frontmatter `version`，只做补丁号递增。
5. 在“变更记录”末尾追加一句本轮摘要。

## 记录约束

- 不改写旧日志措辞，只追加新行
- 文件列表只写本轮相关文件
- 验证列要写实际结果；仅文档/规则/看板改动时，明确写“无需跑测试”
- 如果当前任务仍是 `OPS-01`，不要为了写日志硬切任务

## 推荐日志格式

| 日期 | 会话结论 | 变更文件 | 验证 |
|------|----------|----------|------|
| 2026-06-09 | 补第一批项目专用高优先级 skills，并同步工具箱清单状态 | `...` | 仅规则/文档整理，无需跑测试 |

## 不要做

- 不新增第二个 `doing`
- 不省略验证说明
- 不为了好看重排整张表
