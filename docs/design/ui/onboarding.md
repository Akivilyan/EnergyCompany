---
id: ui/onboarding
title: 新手引导 UI
status: draft
version: 0.1.0
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

## 7. 微信小游戏

- 挖洞区域 **扩大热区** 8px。
- 步骤卡固定底部，不挡 `下一月`。

## 8. 相关文档

- Feature：[onboarding](../features/onboarding.md)

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-27 | T35a 初稿 |
