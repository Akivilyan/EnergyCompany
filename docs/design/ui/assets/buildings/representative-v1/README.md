# 代表建筑资产包 v1

> 状态：已确认并锁定。仅包含风电·I、光伏·I、火电·I 三个真实代表设施；镜头固定为 A′，光照固定为 L3。该包用于建筑合同与后续场景装配，不代表完整建筑清单，也尚未接入 Cocos。

## 1. 交付范围

| 设施 | 512px 透明母图 | 独立接地影 | 256px 缩略图 | 主体包围盒（px） |
|------|----------------|------------|---------------|------------------|
| 风电·I | `master/building-wind-tier1-master-v1.png` | `shadow/building-wind-tier1-shadow-v1.png` | `thumbnail/building-wind-tier1-thumbnail-v1.png` | `145,12—368,468`（223×456） |
| 光伏·I | `master/building-solar-tier1-master-v1.png` | `shadow/building-solar-tier1-shadow-v1.png` | `thumbnail/building-solar-tier1-thumbnail-v1.png` | `115,130—397,468`（282×338） |
| 火电·I | `master/building-thermal-tier1-master-v1.png` | `shadow/building-thermal-tier1-shadow-v1.png` | `thumbnail/building-thermal-tier1-thumbnail-v1.png` | `48,94—465,468`（417×374） |

所有母图与阴影层均为 512×512 RGBA；共同主锚点为 `(256, 468)`，归一化为 `(0.5, 0.9141)`。缩略图为 256×256 RGBA，共同锚点为 `(128, 234)`。精确字段以 [`manifest-v1.json`](manifest-v1.json) 为准。

## 2. 评审预览

- [`building-representative-master-preview-v1.png`](preview/building-representative-master-preview-v1.png)：三栋母图按共同锚点和实际相对体量并排，不按各自画布强行等高。
- [`building-representative-thumbnail-preview-v1.png`](preview/building-representative-thumbnail-preview-v1.png)：同一母图派生的 256px 裁切，不重新设计为 App 图标。
- 场景比例真值仍是 [`building-representative-scale-grounding-test-v4.png`](../../../concepts/building-representative-scale-grounding-test-v4.png)；预览底色与卡框只用于 QA，不属于建筑资产。

## 3. 分层与装配

1. 场景地表和占地反馈位于最底层。
2. `shadow/` 放在建筑下方，可按场景地表亮度微调透明度，但不得拉成长重影。
3. `master/` 只包含建筑实体和必要薄地基，不含厚底座、圆形徽章底、选中框或状态特效。
4. 可建、在建、完成、锁定与环保状态继续使用独立 UI / 特效层；不得烘焙回母图。

`source/` 中的 1254×1254 色键源图与透明源图用于可追溯编辑，不进入运行时包。实际导出必须使用 `master/`、`shadow/` 和 `thumbnail/`，不能直接缩放高分辨率源图。

## 4. 生成与透明通道记录

- 生成模式：内置图像生成，分别生产三栋设施；以批准的 v4 同场景稿为视觉参考，不从场景截图抠图。
- 通用约束：`A′ 约 38° 高机位弱透视三分之四俯视；L3 近顶部正午暖白主光和天空蓝补光；明亮新能源游戏风格；完整脚点、薄地基、无地面、无文字、无 HUD、无厚展台；单栋建筑置于纯洋红色键背景。`
- 风电归一化提示：`风电·I，白色三叶片、天空蓝机舱和塔基、暖黄端部与机械细节；高而轻、小占地，保留完整叶片和维护柜。`
- 光伏归一化提示：`光伏·I，一整块立式矩形 3×4 钴蓝受光面；双叉俯仰支架、暖黄转轴、青色水平旋转环、短立柱、贴地四臂 X 形基础和小型逆变器；清楚表达双轴向日追踪，不画植物花瓣，不悬浮。`
- 火电归一化提示：`火电·I，珊瑚橙与杏橙主厂房、两根浅色烟囱、浅蓝灰机房和少量暖黄管线；中大型实体占地，不画烟雾。`
- 透明处理：使用 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 从色键源生成透明源；三个透明源与最终 RGBA 资产四角 alpha 均为 0。

## 5. 可重复导出与边界

运行 `python scripts/design/export-building-representatives.py` 可从透明源重建母图、独立阴影、缩略图、预览和 JSON 清单。脚本只做裁切、分级、锚点对齐和阴影分层，不改变建筑设计。

本包没有水电、核电、超级水电，也不得扩写储能站、变电站、总部或通用城市建筑。本包确认不授权开始完整城市组合、区域 / 世界地图或批量建筑生产；这些工作必须进入各自设计阶段后另行评审。

## 6. 收口评审

- **场景身份通过**：风电依靠高细轮廓和叶片、光伏依靠矩形受光面与双轴机构、火电依靠宽实体厂房与双烟囱辨识；颜色是辅助信息，不是唯一信息。
- **尺度与接地通过**：共同锚点下保持“风机最高、光伏中等、火电最宽”的相对关系；脚点完整，短软影独立，没有厚底座或孤立展台。
- **缩略图通过**：256px 版本保持同角度、同光照、同配色和短影，没有附加 App 图标容器，也没有为填满画布把三栋建筑强行等高。
- **生产边界通过**：只交付三个真实代表设施，色键源图不进入运行时，没有制作玩法不存在的建筑。
- **延后验收**：390×844 与 430×932 中的实际占屏、点按区域、选中态和遮挡关系必须在后续城市场景垂直切片中验证；本资产预览不能替代 Cocos 预览或真机点击。
