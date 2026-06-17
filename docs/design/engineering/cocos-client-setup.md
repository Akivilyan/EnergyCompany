---
id: engineering/cocos-client-setup
title: Cocos 客户端工程初始化清单
status: draft
version: 0.3.0
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
npm run verify:client
```

（等价于 `build:client` + 工程预检 + T50 HUD 全屏冒烟 + hide 存档恢复，**不打开 Cocos** 也能验证逻辑与资源。）

分项脚本：

| 命令 | 用途 |
|------|------|
| `npm run sim:cocos-hud-close` | 仅 T50 静态检查 + HUD 冒烟 |
| `npm run sim:client-sync-spike` | 冒烟 + T49 存档恢复（playtest 子步骤） |
| `npm run sim:cocos-init-spike` | 仅工程/资源预检 |

编辑器里点 **播放** 后，可在仓库根目录探测预览 HTTP 是否起来：

```bash
npm run check:cocos-preview
```

预检通过后再进编辑器；`editor-scenes` 为 **advisory**（仓库内可以没有 `.scene`，但预览前需在编辑器里创建）。

### 语言（简中 / 英语）

- **默认简中**（`zh-CN`），适合人肉测试。
- 文案表：`src/i18n/messages/zh-CN.ts`、`en.ts`。
- 切英语：预览 URL 加 `?locale=en`（会写入 `localStorage`）。
- 切回简中：`?locale=zh-CN`，或删除 `localStorage` 键 `energy-company.locale`。

---

## 1. 打开工程


| 项    | 说明                                                        |
| ---- | --------------------------------------------------------- |
| 引擎   | Cocos Creator **3.8.8**（与 `client/cocos/package.json` → `creator.version` 一致） |
| 工程路径 | 仓库内 **`client/cocos`**（含 `package.json` 的目录；不要选到 `client` 上一层） |
| 工程骨架 | 已含 `package.json`、`settings/`、`.creator/`；**不要**在 Dashboard 新建空项目代替 |
| 首次打开 | 编辑器会自动生成 `library/`、`temp/`（已在 `.gitignore`，勿提交） |
| 同步   | 每次拉代码或改 `src/` 后 `npm run`执行 `build:client`               |


---

## 2. 最小启动场景（只需 1 个）

当前代码只需 `**CityDetail`** 即可跑通城市页闭环；其它场景名见 `client/cocos/scene-registry.json`，可后续再建。

1. 新建场景，命名为 `**CityDetail**`
2. 添加 **Canvas**（含 Camera）
3. Canvas 下建空节点（建议命名 `GameRoot`），挂载 `**GameRoot`** 组件
4. **无需**手动添加 `CityHudPanel`（`GameRoot` 会自动挂上并**用代码画**文字和按钮，不是 3D 模型）
5. 确认层级：`CityDetail` → `Canvas` → `GameRoot`（GameRoot **必须在 Canvas 下面**，否则 UI 不显示）
5. **项目设置 → 项目数据 → 默认场景**：设为 `CityDetail`

预览预期：

- 顶栏（简中）：`第1月 · 资金140 · 起始城`；公司屏主行 `公司 · 1级 · …`，副行 `在贷：小额贷款（30万）· 剩12月`
- 按钮（简中）：**建造风场** / **下一月** / **公司** / **科技** / **返回** 等
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


| 路径                            | 用途                                         |
| ----------------------------- | ------------------------------------------ |
| `assets/scripts/`             | Cocos 组件（GameRoot、CityHudPanel 等）          |
| `assets/shared/game-client.mjs` | `build:client` 用 esbuild 打好的浏览器包（**不提交**） |
| `sync-manifest.json`            | `build:client` 本地同步 stamp（**不提交**）           |
| `assets/resources/config/v0/` | 表数据 JSON                                   |
| `scene-registry.json`         | screenId ↔ 场景名注册表                          |


---

## 5. 常见问题


| 现象                       | 处理                                                   |
| ------------------------ | ---------------------------------------------------- |
| Dashboard「编辑器版本不存在」 | 在 Dashboard **编辑器**页安装/关联 3.8.8；工程路径必须是 `client/cocos` |
| 空项目文件很多、本仓库很少        | 正常：`library/`、`temp/`、`.meta` 多为首次打开后生成，不必与空模板逐文件对齐 |
| config load failed       | 先 `npm run build:client`                             |
| 找不到 `./sceneMap.js` / `node:fs` | 先 `npm run build:client`；脚本须从 `game-client.mjs` 导入，勿直接引用 `assets/shared/src` |
| shared 导入报错              | 确认 `assets/shared/game-client.mjs` 存在（由 esbuild 生成） |
| loadScene Company failed | 正常；创建对应场景或忽略（单场景模式）                                  |
| 预览全黑、无任何字               | 看 Console 是否有 `[GameRoot] mounted`；无则配置未加载成功。改脚本后保存并等底部 **Quick Compile** 完成再预览 |
| `import-map.json` ENOENT   | 关编辑器 → 删 `client/cocos/temp` 与 `library` → 重开工程 → 等编译完成再播放 |
| 改 TS 后预览不更新              | **开发者 → 重新加载**（Ctrl+R），或 **开发者 → 缓存 → 清除代码缓存**；无「重新编译脚本」菜单（3.8.8 正常） |
| 浏览器 F12 只有引擎日志、没有 `[GameRoot]` | 正常：`cc.log` 默认在 **Cocos 编辑器 → Console**。预览页调试级别选 **Info For Web Page**，或看 F12 里 `console.warn`（脚本已双写）。须在编辑器点 **播放** 且保持预览页打开 |
| 一直 Loading、顶栏不变 | 看是否变成 **Config load failed**；根目录执行 `npm run build:client` 后回 Cocos 保存场景再播放 |
| Console 刷屏 `CityDetail is already being loaded` | 已修：`CocosSceneHost` 在**当前场景同名**时不再 `loadScene`；去掉 `addPersistRootNode`（Canvas 子节点不能常驻根） |
| `game-client.mjs.map.meta is not exist` | 正常：`build:client` 不再生成 `.map`；若仍报错，删 `assets/shared/*.map*` 后重跑 `npm run build:client`，再在 Cocos 里 **资源 → 刷新** |
| 微信模拟器 `URLSearchParams is not defined` | 已修：`previewLocale` 不依赖 URLSearchParams；改 `src/` 后 `npm run build:client` 再 **构建微信小游戏** |
| 按钮无反应                    | 确认 Console 有 `[GameRoot] mounted`；检查 Canvas 有 Camera |
| 推月后出现「知道了」按钮            | 灾害全屏确认（T50-06）；顶栏会显示待确认标题，点 **知道了** 清除 pending |
| 导航条 **区域** + **铺线**        | 需公司 **2 级**（可先公司屏借贷/推月或科技屏升到 II）；区域屏点 **铺线** 排队 `CITY-START → CITY-MAP01-02` |


---

## 5.1 T50 开发 HUD 验收（已收口）

`npm run sim:cocos-hud-close` 或 `npm run verify:client` 会逐项打印：

| ID | 内容 |
|----|------|
| t50-01 | 挂载、建造风场、推月 |
| t50-03~04 | 导航公司、申请贷款 |
| t50-05 | 升 II 级、开研、广告加速 |
| t50-07 | 导航区域、默认铺线 |
| t50-06 | 推至 M23、灾害确认 |
| t49-persistence | hide 存档与 remount 恢复（仅 `verify:client` / `client-sync-spike`） |

当前为 **代码绘制** 的开发 HUD，不是 Prefab 真 UI（见 `PROJECT-TASK-BOARD` T55 入口条件）。

---

## 6. 微信小游戏构建清单（T51）

CityDetail 在编辑器预览与 `npm run verify:client` 通过后：

1. **构建前**：`npm run verify:client`；确认 `client/cocos/assets/shared/game-client.mjs` 存在
2. **Cocos Creator**：菜单 **项目 → 构建发布** → 平台 **微信小游戏**
3. **首包**：确认 `resources/config/v0` 已打进包；`temp/`、`library/` 勿提交 Git
4. **真机冒烟**：
   - 冷启动进入 `CityDetail`，顶栏非 Loading
   - 玩 2～3 月后切后台再进，月份/资金与退出前一致（`onHide` 存档）
   - 公司 2 级后可进 **区域** 并 **铺线**
   - 推至约 M23 出现灾害 **知道了** 并可确认
5. **广告**：激励视频仍为 stub；真机接 WeChat 广告需替换 `RewardedAdProvider`（见 `engineering/stack.md`）
6. **语言**：预览 URL `?locale=en` 或 `localStorage` 键 `energy-company.locale`

### 当前状态

- 当前只可确认：已能构建微信小游戏包，且已在真机上跑起
- `T51` 仍未完成，原因是真机仍有待修问题
- 本页继续作为构建、联调、问题复现和回归自检的操作入口

---

## 变更记录


| 版本    | 日期         | 说明                                   |
| ----- | ---------- | ------------------------------------ |
| 0.1.0 | 2026-05-30 | T50-02 初版：最小 CityDetail 场景清单与单场景导航说明 |
| 0.2.0 | 2026-06-17 | 补充 T51 当前状态说明，明确本页作为后续构建与联调入口继续保留 |
| 0.3.0 | 2026-06-17 | 按用户纠偏修正 T51 状态：已跑起但仍有真机问题待修 |


