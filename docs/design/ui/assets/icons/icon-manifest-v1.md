# 正式图标资产清单 v1

> 历史版本：本文件记录第一批 256px 等级 / 科技点交付，当前轻量运行时清单已由 `icon-manifest-v2.md` 取代。这里的 256px 文件继续作为设计母版保留，不直接进入小游戏运行时目录。

## 历史设计母版

母版均为 256×256 RGBA PNG。透明仅指图标外部背景；图标本体保持饱满实体。它们与 `source/` 中的整版源图、去背中间件一样只作设计源；当前运行时文件统一见 `runtime/` 和 `icon-manifest-v2.md`。

### 等级 I—V

| 文件 | 语义 | 主色 | 状态 |
|------|------|------|------|
| `level/icon-level-01-blue-v1.png` | 等级 I | 蓝 | default |
| `level/icon-level-02-green-v1.png` | 等级 II | 绿 | default |
| `level/icon-level-03-yellow-v1.png` | 等级 III | 黄 | default |
| `level/icon-level-04-orange-v1.png` | 等级 IV | 橙 | default |
| `level/icon-level-05-red-v1.png` | 等级 V | 红 | default |

等级只使用实体罗马数字，不添加光点、能量条、下划线、徽章或底座。数字形状与颜色共同表达等级，因此不依赖颜色单独编码。

### 科技点

| 文件 | 语义 | 状态处理 |
|------|------|----------|
| `tech-point/icon-tech-point-normal-v1.png` | 科技点资源 | 标准饱和度、白描边与受控柔光 |
| `tech-point/icon-tech-point-selected-v1.png` | 科技点 / 科技节点选中 | 同一芯片主体；增强白青描边和紧凑光晕 |
| `tech-point/icon-tech-point-locked-v1.png` | 科技点 / 科技节点锁定 | 同一芯片主体；降饱和并叠加锁定图形 |

科技点用于资源栏、科技树节点和月报。芯片轮廓必须与电力闪电、资金金币和 SV 星形保持区分。

## 缩小预览

`preview/` 为每个运行时母版提供真实 32 / 48 / 64px PNG，命名规则为：

```text
{母版文件名去掉 .png}-{32|48|64}.png
```

综合毛玻璃预览：`preview/functional-icon-level-techpoint-final-preview-v3.png`。

## 使用约束

- 32px 为信息密集场景的最小视觉尺寸；主要交互热区仍不得小于约 48×48dp。
- 图标放在乳白 / 浅冰蓝稳定毛玻璃承载层上；不通过加强全局发光弥补尺寸或对比问题。
- 科技点选中态和锁定态不得重绘芯片主体。
- 等级不再增加颜色之外的附属标识；罗马数字自身提供非颜色冗余。
- 本批只交付设计资产，不包含 Cocos 节点、Prefab、组件或代码实现。
