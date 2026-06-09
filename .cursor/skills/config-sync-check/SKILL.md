---
name: config-sync-check
description: 处理配置表改动后的同步与最小验证，避免漏跑 build:client 或把配置问题误判成客户端故障。Use when touching docs/design/data/vertical-slice-v0, config JSON, ConfigRepo-related data, or when the user mentions 配置同步、表数据、build:client、config load failed.
---

# Config Sync Check

## 适用场景

- 改了 `docs/design/data/vertical-slice-v0/`
- 改了会影响 `ConfigRepo`、客户端 resources 配置包的数据文件
- 用户提到 `config load failed`、表数据不同步、客户端读到旧配置

## 工作流

1. 先确认是不是“配置源变更”：
   - 主要来源是 `docs/design/data/vertical-slice-v0/`
   - 只改运行时代码而没动配置表时，不要强行跑这条技能
2. 默认最小验证是：

```bash
npm run build:client
```

3. 如果改动同时影响 sim / modules 逻辑，再按需补：
   - `npm test`
   - `npm run build`
4. 如果问题出现在 Cocos 或微信预览侧，可进一步说明：
   - `build:client` 负责把配置同步到 client 资源
   - 它不是完整客户端构建，也不等于 `verify:client`
5. 用户反馈 `config load failed` 时，优先检查：
   - 是否刚改完表数据但没跑 `npm run build:client`
   - `client/cocos/assets/resources/config/v0/` 是否已更新
   - 预览环境是否还在使用旧缓存

## 回复要求

至少说明：

1. 这次是否属于配置同步类改动
2. 跑了哪些同步/验证命令
3. 是否仍需要额外客户端验证

## 不要做

- 不把 `build:client` 误说成 Cocos 完整构建
- 不在纯文档或纯 TS 非配置改动时滥用这条技能
- 不把缓存问题直接判成代码 bug
