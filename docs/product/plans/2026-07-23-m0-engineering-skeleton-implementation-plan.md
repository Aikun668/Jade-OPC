# 宠物记忆 M0 工程骨架实施计划

> **当前状态：Task 1 完成，Task 2 self-verified（2026-07-27 全部 9 个修复批次完成，197 测试通过，typecheck 通过，等待独立复核）。Task 3–10 尚未实施。**
>
> Task 2”设计系统与核心展示组件”已经完成专项讨论、逐项确认和正式规格编写。任何执行者不得自行推断或改写 Task 2 的颜色、字体、间距、组件视觉、页面展示和视觉验收规则。
>
> 本文中的 71 个复选框记录正式小程序的实施进度。2026-07-26 开工前审计中的 B0 阻断项、B1 模糊决策、导航合同和状态清理均已确认并写入；Task 1 已获用户授权并开始实施。
>
> **执行要求：** 实施阶段必须逐个 Task 执行并在每个检查点复核。若使用自动化代理执行，应使用适合逐任务实施和复核的工作流，不得一次性生成全部页面后再统一修正。

**目标：** 在 `apps/pet-memory-miniapp` 建立可构建、可测试、可在微信开发者工具和真机中验收的 M0 本地 Mock 小程序，完整覆盖 13 个概念路由页面、文字与草稿闭环、会话级照片、受控 Mock AI、设置与数据控制。

**架构：** 页面只负责路由、页面级临时状态和业务编排；普通组件通过 props 与事件通信；Pinia Store 调用稳定的 `MemoryRepository`；M0 使用单快照 `LocalMemoryRepository`，以后由 M1 的 CloudBase 实现替换。平台能力通过 adapter 隔离，使领域逻辑和组件测试不依赖完整微信运行时。

**技术栈：** uni-app、Vue 3、TypeScript、Pinia、Vite、Vitest、`@vue/test-utils`、`@pinia/testing`、微信开发者工具。

## 全局约束

- 阶段固定为 `M0 — 本地 Mock 骨架`。
- M0 不接入微信登录、CloudBase、云端照片、真实 AI、真实导出、提醒、分享、社区或商业化。
- 当前临时产品名称统一为“宠物记忆”。
- 一次记录只留一段，只提供一个首问，不自动追问。
- 一个空间最多存在一条进行中的草稿；Repository 必须再次校验。
- 用户原话是正式事实来源；AI 只生成可编辑候选稿，永远不得覆盖原话。
- 页面和组件不得直接调用 `uni.getStorage`、`uni.setStorage` 或未来的 CloudBase SDK。
- 普通展示组件不得直接读取 Store；由页面传入 props，并通过事件返回用户选择。
- 页面短生命周期状态使用 `ref` / `reactive`，不得建立 `useUiStore`。
- 路由只传内部 ID 和白名单参数，不传名字、原话、照片路径或序列化对象。
- 用户相册照片在 M0 中标记为 `session-only`；应用重启后允许失效，不得宣称已经永久保存。
- 打包 Mock 照片使用 `bundled` 生命周期，可跨重启稳定显示。
- 用户输入写入 Repository 成功后，Store 才提交正式状态并导航；失败时页面输入必须保留。
- 不预先臆造依赖版本。Task 1 必须根据实际兼容结果锁定版本并生成 lockfile。
- 未经用户明确要求，不初始化 Git、不创建提交、不推送或合并。
- 所有页面任务必须遵守 Task 2 正式规格，不得自行添加颜色、字号、阴影、纹理或组件变体。
- Task 2 是共享视觉组件的唯一创建者；Task 3–10 只能使用固定公开接口，不能复制、改名或在业务页面重建等价组件。
- 页面返回、保存成功、删除成功和放弃流程必须遵守第 19.4 节导航合同；不得靠连续多次返回碰运气恢复页面栈。

## 交付范围

### 13 个路由页面

| 页面 | 路径 | 允许参数 |
|---|---|---|
| 首次说明 | `/pages/onboarding/index` | 无 |
| 我的记忆空间 | `/pages/spaces/index` | 无 |
| 创建 Ta 的空间 | `/pages/space-create/index` | 无 |
| Ta 的空间首页 | `/pages/space-home/index` | `spaceId` |
| 选择记录入口 | `/pages/record-entry/index` | `spaceId` |
| 文字记录 | `/pages/record-text/index` | `spaceId`, `entry=daily|photo|meeting|relationship` |
| 照片记录 | `/pages/record-photo/index` | `spaceId` |
| 全部记忆 | `/pages/memories/index` | `spaceId` |
| 记忆详情 | `/pages/memory-detail/index` | `memoryId` |
| 编辑原话 | `/pages/memory-edit/index` | `memoryId` |
| AI 候选稿 | `/pages/ai-draft/index` | `memoryId` |
| Ta 的空间设置 | `/pages/space-settings/index` | `spaceId` |
| 隐私说明 | `/pages/privacy/index` | 无 |

弹窗、底部面板、照片查看器、开发者面板、加载、空数据、保存中、成功、失败、无权限和内容不存在均为页面局部状态或组件，不新增路由。

### 稳定导航结果

- 创建空间成功：`02 我的记忆空间 → 04 空间首页`；
- 正式保存文字或照片：`04 空间首页 → 09 新记忆详情`；
- 新记忆详情返回：进入 04，不返回已经完成的 05/06/07；
- 从 08 全部记忆进入既有详情：详情返回或删除成功后回到 08，并恢复列表位置；
- 从 04 进入既有详情：详情返回或删除成功后回到 04；
- 删除空间成功：清理该空间的失效页面栈并进入 02；
- 13 隐私说明返回实际来源 01 或 12；
- 键盘、查看器、面板和弹窗总是先于路由页面关闭；
- 未保存表单先执行退出保护；保存草稿或确认放弃后稳定返回 04。

完整 13 页矩阵、草稿恢复与 `NavigationAdapter` 固定接口见正式决策第 19.4 节。

## 目标目录

```text
apps/pet-memory-miniapp/
├─ package.json
├─ package-lock.json
├─ DEVELOPMENT.md
├─ vite.config.ts
├─ vitest.config.ts
├─ tsconfig.json
├─ src/
│  ├─ App.vue
│  ├─ main.ts
│  ├─ pages.json
│  ├─ manifest.json
│  ├─ pages/
│  │  ├─ onboarding/index.vue
│  │  ├─ spaces/index.vue
│  │  ├─ space-create/index.vue
│  │  ├─ space-home/index.vue
│  │  ├─ record-entry/index.vue
│  │  ├─ record-text/index.vue
│  │  ├─ record-photo/index.vue
│  │  ├─ memories/index.vue
│  │  ├─ memory-detail/index.vue
│  │  ├─ memory-edit/index.vue
│  │  ├─ ai-draft/index.vue
│  │  ├─ space-settings/index.vue
│  │  └─ privacy/index.vue
│  ├─ components/
│  │  ├─ PageShell.vue
│  │  ├─ PrimaryButton.vue
│  │  ├─ TextAction.vue
│  │  ├─ FormField.vue
│  │  ├─ MemoryEntry.vue
│  │  ├─ MemoryList.vue
│  │  ├─ DraftNotice.vue
│  │  ├─ ConfirmDialog.vue
│  │  ├─ BottomSheet.vue
│  │  ├─ PhotoStack.vue
│  │  ├─ PhotoViewer.vue
│  │  ├─ MissingContentState.vue
│  │  └─ DevPanel.vue
│  ├─ adapters/
│  │  ├─ storage.ts
│  │  ├─ uni-storage.ts
│  │  ├─ photo-picker.ts
│  │  ├─ uni-photo-picker.ts
│  │  └─ navigation.ts
│  ├─ repositories/
│  │  ├─ memory-repository.ts
│  │  ├─ local-memory-repository.ts
│  │  └─ snapshot-validation.ts
│  ├─ services/
│  │  ├─ ai-draft-service.ts
│  │  └─ mock-ai-draft-service.ts
│  ├─ stores/
│  │  ├─ app.ts
│  │  └─ memory.ts
│  ├─ types/
│  │  ├─ domain.ts
│  │  ├─ repository.ts
│  │  ├─ routes.ts
│  │  └─ ai.ts
│  ├─ fixtures/
│  │  ├─ empty-snapshot.ts
│  │  ├─ complete-snapshot.ts
│  │  └─ assets/
│  ├─ features/
│  │  ├─ routing/
│  │  ├─ spaces/
│  │  ├─ recording/
│  │  ├─ memories/
│  │  └─ developer/
│  ├─ styles/
│  │  ├─ tokens.scss
│  │  ├─ globals.scss
│  │  └─ texture.scss
│  └─ utils/
│     ├─ ids.ts
│     ├─ dates.ts
│     └─ text.ts
└─ tests/
   ├─ helpers/
   ├─ unit/
   └─ components/
```

Task 2 可以按正式规格调整 `components/` 和 `styles/` 中的内部文件，但不得改变页面、Store 和 Repository 的职责边界。

Task 2 是共享组件的唯一创建任务。Task 3–10 只能通过 Task 2 固定的 Props、Events 和 Slots 使用这些组件；不得再次创建同名文件、复制内部结构或在业务 Task 中改写视觉合同。

## 跨任务接口

```ts
export type SampleMode = 'empty' | 'complete'
export type RecordEntry = 'daily' | 'photo' | 'meeting' | 'relationship'
export type TextRecordEntry = RecordEntry
export type AssetPersistence = 'session-only' | 'bundled'

export interface MemorySpace {
  id: string
  name: string
  coverAssetId: string | null
  createdAt: string
  updatedAt: string
}

export interface LocalAsset {
  id: string
  ownerType: 'space' | 'memory' | 'draft'
  ownerId: string
  uri: string
  persistence: AssetPersistence
  availability: 'available' | 'expired'
  order: number
}

export interface MemoryItem {
  id: string
  spaceId: string
  entry: RecordEntry
  originalText: string
  aiCandidateText: string | null
  assetIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoryDraft {
  id: string
  spaceId: string
  entry: RecordEntry
  text: string
  assetIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemorySnapshot {
  schemaVersion: 1
  sampleMode: SampleMode
  hasCompletedOnboarding: boolean
  spaces: MemorySpace[]
  memories: MemoryItem[]
  drafts: MemoryDraft[]
  assets: LocalAsset[]
}

export interface NewSessionAssetInput {
  uri: string
}

export type MemoryAssetInput =
  | { kind: 'existing'; assetId: string }
  | { kind: 'new'; asset: NewSessionAssetInput }

export interface CreateSpaceInput {
  name: string
  coverPhoto: NewSessionAssetInput | null
}

export interface UpdateSpaceInput {
  spaceId: string
  name: string
  coverPhotoChange:
    | { kind: 'keep' }
    | { kind: 'remove' }
    | { kind: 'replace'; photo: NewSessionAssetInput }
}

export interface SaveMemoryInput {
  spaceId: string
  entry: RecordEntry
  originalText: string
  assets: MemoryAssetInput[]
  sourceDraftId: string | null
}

export type UpdateMemoryInput =
  | { kind: 'original-text'; memoryId: string; originalText: string }
  | { kind: 'ai-candidate'; memoryId: string; aiCandidateText: string | null }

export interface SaveDraftInput {
  spaceId: string
  entry: RecordEntry
  text: string
  assets: MemoryAssetInput[]
}

export interface RepositoryWriteResult<T> {
  value: T
  snapshot: MemorySnapshot
}

export interface MemoryRepository {
  bootstrap(): Promise<MemorySnapshot>
  completeOnboarding(): Promise<MemorySnapshot>
  createSpace(input: CreateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>>
  updateSpace(input: UpdateSpaceInput): Promise<RepositoryWriteResult<MemorySpace>>
  deleteSpace(spaceId: string): Promise<MemorySnapshot>
  saveMemory(input: SaveMemoryInput): Promise<RepositoryWriteResult<MemoryItem>>
  updateMemory(input: UpdateMemoryInput): Promise<RepositoryWriteResult<MemoryItem>>
  deleteMemory(memoryId: string): Promise<MemorySnapshot>
  saveDraft(input: SaveDraftInput): Promise<RepositoryWriteResult<MemoryDraft>>
  deleteDraft(draftId: string): Promise<MemorySnapshot>
  resetSample(mode: SampleMode): Promise<MemorySnapshot>
}
```

领域写入输入类型必须独立于持久化实体：

- 调用方不传实体 ID、系统时间、资产归属或可用性；
- 新选择照片只能作为 `NewSessionAssetInput` 进入，Repository 固定标记为 `session-only`；
- `existing` 资产必须由 Repository 校验属于当前空间或来源草稿；
- `SaveDraftInput` 按 `spaceId` upsert 唯一草稿；
- `SaveMemoryInput` 至少包含非空原话或一张照片，最多 9 张；
- `UpdateMemoryInput` 不允许修改既有记忆照片；
- 写操作成功后返回完整快照，Store 使用返回快照整体更新。
- `completeOnboarding()` 只把 `hasCompletedOnboarding` 设为 `true`，并遵守同一候选快照校验与原子提交管线。

`saveMemory` 若接收来源草稿，必须在一次快照写入中原子完成正式记忆创建、资产归属转换与来源草稿删除。写入失败时三者都保持原状；Store 不得组合调用 `saveMemory` 与 `deleteDraft` 来模拟该操作。

---

## Task 1：CLI 工程、依赖兼容与验证基线

**目标：** 建立唯一正式 M0 应用目录，锁定实际可用依赖版本，并证明空工程可以类型检查、测试和生成微信小程序开发/生产产物。

**文件：**

- 创建：`apps/pet-memory-miniapp/package.json`
- 创建：`apps/pet-memory-miniapp/package-lock.json`
- 创建：`apps/pet-memory-miniapp/tsconfig.json`
- 创建：`apps/pet-memory-miniapp/vite.config.ts`
- 创建：`apps/pet-memory-miniapp/vitest.config.ts`
- 创建：`apps/pet-memory-miniapp/DEVELOPMENT.md`
- 创建：`apps/pet-memory-miniapp/src/manifest.json`
- 创建：`apps/pet-memory-miniapp/src/pages.json`
- 创建：`apps/pet-memory-miniapp/src/main.ts`
- 创建：`apps/pet-memory-miniapp/src/App.vue`
- 创建：`apps/pet-memory-miniapp/tests/unit/app-bootstrap.test.ts`
- 修改：`docs/product/technical/2026-07-20-wechat-miniapp-engineering-decision.md`，仅记录实际锁定的工具版本和已验证命令

**产生：**

- `npm run typecheck`
- `npm run test`
- `npm run test:run`
- `npm run dev:mp-weixin`
- `npm run build:mp-weixin`
- `dist/dev/mp-weixin`
- `dist/build/mp-weixin`

### 实施步骤

- [x] **1.1 检查本机 Node、npm、HBuilderX 和微信开发者工具环境**

运行：

```powershell
node --version
npm --version
```

记录实际版本。HBuilderX 与微信开发者工具若无法通过 CLI 获取版本，则在交付记录中写明人工检查结果，不把“已安装”当成“已验证可用”。

Node 必须处于 Node.js 官方仍支持的 `Active LTS` 或 `Maintenance LTS` 周期，并与本次锁定的 uni-app、Vite、Vitest 和 `vue-tsc` 版本实际兼容。检测到 EOL 或非 LTS Node 时停止创建工程，先切换到兼容的受支持 LTS；不得仅因当前 `npm install` 暂时成功就继续。

- [x] **1.2 查询 uni-app Vue 3 CLI 依赖的兼容关系**

运行：

```powershell
npm view @dcloudio/vite-plugin-uni version peerDependencies --json
npm view @dcloudio/uni-app version peerDependencies --json
npm view pinia version peerDependencies --json
npm view vitest version peerDependencies engines --json
npm view @vue/test-utils version peerDependencies --json
```

只选择彼此 peer dependency 与本机 Node 版本兼容的稳定版本。不得通过 `--force` 或 `--legacy-peer-deps` 掩盖冲突。

- [x] **1.3 创建官方 Vue 3 + Vite + TypeScript CLI 骨架**

使用 DCloud 官方当前推荐的 CLI 创建方式，目标目录必须是：

```text
apps/pet-memory-miniapp
```

创建后立即检查 `package.json`、`vite.config.ts`、`src/main.ts`、`src/manifest.json` 与 `src/pages.json`。Task 1 保留官方模板的最小启动页，只用于证明空工程可以构建；不得把它改造成产品页面。Task 5 创建正式首次说明页并更新 `src/pages.json` 后，再删除该模板页及其示例素材，避免 Task 1–4 期间出现无页面可构建的工程。

同时创建短版 `DEVELOPMENT.md`，明确以下固定操作：

1. HBuilderX 打开完整目录 `apps/pet-memory-miniapp`，不是只打开 `src`，也不是把 `dist` 当作源码工程；
2. 在该目录安装依赖、运行类型检查与测试；
3. HBuilderX 运行到微信开发者工具时，配置本机微信开发者工具路径；
4. 自动联动不可用时，先运行 `npm run dev:mp-weixin`，再在微信开发者工具中手动导入 `dist/dev/mp-weixin`；
5. `dist/dev/mp-weixin` 是开发预览产物，`dist/build/mp-weixin` 是生产构建产物，两者都不能手工编辑；
6. AppID、开发者工具服务端口和真机权限按 1.7 的阶段门槛处理。

- [x] **1.4 安装并锁定已批准的开发依赖**

允许的测试依赖范围：

```text
vitest
@vue/test-utils
@pinia/testing
jsdom
vue-tsc
```

若实际 uni-app 兼容矩阵要求不同测试环境，应先记录原因；不得替换核心技术栈来迎合测试工具。

- [x] **1.5 写入最小启动测试**

测试必须验证：

```ts
import { describe, expect, it } from 'vitest'

describe('M0 application bootstrap', () => {
  it('exposes the M0 schema version', () => {
    expect(1).toBe(1)
  })
})
```

此测试只验证测试链路，不把业务逻辑塞进应用入口。

- [x] **1.6 配置脚本并执行完整基线验证**

`package.json` 至少暴露：

```json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin"
  }
}
```

运行：

```powershell
npm run typecheck
npm run test:run
npm run build:mp-weixin
```

预期：三个命令退出码均为 `0`，且生成 `dist/build/mp-weixin`。

- [ ] **1.7 检查开发产物导入路径** ⬅ 外部阻塞：微信开发者工具尚未安装，模拟器导入待用户安装后验证

运行开发构建，确认 `dist/dev/mp-weixin` 可被微信开发者工具导入。打开与预览分为三个阶段：

| 阶段 | 目标 | 前置条件 | 本轮处理 |
|---|---|---|---|
| S 模拟器开发 | 在微信开发者工具模拟器查看页面和交互 | 开发产物可导入；可使用开发工具允许的测试模式 | 优先打通；外部工具不可用时允许记录唯一阻碍 |
| P 真机预览 | 在用户手机微信中预览 | 用户提供或确认可用 AppID，且微信账号具备项目权限 | 到需要真机预览时再配置 |
| A 自动化采集 | Codex/脚本控制开发者工具并尝试截图 | 可用 AppID、开发者工具服务端口、实际兼容的自动化能力 | Task 2/10 现场探测，不提前承诺 |

- AppID 属于项目运行配置，只有用户明确提供或确认后才写入 `src/manifest.json`；不得擅自使用私人 AppID，也不得把密钥写入仓库；
- HBuilderX 的微信开发者工具安装路径属于本机设置，不写入共享源码；
- 开发者工具“服务端口”只在 HBuilderX 自动拉起失败或需要自动化时开启，不是普通手动导入的前置条件；
- 自动联动失败不阻断开发：保留“命令行持续构建 + 手动导入 `dist/dev/mp-weixin`”兜底；
- 上传、发布、体验版成员管理与生产配置不属于 M0 Task 1，除非用户后续另行授权。

### Task 1 完成条件

- lockfile 存在；
- 没有 peer dependency 强制覆盖；
- 类型检查、单元测试、生产构建通过；
- 微信开发者工具能够加载开发产物，或明确记录唯一外部阻碍；
- `DEVELOPMENT.md` 能让用户区分 HBuilderX 源码目录、微信开发者工具导入目录和 S/P/A 三阶段前置条件；
- 技术文档只记录实际验证过的版本与命令。

---

## Task 2：设计系统与核心展示组件

**状态：self-verified。2026-07-27 全部 9 个修复批次（A–I）完成，197 测试通过，typecheck 通过，等待独立复核。**

Task 2 将独立定义设计令牌、排版算法、间距节奏、组件状态、照片展示、草稿材质、响应式规则、视觉回归基准和第三方 AI 实现约束。Task 3–10 只能依赖 Task 2 最终公开的组件接口，不得在业务页面中自行实现替代视觉。

视觉真源、统一测量坐标、全局设计令牌、页面布局算法、核心组件施工合同、完整状态矩阵、照片展示专项、草稿材质专项、13 页装配说明与视觉回归验收已经写入并确认于 [《M0 设计系统工程执行规格》](../specs/2026-07-24-m0-design-system-engineering-spec.md)。

**依赖：** Task 1 已建立可构建、可测试的空工程并锁定实际兼容版本。

**文件：**

- 创建：`src/styles/tokens.scss`
- 创建：`src/styles/globals.scss`
- 创建：`src/styles/texture.scss`
- 创建：`static/ui/draft-notice-paper.png`
- 创建：`src/components/PageShell.vue`
- 创建：`src/components/PrimaryButton.vue`
- 创建：`src/components/TextAction.vue`
- 创建：`src/components/FormField.vue`
- 创建：`src/components/MemoryEntry.vue`
- 创建：`src/components/MemoryList.vue`
- 创建：`src/components/DraftNotice.vue`
- 创建：`src/components/ConfirmDialog.vue`
- 创建：`src/components/BottomSheet.vue`
- 创建：`src/components/PhotoStack.vue`
- 创建：`src/components/PhotoViewer.vue`
- 创建：`src/components/MissingContentState.vue`
- 创建：`src/components/DevPanel.vue`
- 创建：`tests/components/design-system-contracts.test.ts`
- 创建：`tests/components/PageShell.test.ts`
- 创建：`tests/components/content-components.test.ts`
- 创建：`tests/components/overlay-components.test.ts`
- 创建：`tests/components/photo-components.test.ts`
- 创建：`tests/components/DraftNotice.test.ts`
- 创建：`scripts/visual-regression/normalize-baselines.mjs`
- 创建：`tests/unit/visual-baseline-normalization.test.ts`

### 实施步骤

- [x] **2.1 落地全局令牌与基础样式**

将规格第 4 节的颜色、排版、间距、圆角、边框、阴影、控件与动效令牌逐项写入 `tokens.scss`。`globals.scss` 只建立画布、系统字体、盒模型、文本继承和减少动态效果规则；不得增加页面私有视觉值或全局纸纹。

测试或静态检查至少验证：

- 必需令牌全部存在且值一致；
- 禁止的中间字号、额外阴影和页面背景纹理没有出现；
- 危险色、禁用状态和最小点击热区规则可追溯到共享令牌。

- [x] **2.2 实现 PageShell 与四类布局模板**

按规格第 5、6.2 节实现导航、安全区、微信胶囊避让、原生页面滚动和：

```text
QuietLandingLayout
StandardFlowLayout
TaskFormLayout
ReadingLayout
```

`PageShell.test.ts` 必须覆盖 `320 / 393 / 480px`、键盘打开与关闭、底部操作下沉、长内容滚动、覆盖层滚动锁定和返回后的滚动恢复。

- [x] **2.3 实现基础操作与表单组件**

先写失败测试，再实现：

- `PrimaryButton`
- `TextAction`
- `FormField`

覆盖默认、按下、禁用、等待、错误、两行文案、危险语义、焦点、说明文本、点击热区和单次事件纪律。组件不得读取 Store、调用 Repository 或执行导航。

- [x] **2.4 实现内容与缺失状态组件**

实现：

- `MemoryEntry`
- `MemoryList`
- `MissingContentState`

覆盖有图、无图、照片失效、长摘要、空列表、内容不存在和完整行点击语义。列表只渲染调用方数据，不自行排序、格式化日期或读取详情。

- [x] **2.5 实现弹窗与底部面板**

实现 `ConfirmDialog` 与 `BottomSheet`，覆盖：

- 背景滚动与交互锁定；
- 焦点进入、关闭与恢复；
- 遮罩关闭纪律；
- 两项确认与三项选择边界；
- 草稿冲突、删除范围和保存失败恢复；
- 安全区与 `80%` 有效视口最大高度。

- [x] **2.6 实现照片展示基础组件**

实现 `PhotoStack` 与 `PhotoViewer` 的纯展示和交互合同：

- 单图、两层和最多三层；
- `1.00 / 0.97 / 0.94` 缩放、`0 / 12 / 24rpx` 位移与 `0° / 2° / 4°` 旋转；
- `64rpx / 32rpx` 预留和标准包围盒；
- 水平手势与纵向滚动冲突处理；
- 完整适配查看器、计数、关闭和滚动位置恢复；
- 照片失效时不产生破图请求；
- 不提供分享、下载、转发、评论或编辑。

本步骤只实现组件合同；相册选择、页面索引状态和照片生命周期在 Task 7 接入。

- [x] **2.7 制作草稿材质并实现 DraftNotice**

依据最终首页母版制作单张透明 PNG 草稿材质：

- 不直接裁剪页面截图；
- 不用 CSS 伪元素重新拼胶带或撕边；
- 文案、箭头和点击热区保持真实组件；
- 资产失败时降级为暖白纸面、细边框和轻阴影；
- 整张纸不可点击，只有“继续写”发出一次 `continue`。

将材质资产与最终首页母版放在同一比较输入中复核轮廓、胶带、纹理、阴影和文字层级。

- [x] **2.8 建立视觉回归归一化与能力探测**

实现并测试规格第 11 节的基准归一化：

- `394 × 852` 页面删除最右侧边缘取整列；
- 首页等比缩放到 `393 × 850`，上下各补 `1px` 画布；
- 保留原图和归一化副本 SHA-256；
- 生成 manifest，不改写原始基准。

同时探测微信开发者工具 CLI 和自动截图能力。探测失败必须记录真实原因并启用用户提供 13 张标准截图的通道，不得伪造自动化成功，也不得因此阻断组件实现。

- [x] **2.9 运行 Task 2 组件与构建验证**

```powershell
npm run test:run -- tests/components/design-system-contracts.test.ts tests/components/PageShell.test.ts tests/components/content-components.test.ts tests/components/overlay-components.test.ts tests/components/photo-components.test.ts tests/components/DraftNotice.test.ts tests/unit/visual-baseline-normalization.test.ts
npm run typecheck
npm run build:mp-weixin
```

### Task 2 完成条件

- 全局令牌、布局模板和共享组件与正式规格一致；
- 组件接口、状态、热区、滚动、安全区和降级行为有自动化证据；
- 草稿材质不是截图裁片或 CSS 假纸张；
- 照片叠放几何通过标准包围盒检查；
- 基准归一化与 manifest 可重复生成；
- 自动截图能力按真实环境记录，失败时人工截图通道清楚；
- 页面任务不需要自行作新的视觉判断；
- Task 2 测试、类型检查和微信生产构建通过。

Task 2 的前置规格门已经满足。本计划具备进入实施的必要规格，但只有在用户另行明确授权开始实施后，才能执行 Task 1。

---

## Task 3：领域模型、单快照与 LocalMemoryRepository

**目标：** 先建立与 UI 无关、可完整单测的数据核心。

**文件：**

- 创建：`src/types/domain.ts`
- 创建：`src/types/repository.ts`
- 创建：`src/adapters/storage.ts`
- 创建：`src/adapters/uni-storage.ts`
- 创建：`src/repositories/memory-repository.ts`
- 创建：`src/repositories/local-memory-repository.ts`
- 创建：`src/repositories/snapshot-validation.ts`
- 创建：`src/fixtures/empty-snapshot.ts`
- 创建：`src/fixtures/complete-snapshot.ts`
- 创建：`src/utils/ids.ts`
- 测试：`tests/unit/snapshot-validation.test.ts`
- 测试：`tests/unit/local-memory-repository.test.ts`

**接口：**

- 消费：Task 1 的 TypeScript 与 Vitest 基线；
- 产生：`MemoryRepository`、`MemorySnapshot` 和供 Store 使用的本地实现。

### 实施步骤

- [ ] **3.1 为快照校验写失败测试**

覆盖：

- 空值返回空样本；
- `schemaVersion: 1` 且字段合法时通过；
- 未来版本不得被静默覆盖；
- 非数组字段、重复实体 ID、悬空 `spaceId` 被拒绝；
- 同一空间两条草稿被拒绝；
- `session-only` 资产在新会话 bootstrap 后转为 `expired`。

运行：

```powershell
npm run test:run -- tests/unit/snapshot-validation.test.ts
```

预期：因校验函数尚未存在而失败。

- [ ] **3.2 实现纯函数快照校验**

`snapshot-validation.ts` 必须是无 `uni` 依赖的纯 TypeScript：

```ts
export type SnapshotReadResult =
  | { kind: 'valid'; snapshot: MemorySnapshot }
  | { kind: 'empty' }
  | { kind: 'unsupported-version'; version: number }
  | { kind: 'invalid'; reason: string }

export function validateSnapshot(value: unknown): SnapshotReadResult
export function expireSessionAssets(snapshot: MemorySnapshot): MemorySnapshot
```

未来版本返回 `unsupported-version`，不得调用写入覆盖原数据。

- [ ] **3.3 为 Repository 写失败测试**

使用内存 `StorageAdapter` 和确定性 `Clock`、`IdFactory`，覆盖：

- 首次 bootstrap 写入空样本；
- 首次说明完成状态写入成功、失败与幂等；
- 创建、修改和删除空间；
- 保存、修改和删除正式记忆；
- 保存草稿时替换同空间既有草稿，而不是增加第二条；
- 删除草稿只删除其独占资产；
- 删除记忆删除其独占资产；
- 删除空间级联删除该空间的记忆、草稿和资产；
- 写入失败时不修改内存快照；
- `resetSample('complete')` 返回完整样本；
- `resetSample('empty')` 固定恢复 `hasCompletedOnboarding: false`，`resetSample('complete')` 固定使用 `true`；
- 完整样本含团团与豆豆，并覆盖有图、有草稿、无图、无记忆状态。

- [ ] **3.4 实现 StorageAdapter 和 UniStorageAdapter**

```ts
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}
```

只有 `UniStorageAdapter` 可以调用 `uni.getStorage`、`uni.setStorage` 和 `uni.removeStorage`。

- [ ] **3.5 实现 LocalMemoryRepository**

固定存储键：

```ts
export const M0_SNAPSHOT_KEY = 'pet-memory:m0:snapshot'
```

所有写操作遵循：

```text
读取当前内存快照
→ 创建不可变候选快照
→ 校验候选快照
→ StorageAdapter 写入成功
→ 替换 Repository 内存快照
→ 返回新实体
```

写入失败时不得替换内存快照。

- [ ] **3.6 运行数据层验证**

```powershell
npm run test:run -- tests/unit/snapshot-validation.test.ts tests/unit/local-memory-repository.test.ts
npm run typecheck
```

预期：全部通过。

### Task 3 完成条件

- 单一快照键成立；
- 单草稿规则在 Repository 层成立；
- 删除范围有测试证据；
- 未来 schema 不被覆盖；
- session-only 生命周期有明确降级；
- 数据层不依赖 Vue 或页面。

---

## Task 4：Pinia、应用初始化、路由解析与开发者工具

**目标：** 建立应用状态入口和稳定路由读取，使后续页面不复制数据与参数逻辑。

**文件：**

- 修改：`package.json`，增加 Task 4 单一验证入口，不新增生产依赖
- 修改：`src/main.ts`，注册唯一 Pinia 实例
- 修改：`src/App.vue`，只接入应用生命周期 bootstrap，不添加页面视图
- 修改：`src/pages/index/index.vue`，在 Task 5 替换正式页面前作为仅开发态 `DevPanel` 宿主
- 创建：`src/stores/app.ts`
- 创建：`src/stores/memory.ts`
- 创建：`src/types/routes.ts`
- 创建：`src/features/routing/route-params.ts`
- 创建：`src/adapters/navigation.ts`
- 创建：`src/features/developer/dev-scenarios.ts`
- 创建：`src/components/DevPanel.vue`
- 测试：`tests/unit/app-store.test.ts`
- 测试：`tests/unit/memory-store.test.ts`
- 测试：`tests/unit/route-params.test.ts`
- 测试：`tests/unit/navigation.test.ts`
- 测试：`tests/components/DevPanel.test.ts`

### 实施步骤

- [ ] **4.1 写路由参数失败测试**

覆盖：

- `spaceId` / `memoryId` 缺失；
- ID 不符合内部格式；
- `entry` 只接受 `daily|photo|meeting|relationship`；
- `entry=photo` 在参数层属于合法白名单值；“只能从照片记录的继续讲述进入”由照片页的路由构造与后续页面集成测试保证，不能由只接收 query 的解析函数猜测上一页；
- 照片引用始终从 Store/草稿读取，不进入路由；
- 不读取任何序列化对象参数。

实现：

```ts
export function parseSpaceRoute(query: Record<string, unknown>): RouteParseResult<{ spaceId: string }>
export function parseMemoryRoute(query: Record<string, unknown>): RouteParseResult<{ memoryId: string }>
export function parseTextRecordRoute(
  query: Record<string, unknown>
): RouteParseResult<{ spaceId: string; entry: TextRecordEntry }>
```

`src/adapters/navigation.ts` 必须实现正式决策第 19.4 节的固定 `NavigationAdapter` 接口。`tests/unit/navigation.test.ts` 至少覆盖：

- `push / back / replace` 的一对一平台调用；
- 创建空间、正式保存、删除空间和明确放弃流程使用 `resetTo`；
- 完成后的 03/05/06/07 不残留为用户需要逐级返回的页面；
- 详情页保留 `04 / 08 / new-memory` 三种非敏感来源语义；
- 键盘或覆盖层打开时，页面层先消费返回动作，不调用路由返回。

- [ ] **4.2 写 useAppStore 失败测试并实现**

状态固定为：

```ts
type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error'
```

Store 只管理：

- `bootstrapStatus`
- `sampleMode`
- `schemaVersion`
- `hasCompletedOnboarding`
- `devMode`
- 初始化错误的用户可理解分类

不复制 spaces、memories、drafts。

- [ ] **4.3 写 useMemoryStore 失败测试并实现**

Store 管理：

- `spaces`
- `memories`
- `drafts`
- `assets`

Actions 与 `MemoryRepository` 一一对应。每个 action 必须等待 Repository 成功后再替换状态。Getters 至少包含：

- 按正式记忆最近更新时间排序的空间；
- 某空间最近三条正式记忆；
- 某空间全部记忆时间倒序；
- 某空间唯一草稿；
- 按 ID 查找空间、记忆与资产。

- [ ] **4.4 实现应用 bootstrap 顺序**

```text
App 启动
→ main.ts 注册唯一 Pinia 实例
→ appStore 标记 loading
→ repository.bootstrap()
→ memoryStore 接收完整快照
→ appStore 接收 hasCompletedOnboarding
→ appStore 标记 ready
→ 页面才判断内容是否存在
```

bootstrap 完成前不得显示“内容不存在”。

- [ ] **4.5 实现开发者场景控制**

仅开发构建支持：

- 切换 `empty / complete` 样本；
- 重置本地体验数据；
- 切换 AI 场景；
- 模拟保存失败；
- 模拟照片失败；
- 模拟无权限；
- 查看当前路由、实体 ID 和 schemaVersion。

开发场景语义固定为：

- `empty` 同时恢复 `hasCompletedOnboarding: false`，用于复现真正首次进入；
- `complete` 使用 `hasCompletedOnboarding: true`，直接进入空间列表；
- “已看过说明但没有空间”不新增第三种样本模式，通过 empty → 点击开始 → 创建页取消 → 02 空状态复现。

Task 4 在当前临时启动页挂载仅开发态入口，使上述场景可以被真实操作；Task 5 替换临时页时必须把入口迁移到正式页面的开发态宿主。生产条件编译后，入口、场景控制代码和调试信息均不得出现在产物中。

- [ ] **4.6 运行状态与路由验证**

```powershell
npm run test:run -- tests/unit/app-store.test.ts tests/unit/memory-store.test.ts tests/unit/route-params.test.ts tests/unit/navigation.test.ts tests/components/DevPanel.test.ts
npm run typecheck
npm run build:mp-weixin
```

### Task 4 完成条件

- 只有两个全局 Store；
- Repository 是唯一持久化入口；
- 路由错误和实体不存在被区分；
- 开发工具能稳定复现状态；
- 生产构建不包含可达开发入口。

---

## Task 5：首次进入、创建空间与回看路径

**目标：** 第一次装配正式页面，先建立稳定回看落点，再完成首次进入与创建空间闭环。Task 5 不实现记录、详情或设置业务，但必须为其保留准确的非敏感路由合同。

**执行顺序：**

```text
Task 5A：02 我的记忆空间 → 04 空间首页 → 08 全部记忆
→ 独立 Reviewer 小闭环
Task 5B：01 首次说明 ↔ 13 隐私说明；01 → 03 创建空间 → 04
→ Task 5 总集成验收
```

详细执行与验收门分别位于：

- `docs/project/acceptance/2026-07-28-task-5a-space-browsing-acceptance-standard.md`
- `docs/project/acceptance/2026-07-28-task-5b-onboarding-space-creation-acceptance-standard.md`

**文件：**

- 修改：`package.json`，增加 `verify:task5a`、`verify:task5b` 与聚合 `verify:task5`
- 修改：`src/pages.json`，5A 注册 02/04/08，5B 再注册 01/03/13 并把 01 设为首次入口
- 修改：`src/adapters/navigation.ts`，把空间列表正式路径从临时 `/pages/index/index` 改为 `/pages/spaces/index`
- 删除：5B 确认 01 可构建后，删除 Task 1 临时 `src/pages/index/index.vue` 及仅供模板使用的素材
- 创建：`src/pages/spaces/index.vue`
- 创建：`src/pages/space-home/index.vue`
- 创建：`src/pages/memories/index.vue`
- 创建：`src/pages/onboarding/index.vue`
- 创建：`src/pages/space-create/index.vue`
- 创建：`src/pages/privacy/index.vue`
- 创建：`src/features/memories/memory-summary.ts`
- 创建：`src/features/spaces/space-form.ts`
- 创建：`src/adapters/photo-picker.ts`
- 创建：`src/adapters/uni-photo-picker.ts`
- 测试：`tests/unit/memory-summary.test.ts`
- 测试：`tests/unit/space-form.test.ts`
- 测试：`tests/components/spaces-page.test.ts`
- 测试：`tests/components/space-home-page.test.ts`
- 测试：`tests/components/memories-page.test.ts`
- 测试：`tests/components/onboarding-page.test.ts`
- 测试：`tests/components/space-create-page.test.ts`
- 测试：`tests/components/privacy-page.test.ts`
- 测试：`tests/components/task5-journey.test.ts`

**依赖：** Task 2 的公开组件接口；Task 3 Repository；Task 4 Store、bootstrap、路由解析和 NavigationAdapter。

### Task 5A：空间回看基础

- [ ] **5.1 先建立记忆摘要与空间列表视图模型失败测试，再实现纯函数**

覆盖：

- 摘要只取用户原话，不以 AI 候选稿替代；
- 最多显示两行，视觉截断由共享组件完成，纯函数不破坏原文；
- 只使用第一张 `available` 资产作为缩略图；
- `expired` 或悬空资产不输出破图 URI；
- 日期来自固定输入，不读取当前系统时间；
- 无正式记忆时返回“还没有留下记忆”所需状态。

- [ ] **5.2 实现 02 我的记忆空间**

覆盖 empty、with-spaces、loading 和 error；使用 Store 的正式排序结果。整条空间条目进入 04，不放设置、删除或更多按钮。创建入口指向 03 的固定路由合同；在 5B 创建目标页前，不得增加占位页面或伪造完成状态。

- [ ] **5.3 实现 04 空间首页只读状态**

覆盖无草稿/无记忆、有草稿/无记忆、无草稿/有记忆、有草稿/有记忆、路由非法、实体不存在和 bootstrap 未完成。首页最多显示最近三条正式记忆，使用 `DraftNotice`、`MemoryList` 和既有布局组件，不实现快速编辑或删除。

05 记录入口、09 记忆详情和 12 空间设置由后续 Task 创建。Task 5A 只验证点击事件构造准确路由且不携带私人内容；不得创建占位页、死按钮或声称目标流程已可用。

- [ ] **5.4 实现 08 全部记忆并关闭 Task 5A**

使用时间倒序档案序列，覆盖 empty、with-items、photo-expired、路由非法、实体不存在和 bootstrap 等待状态。完成：

```powershell
npm run verify:task5a
```

并取得 02、04、08 三张 `393 × 852` 微信开发者工具标准截图。Task 5A 通过 Reviewer 后才能开始 5B；不得提前宣布整个 Task 5 完成。

### Task 5B：首次进入、隐私与创建空间

- [ ] **5.5 先建立名称校验与 PhotoPicker 失败测试，再实现适配器**

名称规则：

- 提交前去除首尾空格；
- 空名称提示“先写下 Ta 的名字。”；
- 最多 20 个字符；
- 不限制语言、昵称形式或物种。

PhotoPicker 使用既有固定接口，空间封面 `remaining` 固定为 1。取消、拒绝和失败必须区分；Task 7 复用同一接口，不另建第二套服务。

- [ ] **5.6 实现 01 首次说明与前移后的 13 隐私说明**

01 点击“开始”先调用 `appStore.completeOnboarding()`：Repository 成功写入 `hasCompletedOnboarding: true` 后才进入 03，不经过 02，不请求登录、头像或昵称授权。超过 `150ms` 时按钮显示“正在准备…”。失败时停留 01，恢复操作并显示“刚才没有准备好，可以再试一次。”。13 完整说明 M0 本地 Mock、会话照片、M1 云端边界、Mock AI、删除不可恢复与无虚假导出；从 01 进入后返回 01，查看隐私本身不改变首次说明状态。

先在 `pages.json` 注册并验证 01/03/13，再把 01 调整为首个页面。确认正式入口可构建后，才删除临时 `pages/index/index.vue`。Task 9 后续只补充从 12 进入和返回 12 的集成，不复制第二个隐私页面。

应用根入口等待 bootstrap 完成后按 `hasCompletedOnboarding` 分流：`false` 留在 01，`true` 立即归一化到 02。若旧 v1 快照缺少字段，或错误地出现“已有空间但字段为 false”，必须保留全部空间并修正为 `true`；不得重新展示首次说明或覆盖数据。

- [ ] **5.7 实现 03 创建空间并完成 Task 5 总集成验收**

覆盖：

- 名称唯一必填；
- 照片可选、可跳过、可更换、可移除；
- 未修改时直接返回；
- 有名字或照片时显示“这次先不创建了吗？”；
- “继续填写”保留全部页面状态；
- “先不创建”丢弃临时内容且不创建草稿；
- pending 锁定重复提交和离开；
- 保存失败保留名称、照片、滚动与错误恢复；
- 成功后 Store 先更新，再归一化为 `02 → 04`；
- 从 04 返回到 02，不重新进入 03 或 01。

运行：

```powershell
npm run verify:task5b
npm run verify:task5
```

取得 01、03、13 标准截图，并执行：

```text
01 → 13 → 01
01 → 03 → 创建成功 → 04 → 02 → 再次进入 04 → 08
03 有修改 → 返回保护 → 继续填写
03 有修改 → 返回保护 → 先不创建 → 02
03 保存失败 → 原输入仍在 → 重试成功
```

### Task 5 完成条件

- 5A、5B 均通过独立 Reviewer；
- 首次路径、创建路径和回看路径形成真实闭环；
- 首次创建不经过空列表、不被登录打断；
- 返回保护不产生空间草稿；
- 01、02、03、04、08、13 的标准状态通过微信截图复核；
- loading、error、empty、missing 与完整样本不混淆；
- 页面只通过 Store、Repository 和 NavigationAdapter 工作；
- 未创建 05、09、12 占位页，后续入口边界有明确记录；
- 页面没有自行发明 Task 2 之外的样式；
- Task 5 正式验收前不得更新 README 为已完成。

---

## Task 6：记录入口、文字记录、单草稿与正式原话

**目标：** 完成 M0 最核心的文字记录闭环。

**文件：**

- 创建：`src/pages/record-entry/index.vue`
- 创建：`src/pages/record-text/index.vue`
- 修改：`src/pages/space-home/index.vue`
- 创建：`src/features/recording/entry-prompts.ts`
- 创建：`src/features/recording/draft-exit.ts`
- 测试：`tests/unit/entry-prompts.test.ts`
- 测试：`tests/unit/draft-exit.test.ts`
- 测试：`tests/components/record-entry-page.test.ts`
- 测试：`tests/components/record-text-page.test.ts`
- 修改测试：`tests/components/space-home-page.test.ts`

### 实施步骤

- [ ] **6.1 固定四个入口与三个文字首问**

入口顺序：

```text
日常
一张照片
相遇
你们的关系
```

文字页首问：

```ts
export const TEXT_ENTRY_PROMPTS: Record<TextRecordEntry, string> = {
  daily: 'Ta 平时最喜欢待在哪个地方？',
  photo: '看到这张照片时，你最先想起了什么？',
  meeting: '还记得第一次见到 Ta 时，Ta 是什么样子吗？',
  relationship: '如果用一句话形容你和 Ta 的关系，会是什么？',
}
```

不得自动追加第二个问题。

- [ ] **6.2 实现记录入口页**

四个入口都不是必须完成的模块，不默认高亮。照片进入独立照片页，其他三个入口进入共用文字页。

- [ ] **6.3 实现文字输入**

- 不显示字数统计；
- 技术上限制 2,000 字；
- 只有超限时显示中性提示；
- 当前文字、保存中、错误和面板状态只保存在页面；
- 本 Task 先完成纯文字记录闭环，不显示尚未接通的照片按钮；
- 不要求填写事件发生日期。

- [ ] **6.4 实现“想不起来”底部面板**

面板只帮助切换更轻的回忆角度或安全停止，不自动生成内容，不调用 Mock AI，不替用户填写输入框。

- [ ] **6.5 实现安全退出与草稿**

有输入或照片时退出，提供明确选择：

- 保存为草稿后离开；
- 继续填写；
- 放弃本次内容。

已有草稿时再次开始新记录，显示：

- 继续写这段；
- 不保留这段，另起一段；
- 先不动。

“不保留这段，另起一段”删除旧草稿及只属于旧草稿的会话资产，不叠加第二次确认。

- [ ] **6.6 实现保存原话**

保存成功：

```text
Repository 在一次快照写入中完成：
  创建正式记忆
  + 转换本次资产归属
  + 删除来源草稿
→ Store 整体更新
→ resetTo 新记忆详情，稳定栈为 04 空间首页 → 09 新记忆详情
```

保存失败时正式记忆、来源草稿和资产归属均不改变；页面输入、入口类型和照片选择保持不变。保存成功后的详情返回 04，不得重新出现已经完成的 05 或 06。保存草稿或确认放弃则稳定返回 04。

- [ ] **6.7 运行文字闭环验证**

```powershell
npm run test:run -- tests/unit/entry-prompts.test.ts tests/unit/draft-exit.test.ts tests/components/record-entry-page.test.ts tests/components/record-text-page.test.ts tests/components/space-home-page.test.ts
npm run typecheck
npm run build:mp-weixin
```

### Task 6 完成条件

```text
空间首页
→ 留下一段
→ 日常
→ 输入原话
→ 保存
→ 记忆详情
→ 返回空间看到最新摘要
```

以及“退出—保留草稿—继续草稿—正式保存”均可完成。

---

## Task 7：会话照片、照片记录、文字记录加图、叠放与失效降级

**目标：** 验证 M0 真机照片交互，同时诚实表达照片没有云端持久化。

**文件：**

- 修改：`src/adapters/photo-picker.ts`
- 修改：`src/adapters/uni-photo-picker.ts`
- 创建：`src/pages/record-photo/index.vue`
- 修改：`src/pages/record-text/index.vue`
- 使用：`src/components/PhotoStack.vue`（由 Task 2 创建，不重写公开接口）
- 使用：`src/components/PhotoViewer.vue`（由 Task 2 创建，不重写公开接口）
- 创建：`src/features/recording/photo-flow.ts`
- 测试：`tests/unit/photo-flow.test.ts`
- 测试：`tests/components/record-photo-page.test.ts`
- 修改测试：`tests/components/record-text-page.test.ts`

### 实施步骤

- [ ] **7.1 建立照片选择 Adapter**

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

组件测试替换 Adapter，不伪造完整微信运行时。

- [ ] **7.2 实现照片记录页**

流程：

```text
选择自己的照片
→ 预览
→ 先把这张照片留在这里 / 说说最先想起的事
```

支持：

- 最多 9 张；
- 按选择顺序；
- 可移除；
- 不做拖拽排序；
- 不做图片编辑器；
- 居中裁切并使用 `object-fit: cover`；
- 取消权限或失败时保留已选状态。

- [ ] **7.3 为文字记录补充可选照片**

日常、相遇和关系三种文字入口在保存前提供低强调“加一张照片”操作：

- 不是必经步骤；
- 与照片记录页共用 `PhotoPicker`；
- 最多 9 张；
- 按选择顺序，可移除，不拖拽排序；
- 照片失败不清空文字；
- 保存草稿时资产归属草稿；
- 保存为正式记忆后，Repository 将资产归属更新为该记忆。

- [ ] **7.4 实现只保存照片**

只保存照片是完整记忆，`originalText` 可以为空，但 `assetIds` 不得为空。界面不得要求用户补文字。保存成功进入新记忆 09，稳定栈为 `04 → 09`，从详情返回 04。

- [ ] **7.5 实现继续讲述**

进入文字记录页时使用 `TEXT_ENTRY_PROMPTS.photo`，并从 Store/当前草稿恢复已经选择的照片。只问这一问，不自动追问。若用户没有新增文字且没有改动照片，返回 07；存在新增或修改时先执行退出保护。

- [ ] **7.6 实现 session-only 失效状态**

bootstrap 后，用户选择的会话资产转为 `expired`：

- 图文记忆继续显示文字；
- 不显示破图；
- 显示“这张照片只用于上次预览，没有保存到云端”；
- 纯照片记忆仍保留测试记录和不可用说明；
- bundled 样本照片保持可用。

- [ ] **7.7 实现照片叠放与查看器行为**

两张及以上照片时：

- 视觉最多三层；
- 当前照片在最上层；
- 左右滑动改变当前索引；
- 不自动轮播；
- 显示 `1 / 3`；
- 首页只显示单张缩略图；
- 全屏查看器只提供关闭、计数和左右滑动；
- 不提供分享、下载、转发、评论或编辑。

具体视觉参数由 Task 2 决定，本 Task 只实现状态和事件。

- [ ] **7.8 运行自动化与真机验证**

```powershell
npm run test:run -- tests/unit/photo-flow.test.ts tests/components/record-photo-page.test.ts tests/components/record-text-page.test.ts tests/components/photo-components.test.ts
npm run typecheck
npm run build:mp-weixin
```

真机至少检查：

- iPhone 和 Android 各一台；
- 首次相册权限；
- 拒绝后恢复；
- 选择、移除、再次选择；
- 多图滑动；
- 应用重启后的失效降级。

### Task 7 完成条件

- 照片交互在真机可用；
- session-only 与 bundled 明确区分；
- 没有任何界面虚假承诺本地照片永久保存；
- 照片失败不损害文字内容。

---

## Task 8：记忆详情、编辑原话与受控 Mock AI

**目标：** 完成原话回看、独立编辑和可拒绝的 AI 候选稿流程。

**文件：**

- 创建：`src/pages/memory-detail/index.vue`
- 创建：`src/pages/memory-edit/index.vue`
- 创建：`src/pages/ai-draft/index.vue`
- 创建：`src/types/ai.ts`
- 创建：`src/services/ai-draft-service.ts`
- 创建：`src/services/mock-ai-draft-service.ts`
- 测试：`tests/unit/mock-ai-draft-service.test.ts`
- 测试：`tests/components/memory-detail-page.test.ts`
- 测试：`tests/components/memory-edit-page.test.ts`
- 测试：`tests/components/ai-draft-page.test.ts`

### 实施步骤

- [ ] **8.1 实现记忆详情**

详情显示：

- 可选照片；
- 创建日期；
- 明确标注的“你留下的话”；
- 可选 AI 整理版本；
- 编辑、整理和删除入口。

默认摘要和主要展示始终优先使用原话。

详情页记录非敏感来源语义：来自 04 时返回 04，来自 08 时返回 08，新建成功进入时返回 04。来源只决定返回目标，不进入 Repository，不携带用户内容。

- [ ] **8.2 实现编辑原话**

编辑页：

- 预填当前原话；
- 上限 2,000 字；
- 未保存返回时保护修改；
- 保存成功后更新 Store 再返回；
- 保存失败时保留编辑内容；
- 修改原话不自动重新生成或删除 AI 候选稿。

保存修改或无修改取消均返回 09；有未保存修改时，页面返回、系统手势和导航按钮都先触发同一退出保护。

- [ ] **8.3 定义 Mock AI 服务**

```ts
export type AiMockScenario = 'success' | 'insufficient' | 'unavailable'

export type AiDraftResult =
  | { kind: 'success'; candidate: string }
  | { kind: 'insufficient' }
  | { kind: 'unavailable' }

export interface AiDraftService {
  createDraft(input: {
    memoryId: string
    originalText: string
  }): Promise<AiDraftResult>
}
```

- [ ] **8.4 实现固定场景服务**

实现类名固定为 `MockAiDraftService`，并实现 `AiDraftService` 接口。

- 等待时间固定在规格允许的 `600–900ms` 范围内；
- 相同场景可重复复现；
- 不根据用户临时文本动态编造内容；
- 请求期间锁定重复点击；
- `insufficient` 和 `unavailable` 不修改记忆；
- 服务不得直接写 Store 或 Repository。

- [ ] **8.5 实现按次授权**

首次整理前明确说明：

- 本次只处理当前原话；
- 生成的是可编辑候选版本；
- 不覆盖原话；
- 用户可以不用。

M0 不声称内容已发送到真实模型。

- [ ] **8.6 实现 AI 候选稿页面**

同一路由承载：

- 等待；
- 成功；
- 信息不足；
- 暂时不可用；
- 编辑候选稿；
- 确认保存；
- 放弃并继续使用原话。

首版只生成一个候选稿，不提供重新生成。

“使用候选稿”和“继续使用原话”都返回 09。候选稿编辑后尚未保存时，离开页面必须先执行退出保护；AI 等待或失败状态不能把用户困在当前页。

- [ ] **8.7 运行 AI 与详情验证**

```powershell
npm run test:run -- tests/unit/mock-ai-draft-service.test.ts tests/components/memory-detail-page.test.ts tests/components/memory-edit-page.test.ts tests/components/ai-draft-page.test.ts
npm run typecheck
npm run build:mp-weixin
```

### Task 8 完成条件

- 三种 AI 结果可由开发者面板稳定触发；
- 原话在所有路径中保持存在；
- 用户可编辑、确认或拒绝候选稿；
- AI 失败不影响原话回看；
- 页面不暗示已经调用真实 AI。

---

## Task 9：空间设置、隐私、删除与异常状态

**目标：** 完成 M0 的用户控制权和全部关键异常出口。

**文件：**

- 创建：`src/pages/space-settings/index.vue`
- 修改：`src/pages/privacy/index.vue`，复用 Task 5B 已完成页面并增加从设置来源返回 12 的集成
- 修改：`src/pages/memory-detail/index.vue`
- 使用：`src/components/MissingContentState.vue`（由 Task 2 创建，不重写公开接口）
- 创建：`src/features/spaces/delete-space.ts`
- 创建：`src/features/memories/delete-memory.ts`
- 测试：`tests/components/space-settings-page.test.ts`
- 修改测试：`tests/components/privacy-page.test.ts`
- 修改测试：`tests/components/memory-detail-page.test.ts`
- 测试：`tests/unit/delete-scope.test.ts`

### 实施步骤

- [ ] **9.1 实现空间资料编辑**

- 修改空间名称继续使用创建页的校验规则；
- 历史页面显示最新空间名称；
- 绝不改写历史原话；
- 空间照片和记忆照片严格独立；
- 移除空间照片不影响记忆资产。

资料保存成功后停留在 12 并显示明确成功反馈，普通返回进入 04；不得用“保存成功后返回”造成用户误以为修改未生效。

- [ ] **9.2 实现隐私说明**

必须明确：

- M0 是本地 Mock；
- M0 用户照片只用于本次会话预览；
- M1 才接入真实私密云端保存；
- AI 按次授权且 M0 只使用 Mock AI；
- 删除不可恢复；
- M0 不提供虚假的导出按钮。

13 隐私说明返回实际来源：首次说明进入时返回 01，空间设置进入时返回 12；不得固定跳到其中某一页。

- [ ] **9.3 实现删除记忆**

确认文案明确删除原话与该记忆独占照片。删除成功后返回详情的实际来源：从 08 全部记忆进入则返回 08 并恢复滚动位置；从 04 或新建成功路径进入则返回 04。目标页面从更新后的 Store 读取。失败时保持详情页和数据不变。

- [ ] **9.4 实现删除空间**

确认文案动态显示该空间的记忆和照片数量。删除范围包含：

- 空间；
- 该空间全部正式记忆；
- 唯一草稿；
- 所有关联资产。

删除最后一个空间后回到“我的记忆空间”空状态，不重新显示首次说明。

任何空间删除成功都必须清理该空间首页、设置、记录、列表和详情等失效栈，使用 `resetTo({ page: 'spaces' })` 进入 02；不得让系统返回重新打开已删除空间。

- [ ] **9.5 统一内容不存在与参数错误**

- 缺少或错误参数：返回合理上级页面并显示轻提示；
- ID 格式合法但实体不存在：显示“这段内容已经不在这里”；
- bootstrap 加载中：显示加载状态，不提前判断不存在；
- 不显示错误码、堆栈、服务器术语或“提交失败”。

- [ ] **9.6 运行设置与删除验证**

```powershell
npm run test:run -- tests/components/space-settings-page.test.ts tests/components/privacy-page.test.ts tests/components/memory-detail-page.test.ts tests/components/content-components.test.ts tests/unit/delete-scope.test.ts
npm run typecheck
npm run build:mp-weixin
```

### Task 9 完成条件

- 用户能修改和删除自己的数据；
- 删除范围与测试一致；
- 空间照片和记忆照片不会互相误删；
- 隐私页面不夸大 M0 能力；
- 所有失效路由都有可恢复出口。

---

## Task 10：M0 集成、场景矩阵与交付验收

**目标：** 证明 M0 不是静态页面集合，而是可连续体验、可失败恢复、可重复验收的产品骨架。

**文件：**

- 创建：`apps/pet-memory-miniapp/tests/m0-scenario-matrix.md`
- 创建：`apps/pet-memory-miniapp/tests/manual-device-results.md`
- 创建或修改：覆盖跨页面核心路径的有限 uni-app 自动化用例；仅在当前 CLI 与微信开发者工具实际兼容时启用
- 修改：`docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md`，只勾选有证据完成的步骤

### 实施步骤

- [x] **10.1 执行静态与单元验证**（`verify:task10` 自动化证据）

```powershell
npm run typecheck
npm run test:run
npm run build:mp-weixin
```

预期：退出码全部为 `0`。

- [x] **10.2 验收空状态样本**（Store/Repository 自动化证据；微信实际路径仍待外部验收）

```text
首次说明
→ 隐私说明
→ 开始
→ 创建空间（不选照片）
→ 进入空空间首页
→ 留下一段
→ 日常
→ 保存原话
→ 详情
→ 返回空间首页
→ 全部记忆
```

逐步记录预期页面、文案、数据变化和返回目标。

该场景必须证明创建成功后不会回到 03，正式保存后详情返回 04，不会逐级回到 06 和 05。

- [x] **10.3 验收草稿路径**（Store/Repository 自动化证据；微信实际路径仍待外部验收）

```text
开始文字记录
→ 输入一部分
→ 退出并保存草稿
→ 首页显示草稿优先
→ 继续草稿
→ 再次退出
→ 另起一段并删除旧草稿
→ 保存正式记忆
```

验证始终只有一条草稿。

- [x] **10.4 验收完整样本**（Store/Repository 与 AI 三场景自动化证据；视觉/设备仍待外部验收）

覆盖：

- 团团：空间照片、两段正式记忆、一段草稿、多图记忆；
- 豆豆：无空间照片、无正式记忆；
- 空间排序；
- 最近三条与全部记忆；
- 多图详情；
- 编辑原话；
- AI 三种场景；
- 删除记忆和删除空间。

删除记忆分别从 04 和 08 进入详情执行一次，验证返回实际来源；删除空间后执行系统返回，验证不会重新进入已删除空间。

- [x] **10.5 验收失败恢复**（Repository、路由、AI fallback 自动化证据；照片设备权限仍待外部验收）

使用开发者面板逐项模拟：

- 保存失败；
- 照片选择失败；
- 照片权限不足；
- AI 信息不足；
- AI 暂时不可用；
- 内容不存在；
- 不支持的快照版本。

每项必须记录：用户看到什么、输入是否保留、数据是否变化、怎样恢复。

- [ ] **10.6 微信开发者工具验收**

检查：

- 13 个页面路由；
- 页面返回；
- 长列表滚动；
- 键盘顶起；
- 输入焦点；
- 安全区；
- 开发构建中的开发者入口；
- 生产构建中开发者入口不可达。

在以上运行检查通过后，执行 Task 2 规格第 11 节的完整视觉回归：

- 最终候选版本必须具备 13 张微信开发者工具标准页面截图；
- 优先自动采集，自动化不可用时使用用户一次性提供的 13 张截图；
- 按唯一归一化算法生成 manifest、并排图、`50%` 叠层图、差异图与页面结论；
- 执行 `320 / 393 / 480px` 响应式检查和高风险状态检查；
- 依次通过 G0–G4，保持 `P0 = 0`、`P1 = 0`、`P2 = 0`；
- 证据写入 `output/visual-regression/<run-id>/`，不得覆盖原始基准。

- [ ] **10.7 iPhone 与 Android 真机验收**

至少各一台设备，记录：

- 系统与微信版本；
- 屏幕尺寸；
- 键盘和长文本；
- 相册权限；
- 多图滑动；
- 返回手势；
- 底部安全区；
- session-only 照片重启降级；
- 视觉与触控异常。

- [x] **10.8 清理和最终范围检查**（`verify-task10.mjs` 边界扫描证据）

确认：

- 没有真实密钥、未经用户确认的 AppID、用户照片或私人原话；经用户确认用于本项目的 AppID 只出现在批准的项目配置中；
- 没有 CloudBase、真实 AI、分享、提醒或导出假入口；
- 没有未受控的调试代码；
- 没有页面直接访问 storage；
- 没有第二个草稿；
- 没有路由携带私人内容；
- 没有 Task 2 之外的临时视觉数值。

### Task 10 完成条件

- 自动验证通过；
- 微信开发者工具验收完成；
- 13 页视觉回归、响应式检查和 G0–G4 验收门完成；
- iPhone 与 Android 结果有记录；
- 所有未验证项明确列出，不能用“应该可用”代替证据；
- M0 范围完整，M1 能力没有混入。

### Task 10 当前状态（2026-08-06）

- `automated-passed`：42 个测试文件、864 个测试通过；typecheck、生产构建、WXSS 兼容检查和 `verify:task10` 通过。
- `visual-pending`：已建立浏览器原型到 13 个页面基准图的 manifest，但尚未获得微信开发者工具的 13 张真实实现截图和 G0–G4 对比结果。
- `device-pending`：微信开发者工具、iPhone、Android 的实际运行记录仍未完成；见 `apps/pet-memory-miniapp/tests/manual-device-results.md`。
- 因此当前不能把 Task 10 或整个 M0 标记为 `m0-accepted`。

---

## 规格覆盖索引

| 规格主题 | 实施任务 |
|---|---|
| CLI、构建与测试基础 | Task 1 |
| 设计令牌、组件视觉与防漂移 | Task 2（规格已确认） |
| Snapshot、Repository、样本与删除范围 | Task 3 |
| Pinia、初始化、路由与开发工具 | Task 4 |
| 首次说明、创建空间、列表、首页与全部记忆 | Task 5 |
| 四入口、文字记录、草稿与保存原话 | Task 6 |
| 相册、只保存照片、多图与失效降级 | Task 7 |
| 详情、编辑原话与 Mock AI | Task 8 |
| 设置、隐私、删除与异常恢复 | Task 9 |
| 模拟器、真机、场景矩阵与交付 | Task 10 |

## 开工门槛

满足以下条件后，才能开始 Task 1：

1. Task 2 专项方案已经讨论并由用户确认；
2. Task 2 已补入本计划或形成明确引用的正式专项规格；
3. 本计划完成最终一致性检查（2026-07-26 文档审计已完成，实施时仍须按真实环境复核）；
4. 用户明确授权开始实施；
5. 实施过程继续遵守根目录 `AGENTS.md`。
