# Task 7 会话照片、照片记录、文字加图与失效降级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. 本计划采用一次性大收口，不设置 Phase A/B/C 小收口；Builder 完成全部范围后统一提交自证材料，Logic Reviewer、视觉负责人和用户一次性验收。

**Goal:** 在 M0 中完成真实可用且诚实的照片闭环：选择照片 → 只保存照片或继续写一段 → 草稿/正式记忆保存 → 多图叠放与查看 → 重启后的 session-only 失效降级。

**Architecture:** 页面只负责本次记录的临时选择状态和交互；照片选择统一经过 `PhotoPicker` Adapter；资产写入统一经过现有 Pinia `memory` Store 与 `MemoryRepository` 的 `MemoryAssetInput` 合同。照片的 URI 只作为本机会话输入，保存后标记为 `session-only`，bootstrap 后转为 `expired`；已打包的 bundled fixture 照片保持可用。现有 `PhotoStack` 与 `PhotoViewer` 是 Task 2 已确认的共享组件，本 Task 复用并补齐失效文案，不另建第二套照片组件。

**Tech Stack:** uni-app、Vue 3、TypeScript、Pinia、微信小程序、Vitest、现有 `PhotoPicker` / `MemoryRepository` / `PageShell` / `PhotoStack` / `PhotoViewer`。

## Global Constraints

- 当前阶段固定为 `M0` 本地 Mock；不接入云端照片、不上传照片、不调用真实 AI、不提供分享、下载、转发、评论或图片编辑。
- 浏览器原型是视觉标准：`apps/pet-memory-design-prototype/src/Prototype.tsx` 与 `prototype.css`；原型结构用于移植，原型事件和浏览器 CSS 不得直接复制到 Vue/WXSS。
- Task 7 的开工门是 Task 6 已达到 `reviewer-accepted`，至少包括文字记录、草稿、09 只读详情和 04 返回链路。若 Task 6 尚未通过，不得用照片实现掩盖文字闭环问题。
- 页面不得直接访问 storage、Repository、`uni.chooseMedia` 或原始 `uni.navigate*`；页面只使用 Store、Adapter 和 NavigationAdapter。
- 路由只传 `spaceId`、`memoryId`、`entry`、`draftId`、`source` 等白名单参数，不传照片数组、URI、原话或完整快照。
- 选择顺序必须保留，最多 9 张；不做拖拽排序、图片编辑器或自动轮播。
- 取消、权限拒绝和选择失败必须区分；失败不得清空已经选择的照片，也不得清空文字。
- 照片记忆可以没有文字；文字记忆可以没有照片；只有文字和照片都为空时才禁止保存正式记忆。
- session-only 照片不得被描述为永久保存；重启后的失效状态必须保留记忆结构和明确的中性说明。
- Task 8 的编辑、删除、AI 候选稿不属于本 Task；09 页面只扩展照片展示和失效说明，不提前实现未来操作。
- 微信组件 WXSS 只能使用允许的 class 选择器；不得使用 tag、ID、attribute、通配或 `:root` 选择器。
- 不新增 UI 组件库、照片 SDK、状态管理库、云服务 SDK 或生产运行时依赖。

---

## 1. 开工依赖与事实来源

### 1.1 必须先读取

- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md` 的 Task 7、Task 8 段落；
- `docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md`；
- `docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md`；
- `docs/project/acceptance/2026-07-28-task-5b-onboarding-space-creation-acceptance-standard.md`；
- Task 6 实施计划：`docs/product/plans/2026-08-03-task-6-recording-draft-implementation-plan.md`；
- Task 6 最终自证与 Reviewer 报告，确认记录页、草稿页和 09 只读详情已经真实存在且可回归。

### 1.2 浏览器原型来源

- `apps/pet-memory-design-prototype/src/Prototype.tsx`
  - `RecordEntryScreen`
  - `RecordTextScreen`
  - `RecordPhotoScreen`
  - `MemoryDetailScreen`
- `apps/pet-memory-design-prototype/src/prototype.css`
  - `.photo-preview`
  - `.photo-change-button`
  - `.photo-choice-list`
  - `.photo-add-action`
  - `.session-note`
  - `.detail-photo-stack`

### 1.3 微信现有实现来源

- `apps/pet-memory-miniapp/src/adapters/photo-picker.ts`
- `apps/pet-memory-miniapp/src/adapters/uni-photo-picker.ts`
- `apps/pet-memory-miniapp/src/adapters/photo-picker-deps.ts`
- `apps/pet-memory-miniapp/src/components/PhotoStack.vue`
- `apps/pet-memory-miniapp/src/components/PhotoViewer.vue`
- `apps/pet-memory-miniapp/src/features/photos/photo-types.ts`
- `apps/pet-memory-miniapp/src/types/domain.ts`
- `apps/pet-memory-miniapp/src/repositories/local-memory-repository.ts`
- `apps/pet-memory-miniapp/src/repositories/snapshot-validation.ts`
- `apps/pet-memory-miniapp/src/pages/record-text/index.vue`
- `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`

---

## 2. 原型到小程序映射

| 浏览器原型 | 微信小程序目标 | 移植要求 |
|---|---|---|
| `RecordEntryScreen` 的“一张照片”入口 | `pages/record-entry/index.vue` | 在 Task 6 三个文字入口基础上接通照片入口，不改变已有文字入口顺序和样式 |
| `RecordPhotoScreen` | `pages/record-photo/index.vue` | 先选择照片，再显示大图/叠放、替换、只保存照片、继续讲述和会话说明 |
| `RecordTextScreen` 的编辑区 | `pages/record-text/index.vue` | 复用 Task 6 输入和草稿状态，增加低强调“加一张照片”和已选照片移除 |
| `RecordTextScreen` 的 photo prompt | `entry-prompts.ts` | 增加 `photo` 首问：`看到这张照片时，你最先想起了什么？` |
| `MemoryDetailScreen` 的照片区 | `pages/memory-detail/index.vue` | 复用 `PhotoStack` / `PhotoViewer`；保留原话优先，补齐 expired 说明 |
| 原型中的图片 URI | `PickedPhoto.uri` → `MemoryAssetInput` | 只通过 Adapter 和 Repository 写入，路由不携带 |
| 浏览器照片状态 | 页面 `SelectedPhoto` + Store/Repository 快照 | 页面临时选择不进入 URL；跨页面时先保存为明确的草稿并传 `draftId` |

Task 7 不复制原型中的真实图片资源作为用户选择结果。原型图片只作为视觉参考；用户选择的照片只接受微信 `PhotoPicker` 返回的会话 URI。

---

## 3. 文件施工地图

### 3.1 创建

- `apps/pet-memory-miniapp/src/pages/record-photo/index.vue`
- `apps/pet-memory-miniapp/src/features/recording/photo-flow.ts`
- `apps/pet-memory-miniapp/tests/unit/photo-flow.test.ts`
- `apps/pet-memory-miniapp/tests/components/record-photo-page.test.ts`

### 3.2 修改

- `apps/pet-memory-miniapp/src/adapters/photo-picker.ts`：保持 `PhotoPicker` 公共接口稳定，补齐结果说明或必要的类型注释；
- `apps/pet-memory-miniapp/src/adapters/uni-photo-picker.ts`：完善微信取消、拒绝、失败分类和多图顺序；
- `apps/pet-memory-miniapp/src/features/recording/entry-prompts.ts`：增加 `photo` 入口与首问，保留三个文字入口；
- `apps/pet-memory-miniapp/src/features/recording/draft-exit.ts`：把“照片变更”纳入 dirty 判定和退出保护；
- `apps/pet-memory-miniapp/src/features/routing/route-params.ts`：增加/扩展 `record-photo`、`record-text` 的 `draftId`、`entry=photo` 白名单解析；
- `apps/pet-memory-miniapp/src/adapters/navigation.ts`：增加 `record-photo` 路径；
- `apps/pet-memory-miniapp/src/pages.json`：注册 `pages/record-photo/index`，使用 `navigationStyle: custom`；
- `apps/pet-memory-miniapp/src/pages/record-entry/index.vue`：接通“一张照片”入口；
- `apps/pet-memory-miniapp/src/pages/record-text/index.vue`：接通照片选择、已选照片、移除、草稿恢复、文字加图和资产提交；
- `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`：使用共享照片叠放/查看器，显示 available 与 expired 两种状态；
- `apps/pet-memory-miniapp/src/features/memories/memory-summary.ts`：继续只对 available 图片生成缩略图，补充 expired 计数/状态所需的非敏感视图字段；
- `apps/pet-memory-miniapp/src/components/PhotoStack.vue`：保留 props/emits 合同，补充 expired 的可理解视觉状态；
- `apps/pet-memory-miniapp/src/components/PhotoViewer.vue`：保留 props/emits 合同，补充 expired 的可理解说明；
- `apps/pet-memory-miniapp/tests/unit/photo-picker.test.ts`：补齐 Adapter 结果分类；
- `apps/pet-memory-miniapp/tests/components/photo-components.test.ts`：补齐 0/1/2/3/9 张、失效、打开、滑动、关闭反证；
- `apps/pet-memory-miniapp/tests/components/record-text-page.test.ts`：增加照片选择、取消/拒绝/失败、移除、保存和草稿恢复；
- `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`：增加图片、expired、纯照片记忆与原话优先；
- `apps/pet-memory-miniapp/tests/components/task6-journey.test.ts`：扩展照片后保存的真实调用链，或另建 Task 7 集成测试，不删除 Task 6 反证；
- `apps/pet-memory-miniapp/tests/unit/local-memory-repository.test.ts`：补齐新照片、草稿照片转正式记忆、照片上限和失败不提交；
- `apps/pet-memory-miniapp/tests/unit/snapshot-validation.test.ts`：补齐 session-only / bundled / expired 快照边界。

### 3.3 明确不修改

- 不创建第二个 PhotoPicker、PhotoStore 或 PhotoRepository；
- 不把页面改成直接调用 `uni.chooseMedia`；
- 不修改 Task 5A 的空间列表、空间首页和全部记忆整体视觉结构；
- 不提前实现 `memory-edit`、`ai-draft`、删除、分享、导出或照片编辑器；
- 不删除 `PhotoStack` / `PhotoViewer`，不以页面内重复组件替代它们；
- 不把真实用户照片、测试截图或临时路径提交到公开样本和日志。

---

## 4. 照片数据与跨页面合同

### 4.1 选择项类型

在 `photo-flow.ts` 中定义页面使用的选择项，不把临时对象放进路由：

```ts
export type SelectedPhoto =
  | { kind: 'new'; photo: PickedPhoto }
  | { kind: 'existing'; assetId: string }
```

必须提供纯函数：

```ts
export const MAX_PHOTOS = 9

export function remainingPhotoSlots(selected: readonly SelectedPhoto[]): number

export function appendPickedPhotos(
  selected: readonly SelectedPhoto[],
  picked: readonly PickedPhoto[],
): { kind: 'ok'; selected: SelectedPhoto[] } | { kind: 'limit-exceeded' }

export function removeSelectedPhoto(
  selected: readonly SelectedPhoto[],
  index: number,
): SelectedPhoto[]

export function toMemoryAssetInputs(
  selected: readonly SelectedPhoto[],
): MemoryAssetInput[]

export function hasPhotoChanges(
  initialAssetIds: readonly string[],
  selected: readonly SelectedPhoto[],
): boolean
```

要求：

- 顺序由数组顺序决定；
- `appendPickedPhotos` 不允许超过 9 张；
- 取消、拒绝、失败不调用 `appendPickedPhotos`；
- 移除只改变页面选择，不直接删除已保存资产；
- `toMemoryAssetInputs` 将 `new` 转为 `{ kind: 'new', asset: { uri } }`，将 `existing` 转为 `{ kind: 'existing', assetId }`；
- 纯函数不访问 Store、Repository、uni API 或时间。

### 4.2 记录入口到文字页

照片页进入文字页时，不能把照片数组编码到 URL。统一流程为：

```text
record-photo 已选照片
→ memoryStore.saveDraft({
    spaceId,
    entry: 'photo',
    text: '',
    assets: toMemoryAssetInputs(selected),
  })
→ 得到 draftId
→ /pages/record-text/index?spaceId=...&entry=photo&draftId=...
```

这样照片资产由 Repository 明确归属 draft，页面之间只传稳定 `draftId`。若保存草稿失败，停留照片页并保留页面选择，不导航。

### 4.3 草稿资产转正式记忆

保存照片或图文记忆时，必须把当前选择中的既有草稿资产和新照片一起传给 Repository：

```ts
saveMemory({
  spaceId,
  entry,
  originalText,
  assets: toMemoryAssetInputs(selected),
  sourceDraftId,
})
```

不得只传新照片而遗漏 `existing assetId`。Repository 单次快照提交必须完成：

```text
新建 memory
+ 将保留的 draft assets 转为 memory owner
+ 将新照片建立为 memory owner
+ 删除 source draft
+ 删除 source draft 中被移除且不再被引用的资产
```

失败时上述四项全部不发生，页面输入和选择保持不变。

### 4.4 session-only 与 bundled

| 类型 | 保存时 | bootstrap 后 | UI 表达 |
|---|---|---|---|
| 用户选择照片 | `persistence=session-only`, `availability=available` | `availability=expired` | 不显示破图；显示照片仅用于上次预览、未保存到云端的说明 |
| bundled fixture | `persistence=bundled`, `availability=available` | 保持 `available` | 正常显示 |

不得把 session-only URI 写成永久资源 URL，不得在重启后继续尝试渲染已经 expired 的 URI。

---

## 5. PhotoPicker Adapter 合同

### 5.1 公共接口

保留现有接口：

```ts
export interface PickedPhoto {
  uri: string
  width?: number
  height?: number
}

export type PickResult =
  | { kind: 'selected'; photos: PickedPhoto[] }
  | { kind: 'cancelled' }
  | { kind: 'denied' }
  | { kind: 'failed' }

export interface PhotoPicker {
  pick(options: { remaining: number }): Promise<PickResult>
}
```

### 5.2 微信实现

`UniPhotoPicker` 必须：

- 将 `remaining` 限制在 1–9 后传给 `uni.chooseMedia({ count })`；
- 只请求 image；
- 保留微信返回 `tempFiles` 的原始顺序；
- `tempFiles.length === 0` 归类为 `cancelled`；
- `cancel` 归类为 `cancelled`；
- `auth deny` / `authorize` 归类为 `denied`；
- 其他失败归类为 `failed`；
- 不把原始错误对象、真实路径或权限详情写入用户内容、路由或报告样本。

### 5.3 页面状态反应

| 结果 | 首次选择 | 已有照片后再次选择 |
|---|---|---|
| `selected` | 按顺序追加 | 按顺序追加到剩余槽位 |
| `cancelled` | 保持空状态，无错误 | 保持已有照片，无错误 |
| `denied` | 显示需要相册权限的中性说明 | 保持已有照片并显示说明 |
| `failed` | 显示可重试失败说明 | 保持已有照片并显示说明 |

`isPickingPhoto` 必须防止连续点击；picker 结束后无论结果如何都恢复可操作状态。

---

## 6. 页面施工合同

### 6.1 `record-photo` 页面

以原型 `RecordPhotoScreen` 为视觉标准：

- PageShell 标题：`一张照片`；
- 引导标题：`先把这张照片留在这里`；
- 说明：照片不需要说明，也可以继续写下一句；
- 空状态提供低强调 `添加一张照片`；不进入页面即自动弹出系统相册，避免导航就触发权限请求；
- 选中后展示一张大图；两张及以上复用 `PhotoStack`；
- 允许更换、移除照片；
- 选择顺序保留；最多 9 张；
- `先只留下照片` 直接保存正式记忆，`originalText=''`，保存成功进入 09；
- `说说最先想起的事` 先建立/更新 photo draft，再进入 `record-text?entry=photo&draftId=...`；
- 显示：`M0 中，这些照片只用于本次会话预览，不会被描述为已经永久保存。`；
- 选择取消、拒绝、失败时保留已有状态；
- 空状态返回不产生草稿；已有照片返回进入统一退出保护。

### 6.2 `record-text` 页面照片扩展

在 Task 6 已有文字输入合同上增加：

- `entry=photo` 使用首问：`看到这张照片时，你最先想起了什么？`；
- photo draft 加载时恢复 `existing assetId` 和原有文字；
- 文字编辑区下方显示低强调的 `加一张照片`；
- 已选照片以小型横向预览/叠放展示，每张都可移除；
- 继续选择使用同一个 PhotoPicker，remaining = `9 - selected.length`；
- 文字保存、草稿保存、返回保护都提交当前选择；
- 照片失败不清空文字，文字保存失败不清空照片；
- 纯文字入口原有行为不回归；
- Task 7 不显示 AI、编辑详情或照片编辑器。

### 6.3 `memory-detail` 页面照片扩展

- 有照片时使用 `PhotoStack`，点击打开 `PhotoViewer`；
- 1 张照片不显示多图计数；2–9 张显示 `当前 / 总数`；
- available 照片正常渲染；expired 照片显示中性占位和说明，不渲染失效 URI；
- 混合图文记忆始终显示原话；
- 纯照片记忆显示 `一张照片` 的中性摘要和照片失效说明；
- bundled fixture 照片在完整样本中保持可查看；
- 查看器只能关闭、计数和左右滑动，不提供分享、保存、转发、编辑或删除；
- 不把 expired 误报成加载失败或用户操作错误。

### 6.4 `PhotoStack` 与 `PhotoViewer`

复用已有公开 props/emits：

- `PhotoStack`：props 为 `items`、`initialIndex`；emits 为 `open`、`change`。
- `PhotoViewer`：props 为 `open`、`items`、`initialIndex`；emits 为 `close`、`change`。

如需显示 expired 文案，只修改内部模板和样式，不改变现有调用方接口。继续保持：

- 最多三层视觉叠放；
- 左右滑动切换当前索引；
- 垂直滑动不切换；
- 滑动后不误触发打开；
- 当前 index 不越界；
- 查看器打开时阻止页面底层滚动；
- 微信按钮默认 `::after` 边框已清除。

---

## 7. 自动化验证

Builder 完成全部实现后一次性运行：

```powershell
npm run test:run -- tests/unit/photo-picker.test.ts tests/unit/photo-flow.test.ts tests/unit/snapshot-validation.test.ts tests/unit/local-memory-repository.test.ts tests/components/photo-components.test.ts tests/components/record-photo-page.test.ts tests/components/record-text-page.test.ts tests/components/memory-detail-page.test.ts
npm run test:run
npm run typecheck
npm run build:mp-weixin
npm run verify:task5a
npm run verify:task5b
```

必须验证：

- Picker 四种结果均有测试；
- 0、1、2、3、9 张选择均有测试；
- 第 10 张被阻止且不调用多余写入；
- 取消/拒绝/失败不改变已有选择；
- 草稿照片转正式记忆时资产 owner 正确迁移；
- 删除照片后未保留资产被清理；
- 保存失败不提交半成品；
- bootstrap 后 session-only 变 expired，bundled 不变；
- PhotoStack/Viewer 的滑动、计数、失效和关闭通过；
- Task 5A、Task 5B 和 Task 6 回归不受影响；
- 生产构建无 DevPanel、无无效页面引用、无 WXSS 兼容性违规；
- 无新增生产依赖。

---

## 8. 微信开发者工具一次性大收口路径

使用最新生产构建：

```text
apps/pet-memory-miniapp/dist/build/mp-weixin
```

标准视口优先使用 393×852；权限、键盘和失效降级至少在一个 iPhone 与一个 Android 环境检查。

### 8.1 只保存照片

```text
完整样本 → 04 团团首页
→ 留下一段
→ 一张照片
→ 添加 1–3 张照片
→ 先只留下照片
→ 09 详情
→ 关闭查看器 / 左右滑动 / 返回 04
```

检查：

- `originalText` 为空但记忆存在；
- 04 摘要显示 `一张照片`；
- 选择顺序和计数正确；
- 取消/拒绝/失败不会清空已有照片。

### 8.2 照片继续讲述

```text
04 → 一张照片 → 选择照片
→ 说说最先想起的事
→ photo 首问文字页
→ 输入原话并继续加图
→ 保存正式记忆
→ 09 显示原话与照片
```

检查：

- URL 只有 `spaceId`、`entry=photo`、`draftId`；
- 不通过 URL 传照片 URI；
- photo draft 资产全部迁移到新 memory；
- 保存失败时文字和照片均保留。

### 8.3 文字记录加图

```text
04 → 记录入口 → 日常
→ 输入文字 → 加一张照片
→ 取消 / 拒绝 / 失败
→ 重新选择成功
→ 保存草稿或正式记忆
```

检查：

- 文字不因照片失败而消失；
- 照片不因文字保存失败而消失；
- 草稿恢复后照片仍可移除、追加和保存；
- 不显示尚未接通的 AI 或编辑功能。

### 8.4 重启失效降级

```text
选择照片并保存图文记忆
→ 关闭/重新打开小程序
→ bootstrap
→ 09 / 08 / 04 回看
```

检查：

- session-only 图片不再请求渲染失效 URI；
- 原话仍然存在；
- 图片区域显示中性失效说明；
- 纯照片记忆仍然可被识别为一张照片；
- bundled 完整样本照片仍然正常显示。

### 8.5 真机权限与选择操作

- 首次相册权限允许；
- 用户取消；
- 用户拒绝权限；
- 系统选择失败；
- 选择 1 张、3 张、9 张；
- 尝试第 10 张；
- 更换、移除、再次选择；
- 系统返回和 PageShell 返回触发同一退出保护；
- 键盘打开时文字与照片操作仍可达。

---

## 9. 视觉检查与证据

视觉标准以原型为准，但必须接受微信平台的必要适配。重点检查：

- `RecordPhotoScreen` 不是厚重卡片堆叠；
- 照片大图比例、圆角、替换操作和选择列表层级接近原型；
- 会话说明清楚但不制造压力；
- `RecordTextScreen` 的照片操作是低强调，不抢主输入任务；
- 多图叠放最多三层，数量 badge 不遮挡关键内容；
- 查看器背景、关闭、计数和图片适配稳定；
- expired 不显示破图、不使用危险红色警报、不暗示用户操作错误；
- 04、08、09 使用同一套照片语言；
- 图片与胶囊、安全区、键盘不重叠；
- 所有微信原生按钮的默认边框已清除。

Builder 交付截图至：

```text
docs/project/gpt-review-output/task7-evidence/record-photo-selected.png
docs/project/gpt-review-output/task7-evidence/record-text-with-photos.png
docs/project/gpt-review-output/task7-evidence/memory-detail-photo-viewer.png
docs/project/gpt-review-output/task7-evidence/memory-detail-expired.png
docs/project/gpt-review-output/task7-evidence/report.md
```

截图必须来自微信开发者工具真实构建产物，不使用浏览器原型截图冒充实现证据。

---

## 10. Builder 交付物

Builder 只能报告 `self-verified`，并提交：

1. 修改文件清单及每个文件职责；
2. Picker、photo-flow、Repository、Store、页面和共享组件的测试输出；
3. 全量测试、类型检查、生产构建、Task 5A/5B 回归的真实命令输出；
4. 四张微信实现截图和 `task7-evidence/report.md`；
5. 只保存照片、照片继续讲述、文字加图、重启失效、权限拒绝五条路径的实际结果；
6. 资产 owner 在 draft / memory 之间迁移的证据；
7. session-only 与 bundled 的差异说明；
8. 与浏览器原型的差异清单，区分平台适配差异与实现偏差；
9. 未验证项与设备风险；
10. 不得把 `visual-accepted` 或 `reviewer-accepted` 写入 Builder 报告。

---

## 11. Logic Reviewer 与视觉负责人收口规则

本轮采用一次大收口：

- 白屏、构建失败、照片 URI 进入路由、原话丢失、资产 owner 错误、session-only 虚假持久化、保存失败半提交、照片失败清空文字：`FAIL`，整轮退回；
- 权限拒绝后无法继续、重复提交产生两条记忆、超过 9 张仍写入、expired 继续渲染破图：`FAIL`，整轮退回；
- 低风险间距、字号、颜色、非核心说明文字偏差：记录为 `P2/P3`，不阻断主路径，但进入后续清单；
- 原型到微信的必要适配必须有原因和证据，不允许 Builder 只说“微信不支持”；
- Reviewer 必须实际触发取消、拒绝、失败、移除、追加、重启和滑动，不能只搜索 `PhotoPicker` 字符串；
- 视觉负责人必须对照原型源码、微信截图和现有设计令牌，确认照片页面属于同一个产品。

---

## 12. 完成定义

Task 7 只有在以下条件全部满足后才可标记为 `reviewer-accepted`：

1. 04 → 记录入口 → 照片页 → 只保存照片 → 09 在微信真实走通；
2. 04 → 照片页 → 继续讲述 → photo 首问 → 图文保存真实走通；
3. 文字入口可以追加照片、保存草稿、恢复草稿和正式保存；
4. PhotoPicker 的 selected/cancelled/denied/failed 四种结果都可复现；
5. 最多 9 张、顺序、移除和再次选择正确；
6. draft assets 转 memory assets 的 owner、顺序和删除规则正确；
7. 纯照片记忆和图文记忆都可回看；
8. PhotoStack / PhotoViewer 的叠放、计数、滑动、关闭和失效状态通过；
9. 重启后 session-only 失效，原话和记忆记录保留，bundled 照片不受影响；
10. 没有任何界面虚假承诺照片已经永久保存或上传云端；
11. Task 5A、Task 5B、Task 6 回归通过；
12. 全量测试、类型检查、生产构建和 WXSS 检查通过；
13. 四张截图与收口报告齐全；
14. Builder 只报告 `self-verified`，Logic Reviewer、视觉负责人和用户分别完成独立验收；
15. Task 8 的编辑、删除和 AI 仍保持边界，不被照片页面偷偷实现；
16. 状态文档只记录真实证据，不提前更新 M0 总体完成状态。

Task 7 通过后，才进入 Task 8 的记忆详情、编辑原话与受控 Mock AI 计划。
