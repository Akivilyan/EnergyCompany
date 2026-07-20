# Cocos Creator 工程入口

## 当前状态

- 引擎：Cocos Creator 3.8.8。
- 工程目录：`client/cocos`。
- 旧 `CityDetail` 临时场景、程序化 HUD 和全页面 screen 壳已删除。
- 当前只保留项目设置和资源目录 UUID；正式场景从 `PLAYABLE-CORE-01` 按设计重建。
- `docs/design/data/vertical-slice-v0/` 是配置真理源，Cocos 内配置由 `build:client` 生成，不提交副本。

## 打开工程前

```bash
npm run build:client
npm run build
npm run lint:boundaries
```

然后用 Cocos Creator 3.8.8 打开 `client/cocos`。首次打开会生成 `library/`、`temp/`、`local/` 等本地缓存，它们均不提交。

也可从仓库根目录执行：

```bash
npm run tool:cocos
```

## 当前同步命令

| 命令 | 用途 |
|------|------|
| `npm run build:client` | 打包最小共享逻辑并同步配置 |
| `npm run build:client:bundle` | 只重打共享 TypeScript 逻辑 |
| `npm run build:client:config` | 只同步配置 |
| `npm run build:client:clean` | 清理并重建共享逻辑包 |
| `npm run build:client:watch` | 开发期间监听根源码和配置 |
| `npm run check:cocos-preview` | 编辑器播放后探测预览 HTTP |

## 正式客户端约束

- 第一个正式场景只服务城市建设与月结垂直切片。
- Cocos 输入只能调用 `src/modules` 暴露的动作，不直接修改 `GameState`。
- 资金、预计每回合净资金变化、供能和 EXP 使用规则/模块快照，Cocos 不拼公式。
- 玩家可见切片以 390×844、430×932 截图和实际点击路线验收。
- 没有进入当前切片的页面、按钮、资产和逻辑不提前创建。

## 生成目录

下列目录是本地缓存或构建输出，出现问题时可安全重建，不进入 Git：

- `client/cocos/library/`
- `client/cocos/temp/`
- `client/cocos/local/`
- `client/cocos/build/`
- `client/cocos/assets/shared/`
- `client/cocos/assets/resources/config/v0/*.json`
- `client/cocos/sync-manifest.json`
