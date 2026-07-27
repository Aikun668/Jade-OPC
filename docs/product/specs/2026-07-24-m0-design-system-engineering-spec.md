# 宠物记忆 M0 设计系统工程执行规格

版本：v0.2（Task 2 规格完成）  
日期：2026-07-26  
状态：Task 2 全部专项已经逐项确认，本文可作为正式实施与验收规格；正式小程序代码尚未实施，仍需用户按实施计划另行授权开工

## 1. 文档职责

本文件是 `M0 — 本地 Mock 骨架` 的设计系统工程执行规格，服务对象包括无视觉能力的 Builder、代码复核者与视觉验收者。

它负责把已确认的页面图片翻译为：

- 可直接落入 `tokens.scss` 的共享设计令牌；
- 页面和组件必须遵守的测量坐标与单位规则；
- 已确认的页面布局算法；
- 已确认的核心组件施工合同；
- 完整状态矩阵、照片与草稿材质规则；
- 13 页装配说明与视觉回归验收门。

本文件不改变既有产品范围、数据、隐私、路由、Store 或 Repository 决策，也不授权创建正式小程序工程。实施步骤与进度仍由 [M0 工程骨架实施计划](../plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md) 管理。

当前版本已经包含 Task 2 的完整实施与验收边界：视觉真源、测量坐标、设计令牌、布局算法、组件合同、状态矩阵、照片展示、草稿材质、13 页装配和视觉回归。后续实现不得以“等价设计判断”为由跳过或重写这些规则。

## 2. 视觉真源与冲突处理

### 2.1 真源职责

不同来源按职责分别生效：

1. 产品行为、数据、隐私和流程结果，以时间更新、范围更具体且已明确确认的正式产品决策为准；
2. 空间首页的视觉和操作层级，以 [最终空间首页图](../assets/m0-page-baselines/04-space-home.png) 为准；
3. 其余 12 个页面的视觉，以 [M0 页面视觉基准](../assets/m0-page-baselines/README.md) 中的对应页面图为准；
4. 设计原型代码与 CSS 只用于辅助理解结构和交互，不是正式视觉真源；
5. 旧设计参数只有在本文件中重新核验并明确收入后才能继续使用，未迁入的旧数值自动失效。

图片负责回答“视觉结果是什么”，产品决策负责回答“行为和数据结果是什么”。两者发生无法按职责消解的冲突时，不得由 Builder 自行选择，必须暂停对应实现并请求确认。

### 2.2 空间首页覆盖规则

[最终空间首页图](../assets/m0-page-baselines/04-space-home.png) 与 [M0 视觉母版](../assets/2026-07-23-space-home-visual-master-v0.1.png) 必须保持内容一致。

空间首页采用以下较新的明确确认：

- 胶带、撕纸、纸面纹理、按钮位置、照片比例和纵向节奏以最终图片为准；
- “继续写”只存在于草稿纸模块内部；
- 有草稿时，草稿纸模块下方仍显示“留下一段新的记忆”主按钮；
- 点击“留下一段新的记忆”后，继续使用既有草稿冲突面板，不得静默覆盖当前草稿或创建第二条草稿；
- 当前原型中的首页 CSS 不得作为胶带、撕纸和局部比例的实现答案。

以上规则替代旧决策中“有草稿时新记忆入口必须降为低强调文字操作”的视觉层级要求，不改变“每个空间最多一条草稿”的业务约束。

### 2.3 旧参数清理

原《M0 工程骨架与设计系统决策记录》第 20 节中的精确颜色、字号、间距、圆角、胶带尺寸和胶带 CSS 已由本文件替代。

以下长期原则继续有效：

- 使用系统中文字体，不引入自定义品牌字体；
- 全局页面不使用纸张纹理、噪点背景或照片复古滤镜；
- 胶带与撕纸只允许出现在草稿提示组件；
- 橄榄色保持克制，危险色只用于不可恢复操作；
- 页面不得创建私有颜色、字号、间距、圆角或阴影值。

## 3. 统一测量坐标与单位

### 3.1 标准坐标

- 标准视觉验收视口为 `393 × 852 CSS px`；
- 12 张原型截图文件为 `394 × 852px`，宽度多出的 `1px` 来自设备屏幕边缘取整，不进入布局计算；
- 最终空间首页图为 `853 × 1844px`，测量时按宽度等比归一到 `393px` 视觉坐标，再与 `393 × 852` 标准视口对齐；
- 正式 uni-app 页面仍以 `750rpx` 为全宽逻辑坐标。

基础换算公式为：

```text
实现值 rpx = 视觉测量值 px × 750 ÷ 393
```

图片测量值不能不经归并直接写入页面。重复尺寸必须先提升为共享令牌，再按统一步长归整。Builder 不得凭视觉判断自行选择近似值。

### 3.2 单位职责

- `rpx`：页面布局、间距、组件尺寸、圆角和字号；
- `px`：发丝边框、需要保持物理厚度的细阴影；
- `deg`：局部旋转；
- `ms`：动效时长；
- 无单位数值：行高；
- 平台安全区：使用运行时安全区数据与统一布局算法，不转换为固定截图数值。

## 4. 全局设计令牌

### 4.1 颜色

```scss
$pm-color-canvas: #f7f4eb;
$pm-color-surface: #fffdf8;
$pm-color-ink: #393a31;
$pm-color-muted: #706f64;
$pm-color-line: #dfddd0;
$pm-color-olive: #68735f;
$pm-color-olive-pressed: #596452;
$pm-color-olive-soft: #edf0e9;
$pm-color-danger: #9a5d56;
$pm-color-danger-pressed: #804d47;
$pm-color-overlay: rgba(46, 48, 43, 0.76);
$pm-color-on-primary: #fffdf8;
```

约束：

- 页面背景统一使用 `$pm-color-canvas`，不得为单页创建其他米白色；
- `$pm-color-surface` 只用于需要明确边界的内容面，不把所有区块卡片化；
- 橄榄色不得扩散为大面积页面背景；
- 危险色只用于不可恢复操作的最终确认；
- 不得通过降低整个组件透明度生成禁用状态；
- 正常字号文字的前景与背景对比度不得低于 `4.5:1`；
- 最终首页图中的轻微背景明暗不扩展为全局背景纹理。

### 4.2 字体与排版

```scss
$pm-font-family:
  -apple-system,
  BlinkMacSystemFont,
  "PingFang SC",
  "Microsoft YaHei",
  sans-serif;

$pm-font-display: 50rpx;
$pm-font-page-title: 48rpx;
$pm-font-section-title: 36rpx;
$pm-font-item-title: 32rpx;
$pm-font-body: 30rpx;
$pm-font-support: 26rpx;
$pm-font-meta: 24rpx;

$pm-weight-regular: 400;
$pm-weight-medium: 500;
$pm-weight-semibold: 600;

$pm-leading-title: 1.40;
$pm-leading-compact: 1.55;
$pm-leading-body: 1.75;
```

角色映射：

| 角色 | CSS 参考值 | uni-app 值 | 典型用途 |
|---|---:|---:|---|
| `display` | 26px | `50rpx` | 首页空间名、极少数情绪标题 |
| `page-title` | 24px | `48rpx` | 页面主标题 |
| `section-title` | 18px | `36rpx` | 区块标题 |
| `item-title` | 16px | `32rpx` | 列表与入口标题 |
| `body` | 15px | `30rpx` | 正文、输入、按钮文字 |
| `support` | 13px | `26rpx` | 辅助说明、表单提示 |
| `meta` | 12px | `24rpx` | 日期、状态、极次级信息 |

页面不得自行增加 `11px / 14px / 17px / 20px / 22px` 等中间字号。确有跨页面需求时，必须先提升为共享令牌并重新确认。

中文正文使用 `$pm-leading-body`，按钮、导航和短标签使用 `$pm-leading-compact`，标题使用 `$pm-leading-title`。不设置全局字间距。

### 4.3 间距

```scss
$pm-space-1: 8rpx;
$pm-space-2: 16rpx;
$pm-space-3: 24rpx;
$pm-space-4: 32rpx;
$pm-space-5: 40rpx;
$pm-space-6: 48rpx;
$pm-space-8: 64rpx;
$pm-space-10: 80rpx;
$pm-space-12: 96rpx;
$pm-space-16: 128rpx;

$pm-page-inline: $pm-space-5;
$pm-section-gap: $pm-space-8;
$pm-content-gap: $pm-space-6;
$pm-control-gap: $pm-space-4;
$pm-text-gap: $pm-space-2;
$pm-safe-bottom-extra: $pm-space-6;
```

大块留白必须通过语义间距或弹性布局产生，不得使用页面私有任意数值贴合截图。

### 4.4 圆角、边框与阴影

```scss
$pm-radius-sm: 16rpx;
$pm-radius-md: 24rpx;
$pm-radius-lg: 36rpx;
$pm-radius-dialog: 40rpx;
$pm-radius-round: 999rpx;

$pm-border-hairline: 1px;
$pm-shadow-paper: 0 8rpx 24rpx rgba(57, 58, 49, 0.045);
```

- 普通列表不使用阴影；
- 输入区域主要依靠纸面色与细边界；
- `$pm-shadow-paper` 只用于确实悬浮的纸面、弹窗和草稿纸；
- 不建立当前页面未使用的中阴影或重阴影；
- 胶带和撕纸形状不属于普通圆角令牌。

### 4.5 控件与触控

```scss
$pm-control-height-primary: 96rpx;
$pm-control-height-regular: 88rpx;
$pm-hit-target-min: 88rpx;
$pm-icon-sm: 32rpx;
$pm-icon-md: 40rpx;
```

- 返回、更多、移除等视觉尺寸较小的操作，必须通过透明内边距达到最小热区；
- 主按钮可以按页面合同使用内容宽度或可用宽度，但高度、文字和状态必须统一；
- `$pm-radius-round` 只用于圆形头像与圆形图标底，不用于把普通主按钮变成药丸形。

### 4.6 动效

```scss
$pm-motion-fast: 120ms;
$pm-motion-base: 180ms;
$pm-motion-sheet: 240ms;
$pm-ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

- `$pm-motion-fast` 用于按下反馈；
- `$pm-motion-base` 用于普通状态变化；
- `$pm-motion-sheet` 用于弹窗与底部面板；
- 不使用呼吸、漂浮、胶带晃动或情绪化入场动画；
- 系统开启减少动态效果时，非必要过渡降为 `0ms`；
- 页面路由使用平台原生过渡，不自行叠加动画。

## 5. 页面布局算法

### 5.1 布局模型

M0 使用混合页面模板，不采用“全部自然滚动”或“全部固定底部操作”。

```text
PageShell
├─ QuietLandingLayout
├─ StandardFlowLayout
├─ TaskFormLayout
└─ ReadingLayout
```

共同原则：

- 顶部导航、安全区、页面边距和滚动边界由 `PageShell` 统一处理；
- 普通内容使用页面级自然滚动，不为每个区块创建嵌套滚动容器；
- 短页面通过弹性空白控制纵向节奏，不使用截图坐标或绝对定位；
- 表单页在键盘关闭时保持下部操作节奏，键盘打开后操作区回到普通文档流；
- 长内容页的操作随内容滚动，不悬浮遮挡原话、照片或说明；
- 只有 `ConfirmDialog`、`BottomSheet` 和 `PhotoViewer` 使用固定覆盖层。

### 5.2 运行时布局量

`PageShell` 通过统一的平台适配层读取并暴露以下运行时变量；业务页面不得直接调用平台 API 重复计算：

```scss
--pm-viewport-width;
--pm-viewport-height;
--pm-status-bar-height;
--pm-safe-bottom;
--pm-capsule-top;
--pm-capsule-left;
--pm-capsule-width;
--pm-capsule-height;
--pm-keyboard-height;
```

运行时量的来源：

- 视口、状态栏和安全区优先使用 `uni.getWindowInfo()`；
- 微信胶囊位置使用 `uni.getMenuButtonBoundingClientRect()`；
- 键盘高度使用 `uni.onKeyboardHeightChange()`；
- 读取结果由平台适配层集中转换为 CSS 变量，页面和普通组件只消费变量。

基础布局常量：

```scss
$pm-nav-row-height: 88rpx;
$pm-nav-content-gap: 24rpx;
$pm-page-bottom: 96rpx;
$pm-reading-bottom: 112rpx;
$pm-form-action-gap: 64rpx;
$pm-keyboard-content-gap: 24rpx;
$pm-layout-max-width: 480px;
```

顶部导航行的实际高度采用：

```text
capsuleNavHeight =
  2 × (capsuleTop - statusBarHeight) + capsuleHeight

navRowHeight =
  max(88rpx, capsuleNavHeight)

headerHeight =
  statusBarHeight + navRowHeight
```

在无法取得微信胶囊数据的 H5 或测试环境中，`navRowHeight` 使用 `88rpx`。不得把某一台设备的状态栏或胶囊像素写成固定常量。

### 5.3 PageShell 分区

页面根结构固定为：

```text
page-root
├─ page-header（可选）
│  ├─ status-bar-space
│  └─ navigation-row
└─ page-scroll
   └─ page-column
      ├─ page-intro（可选）
      ├─ page-content
      └─ page-actions（可选）
```

规则：

- `page-root` 使用 `$pm-color-canvas`，最小高度为当前有效视口高度；
- `page-header` 使用不透明画布色，通过 `position: sticky; top: 0` 保持可见；
- `page-scroll` 是语义内容容器，默认使用路由页面的原生纵向滚动，不得仅为普通页面创建嵌套 `<scroll-view>`；
- `page-column` 宽度为 `100%`，左右内边距使用 `$pm-page-inline`；
- 页面内容最大宽度为 `$pm-layout-max-width`，超过时水平居中；
- M0 的精确视觉验收范围为 `320–480 CSS px` 宽的竖屏手机；
- 宽度超过 `480px` 时只保证内容居中、可读且无横向溢出，不把平板视觉一致性列为 M0 验收条件；
- 页面不得使用 `100vw` 叠加左右内边距，以免产生横向滚动；
- 普通页面禁止 `overflow: hidden` 截断内容，只有照片、圆角内容面和固定覆盖层可以局部裁切。

`page-header` 的层级必须高于普通页面内容、低于弹窗和底部面板。它不增加阴影、模糊或玻璃效果，页面滚动时背景始终为 `$pm-color-canvas`。若目标微信基础库出现可靠复现的 `sticky` 兼容问题，允许降级为普通文档流导航；不得因此改成遮挡内容的固定头部。首次说明页不显示应用内导航，因此不创建空白导航占位。

### 5.4 顶部导航算法

导航行使用三列网格：

```text
left-slot | centered-title | right-slot
```

- 导航行最小高度为 `$pm-nav-row-height`；
- 左右操作的视觉图标使用 `$pm-icon-sm` 或 `$pm-icon-md`；
- 每个左右操作的实际点击热区不得小于 `$pm-hit-target-min × $pm-hit-target-min`；
- 返回操作与页面内容左边界对齐；
- 标题使用 `$pm-font-item-title`、`$pm-weight-medium` 和 `$pm-leading-compact`；
- 标题最多一行，超出时省略，不得挤压左右操作；
- 左右槽位为标题预留相同宽度，使标题相对页面视口居中；
- 右侧存在微信胶囊时，右槽位必须预留胶囊占用宽度与至少 `$pm-space-2` 间隔；
- 空间首页的应用内“更多”操作放在微信胶囊左侧的安全位置，不得与平台胶囊重叠，也不得尝试接管微信胶囊；
- 视觉基准图没有展示真实微信胶囊，因此胶囊避让属于平台适配，不视为偏离视觉基准。

返回只执行既有导航决策，不在导航组件中直接保存、删除或修改业务数据。存在未确认输入时，由页面拦截返回并打开对应确认组件。

### 5.5 QuietLandingLayout

适用页面：

- 首次说明。

算法：

- 不显示应用内顶部导航；
- 顶部内边距为 `statusBarHeight + $pm-space-8`；
- 左右内边距使用 `$pm-page-inline`；
- 主内容按正常文档流排列；
- 说明内容与主操作之间使用 `$pm-space-8`；
- 主操作后使用 `$pm-space-2` 放置低强调文字操作；
- 页面底部至少保留 `safeBottom + $pm-page-bottom`；
- 内容较短时保留大面积下方留白，不将整体强制垂直居中；
- 内容变长时自然滚动，不压缩说明文字或按钮高度。

该模板不使用 `position: absolute` 把按钮固定到截图坐标。

### 5.6 StandardFlowLayout

适用页面：

- 我的记忆空间；
- Ta 的空间首页；
- 选择记录入口；
- 全部记忆；
- Ta 的空间设置；
- 隐私说明。

算法：

- 使用标准顶部导航；没有返回或标题的槽位仍按导航网格保留对称关系；
- 导航与首个内容区之间使用 `$pm-nav-content-gap`；
- 页面主要区块之间使用 `$pm-section-gap`；
- 同一区块内关联内容使用 `$pm-content-gap` 或 `$pm-control-gap`；
- 列表、设置项和隐私段落全部进入页面主滚动，不建立内部定高滚动区；
- 流程中段的主按钮按内容顺序出现，不自动吸附屏幕底部；
- 页面底部内边距为 `safeBottom + $pm-page-bottom`；
- 空列表或短列表不通过复制占位卡片填充页面；
- 首页、列表和设置页不得为了贴合标准截图限制总高度。

空间首页使用最终图片确定区块顺序和相对节奏，但仍按本算法自然伸长；不得把胶带、按钮或“最近留下”区块绝对定位到固定纵坐标。

### 5.7 TaskFormLayout

适用页面：

- 创建 Ta 的空间；
- 文字记录；
- 照片记录；
- 编辑原话；
- AI 候选稿。

默认结构：

```text
page-column（flex column）
├─ page-intro
├─ form-content
├─ flexible-space
└─ page-actions
```

键盘关闭且内容未超过一屏时：

```text
minimumColumnHeight =
  effectiveViewportHeight
  - headerHeight
  - navContentGap
  - safeBottom
  - pageBottom
```

- `page-column` 的最小高度使用 `minimumColumnHeight`；
- `page-actions` 使用 `margin-top: auto`；
- `form-content` 与 `page-actions` 之间仍至少保留 `$pm-form-action-gap`；
- 操作区保持文档流成员，不使用 `position: fixed` 或 `position: absolute`；
- 当表单内容超过 `minimumColumnHeight` 时，弹性空白归零，操作区自然排在内容之后。

键盘打开时：

- 以键盘出现后的实际窗口高度作为 `effectiveViewportHeight`；
- 若平台窗口高度未缩小且键盘覆盖页面，才使用 `viewportHeight - keyboardHeight`，不得重复扣减键盘高度；
- 取消 `page-column` 的一屏最小高度；
- `page-actions` 的 `margin-top` 改为 `$pm-space-6`；
- 页面底部只保留 `$pm-space-4`，不再额外叠加安全区空白；
- 操作区不隐藏、不卸载，用户可以滚动到达；
- 聚焦输入框底部与键盘顶部至少保持 `$pm-keyboard-content-gap`；
- 仅在输入框确实被遮挡时执行 `scroll-into-view`，不得在每次输入时反复跳动页面；
- 键盘关闭后恢复弹性布局，但保留当前输入、焦点语义和滚动位置附近的上下文。

页面不得通过整体 `transform: translateY(...)` 顶起内容，也不得把键盘高度写入业务 Store。

### 5.8 ReadingLayout

适用页面：

- 记忆详情；
- 后续出现的同类长阅读页面。

算法：

- 使用标准顶部导航和页面级自然滚动；
- 日期、照片、原话、AI 说明与操作按内容顺序进入同一滚动流；
- 阅读正文使用完整可用内容宽度，行长通过手机宽度和页面边距自然限制；
- 照片宽度为内容区 `100%`，具体比例由后续照片专项规定；
- 正文与下一语义区块之间至少使用 `$pm-content-gap`；
- 编辑、整理、删除等操作放在对应内容之后，不固定在视口底部；
- 页面底部内边距为 `safeBottom + $pm-reading-bottom`；
- 打开照片查看器前记录页面滚动位置，关闭后恢复原位置；
- 内容加载后不得因为图片异步尺寸变化导致正文位置突然跳动，照片容器必须预留确定比例。

### 5.9 固定覆盖层与滚动锁定

只有以下组件可以覆盖视口：

- `ConfirmDialog`；
- `BottomSheet`；
- `PhotoViewer`。

覆盖层打开时：

- 覆盖层使用实际有效视口，不使用截图固定高度；
- 背景页面锁定滚动并记录当前位置；
- 关闭后恢复原滚动位置；
- 底部面板内容区最大高度为有效视口高度的 `80%`；
- 内容超过最大高度时只允许面板内容区滚动；
- 面板底部补偿 `safeBottom + $pm-space-4`；
- 键盘打开的可编辑面板按 TaskFormLayout 的键盘规则处理；
- 不允许同时叠加两个底部面板或两层确认弹窗。

### 5.10 响应式与溢出规则

- `320–480 CSS px` 使用同一套 `750rpx` 令牌和布局算法；
- 页面左右边距不设置窄屏专用魔法数，`rpx` 自然缩放；
- 文本优先换行，不通过缩小字号适配窄屏；
- 双列内容在可用宽度不足时必须转为单列或让主文本收缩，禁止横向滚动；
- 操作文字最多允许两行；主按钮高度可随两行文字增加，但不得低于 `$pm-control-height-primary`；
- 空间名、导航标题和单行列表标题使用省略规则，用户原话正文不得单行截断；
- 竖屏是 M0 精确验收方向；横屏只要求无内容丢失、可滚动且操作可达；
- 系统字体放大后，容器随内容增高，不固定文字容器高度；
- 任何页面出现横向滚动、底部操作遮挡正文、键盘遮挡焦点输入或安全区内不可点击操作，均视为布局缺陷。

## 6. 核心组件施工合同

### 6.1 通用边界

正式 M0 通用组件限定为：

```text
PageShell
PrimaryButton
TextAction
FormField
MemoryEntry
MemoryList
DraftNotice
ConfirmDialog
BottomSheet
PhotoStack
PhotoViewer
MissingContentState
DevPanel
```

其中顶部导航和页面操作区由 `PageShell` 的受控插槽实现，不额外创建只有少量样式的 `TopNavigation.vue` 或 `PageActions.vue`。

所有普通组件必须遵守：

- 不直接读取 Pinia Store、Repository、Storage、CloudBase 或 AI Service；
- 不直接执行路由跳转；
- 只通过 props 接收展示数据，通过 emits 返回用户意图；
- 不把传入对象复制为另一份长期内部业务状态；
- 不创建组件私有颜色、字号、间距、圆角或阴影值；
- 不通过绝对定位复刻整页截图；
- 不读取其他组件内部 DOM；
- 根元素使用 `box-sizing: border-box`，默认最大宽度不得超过父容器；
- 可交互元素必须使用平台可识别的按钮或输入语义，不使用普通 `<view>` 冒充按钮；
- 不嵌套两个可交互控件；
- 图标使用批准的图标资产或平台图标，不用 Emoji、ASCII 字符或临时 CSS 图形代替；
- `disabled` 或 `loading` 时不得发出重复业务事件；
- 组件卸载时清理自身注册的计时器、键盘监听和平台事件；
- 组件的文本、图片替代说明和操作标签均由调用方显式传入，不在内部编造产品文案。

组件公开接口使用 TypeScript 类型。第 6.2–6.14 节中出现的组件名、Props 名称与类型、Events 名称与载荷、插槽名称和状态语义均为固定施工合同，不是可自行改名的示例。除 `DevPanel` 外，组件不得判断当前是否为开发样本数据。

Task 2 统一创建并拥有这些共享组件。后续页面 Task 只允许通过固定公开接口组合、接入和测试；不得再次“创建”同名组件、复制内部结构或从业务页面重新设计视觉。只有发现经验证的技术不可实现点时，才能回到本规格提案并重新确认接口。组件内部 DOM、私有函数名和不改变视觉及外部行为的等价实现方式仍由 Builder自主决定。

### 6.2 PageShell

职责：

- 实现第 5 节的四类布局模板；
- 统一顶部导航、微信胶囊避让、页面边距、安全区、滚动与键盘布局；
- 向页面提供内容区与操作区，不处理保存、删除、草稿或导航业务。

固定公开接口：

```ts
export type PageLayout =
  | 'quiet-landing'
  | 'standard-flow'
  | 'task-form'
  | 'reading'

export interface PageShellProps {
  layout: PageLayout
  title?: string
  showBack?: boolean
  keyboardOpen?: boolean
}

export interface PageShellEmits {
  back: []
}
```

受控插槽：

```text
navigation-left
navigation-title
navigation-right
intro
default
actions
```

规则：

- `quiet-landing` 不渲染空导航占位；
- `showBack` 只渲染返回操作并发出 `back`，不直接调用路由；
- 页面需要拦截未保存内容时，在处理 `back` 事件后自行决定是否导航；
- `navigation-right` 必须在微信胶囊安全区左侧；
- `actions` 在 `task-form` 中使用弹性下沉算法，在其他模板中保持正常文档流；
- `PageShell` 不允许页面覆盖左右边距、导航高度或安全区算法；
- 页面可以在 `default` 插槽内使用共享间距组合区块，但不能修改壳层定位；
- `keyboardOpen` 只控制布局模式，不承载输入值或业务状态；
- 顶部导航内部图标视觉尺寸为 `$pm-icon-sm` 或 `$pm-icon-md`，点击热区不得小于 `$pm-hit-target-min`；
- 返回文案使用“返回”；页面标题最多一行，超过时省略。

### 6.3 PrimaryButton

职责：承载当前页面唯一的高强调提交或继续操作。

```ts
export type PrimaryButtonWidth = 'block' | 'content'

export interface PrimaryButtonProps {
  disabled?: boolean
  loading?: boolean
  width?: PrimaryButtonWidth
  loadingLabel?: string
}

export interface PrimaryButtonEmits {
  press: []
}
```

结构与参数：

```scss
min-height: $pm-control-height-primary; // 96rpx
padding-inline: $pm-space-8;             // 64rpx
border-radius: $pm-radius-md;            // 24rpx
font-size: $pm-font-body;                // 30rpx
font-weight: $pm-weight-medium;
line-height: $pm-leading-compact;
```

- `block` 为默认值，宽度 `100%`；
- `content` 使用内容宽度，最小宽度 `376rpx`，最大宽度 `100%`；
- 空间首页“留下一段新的记忆”使用 `content`，并由父布局水平居中；
- 默认背景为 `$pm-color-olive`，文字为 `$pm-color-on-primary`；
- 按下背景为 `$pm-color-olive-pressed`；
- 禁用状态不得通过降低整个按钮透明度实现；
- `loading` 时保留按钮原宽度，不因文案变化导致跳动；
- `loading` 与 `disabled` 均阻止 `press`；
- 连续触摸只允许当前操作发出一次事件，直到调用方解除 `loading`；
- 按钮文字允许两行并增高容器，但不得缩小字号；
- 不提供 `secondary`、`outline`、`ghost` 等未在当前视觉系统中使用的变体。

完整的禁用、加载和失败视觉遵守第 7 节状态矩阵；不得自行添加旋转图标或进度动画。

### 6.4 TextAction

职责：承载低强调操作、退出、辅助路径或危险文字操作。

```ts
export type TextActionTone = 'default' | 'muted' | 'danger'

export interface TextActionProps {
  tone?: TextActionTone
  disabled?: boolean
}

export interface TextActionEmits {
  press: []
}
```

参数：

```scss
min-height: $pm-control-height-regular; // 88rpx
padding-inline: $pm-space-2;            // 16rpx
font-size: $pm-font-support;            // 26rpx
font-weight: $pm-weight-regular;
line-height: $pm-leading-compact;
```

- `default` 使用 `$pm-color-olive`；
- `muted` 使用 `$pm-color-muted`；
- `danger` 使用 `$pm-color-danger`，只用于不可恢复操作；
- 默认无背景、无边框、无下划线；
- 点击热区不得因文字较短而低于 `$pm-hit-target-min`；
- 对齐位置由父布局控制，组件内部不提供任意 `left / center / right` 视觉变体；
- 禁用时不发出 `press`；
- 不得通过放大字号、增加填充背景或加粗到 `600` 伪装成主按钮。

### 6.5 FormField

职责：统一字段标签、输入控件、辅助说明与中性错误提示的关系。它不保存字段值，也不调用表单提交。

```ts
export interface FormFieldProps {
  label: string
  help?: string
  error?: string
}
```

插槽：

```text
default
trailing
```

结构：

```text
form-field
├─ label-row
│  ├─ label
│  └─ trailing（可选）
├─ control
└─ help-or-error（可选）
```

参数：

```scss
label-to-control: $pm-space-2;    // 16rpx
control-to-message: $pm-space-2;  // 16rpx
field-to-field: $pm-content-gap;  // 48rpx
control-min-height: $pm-control-height-regular; // 88rpx
control-padding-inline: $pm-space-3;            // 24rpx
control-border: $pm-border-hairline solid $pm-color-line;
control-radius: $pm-radius-sm;                  // 16rpx
```

- 标签使用 `$pm-font-support`、`$pm-weight-medium`；
- 输入文字使用 `$pm-font-body`；
- 辅助说明和错误使用 `$pm-font-support` 与 `$pm-leading-compact`；
- 不显示红色星号、“必填项”或感叹号；
- 同时传入 `help` 与 `error` 时只显示 `error`；
- 错误文案由页面传入，组件不根据值自行生成；
- 输入框、文本域使用 `$pm-color-surface`；
- 原生输入控件必须继承系统字体，禁止出现平台默认蓝色或黑色外框；
- 聚焦样式不得改变控件尺寸，避免页面跳动；
- 单行输入最小高度为 `88rpx`；
- 文本域提供三个共享尺寸：

```scss
$pm-textarea-short: 176rpx;
$pm-textarea-regular: 360rpx;
$pm-textarea-long: 480rpx;
```

- 文本域内边距使用 `$pm-space-4`，允许内容向下自然增长或内部滚动；具体页面采用哪个尺寸将在逐页装配说明中确认；
- `2,000` 字上限属于页面和领域校验，不写入通用组件。

### 6.6 MemoryEntry

职责：展示一条已经格式化的正式记忆摘要，并返回选择意图。

```ts
export interface MemoryEntryViewModel {
  id: string
  summary: string
  dateLabel: string
  thumbnailUri?: string
  thumbnailAlt?: string
  photoCount?: number
}

export interface MemoryEntryProps {
  item: MemoryEntryViewModel
}

export interface MemoryEntryEmits {
  select: [memoryId: string]
}
```

布局：

```text
[optional thumbnail] [summary + date] [chevron]
```

参数：

```scss
row-padding-block: $pm-space-4; // 32rpx
column-gap: $pm-space-3;        // 24rpx
thumbnail-size: 144rpx;
thumbnail-radius: $pm-radius-md;
chevron-hit-width: $pm-hit-target-min;
```

- 没有照片时不保留空缩略图槽，正文向左补齐；
- 摘要使用 `$pm-font-body` 与 `$pm-leading-compact`，最多两行，超出显示省略；
- 日期使用 `$pm-font-meta` 与 `$pm-color-muted`，保持一行；
- 文本列必须 `min-width: 0`，避免长原话挤出页面；
- 整行只有一个交互语义，不在行内嵌套第二个按钮；
- 点击行任意位置发出 `select(memoryId)`；
- 组件不读取记忆详情、不格式化日期、不排序、不导航；
- 缩略图裁切和失效状态遵守第 8.3、8.9 节。

### 6.7 MemoryList

职责：按调用方给出的顺序渲染 `MemoryEntry`，统一分隔线、列表间距和空结果插槽。

```ts
export interface MemoryListProps {
  items: MemoryEntryViewModel[]
}

export interface MemoryListEmits {
  select: [memoryId: string]
}
```

插槽：

```text
empty
footer
```

- `items` 的排序由 Store selector 或页面容器完成，组件不重复排序；
- 每条之间使用 `$pm-border-hairline` 与 `$pm-color-line`；
- 第一条之前默认不画分隔线，最后一条之后是否画线由页面区块决定；
- 不把每条记忆包成独立厚卡片；
- 空数组时只渲染 `empty` 插槽，不生成虚构占位数据；
- `footer` 用于“查看全部记忆”等列表级操作，不进入单条 `MemoryEntry`；
- 转发 `MemoryEntry` 的 `select` 事件，不执行导航。

### 6.8 DraftNotice

职责：展示一个空间当前唯一的未完成草稿，并提供唯一的“继续写”入口。

```ts
export interface DraftNoticeProps {
  title: string
  continueLabel?: string
}

export interface DraftNoticeEmits {
  continue: []
}
```

基础结构：

```text
draft-notice
├─ material-layer
├─ tape-layer
└─ content-row
   ├─ title
   └─ continue-action
```

基础参数：

```scss
width: 100%;
min-height: 192rpx;
padding-block: $pm-space-6;   // 48rpx
padding-inline: $pm-space-6;  // 48rpx
content-gap: $pm-space-4;     // 32rpx
```

- 标题使用 `$pm-font-item-title` 或经最终图片复核后的共享标题令牌；
- “继续写”使用 `TextAction` 的 `default` 语义与完整点击热区；
- 只有“继续写”是交互控件，整张纸默认不可点击；
- 组件只发出 `continue`，不提供 `dismiss`、删除或另起一段事件；
- “留下一段新的记忆”属于草稿组件外部的页面主按钮；
- 胶带、纹理、手撕轮廓和降级实现遵守第 9 节；
- 不得恢复旧伪元素胶带参数，也不得复制设计原型 CSS；
- 材质层关闭后，标题和继续操作仍必须完整可读、可点击。

### 6.9 ConfirmDialog

职责：承载两项选择的模态确认，不直接执行被确认的业务操作。

```ts
export type ConfirmDialogTone = 'default' | 'danger'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  tone?: ConfirmDialogTone
  pending?: boolean
}

export interface ConfirmDialogEmits {
  confirm: []
  cancel: []
  closed: []
}
```

参数：

```scss
width: calc(100% - 80rpx);
max-width: 640rpx;
padding: $pm-space-6;              // 48rpx
border-radius: $pm-radius-dialog;  // 40rpx
action-gap: $pm-space-2;           // 16rpx
```

- 使用 `$pm-color-overlay` 遮罩；
- 标题、说明和操作垂直排列；
- 确认操作在上，取消操作在下；
- `danger` 只改变最终确认操作的语义，不把整个弹窗染红；
- `pending` 时阻止关闭和重复确认；
- 点击遮罩默认不关闭涉及未保存内容或删除的确认弹窗；
- 打开时阻止背景交互与滚动；
- 关闭后发出 `closed`，页面负责恢复焦点或继续导航；
- 不支持三个以上操作；三项选择使用 `BottomSheet`。

完整默认、按下、等待和失败视觉遵守第 7.3 节。

### 6.10 BottomSheet

职责：承载三项选择、草稿冲突或需要更多说明的临时决策。

```ts
export interface BottomSheetProps {
  open: boolean
  title?: string
  description?: string
  closeOnMask?: boolean
}

export interface BottomSheetEmits {
  close: []
  closed: []
}
```

插槽：

```text
default
actions
```

参数：

```scss
width: 100%;
max-width: $pm-layout-max-width;
max-height: 80%;
padding-top: $pm-space-6;        // 48rpx
padding-inline: $pm-space-5;     // 40rpx
padding-bottom:
  calc(var(--pm-safe-bottom) + $pm-space-4);
border-top-left-radius: $pm-radius-dialog;
border-top-right-radius: $pm-radius-dialog;
```

- 固定在有效视口底部并水平居中；
- 标题与说明不滚动，内容超高时只让中间内容区滚动；
- 操作默认纵向排列，间距 `$pm-space-2`；
- 草稿冲突面板的三个选择顺序必须与正式产品决策一致；
- 涉及删除或放弃输入时，`closeOnMask` 必须为 `false`；
- 不实现未经确认的拖拽关闭或下滑手势；
- 同一时间只允许一个底部面板；
- 不在面板内直接删除草稿或导航，所有选择通过页面提供的子组件事件返回。

### 6.11 PhotoStack

职责：展示单条记忆的照片集合入口，维护当前可见序号并发出打开查看器的意图。

```ts
export interface PhotoViewModel {
  id: string
  uri: string
  alt: string
  availability: 'available' | 'expired'
}

export interface PhotoStackProps {
  items: PhotoViewModel[]
  initialIndex?: number
}

export interface PhotoStackEmits {
  open: [index: number]
  change: [index: number]
}
```

- 按调用方顺序展示，不在组件内部重排；
- 打开查看器时返回索引，不传递或修改业务实体；
- 容器必须在图片加载前预留确定比例，避免页面跳动；
- 图片使用 `mode="aspectFill"` 对应的居中裁切语义；
- 不添加滤镜、暗角、纸纹或复古效果；
- 空数组时不渲染空框；
- 精确比例、多图指示器、滑动和失效状态遵守第 8 节。

### 6.12 PhotoViewer

职责：在固定覆盖层中查看同一条记忆的照片，不提供分享、下载、转发或编辑。

```ts
export interface PhotoViewerProps {
  open: boolean
  items: PhotoViewModel[]
  initialIndex: number
}

export interface PhotoViewerEmits {
  close: []
  change: [index: number]
}
```

- 覆盖完整有效视口并高于其他普通组件；
- 打开时锁定背景滚动并记录详情页滚动位置；
- 关闭后由页面恢复详情页原滚动位置；
- 关闭操作热区不得小于 `$pm-hit-target-min`；
- 支持同一记忆内左右切换，不跨记忆加载；
- 不把临时照片路径写入日志、路由或测试截图说明；
- 具体背景色、图片适配、页码样式和失效状态留到照片专项。

### 6.13 MissingContentState

职责：处理 ID 合法但内容已经不存在的页面状态。

```ts
export interface MissingContentStateProps {
  title?: string
  description: string
  actionLabel: string
}

export interface MissingContentStateEmits {
  action: []
}
```

参数：

```scss
min-height: 320rpx;
padding-block: $pm-space-12; // 96rpx
text-gap: $pm-space-2;
action-gap: $pm-space-6;
```

- 使用正常页面画布，不显示技术错误码、堆栈或空白页；
- 标题使用 `$pm-font-section-title`，说明使用 `$pm-font-body` 与 `$pm-color-muted`；
- 操作使用 `TextAction` 或页面明确要求的 `PrimaryButton`；
- 组件只发出 `action`，页面决定返回空间或空间列表；
- 加载尚未完成时不得提前显示该状态。

### 6.14 DevPanel

职责：只在开发构建中切换受控样本与失败场景，不属于用户产品界面。

- 必须通过编译时开发环境判断完全排除在生产构建之外；
- 不得仅使用 CSS 隐藏生产 DOM；
- 可以读取开发场景控制接口，但不得直接修改 Repository 内部数据结构；
- 不显示真实用户原话、照片路径、身份信息或 Storage 完整快照；
- 不复用用户产品文案伪装为正式功能；
- 具体入口和视觉保持最低限度，不进入 13 张用户页面视觉基准。

### 6.15 组件组合与测试边界

允许的依赖方向：

```text
页面
→ PageShell
→ 展示与操作组件

MemoryList
→ MemoryEntry

DraftNotice
→ TextAction

ConfirmDialog / BottomSheet
→ PrimaryButton / TextAction

页面
→ PhotoStack
→ PhotoViewer（由页面控制打开状态）
```

禁止：

- `PrimaryButton`、`TextAction`、`MemoryEntry` 或 `DraftNotice` 读取 Store；
- `MemoryEntry` 自行打开详情页；
- `ConfirmDialog` 自行删除数据；
- `BottomSheet` 自行替换草稿；
- `PhotoStack` 自行读取相册；
- `PageShell` 保存输入或处理业务错误。

组件测试至少验证：

- props 能够稳定渲染对应内容；
- emits 的事件名称和载荷；
- `disabled / loading / pending` 时不重复发出事件；
- `MemoryList` 保持调用方顺序；
- `MemoryEntry` 长摘要不会造成横向溢出；
- `DraftNotice` 只有一个继续入口；
- 弹窗和底部面板打开时滚动锁定，关闭后恢复；
- `DevPanel` 不进入生产构建。

纯静态排版不追求无意义的 DOM 快照覆盖率。完整视觉状态遵守第 7 节，截图回归与验收遵守第 11 节。

## 7. 完整状态矩阵

### 7.0 文案确认状态

本节的状态划分、触发条件、数据保留、操作锁定、成功导航和失败恢复规则已经根据正式产品决策形成。

本节沿用的既有文案，以及新增加的加载、成功、失败和恢复文案，已经由用户于 2026-07-24 整组确认。Builder 必须按本节使用，不得自行改写。

### 7.1 状态模型与反馈时序

页面级异步操作统一使用：

```ts
export type AsyncStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error'

export interface AsyncOperationState {
  status: AsyncStatus
  errorMessage: string | null
  startedAt: number | null
}
```

该状态属于页面短生命周期 UI 状态，使用页面内 `ref / reactive`，不得进入 Pinia、Repository 快照或路由参数。

全局时序：

```scss
$pm-feedback-delay: 150ms;
$pm-feedback-min-visible: 300ms;
$pm-success-visible: 1200ms;
```

- 用户触发操作后立即进入 `pending` 并锁定重复触发；
- 操作在 `150ms` 内完成时不显示加载反馈；
- 超过 `150ms` 后才显示加载文案，避免界面闪烁；
- 加载反馈一旦出现且操作完成后仍停留当前页面，至少保持 `300ms`；发生成功导航或错误恢复时立即切换，不为满足最小时长延迟数据提交、导航或错误呈现；
- 成功后立即提交 Store 状态；
- 成功后需要导航的操作不显示额外 Toast，直接按既定导航返回；
- 成功后停留当前页面的操作可以显示不超过 `1200ms` 的行内“已保存”；
- 错误必须显示在对应操作附近，关键失败不得只使用会自动消失的 Toast；
- 失败时保留用户输入、照片选择和当前滚动上下文；
- 同一页面同一时间只允许一个写入操作处于 `pending`；
- 用户取消系统相册或主动关闭非破坏性面板属于 `idle`，不显示错误。

M0 不使用骨架屏、全屏旋转加载动画、虚假进度条或连续成功庆祝动画。

### 7.2 通用组件状态

#### PrimaryButton

| 状态 | 视觉 | 交互 |
|---|---|---|
| `default` | 橄榄背景、浅色文字 | 可触发一次 `press` |
| `pressed` | `$pm-color-olive-pressed`，尺寸不变 | 使用 `$pm-motion-fast` 返回默认态 |
| `loading-hidden` | 触发后前 `150ms` 保持原文案和尺寸 | 已锁定，不再发出 `press` |
| `loading-visible` | 使用调用方传入的“保存中…”等文案；不显示旋转图标 | 已锁定 |
| `disabled` | `$pm-color-olive-soft` 背景、`$pm-color-muted` 文字；不降低整体透明度 | 不响应触摸 |

- `loading` 不改变按钮宽度、高度、圆角或页面位置；
- 加载文案必须描述当前操作，不统一写成无意义的“处理中”；
- 调用方必须在触发回调的同一同步周期内设置 `loading`，防止连续触摸竞态。

#### TextAction

| 状态 | 视觉 | 交互 |
|---|---|---|
| `default` | 使用自身 tone 颜色 | 可触发 |
| `pressed` | 文字颜色保持，背景使用极轻 `$pm-color-olive-soft` | 触摸结束恢复 |
| `disabled` | `$pm-color-muted`，不增加删除线 | 不触发 |

`TextAction` 不承载独立加载动画。触发异步操作后，由所属 `PrimaryButton`、弹窗或面板显示 pending；若它是唯一操作，允许把文案切换为明确的进行时文本。

#### FormField

| 状态 | 边界与文案 | 数据 |
|---|---|---|
| `empty` | 普通细边框；允许占位说明 | 值为空 |
| `focused` | 边框改为 `$pm-color-olive`，厚度仍为 `1px` | 不改变容器尺寸 |
| `filled` | 普通细边框，显示用户内容 | 保留原值 |
| `validation-error` | 边框改为 `$pm-color-ink`；控件下显示中性错误文案 | 不清空、不自动修正 |
| `readonly-pending` | 保持原颜色和内容，不降低整块透明度 | 暂停修改 |
| `submission-error` | 恢复可编辑；操作区显示失败说明 | 保留原值和光标上下文 |

- 错误不能只通过颜色表达；
- 创建空间名称为空时固定提示“先写下 Ta 的名字。”；
- 超过 2,000 字时提示“这段内容有些长，可以稍微收一收再留下。”，不截断或静默丢弃；
- 用户开始修改后，旧的提交错误可以清除；字段校验错误在满足条件后清除；
- 保存失败后不得自动聚焦到第一个字段并把用户从当前滚动位置拉走。

#### ConfirmDialog

| 状态 | 行为 |
|---|---|
| `closed` | 不渲染可交互遮罩 |
| `open` | 锁定背景滚动，确认与取消可用 |
| `pending-hidden` | 前 `150ms` 保持原布局，所有关闭路径已锁定 |
| `pending-visible` | 确认按钮显示明确进行时文案，取消操作禁用 |
| `error` | 弹窗保持打开；说明下方显示失败文案；恢复确认与取消 |

删除失败统一使用：“刚才没有删除成功，内容还在这里。可以再试一次。”

#### BottomSheet

| 状态 | 行为 |
|---|---|
| `closed` | 不占页面布局 |
| `open` | 锁定背景滚动，显示当前决策 |
| `pending` | 锁定遮罩关闭和所有操作 |
| `error` | 面板保持打开，内容和原业务数据不变，显示行内失败说明 |

草稿替换失败使用：“刚才没有处理成功，原来的草稿还在。”

### 7.3 应用初始化与路由读取

#### 应用初始化

| 状态 | 页面显示 | 操作 |
|---|---|---|
| `not-started` | 纯画布，不显示错误或空状态 | 无 |
| `loading < 150ms` | 保持纯画布 | 无 |
| `loading ≥ 150ms` | 居中显示“正在准备你的记忆空间…” | 禁止进入业务页 |
| `ready` | 根据 Store 数据进入正确页面 | 正常 |
| `error` | “暂时没有打开这里。” + “再试一次” | 重试 `bootstrap` |
| `unsupported-version` | “这里的数据来自更新的版本，当前版本暂时不能打开。” | 不覆盖快照；只允许退出或更新后再试 |

初始化失败不得自动执行“重置体验数据”。开发者重置只能从 `DevPanel` 明确触发。

#### 路由内容读取

```text
bootstrap 未完成
→ 继续等待

bootstrap 完成 + 参数无效
→ 返回合理上级 + 轻提示

bootstrap 完成 + ID 合法但对象不存在
→ MissingContentState

bootstrap 完成 + 对象存在
→ 正常页面
```

- 读取期间不得提前闪现“内容不存在”；
- 本地读取超过 `150ms` 时显示“正在打开…”；
- 缺少或非法路由参数不显示技术错误页；
- 内容不存在时使用既有文案“这段内容已经不在这里”，并提供返回空间或空间列表的明确操作。

### 7.4 页面数据组合状态

#### 我的记忆空间

| 状态 | 页面内容 |
|---|---|
| `empty` | 空状态说明 + 创建空间主操作 |
| `with-spaces` | 按既定排序显示空间列表 + 低强调创建另一空间入口 |
| `loading` | 仅用于 bootstrap；不显示列表骨架 |
| `error` | 初始化错误状态，不伪装成空列表 |

首次使用不经过空间列表空状态；该空状态只用于删除最后一个空间后或日后主动返回列表时。

#### Ta 的空间首页

| 草稿 | 正式记忆 | 页面组合 |
|---|---|---|
| 无 | 无 | 空首页 + “留下一段” |
| 有 | 无 | `DraftNotice` + “留下一段新的记忆”，不显示虚构最近记忆 |
| 无 | 有 | 主按钮 + 最近 1–3 条记忆 |
| 有 | 有 | `DraftNotice` + 新记忆按钮 + 最近 1–3 条记忆 |

- 有草稿时“继续写”只存在于 `DraftNotice` 内；
- 点击新记忆按钮进入草稿冲突面板；
- 最近记忆为空时不显示空分隔线或“查看全部记忆”；
- 只要存在至少 1 条正式记忆，就显示“查看全部记忆”；首页仍最多展示最近 3 条。

#### 全部记忆

| 状态 | 页面内容 |
|---|---|
| `empty` | 中性空状态与返回空间入口 |
| `with-items` | 时间倒序列表 |
| `item-deleted` | 删除成功后移除该行并保持合理滚动位置 |
| `photo-expired` | 记忆行仍存在，照片区域使用失效状态 |

空状态与初始化错误必须是两个不同状态。

### 7.5 创建、记录与编辑

#### 创建空间

| 状态 | 主操作 | 数据处理 |
|---|---|---|
| `pristine` | 可点击后执行名称校验 | 名称为空、无照片 |
| `dirty-valid` | “创建 Ta 的空间” | 保留输入 |
| `validation-error` | 不提交 | 显示“先写下 Ta 的名字。” |
| `pending` | “正在创建…” | 输入只读，禁止返回重复提交 |
| `success` | 无额外 Toast | Store 更新后进入空间首页 |
| `error` | 恢复“创建 Ta 的空间” | 名称和照片保留，显示“刚才没有创建成功，填写的内容还在。可以再试一次。” |

未填写任何内容时返回直接离开；已有名字或照片时返回使用既有确认弹窗。

#### 文字记录与编辑原话

| 状态 | 页面行为 |
|---|---|
| `pristine-empty` | 主按钮可触发校验；离开不弹窗 |
| `dirty` | 允许保存或退出选择 |
| `over-limit` | 不提交；保留全文；显示长度提示 |
| `pending` | 文本域只读；主按钮显示“正在留下…”或“正在保存…” |
| `success` | Store 更新后导航；不显示成功 Toast |
| `error` | 恢复编辑；原话、照片选择和滚动位置保持 |

保存记忆失败使用：“刚才没有保存下来，这段内容还在这里。可以再试一次。”

保存修改失败使用：“刚才没有保存修改，原话还在这里。可以再试一次。”

退出状态：

```text
无输入
→ 直接离开

有未确认输入
→ 打开草稿选择或修改确认

已保存成功
→ 直接离开
```

#### 照片记录

| 状态 | 页面行为 |
|---|---|
| `no-photo` | 展示低强调选择照片入口 |
| `picker-opening` | 锁定重复选择；低于 150ms 不显示反馈 |
| `picker-cancelled` | 回到 `no-photo`，不报错 |
| `permission-denied` | 说明照片可选，并提供“重新选择”；不得阻止文字记录路径 |
| `selected` | 显示预览、更换和移除 |
| `save-pending` | 保留预览，锁定更换和移除 |
| `save-error` | 保留预览和文字，恢复操作 |
| `expired-after-restart` | 不显示破图；显示既有照片失效说明 |

权限拒绝文案使用：“这次没有选到照片。你可以重新选择，也可以先只留下文字。”

照片引用失效文案使用：“这张照片只用于上次预览，没有保存到云端。”

预览比例、失效占位和多图指示器的视觉遵守第 8 节，不改变本状态行为。

### 7.6 草稿状态

#### 退出时保存草稿

| 状态 | 行为 |
|---|---|
| `dialog-open` | 显示既有草稿选择 |
| `save-pending` | “正在留在草稿里…”；锁定关闭 |
| `save-success` | Store 更新后返回空间首页 |
| `save-error` | 弹窗保持；页面输入仍在；显示“刚才没有留在草稿里，这段内容还在当前页面。” |
| `discard-confirmed` | 不写入草稿，直接离开 |

#### 已有草稿时另起一段

| 状态 | 行为 |
|---|---|
| `sheet-open` | 显示继续、替换、先不动三项 |
| `continue-existing` | 关闭面板并进入现有草稿 |
| `replace-pending` | 锁定面板，删除旧草稿及其专属会话照片 |
| `replace-success` | 进入记录入口 |
| `replace-error` | 面板保持；旧草稿完整保留；显示失败说明 |
| `cancelled` | 关闭面板，数据不变 |

不得在 `replace-pending` 时提前从 Store 移除草稿。

### 7.7 AI 候选稿

AI 候选稿页面使用单一路由内状态：

```ts
export type AiDraftPageState =
  | 'authorization-required'
  | 'loading'
  | 'success'
  | 'insufficient'
  | 'unavailable'
  | 'save-pending'
  | 'save-error'
```

| 状态 | 页面内容 | 可用操作 |
|---|---|---|
| `authorization-required` | 明确本次处理范围 | 同意继续 / 继续使用原话 |
| `loading < 150ms` | 保留说明区，不显示动画 | 无重复请求 |
| `loading ≥ 150ms` | “正在整理这段原话…” | 继续保留原话可见 |
| `success` | 一个可编辑候选稿 + 原话参考 | 保存候选稿 / 继续使用原话 |
| `insufficient` | 说明当前原话不足以安全整理 | 继续使用原话 |
| `unavailable` | 暂时无法整理 | 再试一次 / 先保留原话 |
| `save-pending` | 候选稿只读；“正在保存…” | 禁止重复保存 |
| `save-error` | 候选稿恢复编辑并完整保留 | 再试一次 / 继续使用原话 |

文案：

- `insufficient`：“这段原话暂时不适合整理，保留现在的样子就很好。”
- `unavailable`：“刚才没有整理出来。你的原话没有受到影响。”
- `save-error`：“刚才没有保存整理后的版本，候选稿还在这里。”

约束：

- loading 不隐藏用户原话；
- 失败不得清空候选稿或覆盖原话；
- “再试一次”只重新调用一次受控 mock，不生成第二个并列候选稿；
- 用户选择继续使用原话属于成功退出，不显示失败提示；
- 不展示模型名、人格头像、思考过程或虚假进度。

### 7.8 删除状态

#### 删除单条记忆

```text
dialog-open
→ delete-pending
→ success: 更新 Store，返回列表或空间首页
→ error: 弹窗保持，记忆与照片引用不变
```

#### 删除整个空间

```text
dialog-open
→ delete-pending
→ success: 更新 Store，返回空间列表
→ success + 无剩余空间: 进入空间列表空状态
→ error: 弹窗保持，空间、记忆、草稿和照片引用全部不变
```

- 删除成功前不得提前从 UI 移除正式数据；
- pending 时确认文案使用“正在删除…”；
- 失败使用通用删除失败文案；
- 不增加第二层确认；
- 删除失败后取消按钮恢复可用，用户可以安全退出弹窗。

### 7.9 照片可用性

```ts
export type PhotoAvailabilityState =
  | 'loading'
  | 'available'
  | 'expired'
  | 'load-error'
```

| 状态 | 规则 |
|---|---|
| `loading` | 保留确定比例，不显示骨架闪烁 |
| `available` | 正常居中裁切或查看原图 |
| `expired` | 显示 M0 会话照片失效说明，不请求不存在的本地路径 |
| `load-error` | 不显示破图；显示“这张照片暂时没有打开。”并允许重新进入页面后再试 |

- `expired` 是已知生命周期结果，不等同于网络错误；
- 文字和记忆记录在照片失效后继续显示；
- 只有照片的记忆仍保留其记录和失效说明；
- 打包样本照片加载失败使用 `load-error`，不得错误表述为“没有保存到云端”。

照片专项将补充各状态的占位尺寸和视觉图形。

### 7.10 成功、错误与提示纪律

成功反馈：

- 创建、保存记忆、保存修改、保存草稿和删除后发生导航时，不使用 Toast；
- 设置页保存成功且停留当前页时，在主操作下显示“已保存”，最多 `1200ms`；
- AI 候选稿保存成功后返回详情，由详情页展示最新数据，不弹庆祝提示。

错误反馈：

- 与字段有关的错误放在字段下方；
- 与一次提交有关的错误放在操作区上方；
- 与弹窗操作有关的错误留在弹窗内部；
- 与整页初始化有关的错误使用页面级状态；
- 不使用系统错误码、异常名称、接口名称或技术栈信息；
- 不使用“失败！”、“出错了！”等带感叹号的高压表达；
- 不用危险色表达普通保存、网络或 AI 错误；
- 错误消失前必须有明确的用户动作或状态变化，不依赖短暂 Toast 自动消失。

### 7.11 状态互斥与数据提交纪律

- `pending` 与同一操作的 `error / success` 互斥；
- 弹窗与底部面板不得同时打开；
- 照片查看器打开时不得再打开底部面板；
- 页面导航只发生在 Repository 成功、Store 提交完成之后；
- Repository 失败时 Store 不提交乐观数据；
- UI 可以立即锁定重复操作，但不得提前显示成功结果；
- 页面离开前必须清理 pending 计时器，不得让旧页面延迟反馈污染新页面；
- 路由返回后，上级页面重新从 Store selector 获取摘要、草稿与排序；
- 照片临时路径、用户原话和错误详情不得写入日志、路由或开发提示；
- 开发者面板可以切换受控失败场景，但不得改变生产状态分支。

### 7.12 状态验证清单

自动化组件与页面测试至少覆盖：

- 加载反馈在 `150ms` 前不出现、之后出现；
- loading 出现后不改变按钮尺寸；
- pending 期间重复点击只产生一次写入；
- 创建和保存失败后输入完整保留；
- 草稿替换失败后旧草稿仍存在；
- 删除失败后正式数据未从 Store 消失；
- bootstrap 完成前不显示内容不存在；
- 空列表与初始化错误不混淆；
- 相册取消不显示错误；
- 照片失效不显示破图且文字仍在；
- AI `success / insufficient / unavailable` 三种结果；
- AI 失败与候选稿保存失败都不覆盖原话；
- 弹窗、底部面板和照片查看器互斥；
- 成功导航不额外显示 Toast；
- 普通错误不使用危险色或感叹号文案。

真机验收至少覆盖：

- 快速保存与超过 `150ms` 的保存；
- 键盘打开时保存失败和输入保留；
- 相册取消、权限拒绝、重新选择；
- 应用重启后的会话照片失效；
- 删除 pending 期间返回手势；
- iPhone 与 Android 上覆盖层、键盘和加载文案的位置。

## 8. 照片展示专项

### 8.1 总体原则

- 用户照片保持原始色彩，不添加滤镜、暗角、纸纹、噪点、复古色调或情绪化遮罩；
- 普通页面使用居中裁切，全屏查看器使用完整适配；
- 照片容器在资源加载前预留确定尺寸或比例，避免页面跳动；
- 所有圆角与边界来自本节或全局令牌；
- 照片不使用直角，不使用重阴影；
- 用户相册临时路径不得进入日志、路由、公开样本或错误文案；
- `session-only` 与 `bundled` 的生命周期必须真实呈现，不得用可见图片掩盖已经失效的用户照片；
- 只有详情页多图使用叠放；空间首页和所有列表只显示单张缩略图；
- 单条记忆最多 9 张照片，始终保持用户选择顺序，不提供拖拽排序；
- 照片组件不读取相册、不保存文件、不修改业务实体。

新增照片令牌：

```scss
$pm-photo-space-list: 144rpx;
$pm-photo-space-create: 224rpx;
$pm-photo-space-home: 176rpx;
$pm-photo-memory-thumb: 144rpx;
$pm-photo-editor-thumb: 112rpx;

$pm-photo-preview-ratio: 1.25; // 5:4
$pm-photo-detail-ratio: 1.18;

$pm-photo-radius-thumb: 24rpx;
$pm-photo-radius-large: 36rpx;
$pm-photo-radius-stack: 44rpx;

$pm-photo-stack-reserve-x: 64rpx;
$pm-photo-stack-reserve-y: 32rpx;

$pm-photo-viewer-bg: rgba(46, 48, 43, 0.96);
```

### 8.2 空间照片

| 场景 | 尺寸 | 圆角 | 裁切 |
|---|---:|---:|---|
| 空间列表 | `144rpx × 144rpx` | `24rpx` | `aspectFill` |
| 创建空间预览 | `224rpx × 224rpx` | `36rpx` | `aspectFill` |
| 空间首页 | `176rpx × 176rpx` | `36rpx` | `aspectFill` |
| 空间设置 | `144rpx × 144rpx` | `24rpx` | `aspectFill` |

- 裁切中心默认为图片中心，不做面部识别或智能重定位；
- 创建页与设置页使用原始图片资源重新渲染，不从其他页面截图裁切；
- 更换空间照片不影响任何记忆照片；
- 移除空间照片后立即恢复无照片占位，不需要二次确认；
- 无照片占位使用 `$pm-color-olive-soft`、`1px` 细边框与 Ta 名字的第一个可见字素；
- 无照片占位不得使用宠物 Emoji、随机插画或默认动物照片；
- `144rpx` 占位文字使用 `$pm-font-section-title`；
- `176rpx / 224rpx` 占位文字使用 `$pm-font-page-title`；
- 名字为空的异常测试状态使用中性圆点图标资产，不自行猜测字符。

### 8.3 记忆列表缩略图

```scss
width: $pm-photo-memory-thumb;  // 144rpx
height: $pm-photo-memory-thumb; // 144rpx
border-radius: $pm-photo-radius-thumb;
object-fit: cover;
```

- 有多张照片时只显示当前记忆的第一张可用照片；
- 不在列表中叠放多图、不显示轮播点、不显示照片数量角标；
- 没有照片时移除整个缩略图列，文字区向左补齐；
- 第一张照片失效但后续存在可用照片时，使用第一张可用照片作为缩略图；
- 所有照片均失效时保留 `144rpx` 失效占位，表示这条记忆曾包含照片；
- 失效缩略图使用 `$pm-color-olive-soft`、细边框和批准的“图片不可用”图标；
- 列表缩略图不单独响应点击，整行仍只有一个详情入口。

### 8.4 记录页照片编辑布局

用户已确认采用“一张大预览 + 横向缩略图条”的方案。

结构：

```text
photo-editor
├─ active-preview
│  ├─ active-image
│  └─ active-photo-actions
├─ thumbnail-strip（2 张以上时）
│  ├─ thumbnail × n
│  └─ add-photo（少于 9 张时）
└─ photo-help
```

主预览：

```scss
width: 100%;
aspect-ratio: $pm-photo-preview-ratio; // 5:4
border-radius: $pm-photo-radius-large; // 36rpx
overflow: hidden;
```

- 主预览使用 `aspectFill`；
- 只有一张照片时不渲染空缩略图条；
- 主预览右下角可以显示浅色操作面，承载“更换照片”或“移除这张”；
- 操作面背景使用 `rgba(255, 253, 248, 0.92)`，圆角 `$pm-radius-sm`；
- 操作文字使用 `$pm-font-meta` 与 `$pm-color-ink`；
- 操作热区不得小于 `$pm-hit-target-min`；
- 不在照片四角同时堆放多个操作。

缩略图条：

```scss
margin-top: $pm-space-3; // 24rpx
gap: $pm-space-2;        // 16rpx
thumbnail-size: $pm-photo-editor-thumb; // 112rpx
thumbnail-radius: $pm-radius-sm;        // 16rpx
```

- 使用单行横向滚动，不换成第二行；
- 横向滚动不改变页面纵向滚动；
- 当前缩略图使用 `2px` `$pm-color-olive` 外轮廓，使用 `outline` 避免尺寸跳动；
- 非当前缩略图使用 `1px` `$pm-color-line` 边界；
- 点击缩略图只切换主预览，不改变照片顺序；
- 少于 9 张时在末尾显示同尺寸的“添加照片”入口；
- 添加入口使用 `$pm-color-surface`、细边框、批准的添加图标和完整替代说明；
- 达到 9 张后移除添加入口，不显示“10/9”等错误计数；
- 不使用拖拽排序、照片墙或瀑布流。

移除当前照片后：

```text
仍有同索引照片
→ 同索引成为当前照片

移除的是最后一张
→ 前一张成为当前照片

移除后数量为 0
→ 回到 no-photo 状态
```

照片选择、移除和切换只更新页面临时状态；正式保存仍按 Repository 成功后再提交 Store。

### 8.5 详情页单图

单张照片直接使用前层照片尺寸，不渲染空的后层：

```scss
width: 100%;
aspect-ratio: $pm-photo-detail-ratio; // 1.18
border-radius: $pm-photo-radius-large;
object-fit: cover;
```

- 单图容器不额外预留叠放的右侧与底部空间；
- 点击照片进入 `PhotoViewer`；
- 不显示 `1 / 1` 数量角标；
- 只使用 `$pm-shadow-paper` 级别的极轻阴影或细边框，不同时叠加两者。

### 8.6 详情页多图叠放几何

多图叠放不是单独旋转后层，而是缩放、位移、旋转基点、遮挡比例与容器预留的组合。

容器：

```scss
width: 100%;
padding-right: $pm-photo-stack-reserve-x;  // 64rpx
padding-bottom: $pm-photo-stack-reserve-y; // 32rpx
border-radius: $pm-photo-radius-stack;     // 44rpx
overflow: visible;
```

基础照片框：

```text
baseWidth =
  containerWidth - photoStackReserveX

baseHeight =
  baseWidth / 1.18
```

最多渲染三个视觉层：

| 层级 | z-index | 缩放 | 右移 | 下移 | 顺时针旋转 | 旋转基点 |
|---|---:|---:|---:|---:|---:|---|
| 前层 | 3 | `1.00` | `0` | `0` | `0deg` | `bottom right` |
| 第二层 | 2 | `0.97` | `12rpx` | `12rpx` | `2deg` | `bottom right` |
| 第三层 | 1 | `0.94` | `24rpx` | `24rpx` | `4deg` | `bottom right` |

建议结构：

```text
photo-stack
└─ stack-canvas（正常文档流，决定基础高度）
   ├─ layer-position（位移）
   │  └─ layer-card（旋转 + 缩放 + 图片）
   ├─ layer-position
   │  └─ layer-card
   └─ layer-position
      └─ layer-card
```

建议实现：

```scss
.photo-stack {
  width: 100%;
  padding-right: $pm-photo-stack-reserve-x;
  padding-bottom: $pm-photo-stack-reserve-y;
}

.photo-stack__canvas {
  position: relative;
  width: 100%;
  aspect-ratio: $pm-photo-detail-ratio;
}

.photo-layer-position {
  position: absolute;
  inset: 0;
}

.photo-layer-card {
  width: 100%;
  height: 100%;
  transform-origin: bottom right;
  border-radius: $pm-photo-radius-large;
}

.photo-layer-position--front,
.photo-layer-card--front {
  transform: none;
}

.photo-layer-position--second {
  transform: translate(12rpx, 12rpx);
}

.photo-layer-card--second {
  transform: rotate(2deg) scale(0.97);
}

.photo-layer-position--third {
  transform: translate(24rpx, 24rpx);
}

.photo-layer-card--third {
  transform: rotate(4deg) scale(0.94);
}
```

实现约束：

- 必须以右下角为变换基点，使后层主要从右侧和底部露出；
- 第二层约保留 `97%` 尺寸，第三层约保留 `94%`，不得把后层缩到像独立缩略图；
- 在标准 `670rpx` 内容宽度下，第二层相对前层向右露出约 `29rpx`、向下露出 `12rpx`；
- 第三层相对第二层再向右露出约 `28rpx`、向下露出 `12rpx`；
- 第三层相对前层的累计右侧露出约 `58rpx`、累计底部露出 `24rpx`；
- `64rpx` 横向预留用于容纳第三层围绕右下角旋转后向右伸出的右上角；不得擅自缩回 `32rpx`；
- 三层总包围盒必须完全落在容器预留区内，不得触发页面横向滚动；
- 后层使用与前层相同的 `1.18` 比例和 `36rpx` 圆角；
- 每个后层最多使用细边框或极轻阴影，不用重阴影制造 3D；
- 不使用透视、`rotateX / rotateY`、弹簧、飞出、自动轮播或持续漂浮；
- 超过三张照片时仍只渲染三层，数量通过角标表达；
- 后层图片必须是真实的下一张和再下一张照片，不允许重复前层图片伪造层数；
- 只有两张照片时不渲染第三层；
- 页面截图和低端设备不得通过关闭后层来伪装性能优化。

位移必须放在外层，旋转与等比缩放放在内层，避免 H5 与微信运行时对组合变换顺序产生不同结果。不得为了减少 DOM 层级而重新合并后改变最终几何。

标准 `670rpx` 页面内容区的几何校验值：

| 项目 | 前层 | 第二层 | 第三层 |
|---|---:|---:|---:|
| 基础宽度 | `606rpx` | `606rpx` | `606rpx` |
| 基础高度 | 约 `514rpx` | 约 `514rpx` | 约 `514rpx` |
| 变换后最右坐标 | `606rpx` | 约 `635rpx` | 约 `664rpx` |
| 变换后最下坐标 | 约 `514rpx` | 约 `526rpx` | 约 `538rpx` |

叠放容器的总包围盒约为 `670rpx × 546rpx`。第三层仍保留约 `6rpx` 横向和 `8rpx` 纵向安全余量，因此旋转边缘不会碰到页面内容边界。

### 8.7 多图切换

- 左右滑动使下一张或上一张成为前层；
- 使用平台原生触摸/滑动能力，不实现需要持续跟手的复杂物理引擎；
- 有效切换后，后层按照新的索引顺序重新计算；
- 第一张向右滑不循环到最后一张，最后一张向左滑不循环到第一张；
- 不自动轮播；
- 切换动画使用 `$pm-motion-base` 与 `$pm-ease-standard`；
- 动画只包含短距离位移、缩放和旋转过渡，不做弹簧回弹；
- 系统减少动态效果时，直接切换层级；
- 点击当前前层照片进入查看器，并以当前索引打开；
- 滑动与页面纵向滚动发生冲突时，只有水平位移明显大于纵向位移才切换照片。

数量角标：

```scss
right: $pm-space-3;  // 24rpx
bottom: $pm-space-3; // 24rpx
padding: 10rpx 16rpx;
font-size: $pm-font-meta;
color: $pm-color-on-primary;
background: rgba(46, 48, 43, 0.68);
border-radius: $pm-radius-sm;
```

- 使用 `1 / 3` 格式；
- 单图不显示；
- 角标不响应点击；
- 角标不得遮挡主要操作，因为照片本身没有内嵌业务按钮。

### 8.8 PhotoViewer

查看器覆盖完整有效视口：

```scss
background: $pm-photo-viewer-bg;
z-index: overlay;
```

结构：

```text
photo-viewer
├─ viewer-header
│  ├─ close
│  └─ count
└─ viewer-swiper
   └─ image
```

- 顶部区域避让状态栏和微信胶囊；
- 关闭操作使用“关闭”，点击热区不得小于 `$pm-hit-target-min`；
- 数量使用 `1 / 3` 格式与 `$pm-font-meta`；
- 主图可用区域左右至少保留 `$pm-space-5`；
- 主图使用 `aspectFit`，不得裁掉原图内容；
- 可左右查看同一条记忆中的照片；
- 不跨记忆预加载；
- 不提供分享、下载、转发、评论、删除或编辑；
- 不显示照片文件名、路径、EXIF 或拍摄位置；
- 关闭后恢复详情页原滚动位置；
- 系统返回手势与“关闭”执行相同退出逻辑；
- 查看器不是深色主题入口，关闭后立即恢复暖白页面。

### 8.9 加载、失效与错误

#### 加载

- 照片加载前保留确定比例；
- 不使用闪烁骨架屏；
- 可以使用 `$pm-color-surface` 作为静态底色；
- 加载完成后原位淡入，时长不超过 `$pm-motion-base`；
- 加载失败不继续反复请求同一本地失效路径。

#### `session-only` 失效

- 使用与原照片相同的容器尺寸与圆角；
- 背景为 `$pm-color-olive-soft`，边界为 `$pm-color-line`；
- 使用批准的“图片不可用”图标；
- 大图状态显示：“这张照片只用于上次预览，没有保存到云端。”；
- 缩略图只显示图标，完整说明在详情页出现；
- 失效照片不可打开 `PhotoViewer`；
- 文字、日期、AI 候选稿和记忆记录继续正常显示。

#### 其他加载错误

- 打包样本照片加载失败显示：“这张照片暂时没有打开。”；
- 不把打包资源错误误写成照片未保存；
- 错误状态不显示破图图标、空白透明框或浏览器默认替代文本；
- 重新进入页面时允许重新尝试打包样本资源。

### 8.10 隐私、性能与测试

- 图片组件不得把 `uri` 写入控制台、错误提示或测试快照；
- 页面卸载后释放不再使用的临时预览引用；
- 列表只加载当前可见或临近的缩略图，不预解码全部原图；
- 详情页最多同时渲染三个叠放视觉层；
- 查看器只保留当前、上一张和下一张的必要资源；
- 缩略图与详情图使用原资源的显示模式，不在 M0 建立新的持久化缩略图服务；
- M0 不声称用户临时照片已可靠保存。

自动化至少验证：

- 各场景尺寸、比例和圆角使用正确令牌；
- 列表无照片时不保留空列；
- 2 张照片只渲染两层，3–9 张最多渲染三层；
- 第二、第三层使用 `0.97 / 0.94` 缩放与规定偏移、旋转；
- 多图切换后索引、前层照片和数量角标同步；
- 编辑页最多 9 张，移除当前照片后的索引规则正确；
- 失效照片不产生 `<image>` 破图请求；
- `PhotoViewer` 使用完整适配且没有分享、下载和编辑入口；
- 关闭查看器后恢复详情页滚动位置。

真机至少检查：

- iPhone 与 Android 的 `aspectFill / aspectFit`；
- 叠放后的实际可见边缘和总包围盒；
- 水平切换与页面纵向滚动不冲突；
- 9 张照片的缩略图横向滚动；
- 相册取消、拒绝、重新选择和临时路径失效；
- 长图、竖图、横图、低分辨率图片和透明图片；
- 微信胶囊、安全区与查看器关闭操作不重叠。

## 9. 草稿纸与胶带材质专项

### 9.1 视觉与资产

`DraftNotice` 必须匹配最终空间首页视觉母版中的轻微手作纸张效果，但不在运行时使用 CSS 拼接纸纤维、撕边或胶带。

```scss
$pm-draft-notice-width: 670rpx;
$pm-draft-notice-height: 208rpx;
$pm-draft-notice-padding-left: 48rpx;
$pm-draft-notice-padding-right: 40rpx;
```

- 使用一张透明背景 PNG 材质资产，建议源尺寸为 `1340px × 416px`，标准显示尺寸为 `670rpx × 208rpx`；
- 材质资产包含暖白纸面、轻微纸纤维、自然手撕边缘、左上双层半透明胶带与极轻阴影；
- 材质资产必须依据最终首页视觉母版重新制作，不得直接裁剪页面截图；
- 文案、箭头和点击区域不得烘焙进材质图片；
- 资产只允许等比缩放，不使用九宫格拉伸，不通过 CSS 旋转制造倾斜；
- 不叠加伪元素胶带、`clip-path` 撕边、额外纸纹或第二层阴影；
- 草稿材质只用于 `DraftNotice`，不得扩散到页面背景、列表或弹窗。

### 9.2 内容与操作

```text
draft-notice
├─ material-image
└─ content-layer
   ├─ summary
   └─ continue-action
      ├─ label
      └─ arrow-icon
```

- 主文案固定为“有一段还没写完的记录”，使用 `$pm-font-body`、`$pm-color-ink`，保持单行；
- “继续写”使用 `$pm-font-body` 与 `$pm-color-olive`；
- 文字与箭头间距为 `16rpx`，箭头使用批准的 `32rpx` 图标资产，不使用文本箭头字符；
- 左侧内容起点为 `48rpx`，右侧操作终点距组件右边 `40rpx`；
- 内容层在 `208rpx` 高度内垂直居中；
- “继续写”的点击热区不得小于 `$pm-hit-target-min`；
- 只有“继续写”响应点击，整张纸及材质图片均不可点击；
- 组件外部的“留下一段新的记忆”继续使用独立 `PrimaryButton`，间距由空间首页装配规则决定。

### 9.3 动效、降级与验收

- 不使用晃动、漂浮、呼吸、胶带揭起或入场动画；
- 材质资产加载失败时，使用 `$pm-color-surface`、`1px` `$pm-color-line` 边界、`$pm-shadow-paper` 和 `$pm-radius-sm` 形成普通暖白纸面；
- 降级状态保持相同尺寸、文案、排版和点击热区，不显示破图图标；
- 自动化验证整张纸不可点击、“继续写”只发出一次 `continue` 事件、材质失败后交互仍可用；
- 真机验证 `320–480px` 视口下无文字重叠、无横向滚动，胶带与撕边清晰但不抢过正文；
- 视觉回归以最终空间首页图中的草稿模块为直接基准，纸张轮廓、胶带位置、文字层级和主按钮间距不得回退到旧原型效果。

## 10. 13 页装配说明

### 10.1 共享装配纪律

- 每页只能使用本节指定的四类页面模板，不得创建第五种页面骨架；
- 顶部导航、页面边距、区块间距、安全区、滚动和键盘行为统一继承第 5 节；
- 标准状态分别对应 [M0 页面视觉基准](../assets/m0-page-baselines/README.md) 中的 `01–13` 图片；
- 弹窗、底部面板、照片查看器、加载、失败与内容不存在均为页面局部状态，不新增路由；
- 长文字使页面自然增长，不缩小字号、不截断正文、不用绝对定位贴合截图；
- 页面只编排共享组件，不复制组件内部结构，不新增页面私有颜色、字号、圆角或阴影；
- 区块不存在时，后续区块向上自然补位，不保留为标准截图预留的空白；
- 页面完成异步操作后的导航结果与第 7 节状态矩阵一致。

### 10.2 页面装配表

| 编号 | 页面与基准 | 页面模板 | 内容顺序 | 导航、操作与滚动 |
|---|---|---|---|---|
| 01 | 首次说明；`01-onboarding.png` | `QuietLandingLayout` | 品牌标记 → 页面说明 → 本地隐私提示 → “开始” → “先看看隐私说明” | 不显示顶部导航；两项操作整体弹性下沉 |
| 02 | 我的记忆空间；`02-spaces.png` | `StandardFlowLayout` | 顶部标题 → 简短说明 → 空间列表 → “再为一位 Ta 创建空间” | 根页面不显示返回；右侧提供创建入口；自然滚动 |
| 03 | 创建 Ta 的空间；`03-space-create.png` | `TaskFormLayout` | 页面说明 → 空间照片 → 名字字段 → 创建 → 取消 | 返回空间列表；键盘关闭时操作区下沉，打开时回到文档流 |
| 04 | Ta 的空间首页；`04-space-home.png` | `StandardFlowLayout` | 身份区 → `DraftNotice`（存在时）→ 新记忆按钮 → 最近记忆 → 查看全部 | 返回空间列表；右侧进入设置；自然滚动；严格使用最终首页母版 |
| 05 | 选择记录入口；`05-record-entry.png` | `StandardFlowLayout` | 页面说明 → 四个记录入口 → “这次先看看” | 返回空间首页；入口保持文档流，不固定在底部 |
| 06 | 文字记录；`06-record-text.png` | `TaskFormLayout` | 问题提示 → 原话输入 → 添加照片 → 辅助入口 → 保存原话 → 保存草稿 | 返回记录入口；使用表单键盘规则 |
| 07 | 照片记录；`07-record-photo.png` | `StandardFlowLayout` | 页面说明 → 大图预览与缩略图条 → “先只留下照片” → “说说最先想起的事” → 会话照片说明 | 返回记录入口；缩略图横向滚动不影响页面纵向滚动；本页不新增文字输入框 |
| 08 | 全部记忆；`08-memories.png` | `StandardFlowLayout` | 空间名称与数量 → `MemoryList` → 列表结束说明 | 返回空间首页；使用原生页面滚动 |
| 09 | 记忆详情；`09-memory-detail.png` | `ReadingLayout` | 日期 → 照片或 `PhotoStack` → 原话 → AI 整理入口 | 返回实际来源页；右侧编辑原话；全部操作随内容滚动 |
| 10 | 编辑原话；`10-memory-edit.png` | `TaskFormLayout` | 修改范围说明 → 原话输入 → 保存修改 → 取消修改 | 返回记忆详情；使用表单键盘规则 |
| 11 | AI 候选稿；`11-ai-draft.png` | `TaskFormLayout` | AI 范围说明 → 候选稿标识 → 候选稿输入 → 原话引用 → 保存候选稿 → 继续只用原话 | 返回记忆详情；使用表单键盘规则 |
| 12 | Ta 的空间设置；`12-space-settings.png` | `StandardFlowLayout` | 空间照片 → 名字字段与保存 → 隐私入口 → 删除范围与删除操作 | 返回空间首页；自然滚动；危险区始终位于最后并与保存区至少间隔 `$pm-section-gap` |
| 13 | 隐私说明；`13-privacy.png` | `ReadingLayout` | 页面说明 → 文字存储 → 照片生命周期 → AI 范围 → 删除范围 → “我知道了” | 返回实际来源页；按钮随内容滚动，不悬浮 |

### 10.3 必要收缩与例外

- 01、02 是根层页面：01 无导航栏，02 有标题与创建操作但无返回操作；
- 03、06、10、11 的底部操作只在键盘关闭且剩余高度足够时下沉，不使用固定定位；
- 07 保持既有双入口流程：直接保存照片，或进入 06 补充原话；不得在本页复制一套文字编辑器；
- 09 没有照片时直接从日期进入原话；单图与多图分别遵守第 8 节，不保留空照片槽；
- 12 的保存只影响资料编辑，删除操作必须位于独立危险区并打开确认弹窗；
- 13 可以从首次说明或设置页进入；关闭后返回实际来源页，实现时不得通过复制第二个隐私页面解决；
- 任何页面在标准内容之外出现错误说明时，错误块插入相关内容之后、主要恢复操作之前，不覆盖原内容。

## 11. 视觉回归与验收流程

### 11.1 通过定义与证据层级

视觉验收采用三层证据，不以单一像素分数或单次人工观察代替完整结论：

```text
固定状态与自动化检查
→ 微信开发者工具标准截图
→ 同尺寸并排、叠层与差异复核
→ iPhone / Android 真机专项检查
→ P0–P3 分级与最终结论
```

最终 `passed` 必须同时满足：

- 13 个标准页面全部具有微信开发者工具截图并通过本节检查；
- 第 7 节高风险状态均通过自动化或运行时检查；
- iPhone 与 Android 的代表页面完成真机检查；
- `P0 = 0`、`P1 = 0`、`P2 = 0`；
- 所有 P3 均记录原因、证据与接受结论；
- 最终报告可以从固定 fixture、代码版本和基准清单追溯。

浏览器或 H5 预览只用于提前发现布局问题，不能替代微信开发者工具和真机证据。

### 11.2 基准 manifest 与变更控制

正式基准为 [M0 页面视觉基准](../assets/m0-page-baselines/README.md) 中的 13 张图片，其中：

- `04-space-home.png` 是空间首页唯一视觉真源；
- `2026-07-23-space-home-visual-master-v0.1.png` 与它内容一致，只承担高分辨率母版存档职责，不算第 14 个回归对象；
- 其余 12 张图片是对应页面标准状态的直接视觉基准；
- 标准比较视口为 `393 × 852 CSS px`；
- `394 × 852px` 文件中多出的 1px 只允许按既有屏幕边缘取整说明处理。

比较前必须生成唯一的 `393 × 852px` 归一化副本：

```text
01–03、05–13：
  原图 394 × 852
  → 删除最右侧 x = 393 的边缘取整列
  → 得到 393 × 852
  → 不缩放、不裁其他边

04：
  原图 853 × 1844
  → 保持比例，高质量缩放到 393 × 850
  → 放入 393 × 852 画布
  → 顶部、底部各补 1px #f7f4eb
  → 不做非等比拉伸
```

- 原始基准永不改写，归一化副本写入当次证据目录；
- manifest 同时记录原图和归一化副本的 SHA-256、原始尺寸、归一化方法与输出尺寸；
- 所有几何阈值均针对归一化后的 `393 × 852px` 比较坐标；
- 自动实现截图若不是 `393 × 852px`，必须先解释平台输出比例并记录变换；不得通过任意缩放掩盖布局偏差。

实施前生成基准 manifest，至少记录：

```ts
interface VisualBaselineEntry {
  pageId: string
  route: string
  baselineFile: string
  width: number
  height: number
  fixture: string
  state: string
  sha256: string
}
```

- Builder、测试脚本和复核者不得为了使差异测试通过而替换、裁切或重新压缩基准图；
- 基准变更必须记录原因、受影响页面和新旧校验值，并再次获得用户明确确认；
- 基准变更与实现修复必须分开提交证据，不允许在同一次变更中互相掩盖；
- 基准变更后必须重建 manifest、保留旧哈希，并重跑所有受影响页面及共享组件波及页面；
- 平台管理区域的遮罩规则属于比较配置，不得写回基准图片。

### 11.3 截图获取责任与降级通道

Codex 或自动化执行者应优先尝试自动采集：

1. 定位微信开发者工具 CLI；
2. 导入 `dist/dev/mp-weixin`；
3. 使用固定 fixture 进入目标页面；
4. 等待图片、字体、异步状态和动画稳定；
5. 输出 13 张标准截图及运行日志。

自动化能力必须经过实际探测，不得仅因存在 CLI 或自动化依赖就宣称可用。

若 Codex 无法访问微信开发者工具、自动化端口或 GUI：

- 该外部能力限制本身不构成产品失败；
- 用户只需一次性提供最终候选版本的 13 张标准页面截图；
- 文件名使用 `01-onboarding.png` 至 `13-privacy.png`；
- 用户不负责测量、比较、分级或编写报告；
- Codex 或复核者接收截图后负责文件完整性、尺寸、状态、差异与报告；
- 不再要求用户为高风险状态、修复中间轮次、两种平台或多种宽度额外提供成套截图。

迭代期间只重拍受影响页面和共享组件波及页面；所有 P0–P2 清零后，再生成或收集一次完整 13 页终版。

### 11.4 标准截图条件

标准截图必须满足：

- 微信开发者工具模拟视口为 `393 × 852 CSS px`；
- 使用同一套“团团完整样本”、固定日期、中文语言和默认系统字体大小；
- 截图时关闭键盘、调试面板、性能面板、光标和开发提示；
- 页面进入稳定态后再截图：图片加载完成、异步过程结束、动画停止；
- 标准状态不得混入弹窗、底部面板、加载、失败或焦点状态；
- 截图出现 `394 × 852px` 时，只允许移除屏幕边缘取整产生的 1px，不得任意拉伸；
- 只允许在比较副本中遮罩平台管理的状态栏、微信胶囊和 Home Indicator；
- 应用导航、内容、安全区留白、照片和覆盖层不得遮罩。

平台遮罩必须来自当次运行时状态栏高度、`menuButtonRect` 和安全区数据，并同时应用到基准副本与实现截图。遮罩之外另做结构检查，证明应用返回、标题和右侧操作没有与微信胶囊相交；不得扩大遮罩来隐藏应用布局错误。

截图运行记录至少包含页面、路由、fixture、状态、视口、平台、代码版本、生成时间、资源错误数量和控制台错误数量。

### 11.5 结构零容忍项

出现以下任一情况，不考虑像素差异比例，直接判定至少为 P1 或 P2：

- 组件缺失、多出、顺序错误或使用错误页面模板；
- 主按钮、返回、编辑、删除或恢复操作的层级与位置错误；
- 内容被遮挡、截断、越界或产生横向滚动；
- 通过缩小字号、压缩行高或隐藏文字贴合截图；
- 照片比例、裁切语义、单图/多图形式或数量指示器错误；
- 草稿纸退回旧 CSS 假胶带、伪元素撕边或错误材质；
- 危险操作缺少独立确认或删除范围说明；
- 页面出现未批准的颜色、字号、圆角、阴影、纹理或动画；
- 微信胶囊、状态栏、键盘或底部安全区遮挡应用内容；
- 点击热区小于规格值，或视觉控件与实际热区明显错位。

### 11.6 几何、排版与颜色阈值

在 `393 × 852 CSS px` 标准视口下：

| 项目 | 最大允许误差 |
|---|---:|
| 固定组件宽高 | `±1 CSS px` |
| 页面左右边距 | `±2 CSS px` |
| 组件内部间距 | `±2 CSS px` |
| 普通区块纵向位置 | `±3 CSS px` |
| 大段弹性留白 | `±4 CSS px` |
| 圆角 | `±1 CSS px` |
| `1px` 边框 | 必须保持 `1px` |
| 点击热区 | 不得小于规格值 |

- 误差不得跨区块累计；多个分别在单项阈值内的偏差若造成整体明显漂移，仍判定失败；
- 字号、字重、行高和颜色的计算样式必须精确使用对应令牌，不适用截图几何容差；
- 标准 fixture 下标题和短文案的行数必须与基准一致；
- 正文允许系统中文字体产生细微字形差异，但不得改变明显换行节奏、信息层级或内容密度；
- 截图抗锯齿、子像素和无损截图编码造成的轻微色差可以归为 P3；
- 照片主体裁切、草稿材质、中文换行和整体留白必须人工复核，不能只看数值。

### 11.7 比较方法与自动预警

每个标准页面至少形成：

1. 原始基准图；
2. 实现截图；
3. 同尺寸并排图；
4. `50%` 透明叠层图；
5. 显著像素差异图与统计；
6. 页面结论与问题编号。

显著差异像素定义为：完成允许遮罩和 1px 邻域抗锯齿容忍后，任一颜色通道差值超过 `24` 的像素。

- 显著差异超过应用内容区 `2%` 时，自动进入人工复核；
- 关键组件区域显著差异超过 `4%` 时，至少登记为 P2，除非证据证明全部来自允许的平台渲染差异；
- 差异比例低于阈值不代表自动通过；
- 首页草稿材质、照片和平台字体不使用单一像素分数裁决；
- 截图必须先放入同一张比较输入，再判断布局、裁切、材质、排版与视觉层级；只分别查看两张图不算完成视觉复核。

### 11.8 响应式与高风险状态

响应式验收：

- `393px`：执行完整视觉比较；
- `320px`：验证无横向滚动、无文字重叠、内容完整、操作可达；
- `480px`：验证内容上限、留白和照片比例没有失控；
- 横屏和平板只要求内容完整、可滚动和操作可达，不要求匹配标准截图。

高风险状态至少覆盖：

- 键盘打开与关闭；
- 弹窗和底部面板；
- 空数据与内容不存在；
- 保存失败；
- AI 加载、失败与恢复；
- 照片失效；
- 9 张照片缩略图；
- 三层照片叠放；
- 长文字与字体放大；
- 系统减少动态效果。

这些状态优先通过组件测试、运行时测量和自动截图取证。自动截图不可用时，不要求用户额外提交成套图片，但执行者必须留下测试结果或人工检查记录。

### 11.9 真机范围

iPhone 与 Android 至少抽查：

- 空间首页；
- 文字记录；
- 照片记录；
- 记忆详情；
- 空间设置；
- 隐私说明。

重点检查微信胶囊与安全区、键盘抬升与收起、照片横向手势、页面纵向滚动、查看器关闭、系统返回手势、长内容和低性能降级。

真机不要求两种平台各提交完整 13 页截图；只有发现异常或需要证明修复时才补问题截图。设备型号、系统版本、微信版本、开发者工具版本和检查结果写入真机记录。

### 11.10 问题分级与阻断

| 等级 | 定义 | 处理 |
|---|---|---|
| P0 | 页面不可用、内容丢失、隐私边界或删除范围错误 | 立即阻断 |
| P1 | 核心结构、主操作、导航、安全区、键盘或恢复路径错误 | 阻断 |
| P2 | 超出阈值的尺寸、间距、排版、颜色、裁切、材质或组件状态偏差 | 阻断 |
| P3 | 不影响结构、信息和操作的轻微平台渲染差异 | 记录后逐项接受 |

- P0–P2 不允许通过备注、已知问题或“后续优化”豁免；
- P3 必须记录页面、区域、原因、截图证据和接受人；
- 修复后必须重跑直接受影响页面、共享组件波及页面和原失败状态；
- 任何修复造成新的 P0–P2 时，重新打开验收，不得沿用旧 `passed`。

### 11.11 证据目录与最终报告

建议证据目录：

```text
output/visual-regression/<run-id>/
├─ manifest.json
├─ actual/
├─ normalized/
├─ comparisons/
├─ diffs/
├─ runtime-checks/
├─ device-checks.md
└─ report.md
```

最终报告至少记录：

- 代码版本与构建产物；
- 13 张截图的来源、尺寸和完整性；
- 自动截图能力探测结果；
- 每页比较结论；
- 高风险状态检查结果；
- iPhone 与 Android 真机记录；
- P0–P3 问题及修复前后证据；
- 基准 manifest 与校验值；
- 最终 `passed / failed` 结论。

### 11.12 最终验收门

按顺序通过五个验收门：

```text
G0 质量门
→ typecheck、unit tests、component tests、生产构建通过

G1 证据门
→ 13 张标准截图完整、命名正确、状态正确

G2 视觉门
→ 结构、几何、排版、颜色、照片和材质通过

G3 体验门
→ 高风险状态、320/480 宽度、iPhone/Android 通过

G4 交付门
→ P0–P2 清零、P3 逐项接受、报告为 passed
```

任一验收门失败，后续门不得代替前序门，最终状态必须保持 `failed`。

## 12. Task 2 完成状态与实施边界

Task 2 的设计与验收规格已经完成并经用户逐项确认。本文现在可以作为无视觉 Builder、代码复核者与视觉验收者的唯一 Task 2 工程真源。

规格完成不等于代码已经实施：

- `apps/pet-memory-miniapp` 尚未创建；
- 实施计划中的 71 个复选框仍未执行；
- 必须由用户另行明确授权开始实施后，才能按计划进入 Task 1；
- 实施阶段不得重新讨论或自行替换已确认设计，除非发现可证明的技术不可实现点并回到本规格变更流程。
