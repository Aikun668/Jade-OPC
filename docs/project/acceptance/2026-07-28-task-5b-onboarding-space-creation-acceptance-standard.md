# Task 5B 首次进入、隐私与创建空间构建及验收标准

日期：2026-07-28  
状态：正式构建合同与验收门槛  
适用范围：M0 Task 5.5–5.7；页面 01、03、13

## 1. 目标与职责

Task 5B 在 Task 5A 已经建立的空间回看落点上，完成第一次使用产品的真实闭环：

```text
01 首次说明
├─ 13 隐私说明 → 返回 01
└─ 开始 → 03 创建空间 → 04 Ta 的空间首页
```

本文件把已经确认的产品与工程规则转换为：

- Builder 可逐批执行的施工顺序；
- 每批可独立运行的小闭环；
- 页面、Store、Repository 和导航之间的固定合同；
- Reviewer 可反证的状态矩阵；
- 微信开发者工具中的实际交互与视觉证据；
- Task 5 总闭环的完成门槛。

本文件不替代产品规格、Task 2 设计系统规格或总实施计划。发生冲突时，Builder 必须暂停并报告证据，不得在页面里自行发明新规则。

相关真源：

- [AI 开发协作与验收协议](../rule/2026-07-27-ai-development-collaboration-protocol.md)
- [M0 工程骨架实施计划](../../product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md)
- [M0 工程骨架与设计系统决策记录](../../product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md)
- [M0 设计系统工程执行规格](../../product/specs/2026-07-24-m0-design-system-engineering-spec.md)
- [M0 页面视觉基准](../../product/assets/m0-page-baselines/README.md)
- [Task 3 验收标准](2026-07-27-task-3-domain-repository-acceptance-standard.md)
- [Task 4 验收标准](2026-07-28-task-4-state-routing-devtools-acceptance-standard.md)
- [Task 5A 验收标准](2026-07-28-task-5a-space-browsing-acceptance-standard.md)

## 2. 开工条件

Builder 开始 Task 5B 前必须确认：

1. Task 5A 已由独立 Reviewer 通过，不以 Builder 自证代替；
2. 02、04、08 已能在微信开发者工具中真实打开；
3. Task 2 共享组件公开接口没有被页面私自修改；
4. Task 3/4 中本节依赖的首次说明字段和动作已补齐并通过定向测试；
5. 工作区没有与 Task 5B 无关、会被本轮覆盖的用户修改；
6. 本轮不新增生产依赖，不创建第二套 Store、Repository、导航或照片选择服务。

如果 Task 3/4 尚未做完整独立验收，本轮只允许对下列已确认合同做兼容性补齐和定向验证，不得借机重构其余上游代码。

## 3. 范围边界

### 3.1 本批次负责

- 01 首次说明；
- 03 创建 Ta 的空间；
- 13 隐私说明；
- 首次说明只出现一次的持久化合同；
- 应用 bootstrap 后的首次入口分流；
- 空间名称纯校验；
- 单张空间照片的选择、更换、移除和失败恢复；
- 创建空间的返回保护、提交锁和失败恢复；
- 创建成功后稳定进入 04；
- 01、03、13 的标准截图与 Task 5 总路径验证；
- `verify:task5b` 和聚合 `verify:task5`。

### 3.2 本批次不负责

- 微信登录、头像昵称授权或账户页面；
- CloudBase、真实上传、云端照片和真实 AI；
- 空间资料编辑和删除空间；
- 记录入口、文字记录、照片记忆和记忆详情；
- 导出功能或不可点击的“未来功能”按钮；
- 第二个隐私页面；
- 创建空间草稿；
- 照片裁剪器、滤镜、拖拽排序或图片编辑器；
- 修改 Task 2 已锁定的组件 Props、Events、Slots 或视觉令牌；
- 为后续页面建立“开发中”占位路由。

### 3.3 后续任务边界

- 13 隐私说明在 Task 5B 创建；Task 9 只增加从 12 进入和返回 12 的集成。
- `PhotoPicker` 在 Task 5B 创建；Task 7 直接复用，不再创建另一套相册服务。
- 03 创建成功使用 Task 5A 已完成的 04；不得复制空间首页。
- 删除最后一个空间后的空列表行为属于 Task 9，但仍必须遵守“不重新显示首次说明”。

## 4. 已锁定的跨层合同

### 4.1 首次说明状态

```ts
export interface MemorySnapshot {
  schemaVersion: 1
  hasCompletedOnboarding: boolean
  spaces: Space[]
  memories: Memory[]
  drafts: Draft[]
  assets: Asset[]
}

export interface MemoryRepository {
  completeOnboarding(): Promise<MemorySnapshot>
}
```

`useAppStore` 必须暴露并维护：

```ts
hasCompletedOnboarding: boolean
completeOnboarding(): Promise<void>
bootstrap(): Promise<void>
```

固定语义：

- `false`：bootstrap 后停留 01；
- `true`：bootstrap 后归一化到 02；
- 点击 01“开始”时先持久化 `true`，成功后才进入 03；
- 查看 13 不修改该字段；
- 已有空间但字段为 `false` 时，保留所有数据并修复为 `true`；
- 旧 v1 快照缺字段且已有空间时归一化为 `true`；
- 旧 v1 快照缺字段且无空间时归一化为 `false`；
- `resetSample('empty')` 使用 `false`；
- `resetSample('complete')` 使用 `true`；
- 本轮不增加第三种样本模式，不提升 `schemaVersion`。

“已经看过首次说明但没有空间”的状态按真实流程复现：

```text
empty
→ 01 点击开始
→ 03 直接取消
→ 02 空状态
```

### 4.2 照片选择

```ts
export interface PickedPhoto {
  uri: string
  width?: number
  height?: number
}

export interface PhotoPicker {
  pick(options: { remaining: number }): Promise<
    | { kind: 'selected'; photos: PickedPhoto[] }
    | { kind: 'cancelled' }
    | { kind: 'denied' }
    | { kind: 'failed' }
  >
}
```

空间照片调用时 `remaining` 固定为 `1`。

页面只能消费该接口，不直接散落 `uni.chooseMedia` 调用。组件测试注入假的 Adapter，不伪造完整微信运行时。

### 4.3 空间创建写入

页面调用既有 Store 动作，Store 调用 Repository。页面不得：

- 生成持久化 ID 或系统时间；
- 直接写本地存储；
- 把照片 URI 直接当作永久云端资产；
- 在 Repository 成功前先构造“已创建”页面；
- 从返回值之外猜测新空间 ID。

创建成功时必须先用 Repository 返回的完整快照同步 Store，再执行：

```ts
navigation.resetTo({
  page: 'space-home',
  params: { spaceId: createdSpace.id },
})
```

最终用户可理解的页面栈必须等价于：

```text
02 我的记忆空间 → 04 新空间首页
```

不得让 01 或 03 留在用户需要逐级返回的完成路径中。

### 4.4 隐私页来源

13 只允许非敏感来源语义：

```text
source=onboarding
source=settings
```

Task 5B 实际完成 `onboarding` 来源。`settings` 可在路由白名单和单元测试中保留，但 Task 9 才完成从 12 的真实往返。

不得传原话、照片、完整实体或自由文本来源。

## 5. 文件地图

### 5.1 允许创建

```text
apps/pet-memory-miniapp/
├─ src/
│  ├─ pages/
│  │  ├─ onboarding/index.vue
│  │  ├─ space-create/index.vue
│  │  └─ privacy/index.vue
│  ├─ features/spaces/space-form.ts
│  └─ adapters/
│     ├─ photo-picker.ts
│     └─ uni-photo-picker.ts
└─ tests/
   ├─ unit/
   │  ├─ space-form.test.ts
   │  └─ photo-picker.test.ts
   └─ components/
      ├─ onboarding-page.test.ts
      ├─ space-create-page.test.ts
      ├─ privacy-page.test.ts
      └─ task5-journey.test.ts
```

测试文件可在不分散职责的前提下合并，但验收 ID 不得因此遗漏。

### 5.2 允许修改

```text
apps/pet-memory-miniapp/
├─ package.json
├─ src/
│  ├─ App.vue
│  ├─ pages.json
│  ├─ adapters/navigation.ts
│  ├─ domain/models.ts
│  ├─ repositories/
│  ├─ stores/app.ts
│  ├─ stores/memory.ts
│  └─ dev/sample-scenarios.ts
└─ tests/
   ├─ unit/
   └─ components/
```

上游文件只能为本文件第 4 节已确认合同做最小补齐。若需要修改清单外文件，Builder 必须先报告：

- 为什么当前文件阻碍 Task 5B；
- 会改变什么外部行为；
- 为什么不属于无关重构；
- 用什么测试证明没有回归。

### 5.3 允许删除

只有在 01、03、13 已注册且微信构建成功后，才允许删除：

```text
src/pages/index/index.vue
```

以及确认只被该临时页面使用的示例素材。删除前必须用引用搜索证明没有正式页面仍在使用。不得删除 Task 1–4 的测试或配置来“让验证通过”。

## 6. 页面和局部状态合同

### 6.1 01 首次说明

必须具备：

- 最小产品用途说明；
- 默认私密的克制承诺；
- 《隐私说明》入口；
- “开始”主操作；
- bootstrap 等待；
- 写入 pending；
- 写入失败与重试。

状态矩阵：

| 状态 | 页面行为 |
|---|---|
| bootstrap 未完成 | 不闪现 01 后又跳 02；不允许用户提前提交 |
| onboarding=false | 稳定展示 01 |
| onboarding=true | 使用稳定导航归一化到 02 |
| 点击隐私说明 | 进入 13，返回后仍在 01，字段不变化 |
| 写入小于等于 150ms | 不强制闪烁 pending 文案 |
| 写入超过 150ms | 主按钮显示“正在准备…”并锁定重复点击 |
| 写入失败 | 停留 01，恢复按钮，显示“刚才没有准备好，可以再试一次。” |
| 写入成功 | 同步 App Store 后进入 03，不经过 02 |

不得在本页请求登录、微信头像、昵称、手机号、相册或通知权限。

### 6.2 13 隐私说明

页面至少清晰说明：

1. 内容默认私密；
2. M0 当前是本地 Mock，不伪装云端永久保存；
3. 本机所选照片为会话级临时内容，可能失效；
4. M1 才接入 CloudBase 私密保存与真实数据能力；
5. AI 当前是 Mock，未来真实 AI 仍需按次说明并授权；
6. 删除不可恢复；
7. M0 没有虚假的导出按钮，导出随 M1 数据能力实现。

页面不得：

- 暗示已经上传云端；
- 暗示 AI 已经读取用户内容；
- 放置不可用的导出按钮；
- 用冗长法律文字掩盖阶段事实；
- 固定返回某一个来源。

从 01 进入时，页面返回按钮、系统返回都回 01。Task 5B 不得提前伪造从 12 的完整业务往返。

### 6.3 03 创建 Ta 的空间

页面局部状态至少包括：

```ts
nameInput
selectedPhoto
nameError
photoError
submitError
isPickingPhoto
isSubmitting
showLeaveConfirm
```

这些状态留在页面内，不建立新的 UI Store。

#### 名称

- 提交时去除首尾空格；
- 使用 Unicode 字符数量判断，避免把一个代理对字符算成两个；
- 空值提示固定为“先写下 Ta 的名字。”；
- 超过 20 个字符使用中性提示“Ta 的名字最多写 20 个字。”；
- 不限制中文、英文、昵称或物种；
- 错误放在输入框下，不使用红色高压表达、感叹号或“必填项”。

建议纯函数：

```ts
type SpaceNameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'too-long'; message: string }

export function validateSpaceName(raw: string): SpaceNameValidation
```

#### 照片

- 初始显示“添加一张照片（可选）”；
- 用户不选照片也能创建；
- 已选择时展示小型圆角预览；
- 提供低强调“更换”和“移除”；
- 移除不需要二次确认；
- `cancelled`：保持原状态，不显示错误；
- `denied`：保持原照片，显示可恢复的权限说明；
- `failed`：保持原照片，显示普通失败说明；
- `selected`：只接收第一张有效结果；
- 更换失败不得先清空旧照片；
- 页面不得称照片“已上传”或“永久保存”。

#### 返回保护

脏状态定义为：

```text
名字输入存在任何用户内容，或已经选择照片
```

固定行为：

| 条件 | 返回结果 |
|---|---|
| 名字为空且无照片 | 直接回 02 |
| 有名字或照片 | 弹出“这次先不创建了吗？” |
| 选择“继续填写” | 关闭弹窗，名称、照片、错误和滚动位置保持 |
| 选择“先不创建” | 丢弃页面临时内容，不创建空间或草稿，稳定回 02 |
| 正在选择照片 | 先等待选择器结果或取消，不重复打开 |
| 正在提交 | 阻止重复提交和离开，不能弹出第二层冲突状态 |

页面返回按钮和系统返回必须使用同一保护逻辑。

#### 提交

- 点击创建后先进行名称校验；
- 校验失败不调用 Store；
- pending 期间只允许一次 Store 调用；
- 失败时保留名称、照片、滚动位置和可重试能力；
- 失败不得导航、清空表单或创建部分实体；
- 成功时使用 Store/Repository 返回的新空间；
- Store 完整同步成功后才能导航；
- 从 04 返回进入 02，不重新打开 03 或 01。

## 7. 分批施工顺序

Builder 必须按以下批次推进。每批完成后先自证，失败时就地修复，不得积累到最后一次性解释。

### 5B-0：补齐首次说明数据合同

先写失败测试，再做最小实现：

- `MemorySnapshot.hasCompletedOnboarding` 为必需布尔字段；
- empty/complete 样本值分别为 false/true；
- `completeOnboarding()` 成功、失败、幂等；
- 旧 v1 缺字段的两种归一化；
- 已有空间且 false 的无损修复；
- appStore bootstrap 同步字段；
- appStore 动作成功后更新，失败保持原状态；
- resetSample 同步恢复对应字段。

只运行相关 Task 3/4 测试，不把该批次描述为对 Task 3/4 的完整重新验收。

退出门：

```text
首次说明状态能够跨重新 bootstrap 保持；
修复逻辑不删除任何空间、记忆、草稿或资产；
schemaVersion 仍为 1。
```

### 5B-1：名称校验与 PhotoPicker

先建立：

- 空字符串；
- 仅空格；
- 首尾空格；
- 恰好 20 个字符；
- 超过 20 个字符；
- Unicode 代理对字符；
- selected/cancelled/denied/failed；
- 更换失败保留原照片；
- `remaining: 1`。

测试变红后再实现纯函数、接口和 uni Adapter。不得通过降低断言或删除失败分支让测试变绿。

退出门：

```powershell
npm run test:run -- tests/unit/space-form.test.ts tests/unit/photo-picker.test.ts
```

### 5B-2：先实现 13 隐私说明

先让 13 成为真实可构建目标，再接 01 的入口。覆盖：

- 固定内容边界；
- `source=onboarding`；
- 返回按钮；
- 系统返回；
- 非法来源安全降级；
- 不改变 onboarding 状态；
- 无导出按钮和虚假能力。

退出门：

```text
13 可以从测试路由独立打开；
onboarding 来源返回 01；
页面不依赖 12 已经存在。
```

### 5B-3：实现 01 与根入口分流

顺序：

1. 写 onboarding 页面测试；
2. 注册 01/03/13；
3. 验证构建；
4. 把 01 设置为正式首个页面；
5. 验证 bootstrap false/true；
6. 验证成功、延迟和失败；
7. 再删除临时模板页；
8. 搜索并删除仅供模板使用的孤儿素材。

退出门：

```text
empty 首次打开停留 01；
complete 首次打开不闪现 01，进入 02；
开始成功进入 03；
开始失败留在 01；
隐私往返不改变完成状态。
```

### 5B-4：实现 03 创建空间

顺序：

1. 建立所有表单状态的组件测试；
2. 接名称校验；
3. 接 PhotoPicker；
4. 接返回保护；
5. 接 Store 创建动作；
6. 接失败恢复；
7. 最后接成功导航与稳定页面栈。

必须分别测试：

- 无照片创建；
- 有照片创建；
- 只输入空格；
- 超长名称；
- 选择取消；
- 权限拒绝；
- 选择失败；
- 更换失败；
- 移除照片；
- pristine 返回；
- dirty 返回后继续填写；
- dirty 返回后放弃；
- 重复点击提交；
- Repository 失败后重试；
- 成功后 Store 与页面栈。

退出门：

```text
创建成功只产生一个空间；
失败不产生任何部分写入；
03 不进入完成后的返回路径；
04 返回到 02。
```

### 5B-5：Task 5 总集成与视觉证据

运行完整命令后，在微信开发者工具执行真实路径：

```text
empty
→ 01
→ 13
→ 返回 01
→ 开始
→ 03
→ 不选照片创建
→ 04
→ 返回 02
→ 再次进入 04
→ 08
```

再覆盖：

```text
empty
→ 开始
→ 03 输入内容
→ 返回
→ 继续填写
→ 返回
→ 先不创建
→ 02 空状态
→ 重启应用仍进入 02，不再显示 01
```

以及：

```text
03 选择照片
→ 更换
→ 移除
→ 创建
→ 04
```

不得以组件测试代替微信开发者工具中的页面栈和系统返回验证。

## 8. Builder 自证清单

### 8.1 数据与初始化

| ID | 必须证明 |
|---|---|
| `T5B-M01` | 快照字段是必需布尔值且 schemaVersion 仍为 1 |
| `T5B-M02` | empty=false、complete=true |
| `T5B-M03` | completeOnboarding 成功持久化并幂等 |
| `T5B-M04` | completeOnboarding 失败不改 Store 或快照 |
| `T5B-M05` | 旧 v1 无空间缺字段归一化为 false |
| `T5B-M06` | 旧 v1 有空间缺字段归一化为 true |
| `T5B-M07` | 已有空间但 false 时无损修复 true |
| `T5B-M08` | bootstrap 未完成时不发生首次页闪烁或提前操作 |
| `T5B-M09` | onboarding=true 的根入口归一化到 02 |

### 8.2 首次说明与隐私

| ID | 必须证明 |
|---|---|
| `T5B-M10` | 01 使用正式布局和 Task 2 组件，没有私有视觉系统 |
| `T5B-M11` | 隐私入口进入 13 并携带白名单来源 |
| `T5B-M12` | 13 返回 01 且不改变 onboarding 状态 |
| `T5B-M13` | 开始动作先持久化，后导航 |
| `T5B-M14` | 超过 150ms 显示“正在准备…” |
| `T5B-M15` | pending 期间重复点击只产生一次写入 |
| `T5B-M16` | 写入失败留在 01 并显示固定恢复文案 |
| `T5B-M17` | 写入成功直接进入 03，不经过 02 |
| `T5B-M18` | 01 不请求登录、头像、昵称或其他授权 |
| `T5B-M19` | 13 准确说明 M0/M1、照片、AI、删除与导出边界 |
| `T5B-M20` | 13 没有不可用导出按钮或虚假云端能力 |

### 8.3 名称与照片

| ID | 必须证明 |
|---|---|
| `T5B-M21` | 名称提交前 trim |
| `T5B-M22` | 空名称显示固定中性文案 |
| `T5B-M23` | 20 字通过、21 字失败 |
| `T5B-M24` | Unicode 字符计数正确 |
| `T5B-M25` | 页面不限制昵称语言或物种 |
| `T5B-M26` | PhotoPicker remaining 固定为 1 |
| `T5B-M27` | cancelled 保持状态且无错误 |
| `T5B-M28` | denied 与 failed 分开恢复 |
| `T5B-M29` | 更换失败保留旧照片 |
| `T5B-M30` | 移除不确认并恢复可选入口 |
| `T5B-M31` | 无照片也可正常创建 |
| `T5B-M32` | 页面不直接调用持久化或声称照片已上传 |

### 8.4 返回、保存与页面栈

| ID | 必须证明 |
|---|---|
| `T5B-M33` | pristine 返回直接进入 02 |
| `T5B-M34` | 名称或照片任一存在即触发返回保护 |
| `T5B-M35` | 页面按钮与系统返回使用同一保护逻辑 |
| `T5B-M36` | “继续填写”完整保留表单、错误和位置 |
| `T5B-M37` | “先不创建”不创建空间或草稿并回 02 |
| `T5B-M38` | 校验失败不调用 Store |
| `T5B-M39` | pending 锁定重复提交和离开 |
| `T5B-M40` | Repository 失败保留输入和照片并可重试 |
| `T5B-M41` | 失败不导航、不清空、不部分写入 |
| `T5B-M42` | 成功后 Store 先同步完整快照 |
| `T5B-M43` | 成功使用新空间 ID 进入 04 |
| `T5B-M44` | 完成后的栈等价于 02→04 |
| `T5B-M45` | 从 04 返回 02，不返回 03 或 01 |
| `T5B-M46` | 重启后不重复显示 01 |

### 8.5 工程与回归

| ID | 必须证明 |
|---|---|
| `T5B-M47` | 01/03/13 注册后才删除临时页 |
| `T5B-M48` | 没有残留只供临时页使用的孤儿素材 |
| `T5B-M49` | 没有新增生产依赖 |
| `T5B-M50` | 没有第二套 Store、Repository、导航或 PhotoPicker |
| `T5B-M51` | Task 2 公开组件合同未被修改 |
| `T5B-M52` | 02/04/08 回归测试继续通过 |
| `T5B-M53` | 微信开发构建和生产构建通过 |
| `T5B-M54` | 01/03/13 三张标准截图齐全 |
| `T5B-M55` | Task 5 总路径在微信开发者工具真实通过 |

### 8.6 自动化命令

`package.json` 必须提供：

```json
{
  "scripts": {
    "verify:task5b": "...",
    "verify:task5": "npm run verify:task5a && npm run verify:task5b"
  }
}
```

`verify:task5b` 至少聚合：

```text
Task 5B 定向单元测试
Task 5B 页面组件测试
首次说明字段与 Repository 兼容性测试
appStore/bootstrap/reset 兼容性测试
路由解析与 NavigationAdapter 测试
TypeScript 类型检查
微信生产构建
禁止项静态扫描
```

Builder 最终必须依次运行：

```powershell
npm run verify:task5b
npm run verify:task5
```

不得把交互式 watch 命令当作退出码明确的验收命令。

## 9. 微信视觉与人工体验门

### 9.1 标准证据

在 `393 × 852 CSS px` 标准视口取得：

- 01 首次说明；
- 03 创建 Ta 的空间；
- 13 隐私说明。

截图必须来自微信开发者工具的真实构建产物，不使用浏览器原型冒充正式页面。

### 9.2 视觉比较

每页至少检查：

- PageShell 布局类型；
- 安全区和底部操作区；
- 标题、正文与辅助文字层级；
- 主要/次要操作强调关系；
- 表单错误的中性表达；
- 照片预览、圆角和操作间距；
- 隐私长文的段落节奏与可读性；
- 是否出现 Task 2 禁止的原始视觉值或重复组件。

若与基准有差异，Builder 必须说明：

```text
差异位置
像素或行为证据
原因
是否属于平台不可避免差异
是否需要修复
```

不得用“看起来差不多”替代证据。

### 9.3 响应与设备

至少补充检查：

- 320 CSS px 窄屏不横向溢出；
- 480 CSS px 宽屏不失控拉伸；
- 03 键盘打开时输入框、错误和创建操作可达；
- 03 键盘关闭后页面不残留错误位移；
- 13 长文可完整滚动；
- 系统返回与页面返回一致；
- 真机相册权限、拒绝和取消属于设备相关项，若本轮无法真机验证，必须单独列为未验证风险。

## 10. Reviewer 反证门

独立 Reviewer 不重复照抄 Builder 命令输出，而应主动尝试推翻完成结论。

至少反证：

| ID | 反证动作 |
|---|---|
| `T5B-A01` | 让 completeOnboarding 延迟超过 150ms，检查重复点击和文案 |
| `T5B-A02` | 让 completeOnboarding 抛错，检查是否错误导航或提前改状态 |
| `T5B-A03` | 构造旧 v1 缺字段且已有空间，检查是否丢数据或重进 01 |
| `T5B-A04` | 从 01 查看隐私后重启，检查字段是否被误改 |
| `T5B-A05` | 输入仅空格、20 字、21 字和代理对字符 |
| `T5B-A06` | 模拟相册取消、拒绝、失败和更换失败 |
| `T5B-A07` | 只选照片后返回，检查是否触发保护 |
| `T5B-A08` | 连续点击创建，检查是否产生重复空间 |
| `T5B-A09` | 让 Repository 创建失败后重试，检查表单是否完整 |
| `T5B-A10` | 创建成功后连续返回，检查是否重进 03 或 01 |
| `T5B-A11` | 搜索页面直接存储、直接 uni 跳转和第二套 PhotoPicker |
| `T5B-A12` | 在微信开发者工具走完整 01→13→01→03→04→02→04→08 |

高风险人工门：

- `T5B-H01`：相册真实取消与权限拒绝；
- `T5B-H02`：键盘、安全区和系统返回；
- `T5B-H03`：标准视口三页视觉比较；
- `T5B-H04`：真实页面栈没有完成页残留；
- `T5B-H05`：重启后首次说明不重复出现。

任何一项发生数据丢失、重复创建、虚假能力、错误页面栈或隐私边界误述，Task 5B 直接退回，不以其他测试通过抵消。

## 11. 禁止的捷径

Builder 不得：

- 先导航到 03，再异步补写首次说明状态；
- 用内存布尔值代替快照持久化；
- 用“有无空间”长期替代 onboarding 字段；
- 为复现状态增加第三个正式样本模式；
- 在 01 请求登录或微信用户资料；
- 把 13 写成 M1 已经上线；
- 用无响应按钮表示未来导出；
- 在页面直接调用 `uni.chooseMedia`、存储或 Repository；
- 选择新照片前先删除旧照片；
- 创建失败后清空表单；
- 用多次 `navigateBack` 猜测完成后的页面栈；
- 创建第二个空间首页、隐私页或照片服务；
- 删除失败测试、降低断言或跳过微信构建；
- 未完成真实页面验证便宣布整个 Task 5 完成。

## 12. Builder 收口报告

Builder 必须按以下结构提交，不写笼统总结：

```text
本轮完成：
- 对应 5B-0 至 5B-5 的实际批次

修改文件：
- 创建：
- 修改：
- 删除：

自动验证：
- 命令：
- 退出码：
- 测试数量：
- 构建结果：

微信人工验证：
- 01：
- 03：
- 13：
- 完整路径：

验收 ID：
- T5B-M01 至 T5B-M55：逐项 PASS / FAIL / BLOCKED
- T5B-H01 至 T5B-H05：逐项 PASS / FAIL / NOT RUN

与视觉基准的差异：
- 无 / 具体说明

尚未验证或外部阻碍：
- 无 / 具体说明

同步更新的状态文档：
- 

结论：
- Task 5B self-verified / 部分完成 / 等待外部验证
```

Builder 只能报告 `self-verified`。独立 Reviewer 完成反证、微信视觉检查和 Task 5 总路径后，才能把 Task 5 记为正式通过。

## 13. 最终完成定义

Task 5B 只有同时满足以下条件才可提交独立验收：

1. 5B-0 至 5B-5 全部完成；
2. `T5B-M01` 至 `T5B-M55` 均有证据；
3. `verify:task5b` 与 `verify:task5` 退出码为 0；
4. 01、03、13 标准截图齐全并完成差异说明；
5. 微信开发者工具中的 Task 5 总路径通过；
6. 没有重复提交、失败丢状态或错误页面栈；
7. 没有虚假登录、云端、AI 或导出能力；
8. Task 5A 的 02、04、08 没有回归；
9. 实施计划、README 和进度复选框只按真实证据更新；
10. 未验证的真机权限与设备项被诚实列出。

满足 Builder 自证不等于独立验收完成。Reviewer 通过前，不得开始依赖 Task 5 页面的 Task 6 正式施工。
