---
id: engineering/cocos-client-setup
title: Cocos 客户端工程初始化清单
status: draft
version: 0.1.0
sources:
  - docs/design/engineering/stack.md
  - client/cocos/scene-registry.json
depends_on:
  - engineering/stack
open_questions: []
---

# Cocos 客户端工程初始化清单

在 Cocos Creator 中首次打开 `client/cocos` 前，先在仓库根目录执行：

```bash
npm run build:client
npm run sim:cocos-init-spike
```

预检通过后再进编辑器；`editor-scenes` 为 **advisory**（仓库内可以没有 `.scene`，但预览前需在编辑器里创建）。

---

## 1. 打开工程

| 项 | 说明 |
|----|------|
| 引擎 | Cocos Creator **3.8.x**（与 `client/cocos/project.json` 一致） |
| 工程路径 | 仓库内 `client/cocos` |
| 同步 | 每次拉代码或改 `src/` 后执行 `npm run build:client` |

---

## 2. 最小启动场景（只需 1 个）

当前代码只需 **`CityDetail`** 即可跑通城市页闭环；其它场景名见 `client/cocos/scene-registry.json`，可后续再建。

1. 新建场景，命名为 **`CityDetail`**
2. 添加 **Canvas**（含 Camera）
3. Canvas 下建空节点，挂载 **`GameRoot`** 组件
4. **无需**手动添加 `CityHudPanel`（`GameRoot` 挂载后自动创建）
5. **项目设置 → 项目数据 → 默认场景**：设为 `CityDetail`

预览预期：

- 顶栏：`M1 · 140 · CITY-START`
- 按钮：**Build Wind** / **Next Month** / **Company** / **Tech** / **Back**
- 控制台：`[GameRoot] mounted screen=screen_city_detail ...`

---

## 3. 单场景开发模式说明

若尚未创建 `Company` / `TechTree` 等场景资源：

- 点击 **Company** / **Tech** 后，逻辑层 screen 会切换
- `CocosSceneHost` 在场景缺失时会 **console.warn** 并留在当前场景
- HUD 顶栏 `screen=...` 仍可用于验证导航

这是预期行为，便于先验证玩法再补美术场景。

---

## 4. 资源与目录

| 路径 | 用途 |
|------|------|
| `assets/scripts/` | Cocos 组件（GameRoot、CityHudPanel 等） |
| `assets/shared/src/` | `build:client` 从 `src/` 同步的 TS 逻辑（**不提交**） |
| `sync-manifest.json` | `build:client` 本地同步 stamp（**不提交**） |
| `assets/resources/config/v0/` | 表数据 JSON |
| `scene-registry.json` | screenId ↔ 场景名注册表 |

---

## 5. 常见问题

| 现象 | 处理 |
|------|------|
| config load failed | 先 `npm run build:client` |
| shared 导入报错 | 确认 `assets/shared/src/app/gameClientEntry.ts` 存在 |
| loadScene Company failed | 正常；创建对应场景或忽略（单场景模式） |
| 按钮无反应 | 确认 Console 有 `[GameRoot] mounted`；检查 Canvas 有 Camera |

---

## 6. 微信小游戏（后续）

CityDetail 在编辑器预览通过后，再配置：

1. 构建发布 → 微信小游戏
2. 真机验证：启动读档、`onHide` 自动存档、重进恢复

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 0.1.0 | 2026-05-30 | T50-02 初版：最小 CityDetail 场景清单与单场景导航说明 |
