---
id: engineering/cursor-toolbox
title: 项目工具清单
status: draft
version: 1.0.0
sources:
  - AGENTS.md
  - docs/design/engineering/cocos-client-setup.md
  - package.json
depends_on: []
open_questions: []
---

# 项目工具清单

本文件只保留项目专用命令与外部工具入口。协作约束、验证选择和环境规则见根目录 `AGENTS.md`。

## 常用命令

| 命令 | 用途 |
|------|------|
| `npm test` | sim / modules / app / ui 回归 |
| `npm run build` | TypeScript 编译 |
| `npm run lint:boundaries` | 层间引用检查 |
| `npm run build:client` | 配置与客户端共享资源同步 |
| `npm run verify:client:fast` | 日常客户端快验 |
| `npm run verify:client` | 客户端聚合验证 / 真机前置 |
| `npm run check:cocos-preview` | 探测 Cocos 预览页 |

## 外部工具

| 工具 | 用途 |
|------|------|
| Cocos Creator 3.8.8 | 客户端工程编辑与构建 |
| 微信开发者工具 | 微信小游戏预览与真机调试 |
| `gh` CLI | GitHub PR / CI / 评论查询 |
