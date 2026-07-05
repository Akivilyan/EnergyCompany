---
id: ui/codex
title: 图鉴（overlay_codex）UI
status: draft
version: 0.1.0
sources:
  - docs/design/ui/onboarding.md
supersedes: []
depends_on:
  - ui/00-screen-map
  - ui/onboarding
open_questions: []
---

# 图鉴（overlay_codex）UI

`overlay_codex` 在 v0 采用简版 1-2 页只读内容，用于快速解释核心循环与广告 stub 行为，不阻塞主流程。

## 1. v0 页面范围

| pageId | 目标 | 关键文案键 |
|---|---|---|
| `codex_core` | 解释“建造 -> 推月 -> 供能/SV 变化” | `codex.core.*` |
| `codex_ads` | 解释激励广告 cash/speedup 与剩余次数 | `codex.ads.*` |

## 2. 壳层契约（T45-P1-01）

`screenCodex` 最小只读壳层：

- `getSnapshot(activePageId?)`：返回 `month/doctrineId/companyLevel/adsRemaining/activePageId/pages`
- `openPage(pageId)`：读取指定页；不存在返回 `not_found`
- `tryOpenPage(pageId)`：兜底读取，失败映射 `page_not_found` 与 UI 文案键

错误映射：

| `uiErrorCode` | `messageKey` | `actionKey` |
|---|---|---|
| `page_not_found` | `codex.error.page_not_found` | `codex.action.go_core` |

## 3. 交互约束

- 图鉴只读，不触发 sim 命令，不改变 `GameState`。
- 无论 tutorial/normal run，均可打开并切页。
- 页签不存在时，回退到 `codex_core`。
