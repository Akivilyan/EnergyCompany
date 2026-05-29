---
id: ui/onboarding
title: 新手引导 UI
status: draft
version: 0.1.2
sources:
  - docs/design/features/onboarding.md
  - docs/design/gdd/10-onboarding.md#遮罩交互
supersedes: []
depends_on:
  - features/onboarding
  - ui/00-screen-map
  - ui/construction-flow
open_questions: []
---

# 新手引导 UI

## 1. 叠加 ID

- `overlay_onboarding`（教学局强制链）
- `modal_skip_onboarding`
- `overlay_codex`（图鉴，非强制）

方针屏 UI 归属 `screen_new_game_doctrine`（教学卡 ✓ / 推荐高亮）。

## 2. 遮罩线框

```text
┌──────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░  [高亮挖洞: 下一月按钮]  ░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ┌─────────────────────────────────────┐   │
│  │ 步骤 3/7  点击「下一月」推进时间      │   │
│  │ 👆 手指动画                          │   │
│  │ [跳过引导]                           │   │
│  └─────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## 3. 组件树

- `OnboardingOverlay`
  - `DimLayer`（挖洞 mask 跟随 `highlight_target`）
  - `FingerHint`
  - `StepCard`（文案、步骤条 `current/total`）
  - `BtnSkip` → `modal_skip_onboarding`
- `SkipConfirmModal`（二次确认）
- `CodexOverlay`（分页 Tab，只读）

## 4. 交互表

| 控件 | 结果 |
|------|------|
| 挖洞外点击 | **穿透拦截**（无反应） |
| 挖洞内点击 | 正常控件 + 可能 `advance_onboarding` |
| `BtnSkip` | 打开 `modal_skip_onboarding` |
| 确认跳过 | `skip_onboarding` |
| 大事件弹窗显示中 | 隐藏 `OnboardingOverlay` 直至关闭 |

## 5. `highlight_target` 示例（配置）

| step_id | target |
|---------|--------|
| `onb_02_build` | 第一个空 `BuildSlot` |
| `onb_03_next_month` | `BtnNextMonth` |
| `onb_06_company` | `BtnCompany`（本步前入口灰显） |
| `onb_07_tech_ii` | `BtnTechTree` |

## 6. 方针屏

| 元素 | 态 |
|------|-----|
| 教学卡 | `tutorial_doctrine_cleared` → 角标 ✓ |
| 首访 | 教学卡描边/「新玩家由此开始」 |
| 四方针 | 无遮罩 |

## 6.1 壳层契约（T45-14）

`screenOnboarding` 最小壳层已提供：

- `getSnapshot()`：`isTutorialRun/currentStepId/stepsDone/skipped/cleared/playableSubPhase`
- `advanceStep()`：封装 `advance_onboarding`，返回 `before/after/result/uiErrorCode/uiCopy`
- `skipAll()`：封装 `skip_onboarding`，返回同结构

教学最小链路（当前实现）：

1. tutorial 开局：`isTutorialRun=true`，`currentStepId=onb_01_welcome`，`playableSubPhase=blocked`
2. 连续 7 次 `advance_onboarding`：步进到 `onb_done` 并写 `tutorialDoctrineCleared=true`
3. `skip_onboarding`：直接到 `onb_done`，并写 `onboardingSkipped=true`（不写 cleared）

错误码映射：

| `uiErrorCode` | `messageKey` | `actionKey` |
|---|---|---|
| `not_tutorial_run` | `onboarding.error.not_tutorial_run` | `onboarding.action.start_tutorial_run` |
| `action_blocked` | `onboarding.error.action_blocked` | `onboarding.action.follow_current_step` |
| `action_invalid` | `onboarding.error.action_invalid` | `onboarding.action.retry` |
| `action_failed` | `onboarding.error.action_failed` | `onboarding.action.retry` |

## 6.2 图鉴壳层契约（T45-P1-01）

`overlay_codex` 的 v0 简版已提供 `screenCodex` 只读壳层：

- `getSnapshot(activePageId?)`：读取当前图鉴上下文与页面列表（`codex_core/codex_ads`）
- `openPage(pageId)`：按页签读取，不存在返回 `not_found`
- `tryOpenPage(pageId)`：失败时映射 `page_not_found -> codex.error.page_not_found`

详细字段见 [codex](./codex.md)。

## 7. 微信小游戏

- 挖洞区域 **扩大热区** 8px。
- 步骤卡固定底部，不挡 `下一月`。

## 8. 相关文档

- Feature：[onboarding](../features/onboarding.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T35a 初稿 |
| 0.1.1 | 2026-05-29 | 对齐 T45-14：补 `screenOnboarding` 壳层契约、最小步骤推进链路与错误码映射 |
| 0.1.2 | 2026-05-29 | 对齐 T45-P1-01：补 `overlay_codex` 简版壳层入口说明与索引链接 |
