---
name: wechat-build-debug
description: 排查微信开发者工具慢启动、cli.bat 打开失败、端口未启用、僵尸进程占用等问题。Use when the user mentions 微信开发者工具、cli.bat、wechatgame 构建打开失败、预览未弹出、慢启动、端口或进程排查。
---

# WeChat Build Debug

## 适用场景

- `client/cocos/build/wechatgame` 已生成，但微信开发者工具没有正常打开
- `cli.bat open` 返回成功，但窗口没有出现
- 需要给用户一个短排查清单和可复制命令

## 工作流

1. 先确认目标是否真的是微信工具问题：
   - 构建输出目录应为 `client/cocos/build/wechatgame`
   - 如果构建产物不存在，先说明这是“未构建/构建路径不对”，不要把它误判成微信工具故障
   - 不要把 `npm run build:client` 误当成 Cocos 构建；它主要负责配置同步
2. 按固定顺序排查：
   - 是否有残留 `wechatdevtools` 进程
   - 微信工具是否开启“服务端口 / CLI 调用”
   - 是否使用 `cli.bat`，而不是直接点 `微信web开发者工具.exe`
   - `open --project` 是否使用绝对路径
3. 默认给出这条可复制命令：

```powershell
Get-Process wechatdevtools -ErrorAction SilentlyContinue
& "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" open --project "M:\CursorProjects\EnergyCompany\client\cocos\build\wechatgame"
```

4. 如果 `open` 成功但没有立刻看到窗口，明确说明：
   - 2.x 首次可能预热 3-5 分钟
   - 不要连续重复点开，先等一轮
5. 回复保持短格式：
   - 当前判断
   - 1-3 条短排查项
   - 1 条可复制命令

## 不要做

- 不把“Cocos 构建、配置同步、微信工具启动”混成一个步骤
- 不输出长篇背景解释
- 不在没有新证据时重复尝试同一条打开命令
