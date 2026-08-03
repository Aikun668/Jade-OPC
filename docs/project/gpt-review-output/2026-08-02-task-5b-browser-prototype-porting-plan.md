# Task 5B 浏览器原型迁移与首次创建闭环实施计划

日期：2026-08-02  
状态：已确认、待 Builder 实施  
适用范围：M0 Task 5B；页面 01、03、13  
实施顺序：Task 5A 有条件验收后，Task 6 开工前  

> 本计划用于指导没有可靠视觉判断能力的 Builder 与 Logic Reviewer。它不替代 Task 5B 验收标准，而是把“参考浏览器原型进行确定性移植”补充为明确的施工方法、平台适配规则和视觉证据闭环。

## 1. 目标

将已经在浏览器原型中完成视觉设计的三个页面迁移到微信小程序：

```text
01 首次说明
├─ 13 隐私说明 → 返回 01
└─ 开始 → 03 创建 Ta 的空间 → 04 Ta 的空间首页
```

本轮不是让 Builder 只凭文字重新设计页面，也不是把 React 代码机械翻译成 Vue。正确方法是：

```text
浏览器原型提供视觉结构和布局意图
正式规格提供产品与业务真源
现有 uni-app 架构提供工程边界
微信平台 API 提供胶囊、安全区、键盘和相册适配
```

最终必须同时达到：

- 三页视觉方向与浏览器原型和页面基准一致；
- 首次说明、隐私和创建空间形成真实可恢复的业务闭环；
- 页面不绕过 Store、Repository、NavigationAdapter 和 PhotoPicker；
- 微信胶囊、安全区、键盘和系统返回得到真实平台适配；
- Task 5A 的 02、04、08 不发生回归；
- Builder、Logic Reviewer 与视觉负责人分别在自己的能力范围内给出证据。

## 2. 已确认的工作方式

### 2.1 为什么使用浏览器原型

浏览器原型不是废弃代码，而是本轮可直接追溯的产品参考实现。它已经包含：

- 页面内容顺序；
- 主次操作层级；
- 大部分间距、字号、圆角和颜色意图；
- 01、03、13 的页面构图；
- 已经得到用户认可的安静、克制的视觉方向。

因此 Builder 必须直接阅读原型 JSX 与 CSS，不得只阅读几段文字后自行发挥。

### 2.2 原型不是什么

原型不是业务逻辑真源，也不是可直接复制的跨平台代码。它没有完整实现：

- 首次说明状态的持久化与失败恢复；
- 旧快照兼容；
- 创建空间的校验、相册失败、重复提交和原子写入；
- 脏表单返回保护；
- 微信自定义导航、胶囊和安全区；
- 微信键盘、权限和系统返回；
- 稳定页面栈；
- 生产环境 DevPanel 隔离。

所以本轮采用“双轨迁移”，而不是 React → Vue 的逐行翻译。

### 2.3 双轨迁移

| 轨道 | 真源 | Builder 职责 | Reviewer 职责 |
|---|---|---|---|
| 视觉轨 | 页面基准、原型 JSX/CSS、设计令牌 | 按结构移植并做微信平台适配 | 检查证据完整，不代替视觉裁决 |
| 业务轨 | 正式规格、Task 5B 验收标准、Repository/Store/Navigation 合同 | 用 Vue/Pinia/Adapter 实现真实状态机 | 反证数据、失败、导航和边界 |

两条轨道最后在真实微信页面合流。任何一条单独通过都不能宣布 Task 5B 完成。

## 3. 真源优先级

发生差异时按以下顺序裁决：

1. `docs/product/assets/m0-page-baselines/01-onboarding.png`、`03-space-create.png`、`13-privacy.png`；
2. 已确认的正式产品规格、Task 5B 验收标准和设计令牌；
3. 浏览器原型的 JSX、CSS 和资产；
4. Builder 的实现推断。

相关文件：

```text
apps/pet-memory-design-prototype/src/Prototype.tsx
apps/pet-memory-design-prototype/src/prototype.css

docs/product/assets/m0-page-baselines/
├─ 01-onboarding.png
├─ 03-space-create.png
└─ 13-privacy.png

docs/project/acceptance/
└─ 2026-07-28-task-5b-onboarding-space-creation-acceptance-standard.md
```

若原型交互与正式规则冲突，保留原型视觉，使用正式业务规则。例如：

- 原型“开始”直接切页；小程序必须先持久化 onboarding，再进入 03；
- 原型创建页只有成功态；小程序必须增加校验、选图失败、返回保护和提交失败；
- 原型隐私页固定返回 01；小程序必须解析白名单来源，Task 5B 先完成 onboarding 来源。

## 4. 微信胶囊与自定义导航合同

### 4.1 平台事实

微信小程序右上角胶囊由宿主控制，不属于应用 DOM，位置会随设备、系统、微信版本和窗口变化。不得从浏览器原型复制一个固定右上角空白，也不得硬编码某款 iPhone 的像素值。

正式运行时使用微信官方 API：

- [`wx.getMenuButtonBoundingClientRect()`](https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html)：读取胶囊 `top/right/bottom/left/width/height`；
- [`wx.getWindowInfo()`](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getWindowInfo.html)：读取窗口宽度、安全区域和状态栏高度。

### 4.2 必需的布局数据

在 `src/adapters/platform-layout.ts` 中扩展现有平台布局结果，至少保留：

```ts
interface PlatformLayout {
  statusBarHeight: string
  navRowHeight: string
  capsuleTop: string
  capsuleLeft: string
  capsuleRight: string
  capsuleBottom: string
  capsuleWidth: string
  capsuleHeight: string
  capsuleRightInset: string
  capsuleGuardRight: string
  safeBottom: string
}
```

计算含义：

```ts
const verticalGap = Math.max(capsuleRect.top - statusBarHeight, 0)
const navRowHeight = capsuleRect.height + 2 * verticalGap
const capsuleRightInset = Math.max(windowWidth - capsuleRect.right, 0)

// 从胶囊左边缘一直到屏幕右边缘的完整不可用区
const capsuleGuardRight = Math.max(windowWidth - capsuleRect.left, 0)
```

当前 `PageShell` 只用 `capsuleWidth + 16rpx` 预留右侧空间，遗漏了 `windowWidth - capsuleRect.right`。这会让“更多”、保存、关闭等右侧操作在不同设备上向胶囊靠得过近，甚至发生遮挡。本轮必须改为使用完整的 `capsuleGuardRight`。

### 4.3 合法性检查与降级

只有下列条件都成立时才采用微信返回的胶囊矩形：

```text
width > 0
height > 0
right > left
bottom > top
left >= 0
top >= statusBarHeight
right <= windowWidth
```

无 API、抛错或矩形非法时：

- 使用现有安全默认导航高度；
- `capsuleGuardRight` 使用不会导致内容溢出的保守值；
- 不因平台数据缺失阻断浏览器测试或组件测试；
- 记录为 fallback，不输出私人数据或完整系统信息。

### 4.4 `PageShell` 的固定行为

`PageShell` 必须统一负责胶囊避让，页面不得各写一套 magic number。

| 区域 | 固定规则 |
|---|---|
| 右侧操作 | 右边缘不得越过“胶囊左边缘 - 最小视觉间距” |
| 中间标题 | 在可用导航区域中保持视觉居中，不被胶囊挤偏 |
| 左侧返回 | 满足最小点击热区，不与标题重叠 |
| 01 quiet-landing | 首屏内容起点必须低于胶囊底部加安全间距 |
| 03 task-form | 返回、标题和键盘状态都使用同一导航几何 |
| 13 reading | 长文滚动时导航保持稳定，标题不进入胶囊区 |

不要在 01、03、13 中重复调用胶囊 API；只消费 `usePlatformLayout()`。

### 4.5 胶囊反证夹具

测试至少覆盖：

1. iPhone 风格矩形：`windowWidth=393`、`statusBarHeight=54`、`rect={ top:62, right:368, bottom:94, left:281, width:87, height:32 }`；
2. Android 风格的不同状态栏、不同胶囊宽度和右边距；
3. 胶囊矩形全部为 0；
4. API 抛错；
5. 窗口宽度变化后重新计算；
6. 右侧按钮较长时仍不与胶囊重叠；
7. 页面标题较长时截断而不是挤进胶囊区。

第一组数值只是测试样本，禁止写入产品样式常量。

## 5. 三页视觉迁移地图

### 5.1 01 首次说明

参考：

```text
Prototype.tsx: OnboardingScreen
prototype.css: .page-shell--onboarding、.onboarding-mark、.onboarding-note、.page-actions--bottom
基准图: 01-onboarding.png
目标: src/pages/onboarding/index.vue
PageShell: quiet-landing
```

必须保留的视觉结构：

```text
呼吸留白
→ 克制的圆形识别标记
→ “宠物记忆”眉题
→ 主标题与说明
→ 隐私提示/隐私入口
→ 靠近底部但避开安全区的“开始”主操作
```

平台改造：

- 原型固定 `padding-top: 88px` 改为胶囊和状态栏驱动；
- 不复制浏览器设备外框；
- 使用 `PageShell quiet-landing`、现有 `PrimaryButton` 与 `TextAction`；
- pending 超过 150ms 才显示“正在准备…”；
- DevPanel 展开时不参与标准截图。

禁止：

- 把页面改成普通居中登录页；
- 增加微信登录、头像、昵称或授权入口；
- 用大图、渐变、卡片或额外装饰重做视觉；
- 为避开胶囊直接写固定 `100px/200rpx` 顶部空白。

### 5.2 03 创建 Ta 的空间

参考：

```text
Prototype.tsx: SpaceCreateScreen
prototype.css: .cover-picker、.form-stack、.text-input、.page-actions--bottom
基准图: 03-space-create.png
目标: src/pages/space-create/index.vue
PageShell: task-form
```

必须保留的视觉结构：

```text
自定义导航返回
→ 页面说明
→ 单张空间照片选择区
→ 名称输入区与温和帮助文案
→ 弹性留白
→ 创建主操作
```

平台改造：

- 原型预填“团团”仅用于视觉预览，正式 empty 流程初始名称为空；
- 原型静态照片替换为 PhotoPicker 的 selected/cancelled/denied/failed 状态；
- 输入框使用真实小程序 `input` 和 Task 2 `FormField`；
- 键盘打开时主操作仍可达，不依靠固定视口高度；
- 页面按钮和系统返回走同一 dirty guard；
- 右上区域即使当前没有业务操作，也必须使用统一胶囊安全导航。

禁止：

- 在页面直接调用 `uni.chooseMedia`、Storage 或 Repository；
- 把选中的临时照片描述为已上传或永久保存；
- 用原型 hard-coded Mock 数据创建空间；
- 创建失败后清空表单。

### 5.3 13 隐私说明

参考：

```text
Prototype.tsx: PrivacyScreen
prototype.css: .privacy-sections
基准图: 13-privacy.png
目标: src/pages/privacy/index.vue
PageShell: reading
```

必须保留的视觉结构：

```text
自定义导航与“隐私说明”标题
→ 页面引言
→ 使用细分隔线组织的说明段落
→ 足够行高和段落间距
```

业务内容以正式验收标准为准，至少覆盖：M0 本地 Mock、会话照片、M1 CloudBase、Mock AI、删除不可恢复和无虚假导出。

平台改造：

- 不复制浏览器标签选择器，全部使用明确类名，避免 WXSS 组件选择器警告；
- 页面长文使用原生页面滚动；
- `source=onboarding` 返回 01 且不改变 onboarding 状态；
- 预留 `source=settings` 白名单，但不提前实现 Task 9 设置页。

## 6. 本轮必须先修正的上游合同

### 6.1 旧快照首次说明状态

当前 `src/repositories/snapshot-validation.ts` 在缺少 `hasCompletedOnboarding` 时无条件补 `true`，与已确认规则冲突。

正确规则：

```text
旧 v1 缺字段 + spaces.length === 0 → false
旧 v1 缺字段 + spaces.length > 0  → true
字段为 false + spaces.length > 0 → 无损修正为 true
```

修正时必须：

- 先确认 `spaces` 是合法数组，再推导状态；
- 保留 spaces、memories、drafts、assets 原值；
- 不升级 `schemaVersion`；
- 不把非法字段静默吞掉；
- 添加“已有空间不重放 onboarding”和“空旧快照仍显示 onboarding”的失败测试。

### 6.2 创建空间返回值

当前 `useMemoryStore.createSpace()` 返回 `Promise<void>`，页面无法可靠取得 Repository 生成的新空间 ID。

固定改为：

```ts
async function createSpace(input: CreateSpaceInput): Promise<MemorySpace> {
  const result = await repo.createSpace(input)
  _commitSnapshot(result.snapshot)
  return result.value
}
```

测试必须证明：

- 成功时先提交完整快照，再向页面返回 `result.value`；
- 页面只使用返回空间的 `id` 导航；
- Repository 失败时 Store 不部分更新；
- 重复点击只调用一次；
- 页面不自行生成 ID。

### 6.3 路由与入口

在现有 `PAGE_URLS` 中补齐：

```ts
onboarding: '/pages/onboarding/index'
privacy: '/pages/privacy/index'
```

并注册 01、03、13。根入口等待 bootstrap 后分流：

```text
loading → 不闪现错误页面
ready + onboarding=false → 01
ready + onboarding=true  → reset/replace 到 02
error → 可重试，不展示空白页
```

01 点击开始成功后进入 03；03 创建成功后使用新空间 ID 建立等价于 `02 → 04` 的稳定栈。

### 6.4 DevPanel 迁移

临时 `pages/index/index.vue` 删除前，必须把开发工具迁移到正式开发态宿主。

固定策略：

- 复用同一个 `DevPanel`，不得创建第二套；
- DEV 条件下可从 01 和 02 找到，以便切换 empty/complete；
- 生产构建继续通过现有剥离/扫描机制完全排除；
- 标准截图时保持收起，不遮挡页面主体；
- 01/03/13 注册且分流测试通过后，才删除临时首页。

如果现有生产剥离脚本无法覆盖新宿主，先扩展扫描和测试，再迁移引用；不得让 DevPanel 混入正式用户页面。

## 7. 文件施工地图

### 7.1 创建

```text
apps/pet-memory-miniapp/src/pages/onboarding/index.vue
apps/pet-memory-miniapp/src/pages/space-create/index.vue
apps/pet-memory-miniapp/src/pages/privacy/index.vue
apps/pet-memory-miniapp/src/features/spaces/space-form.ts
apps/pet-memory-miniapp/src/adapters/photo-picker.ts
apps/pet-memory-miniapp/src/adapters/uni-photo-picker.ts

apps/pet-memory-miniapp/tests/unit/space-form.test.ts
apps/pet-memory-miniapp/tests/unit/photo-picker.test.ts
apps/pet-memory-miniapp/tests/components/onboarding-page.test.ts
apps/pet-memory-miniapp/tests/components/space-create-page.test.ts
apps/pet-memory-miniapp/tests/components/privacy-page.test.ts
apps/pet-memory-miniapp/tests/components/task5-journey.test.ts

apps/pet-memory-miniapp/scripts/verify-task5b.mjs

docs/project/gpt-review-output/task5b-evidence/
├─ 01-onboarding-implementation.png
├─ 03-space-create-implementation.png
├─ 13-privacy-implementation.png
└─ report.md
```

### 7.2 修改

```text
apps/pet-memory-miniapp/package.json
apps/pet-memory-miniapp/src/pages.json
apps/pet-memory-miniapp/src/App.vue
apps/pet-memory-miniapp/src/adapters/platform-layout.ts
apps/pet-memory-miniapp/src/adapters/navigation.ts
apps/pet-memory-miniapp/src/components/PageShell.vue
apps/pet-memory-miniapp/src/repositories/snapshot-validation.ts
apps/pet-memory-miniapp/src/stores/app.ts
apps/pet-memory-miniapp/src/stores/memory.ts
apps/pet-memory-miniapp/src/pages/spaces/index.vue
apps/pet-memory-miniapp/tests/unit/platform-layout.test.ts
apps/pet-memory-miniapp/tests/components/PageShell.test.ts
```

测试文件名可按当前目录规范小幅调整，但职责和证据不得丢失。

### 7.3 最后删除

```text
apps/pet-memory-miniapp/src/pages/index/index.vue
```

只有新根入口、三页注册、DevPanel 迁移和开发/生产构建都通过后才能删除。

## 8. 分批实施计划

Builder 必须按顺序实施。每一批都遵守：先写失败测试 → 确认失败原因正确 → 最小实现 → 定向验证 → 记录证据。

### Batch 5B-0：冻结来源与建立追踪表

开工前完整阅读：

- 本计划；
- Task 5B 验收标准；
- 三张页面基准；
- 原型 `OnboardingScreen`、`SpaceCreateScreen`、`PrivacyScreen` 及相关 CSS；
- 现有 PageShell、Store、Repository、NavigationAdapter 与 DevPanel。

提交一张追踪表：

| 页面 | 基准 | 原型 JSX | 原型 CSS | 目标 Vue | 业务状态 | 微信适配 | 状态 |
|---|---|---|---|---|---|---|---|
| 01 | 01-onboarding.png | OnboardingScreen | onboarding-* | onboarding/index.vue | bootstrap/persist/error | capsule/safe area | pending |
| 03 | 03-space-create.png | SpaceCreateScreen | cover/form/actions | space-create/index.vue | photo/form/dirty/submit | capsule/keyboard/permission | pending |
| 13 | 13-privacy.png | PrivacyScreen | privacy-sections | privacy/index.vue | source/back | capsule/long scroll | pending |

退出条件：来源、修改文件、禁止项和验证命令无歧义。

### Batch 5B-1：胶囊与 PageShell 基础适配

先增加失败测试：

- 平台布局计算完整 `capsuleGuardRight`；
- 不同设备矩形得到不同结果；
- 非法矩形走 fallback；
- quiet-landing 起点低于胶囊；
- nav right 不与胶囊相交；
- 标题不会因右侧胶囊明显偏移。

再修改 `platform-layout.ts` 与 `PageShell.vue`。不得在页面中增加重复计算。

定向验证：

```powershell
npm run test:run -- tests/unit/platform-layout.test.ts tests/components/PageShell.test.ts
npm run typecheck
npm run build:mp-weixin
```

微信人工检查：选择至少一个带刘海/灵动岛的 iPhone 模拟器和一个 Android 模拟器，截图标记胶囊矩形与应用内容最近边缘。

### Batch 5B-2：数据、Store 与导航合同

先写失败测试，再修：

- 旧快照 conditional onboarding 归一化；
- 已有空间 + false 的无损修复；
- `completeOnboarding()` 成功、失败、幂等；
- App Store 只在 Repository 成功后更新；
- `memoryStore.createSpace()` 返回 `MemorySpace`；
- onboarding/privacy 路由白名单；
- 根入口不闪屏；
- 创建成功稳定栈。

退出条件：不挂载页面也能通过数据和导航反证。

### Batch 5B-3：名称校验与 PhotoPicker

先实现纯函数和 Adapter 合同：

```text
名称：空、仅空格、trim、20 字、21 字、Unicode 字符
选图：selected、cancelled、denied、failed
更换失败：旧照片保留
remaining：固定 1
```

`UniPhotoPicker` 是唯一 `uni.chooseMedia` 边界；组件测试注入 fake picker。

定向验证：

```powershell
npm run test:run -- tests/unit/space-form.test.ts tests/unit/photo-picker.test.ts
```

### Batch 5B-4：先迁移 13 隐私说明

先完成视觉静态结构，再接来源解析和返回。

施工顺序：

1. 用 `PageShell reading` 建立结构；
2. 根据原型 CSS 映射令牌，不复制 tag/ID/attribute 选择器；
3. 按正式验收内容补齐段落；
4. 接 `source=onboarding`；
5. 测页面返回和系统返回；
6. 进行微信长文滚动和胶囊检查；
7. 保存第一张实现截图。

退出条件：13 可独立构建、可返回 01、不会修改 onboarding 状态。

### Batch 5B-5：迁移 01 与正式根入口

施工顺序：

1. 按原型建立 quiet-landing 构图；
2. 接 bootstrap loading/ready/error；
3. 接隐私入口；
4. 接开始动作的 150ms 延迟反馈；
5. Repository 成功后进入 03；
6. 失败留在原页并恢复；
7. 接 empty/complete 分流；
8. 迁移 DevPanel 开发宿主；
9. 验证生产排除；
10. 保存第二张实现截图。

必须反证：

- 慢写入期间连点只写一次；
- 写入失败不跳 03；
- 查看隐私不完成 onboarding；
- complete 样本启动不闪现 01；
- 首屏任何内容不进入胶囊矩形。

### Batch 5B-6：迁移 03 创建空间完整状态机

先按原型完成视觉骨架，再逐项接业务：

1. 空名称初态；
2. 添加照片；
3. 更换与移除；
4. cancelled/denied/failed；
5. 名称错误；
6. pristine 返回；
7. dirty 返回保护；
8. pending 重复提交锁；
9. Repository 失败保留页面；
10. 成功后用返回空间 ID 进入 04；
11. 04 返回 02；
12. 保存第三张实现截图。

必须在键盘打开和关闭两种状态检查主操作可达性。不要以 jsdom 的几何结果代替微信开发者工具。

### Batch 5B-7：逐页视觉校准

校准顺序固定为：

```text
01 作为 quiet-landing 黄金页
→ 03 校准表单与底部操作
→ 13 校准阅读页
```

每页检查：

- 顶部起点与胶囊；
- 页面水平边距；
- 标题/正文/辅助文字层级；
- 主次操作关系；
- 组件宽度、圆角和高度；
- 内容组之间的垂直节奏；
- 320/393/480 CSS px；
- 微信 button 默认样式是否完全 reset；
- WXSS 是否存在不允许的 tag、ID、attribute 或通配选择器；
- 视觉差异是否源自平台限制还是实现偏差。

默认只要求三张实现截图和 `report.md`。若用户、Reviewer 或 Builder 对某项差异有争议，再追加 side-by-side、overlay 或 diff，不把九张对比图设为日常硬门。

### Batch 5B-8：总验证与真实旅程

自动验证：

```powershell
npm run verify:task5b
npm run verify:task5
```

`verify:task5b` 至少聚合：

```text
Task 5B 定向单元测试
Task 5B 页面组件测试
Task 3/4 首次说明兼容性测试
platform-layout / PageShell 胶囊测试
NavigationAdapter 测试
TypeScript 类型检查
微信开发与生产构建
WXSS 禁止选择器扫描
button reset 扫描
DevPanel 生产排除扫描
三张实现截图 + report.md 证据硬门
```

微信开发者工具真实旅程：

```text
empty
→ 01
→ 13
→ 返回 01
→ 开始
→ 03
→ 创建
→ 04
→ 返回 02
→ 再进入 04
→ 08
```

返回保护旅程：

```text
empty → 01 → 开始 → 03
→ 输入名字或选照片
→ 系统返回
→ 继续填写
→ 再次返回
→ 先不创建
→ 02 空状态
→ 重启仍进入 02
```

只有自动门、Logic Reviewer 反证、微信旅程与用户/Codex 视觉确认都通过，才能标记 `reviewer-accepted`。

## 9. 阶段小收口与放行门

Task 5B 不允许等到全部页面完成后才第一次验收。施工过程固定拆成三个阶段小收口和一次最终验收：

```text
Phase A 平台与数据地基
→ Phase B 01 + 13 首次进入闭环
→ Phase C 03 创建空间闭环
→ Final Task 5B 总验收
```

小收口的目标是尽早发现方向性错误，不把每个 Batch 都扩大成一次完整验收。Builder 必须完成当前阶段报告并得到对应放行结论后，才能开始下一阶段。

### 9.1 统一阶段状态

每个阶段只能使用以下状态：

| 状态 | 含义 | 是否可进入下一阶段 |
|---|---|---|
| `PASS` | 本阶段自动门、人工门和反证全部满足 | 是 |
| `FAIL` | 已发现可复现的实现或视觉偏差 | 否，必须本阶段修复后复验 |
| `BLOCKED` | 缺少设备、权限、外部环境或必要决定 | 否，除非计划明确允许记录风险后继续 |

不得使用“基本完成”“大致通过”“先往后做”等模糊状态。后续阶段的测试通过不能抵消前一阶段的 `FAIL`。

### 9.2 Phase A：平台与数据地基小收口

覆盖范围：

```text
Batch 5B-0 来源冻结
Batch 5B-1 胶囊与 PageShell
Batch 5B-2 数据、Store 与导航
Batch 5B-3 名称校验与 PhotoPicker
```

本阶段不要求用户进行视觉审美验收，但必须证明页面施工所依赖的底层合同已经稳定。

Builder 必交证据：

- platform-layout 与 PageShell 定向测试；
- iPhone、Android、非法矩形和 API 抛错的胶囊反证；
- 旧快照有空间、无空间、已有空间但 false 的归一化测试；
- `completeOnboarding()` 成功、失败、幂等测试；
- `memoryStore.createSpace()` 返回新空间且失败不改 Store；
- 名称边界和 PhotoPicker 四种结果；
- 类型检查；
- 微信开发与生产构建；
- WXSS 禁止选择器扫描。

Logic Reviewer 至少主动反证：

1. 把胶囊宽度、右边距和状态栏高度分别改成不同值，确认实现没有硬编码；
2. 让胶囊 API 返回全 0 或抛错，确认 fallback 不导致页面溢出；
3. 构造旧 v1 空快照，确认 onboarding 为 false；
4. 构造旧 v1 有空间快照，确认数据完整且 onboarding 为 true；
5. 让 Repository 创建失败，确认 Store 没有部分更新；
6. 搜索页面是否出现 storage、Repository、`uni.chooseMedia` 或原始 `uni.navigate*` 越层调用。

Phase A 放行条件：

```text
阶段状态 = PASS
Logic Reviewer = phase-a-accepted
视觉负责人 = NOT REQUIRED
```

Phase A 未通过时，不得开始 01、03、13 页面施工。

### 9.3 Phase B：01 + 13 首次进入闭环小收口

覆盖范围：

```text
Batch 5B-4 13 隐私说明
Batch 5B-5 01 首次说明与根入口
```

本阶段必须形成第一个真实可操作页面闭环：

```text
empty → 01 → 13 → 返回 01 → 开始 → 03
```

这里的 03 只作为已经注册并可安全落入的目标，不要求提前通过完整创建页验收。

Builder 必交证据：

- `01-onboarding-implementation.png`；
- `13-privacy-implementation.png`；
- 01、13 对应基准和原型来源说明；
- 胶囊与首屏内容最近边缘说明；
- onboarding 快写入、慢写入、失败和重复点击结果；
- 隐私往返不改变 onboarding 状态；
- complete 样本启动不闪现 01；
- 13 长文滚动、页面返回和系统返回；
- DevPanel 开发可达与生产排除证据；
- 微信开发者工具真实路径记录。

Logic Reviewer 至少主动反证：

1. `completeOnboarding()` 延迟超过 150ms；
2. 写入过程中连续点击“开始”；
3. 写入失败后重试；
4. 从 13 返回后重启应用；
5. complete 样本冷启动；
6. 非法 privacy source；
7. 生产构建搜索 DevPanel。

视觉负责人只做一次轻量检查：

- 01 是否保持原型的 quiet-landing 构图，而不是普通登录页；
- 01 的顶部留白是否自然且避开胶囊；
- 主次操作和底部安全区是否合理；
- 13 的标题、段落、分隔线和阅读节奏是否接近基准；
- 两页是否出现微信默认按钮边框或突兀平台样式。

Phase B 放行条件：

```text
阶段状态 = PASS
Logic Reviewer = phase-b-logic-accepted
用户/Codex = phase-b-visual-accepted
微信路径 01 → 13 → 01 → 03 = PASS
```

Phase B 视觉未通过时，必须先修正 01/13 的共同视觉规则，不能带着错误视觉方向继续做 03。

### 9.4 Phase C：03 创建空间闭环小收口

覆盖范围：

```text
Batch 5B-6 03 创建空间状态机
Batch 5B-7 三页视觉校准
```

本阶段必须形成：

```text
03 创建成功 → 04 → 返回 02
```

以及：

```text
03 dirty → 返回保护 → 继续填写 / 先不创建 → 02
```

Builder 必交证据：

- `03-space-create-implementation.png`；
- 03 基准和原型来源说明；
- 键盘打开和关闭截图或操作记录；
- 选图 selected/cancelled/denied/failed 结果；
- 更换失败保留旧照片；
- pristine 与 dirty 返回；
- pending 连点和 Repository 失败恢复；
- 创建成功只产生一个空间；
- 成功后的 Store 数据与 `02 → 04` 页面栈；
- 02、04、08 回归结果；
- 320、393、480 CSS px 检查。

Logic Reviewer 至少主动反证：

1. 仅输入空格、20 字、21 字和 Unicode 代理对字符；
2. 只选择照片后触发系统返回；
3. 更换照片时模拟取消、拒绝和失败；
4. 连续点击创建；
5. Repository 首次失败、第二次成功；
6. 创建完成后连续返回，确认不会回到 03 或 01；
7. 重新启动，确认不会重复进入 01。

视觉负责人检查：

- 03 是否保留原型“说明 → 照片 → 名称 → 弹性留白 → 主操作”的顺序；
- 照片选择区、输入区和主按钮的层级是否清楚；
- 键盘出现时是否仍保持可用而不挤成一团；
- 返回按钮、标题和胶囊是否互不冲突；
- 错误文案是否温和、贴近输入框且不造成布局跳动；
- 01、03、13 是否已经形成统一视觉语言。

Phase C 放行条件：

```text
阶段状态 = PASS
Logic Reviewer = phase-c-logic-accepted
用户/Codex = phase-c-visual-accepted
微信路径 03 → 04 → 02 = PASS
Task 5A regression = PASS
```

Phase C 未通过时，不得进入 Task 5B 最终验收，更不得开始 Task 6。

### 9.5 Final：Task 5B 总验收

覆盖范围：

```text
Batch 5B-8 总验证与真实旅程
Phase A、B、C 遗留项复核
```

Final 不重新代替三个小收口，而是检查它们合在一起是否形成稳定产品路径。

必需证据：

- Phase A、B、C 均为 `PASS`；
- 三份阶段报告齐全；
- 三张实现截图和 Task 5B 总报告齐全；
- `verify:task5b` 和 `verify:task5` 退出码为 0；
- 主旅程、返回保护旅程、重启分流真实通过；
- 生产构建无 DevPanel、禁止 WXSS 和临时首页；
- 02、04、08 无回归；
- 未验证真机权限和设备项已明确记录。

Final 状态要求：

```text
Builder = self-verified
Logic Reviewer = logic-accepted
用户/Codex = visual-accepted
Task 5B = reviewer-accepted
```

### 9.6 阶段报告文件

统一放入：

```text
docs/project/gpt-review-output/task5b-evidence/
├─ phase-a-platform-data-report.md
├─ phase-b-onboarding-privacy-report.md
├─ phase-c-space-create-report.md
├─ 01-onboarding-implementation.png
├─ 03-space-create-implementation.png
├─ 13-privacy-implementation.png
└─ report.md
```

每份阶段报告使用以下最小模板：

```text
# Task 5B Phase [A/B/C] 小收口报告

阶段范围：
对应 Batch：
阶段状态：PASS / FAIL / BLOCKED

自动验证：
- 命令：
- 退出码：
- 测试结果：
- 构建结果：

微信人工路径：
- 路径：
- 结果：
- 设备/模拟器：

视觉证据：
- 文件：
- 不需要视觉验收的原因：

Counter-evidence：
- 动作：
- 实际结果：

已知偏差：
- 无 / 具体说明、影响和后续归属

Reviewer 结论：
- 未审 / phase-a-accepted / phase-b-logic-accepted / phase-c-logic-accepted

视觉负责人结论：
- NOT REQUIRED / 未审 / phase-b-visual-accepted / phase-c-visual-accepted

下一阶段：
- ALLOWED / NOT ALLOWED
```

报告中的命令、截图和结论必须对应本次新鲜证据，不得复制前一阶段或 Task 5A 的旧输出。

## 10. 角色分工

### Builder

负责：

- 直接阅读并迁移浏览器原型；
- 实现 Vue/uni-app 平台适配；
- 完成所有业务状态；
- 运行自动验证；
- 提交三张微信实现截图和逐页差异说明；
- 只能报告 `self-verified`。

Builder 不负责最终视觉裁决，也不得以“测试全绿”证明视觉一致。

### Logic Reviewer

负责：

- 数据迁移、Store、Repository、Adapter、导航和失败恢复；
- 主动执行 counter-evidence；
- 检查 Builder 是否绕过架构；
- 检查截图、报告和微信人工项是否齐全；
- 只能报告 `logic-accepted`。

没有视觉能力的 Reviewer 不得自行宣布 `visual-accepted`。

### 用户 / Codex 视觉负责人

负责：

- 对照基准、浏览器原型与微信真实截图；
- 裁决构图、层级、节奏和胶囊避让是否可接受；
- 对争议差异要求追加对比图；
- 给出 `visual-accepted` 或明确退回项。

## 11. 视觉证据报告模板

`docs/project/gpt-review-output/task5b-evidence/report.md` 使用以下结构：

```text
Task 5B 状态：self-verified / logic-accepted / visual-accepted / reviewer-accepted

自动验证：
- test:run：
- typecheck：
- build:mp-weixin：
- verify:task5b：
- verify:task5：

胶囊适配：
- iPhone 模拟器：
- Android 模拟器：
- fallback 测试：
- 最近内容边缘与胶囊是否重叠：

逐页：
- 01 基准 / 原型 / 实现截图 / 差异 / 状态
- 03 基准 / 原型 / 实现截图 / 差异 / 状态
- 13 基准 / 原型 / 实现截图 / 差异 / 状态

真实旅程：
- 主旅程：
- 返回保护：
- 相册取消/拒绝/失败：
- 重启分流：

Counter-evidence：
- 慢 onboarding 写入：
- onboarding 写入失败：
- 旧快照有空间/无空间：
- 创建失败后重试：
- 连点创建：
- 胶囊不同矩形：
- 生产 DevPanel 扫描：

未验证项：
- 无 / 具体说明
```

## 12. 明确禁止

Builder 与 Reviewer 不得：

- 抛开浏览器原型，仅凭文字重新设计三页；
- 把 React 事件、CSS Grid、浏览器伪元素或设备外框直接复制进小程序；
- 硬编码某一款手机的胶囊位置；
- 每个页面单独计算胶囊和状态栏；
- 只预留胶囊宽度，忽略胶囊右边距；
- 使用 WXSS 不允许的通配、tag、ID 或 attribute 选择器；
- 让页面直接访问 storage、Repository、`uni.chooseMedia` 或原始 `uni.navigate*`；
- 用组件测试冒充微信页面栈、键盘、权限或胶囊验证；
- 把 DevPanel 留在生产产物；
- 因视觉差异私改 Task 2 公开组件合同；
- 只看测试数量就宣布视觉或任务完成；
- 在没有用户/Codex 视觉确认时写 `visual-accepted`；
- 未完成 5B 就更新总进度为 Task 5 全部通过。
- 前一 Phase 为 `FAIL` 或 `BLOCKED` 时继续施工下一 Phase；
- 用最终总验收替代 Phase A、B、C 的阶段报告和放行结论；
- 把 Phase A 的“无需视觉验收”误写成整个 Task 5B 无需视觉验收。

## 13. 完成定义

Task 5B 只有同时满足以下条件才完成：

1. 01、03、13 均以浏览器原型为直接视觉参考完成移植；
2. 三张微信实现截图和报告齐全；
3. 胶囊位置由官方 API 动态计算，并通过 iPhone、Android 与 fallback 反证；
4. 旧快照、onboarding 持久化和创建返回值合同修正；
5. 创建页所有失败、返回和重复提交状态通过；
6. 主旅程和返回保护旅程在微信开发者工具真实走通；
7. `verify:task5b` 与 `verify:task5` 退出码为 0；
8. 02、04、08 回归通过；
9. DevPanel 不进入生产构建；
10. Builder `self-verified`、Reviewer `logic-accepted`、用户/Codex `visual-accepted` 三项齐全；
11. 未验证的真机权限或设备风险被如实记录；
12. 状态文档只反映实际证据，不提前宣布完成。
13. Phase A、B、C 均有独立小收口报告并明确放行；
14. 任一阶段的失败没有被后续测试结果覆盖或跳过。

## 14. 交给 Builder 的开工指令

```text
开始 Task 5B 前，完整阅读：

docs/project/gpt-review-output/2026-08-02-task-5b-browser-prototype-porting-plan.md
docs/project/acceptance/2026-07-28-task-5b-onboarding-space-creation-acceptance-standard.md

并直接打开：

apps/pet-memory-design-prototype/src/Prototype.tsx
apps/pet-memory-design-prototype/src/prototype.css
docs/product/assets/m0-page-baselines/01-onboarding.png
docs/product/assets/m0-page-baselines/03-space-create.png
docs/product/assets/m0-page-baselines/13-privacy.png

本轮采用“浏览器原型视觉轨 + 正式业务合同轨”。不要凭文字重新设计，不要逐行复制 React。

先提交 Batch 5B-0 的三页追踪表和预计修改文件，然后按 5B-1 → 5B-8 顺序实施。每批先写失败测试，再做最小实现和定向验证。

不得一路施工到 5B-8 才第一次验收。必须依次完成并获准放行：

Phase A（5B-0～5B-3）
→ Phase B（5B-4～5B-5）
→ Phase C（5B-6～5B-7）
→ Final（5B-8）

每个 Phase 都要在 task5b-evidence 中提交阶段报告；上一阶段没有 PASS 和 ALLOWED 时，不得开始下一阶段。

特别注意：胶囊位置必须通过 getMenuButtonBoundingClientRect + getWindowInfo 动态计算；PageShell 统一避让，页面禁止硬编码。当前只预留 capsuleWidth 的实现不足，必须包含胶囊右边距形成完整 capsuleGuardRight。

完成后只能报告 self-verified，并提交 task5b-evidence 的三张微信实现截图与 report.md，等待 Logic Reviewer 和视觉负责人分别验收。
```
