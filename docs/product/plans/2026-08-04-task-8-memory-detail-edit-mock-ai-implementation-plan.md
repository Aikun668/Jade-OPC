# Task 8 记忆详情、编辑原话与受控 Mock AI 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本计划采用一次性大收口，不拆 Phase A/B/C；Builder 完成全部范围后统一提交自证材料，再由 Logic Reviewer、视觉负责人和用户验收。

**Goal:** 在 M0 本地 Mock 中完成 09 记忆详情、10 编辑原话和 11 受控 Mock AI 候选稿，保证原话始终优先、AI 可拒绝且不伪装真实模型调用。

**Architecture:** 页面只负责路由读取、短生命周期状态和用户交互；原话与 AI 候选稿的持久化继续经过 Pinia `memory` Store 和现有 `MemoryRepository.updateMemory()`。AI 通过可替换的 `AiDraftService` 接口接入，M0 使用固定场景的 `MockAiDraftService`，服务不直接读写 Store/Repository。详情页保留实际来源参数，编辑页和候选稿页只传稳定的 `memoryId`，不把原话、候选稿或照片 URI 放进路由。

**Tech Stack:** uni-app、Vue 3、TypeScript、Pinia、微信小程序、Vitest、现有 `PageShell`、`ConfirmDialog`、`PhotoStack`、`PhotoViewer`、`MemoryRepository`。

## Global Constraints

- 当前阶段固定为 `M0` 本地 Mock；不接入真实 AI、CloudBase、云端照片、微信登录、分享、导出或社区能力。
- Task 7 的逻辑状态已为 `accepted`，其截图和真机权限验证按用户决定暂缓；Task 8 不得用新功能掩盖 Task 7 的既有非阻断问题。
- 浏览器原型是视觉母版：参考 `apps/pet-memory-design-prototype/src/Prototype.tsx` 中 `MemoryDetailScreen`、`MemoryEditScreen`、`AiDraftScreen`，以及 `prototype.css` 中 `.detail-*`、`.ai-invitation`、`.editing-note`、`.ai-scope-note`、`.candidate-*` 样式；不得直接复制 React 事件、浏览器 CSS 或固定 px。
- `MemoryItem.originalText` 永远是用户原话；`aiCandidateText` 只能作为独立、可编辑、可拒绝的候选版本，任何 AI 状态都不得覆盖、清空或自动重写原话。
- `MockAiDraftService` 只返回固定 `success / insufficient / unavailable` 场景；不得根据用户临时文本动态编造候选内容，不展示模型名、人格化头像、思考过程或虚假进度。
- 首次使用 AI 前必须显示按次授权说明：本次只处理当前原话，生成可编辑候选版本，不覆盖原话，用户可以不用；未确认前不得调用服务。
- AI 等待时间固定为 `700ms`，属于规格允许的 `600–900ms` 范围；页面在 `150ms` 内不显示忙碌文案，超过后显示“正在整理这段原话…”。
- AI 每次只保留一个候选稿，不提供“重新生成”；`unavailable` 只允许“再试一次”，成功后不得从同一页面再生成第二个候选稿。
- Task 8 不实现删除记忆。详情页不放禁用删除按钮，也不创建删除占位入口；删除由 Task 9 统一实现。
- 编辑原话上限为 `2,000` 字；超过上限不得提交，输入必须完整保留且显示低压力提示，不显示持续字数统计。
- 编辑原话不会自动删除或重新生成已有 `aiCandidateText`；候选版本与原话并列保留，不使用未经数据支持的“基于最新原话”描述。
- 失败状态不得清空原话、候选稿或编辑内容；保存失败和服务失败必须提供明确恢复动作，禁止使用系统错误码、异常名或危险色高压文案。
- 页面不得直接访问 storage、Repository 或原始 `uni.navigate*`；页面只使用 Store、`NavigationAdapter` 与 `AiDraftService` DI。
- 路由只允许 `memoryId`、`source` 等白名单参数；不得传用户内容、照片 URI、候选文本、完整对象或资产归属。
- 所有新增页面使用现有 `PageShell` 布局、胶囊避让、键盘规则、设计令牌和共享组件；不新增 UI 组件库或生产依赖。
- 本轮不提交 Git commit、不推送远程、不覆盖用户已有工作区修改。

---

## 1. 开工依赖与事实来源

### 1.1 开工前必须读取

- `docs/README.md`；
- `docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md` 中 M0 Mock AI、页面范围、导航和数据边界；
- `docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md` 中 09/10/11 页面布局、AI 状态矩阵、键盘、错误和返回保护；
- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md` 的 Task 8 原始范围；
- `docs/product/plans/2026-08-03-task-7-photo-recording-session-assets-implementation-plan.md`；
- `docs/project/gpt-review-output/task7-evidence/2026-08-03-task-7-reviewer-code-audit.md`，仅用于确认 Task 7 当前状态和已记录非阻断项。

### 1.2 Task 7 当前前置状态

Task 7 可作为 Task 8 前置条件，但状态必须准确描述为：

```text
逻辑 Reviewer：accepted
自动测试：37 files / 743 tests passed
截图视觉验收：按用户指令暂缓
微信真机权限与重启验收：暂缓
已知非阻断项：2 个 P2、2 个 P3，Task 8 不默认扩大修复范围
```

Task 8 只在修改 `memory-detail`、导航、Store 或 Repository 时补相应回归测试；不得因为 Task 7 的截图暂缓而伪造 Task 8 的视觉通过。

### 1.3 浏览器原型映射

| 原型 | 小程序目标 | 必须保留的产品语义 |
|---|---|---|
| `MemoryDetailScreen` | `src/pages/memory-detail/index.vue` | 日期、照片/叠放、原话、候选稿说明、编辑入口；本轮不放删除操作 |
| `MemoryEditScreen` | `src/pages/memory-edit/index.vue` | 只编辑原话、明确修改范围、保存与“这次先不改”、未保存保护 |
| `AiDraftScreen` | `src/pages/ai-draft/index.vue` | 按次授权、安静等待、固定候选稿、原话引用、保存候选稿或继续使用原话 |
| `.detail-*`、`.ai-invitation` | 当前页面 scoped SCSS | 复用设计令牌和 `PageShell`，不能照搬浏览器选择器实现 |

---

## 2. 文件施工地图

### 2.1 创建

- `apps/pet-memory-miniapp/src/types/ai.ts`：AI 场景、结果、页面状态和输入类型。
- `apps/pet-memory-miniapp/src/services/ai-draft-service.ts`：`AiDraftService` 公共接口。
- `apps/pet-memory-miniapp/src/services/mock-ai-draft-service.ts`：固定延迟、固定候选稿和三场景实现。
- `apps/pet-memory-miniapp/src/services/ai-draft-service-deps.ts`：服务 DI 的 `provide/get/reset`。
- `apps/pet-memory-miniapp/src/pages/memory-edit/index.vue`：编辑原话页面。
- `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`：单路由多状态 AI 候选稿页面。
- `apps/pet-memory-miniapp/tests/unit/mock-ai-draft-service.test.ts`：Mock AI 服务直接测试。
- `apps/pet-memory-miniapp/tests/components/memory-edit-page.test.ts`：编辑页面测试。
- `apps/pet-memory-miniapp/tests/components/ai-draft-page.test.ts`：候选稿页面状态与恢复测试。
- `apps/pet-memory-miniapp/scripts/verify-task8.mjs`：Task 8 生产边界和页面注册扫描。

### 2.2 修改

- `apps/pet-memory-miniapp/src/main.ts`：注册 `MockAiDraftService`，场景读取复用现有 `features/developer/dev-scenarios.ts`，不创建第二套 AI 场景状态。
- `apps/pet-memory-miniapp/src/types/routes.ts`：补齐 `source` 白名单和 `invalid-source` 路由错误类型。
- `apps/pet-memory-miniapp/src/features/routing/route-params.ts`：新增 `parseMemoryDetailRoute()`，同时解析 `memoryId` 与可选 `source`。
- `apps/pet-memory-miniapp/src/adapters/navigation.ts`：扩展 `StableDestination.memory-detail` 的 `source`，并增加 `memory-edit`、`ai-draft` 的页面 URL 常量。
- `apps/pet-memory-miniapp/src/pages.json`：注册 `pages/memory-edit/index` 和 `pages/ai-draft/index`，统一使用 `navigationStyle: custom`。
- `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`：加入候选稿展示、AI 入口、编辑入口、来源解析和缺失状态；不加入删除按钮。
- `apps/pet-memory-miniapp/src/pages/record-photo/index.vue`：正式保存详情导航增加 `source: 'new-memory'`。
- `apps/pet-memory-miniapp/src/pages/record-text/index.vue`：正式保存详情导航增加 `source: 'new-memory'`。
- `apps/pet-memory-miniapp/tests/unit/route-params.test.ts`：覆盖详情来源白名单、缺失兼容和非法来源。
- `apps/pet-memory-miniapp/tests/unit/navigation.test.ts`：覆盖新详情来源及编辑/AI URL。
- `apps/pet-memory-miniapp/tests/unit/local-memory-repository.test.ts`：覆盖编辑原话保留候选稿、保存候选稿保留原话和不存在记忆失败。
- `apps/pet-memory-miniapp/tests/unit/memory-store.test.ts`：覆盖 `updateMemory()` 的 Store 快照提交和失败不更新。
- `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`：覆盖原话、候选稿、编辑/AI 入口、照片失效和来源参数。
- `apps/pet-memory-miniapp/package.json`：增加 `verify:task8` 脚本，不增加生产依赖。

### 2.3 明确不修改

- 不修改 `MemoryItem.aiCandidateText`、`UpdateMemoryInput` 的公共语义；现有 Repository 更新合同直接复用。
- 不创建 `AiStore`、`AiRepository` 或第二套全局 AI 状态。
- 不把真实模型 SDK、密钥、网络请求或 CloudBase 调用加入 M0。
- 不实现删除、空间设置、照片编辑、照片删除、分享、导出或重新生成。
- 不在详情页直接切换成表单；编辑必须是独立页面。
- 不把 AI 候选稿写入 `originalText`，不以候选稿替换列表摘要或首页原话。
- 不修改 Task 5A 空间列表、空间首页和全部记忆的整体视觉结构。

---

## 3. 数据、AI 与路由合同

### 3.1 AI 类型合同

在 `src/types/ai.ts` 中定义以下公共类型，不在页面内重复声明：

```ts
export type AiMockScenario = 'success' | 'insufficient' | 'unavailable'

export interface CreateAiDraftInput {
  memoryId: string
  originalText: string
}

export type AiDraftResult =
  | { kind: 'success'; candidate: string }
  | { kind: 'insufficient' }
  | { kind: 'unavailable' }

export type AiDraftPageState =
  | 'authorization-required'
  | 'loading'
  | 'success'
  | 'insufficient'
  | 'unavailable'
  | 'save-pending'
  | 'save-error'
```

`src/services/ai-draft-service.ts` 只暴露：

```ts
import type { AiDraftResult, CreateAiDraftInput } from '../types/ai'

export interface AiDraftService {
  createDraft(input: CreateAiDraftInput): Promise<AiDraftResult>
}
```

页面只能依赖 `AiDraftService`，不能依赖 `MockAiDraftService` 的实现类。

### 3.2 固定 Mock 服务合同

`MockAiDraftService` 使用以下构造方式，便于页面和单元测试注入场景：

```ts
export type AiScenarioReader = () => AiMockScenario

export class MockAiDraftService implements AiDraftService {
  constructor(
    private readonly readScenario: AiScenarioReader,
    private readonly delayMs = 700,
  ) {}

  createDraft(input: CreateAiDraftInput): Promise<AiDraftResult>
}
```

实现要求：

- `readScenario()` 只读取当前开发场景；不要读取 Store，不要根据 `originalText` 拼接候选稿。
- `success` 返回一段固定、可追溯的候选文本；候选文本不使用用户原话变量拼接。
- `insufficient` 只返回 `{ kind: 'insufficient' }`；`unavailable` 只返回 `{ kind: 'unavailable' }`。
- `delayMs` 默认 `700`，测试时可注入 `0`，不在测试中真实等待 `700ms`。
- 相同场景的多次调用返回相同结果；服务不生成第二个候选稿。
- 输入 `memoryId` 和 `originalText` 仍必须保留在接口中，便于未来替换真实服务；M0 Mock 不把它们写入日志或错误文案。
- 并发调用必须有明确行为：同一服务实例已有请求时拒绝第二次请求，页面也必须用 `isRequesting` 锁住重复点击。
- 服务失败只返回受控结果或明确抛出内部错误；页面将内部错误转成用户可理解的“暂时无法整理”，不显示异常文本。

### 3.3 服务 DI 合同

`src/services/ai-draft-service-deps.ts` 使用现有 Adapter/Store DI 风格：

```ts
provideAiDraftService(service: AiDraftService): void
getAiDraftService(): AiDraftService
_resetAiDraftService(): void
```

`main.ts` 中注册一个 `MockAiDraftService`，其 `readScenario` 复用现有 `useDevScenarios().aiScenario`。开发面板仍是唯一场景切换入口；不新增第二个 AI 场景 ref。

### 3.4 记忆更新合同

复用现有 Store/Repository 接口：

```ts
await memoryStore.updateMemory({
  kind: 'original-text',
  memoryId,
  originalText,
})

await memoryStore.updateMemory({
  kind: 'ai-candidate',
  memoryId,
  aiCandidateText: candidateText,
})
```

两种更新都必须由 Repository 产生新快照后再由 Store 提交；页面不直接修改 `memStore.memories`。编辑原话更新不得改动 `aiCandidateText`；候选稿更新不得改动 `originalText`。

### 3.5 详情来源路由合同

`parseMemoryDetailRoute()` 解析：

```ts
type MemoryDetailRoute = {
  memoryId: string
  source: MemoryDetailSource
}
```

规则：

- `memoryId` 继续使用现有非空 ID 校验。
- `source` 允许 `space-home`、`memories`、`new-memory`。
- 为兼容当前已有直接进入详情的测试和旧路径，缺少 `source` 时归一化为 `space-home`；明确传入非法 source 时返回 `{ kind: 'invalid', reason: 'invalid-source', param: 'source' }`。
- `space-home` 和 `memories` 现有调用方继续传来源；照片/文字正式保存后的 `resetTo({ page: 'memory-detail' })` 补 `source: 'new-memory'`。
- 编辑页和 AI 页只传 `memoryId`；原话、候选稿、照片 URI 和完整记忆对象不进 URL。

---

## 4. Task 1：先建立类型、DI 与路由测试门

**Files:**

- Create: `src/types/ai.ts`
- Create: `src/services/ai-draft-service.ts`
- Create: `src/services/ai-draft-service-deps.ts`
- Modify: `src/types/routes.ts`
- Modify: `src/features/routing/route-params.ts`
- Modify: `src/adapters/navigation.ts`
- Modify: `src/pages.json`
- Test: `tests/unit/route-params.test.ts`
- Test: `tests/unit/navigation.test.ts`

**Interfaces:**

- Consumes: existing `MemoryDetailSource`, `isValidId()`, `NavigationAdapter`, `PAGE_URLS`。
- Produces: `AiDraftService`、`AiDraftPageState`、`parseMemoryDetailRoute()`、带 `source` 的详情稳定目标，以及 `memory-edit` / `ai-draft` 页面 URL。

- [ ] **Step 1: 写路由失败测试**

覆盖以下输入：

```ts
expect(parseMemoryDetailRoute({ memoryId: 'm1', source: 'memories' })).toEqual({
  kind: 'valid',
  value: { memoryId: 'm1', source: 'memories' },
})

expect(parseMemoryDetailRoute({ memoryId: 'm1' })).toEqual({
  kind: 'valid',
  value: { memoryId: 'm1', source: 'space-home' },
})

expect(parseMemoryDetailRoute({ memoryId: 'm1', source: 'unknown' })).toEqual({
  kind: 'invalid',
  reason: 'invalid-source',
  param: 'source',
})
```

- [ ] **Step 2: 运行路由测试确认失败**

Run:

```powershell
npm run test:run -- tests/unit/route-params.test.ts tests/unit/navigation.test.ts
```

Expected: FAIL because `parseMemoryDetailRoute()`、新页面 URL 和 `source` 稳定目标尚未实现。

- [ ] **Step 3: 实现最小类型、解析和 URL 扩展**

保持现有 `parseMemoryRoute()` 的调用兼容；由新页面使用 `parseMemoryDetailRoute()`。`StableDestination.memory-detail` 增加 `source: MemoryDetailSource`，并让 `UniNavigationAdapter.resetTo()` 生成：

```text
/pages/memory-detail/index?memoryId=<id>&source=<whitelisted-source>
```

在 `pages.json` 注册：

```json
{
  "path": "pages/memory-edit/index",
  "style": { "navigationBarTitleText": "", "navigationStyle": "custom" }
}
```

AI 页面使用同样的 `navigationStyle: custom`。

- [ ] **Step 4: 运行路由测试确认通过**

Run:

```powershell
npm run test:run -- tests/unit/route-params.test.ts tests/unit/navigation.test.ts
```

Expected: PASS，且现有空间首页、全部记忆和 Task 7 保存路径的导航测试不回归。

---

## 5. Task 2：实现固定 Mock AI 服务

**Files:**

- Modify: `src/main.ts`
- Modify: `src/features/developer/dev-scenarios.ts` only if an explicit read-only scenario accessor is needed；不得复制场景状态。
- Create: `src/services/mock-ai-draft-service.ts`
- Test: `tests/unit/mock-ai-draft-service.test.ts`

**Interfaces:**

- Consumes: `AiDraftService`、`AiMockScenario`、现有 `dev-scenarios.aiScenario`。
- Produces: 可被页面通过 `getAiDraftService()` 调用的固定三场景服务。

- [ ] **Step 1: 写 Mock 服务失败测试**

测试必须注入 `delayMs: 0` 和场景读取函数，覆盖：

```ts
await expect(service.createDraft({ memoryId: 'm1', originalText: '原话' }))
  .resolves.toEqual({ kind: 'success', candidate: EXPECTED_FIXED_CANDIDATE })

scenario = 'insufficient'
await expect(service.createDraft({ memoryId: 'm1', originalText: '原话' }))
  .resolves.toEqual({ kind: 'insufficient' })

scenario = 'unavailable'
await expect(service.createDraft({ memoryId: 'm1', originalText: '原话' }))
  .resolves.toEqual({ kind: 'unavailable' })
```

另外验证：相同场景结果稳定、候选稿不包含动态输入、第二个并发请求被拒绝、服务本身不调用 Store/Repository。

- [ ] **Step 2: 运行服务测试确认失败**

Run:

```powershell
npm run test:run -- tests/unit/mock-ai-draft-service.test.ts
```

Expected: FAIL because `MockAiDraftService` 尚未存在。

- [ ] **Step 3: 实现固定延迟和场景映射**

固定候选稿可使用浏览器原型中的示例文本作为测试常量，但不得把当前用户原话拼接进候选稿。默认等待 `700ms`；测试注入 `0ms`。服务不写 Store，不写 Repository，不输出日志。

`main.ts` 中完成：

```ts
const devScenarios = useDevScenarios()
provideAiDraftService(
  new MockAiDraftService(() => devScenarios.aiScenario.value),
)
```

- [ ] **Step 4: 运行服务测试确认通过**

Run:

```powershell
npm run test:run -- tests/unit/mock-ai-draft-service.test.ts
```

Expected: PASS，三种场景和并发锁均可复现。

---

## 6. Task 3：收口 09 记忆详情

**Files:**

- Modify: `src/pages/memory-detail/index.vue`
- Modify: `src/pages/record-photo/index.vue`
- Modify: `src/pages/record-text/index.vue`
- Test: `tests/components/memory-detail-page.test.ts`
- Test: `tests/unit/local-memory-repository.test.ts`

**Interfaces:**

- Consumes: `parseMemoryDetailRoute()`、`MemoryItem`、`PhotoStack` / `PhotoViewer`、`MemoryStore.findMemory()`、`MemoryStore.findAsset()`。
- Produces: 可从空间首页、全部记忆和新建成功路径进入的完整只读详情，以及进入编辑/AI 页面所需的稳定链接。

- [ ] **Step 1: 写详情页失败测试**

覆盖：

- 有原话时渲染“你留下的话”和原话全文；
- 有照片时保留 Task 7 的 `PhotoStack` / `PhotoViewer`；
- `aiCandidateText` 非空时渲染独立“整理后的候选版本”，不替换原话；
- `aiCandidateText` 为空时不渲染候选稿区域；
- 原话为空的纯照片记忆不显示 AI 整理入口；
- 原话存在时显示低强调“整理一个候选稿”；
- 导航右侧显示“编辑原话”；
- `source` 缺失时兼容为 `space-home`，非法 source 显示缺失参数状态；
- 详情页不出现删除按钮或删除占位文字。

- [ ] **Step 2: 运行详情测试确认失败**

Run:

```powershell
npm run test:run -- tests/components/memory-detail-page.test.ts
```

Expected: 新增候选稿、入口和 source 断言先失败，Task 7 已有照片/失效测试继续通过。

- [ ] **Step 3: 按浏览器原型补齐页面结构**

保留现有 `reading` 布局和照片失效降级，加入以下结构：

```text
PageShell reading
├─ navigation-right：编辑原话
├─ 日期
├─ PhotoStack / PhotoViewer（可选）
├─ 纯照片摘要（仅照片记忆）
├─ 你留下的话（原话存在时）
├─ 整理候选稿入口（仅原话存在时）
└─ 已保存候选版本（aiCandidateText 存在时）
```

候选稿区使用中性标签和低强调说明，永远把原话放在候选稿之前。编辑入口使用 `PAGE_URLS['memory-edit']`，AI 入口使用 `PAGE_URLS['ai-draft']`，两者只携带编码后的 `memoryId`。

- [ ] **Step 4: 补齐新建成功详情来源**

把 Task 7 两处正式保存调用改为：

```ts
await nav.resetTo({
  page: 'memory-detail',
  memoryId: result.id,
  source: 'new-memory',
})
```

空间首页和全部记忆原有 `source=space-home` / `source=memories` 调用保持不变。

- [ ] **Step 5: 运行详情和 Repository 回归测试**

Run:

```powershell
npm run test:run -- tests/components/memory-detail-page.test.ts tests/unit/local-memory-repository.test.ts
```

Expected: PASS；更新候选稿后原话仍等于原值，更新原话后候选稿仍等于原值，照片失效仍不渲染失效 URI。

---

## 7. Task 4：实现 10 编辑原话页面

**Files:**

- Create: `src/pages/memory-edit/index.vue`
- Test: `tests/components/memory-edit-page.test.ts`
- Modify: `tests/unit/local-memory-repository.test.ts` if the preservation assertion is not already present.

**Interfaces:**

- Consumes: `parseMemoryRoute()`、`MemoryStore.findMemory()`、`MemoryStore.updateMemory()`、`NavigationAdapter.back()`、`ConfirmDialog`、`PageShell`。
- Produces: 只修改 `originalText` 的独立页面，成功或取消均返回 09。

- [ ] **Step 1: 写编辑页失败测试**

覆盖：

```text
missing memoryId → 页面级缺失状态
memory not found → “这段记忆已经不存在了”
初始文本预填原话
修改文本后保存 → updateMemory({ kind: 'original-text', ... }) → nav.back()
无修改点击“这次先不改” → 直接 nav.back()
有修改点击返回 → ConfirmDialog
ConfirmDialog 继续修改 → 页面保持
ConfirmDialog 先不保存 → nav.back()
超过 2000 字 → 不调用 updateMemory，保留全文并显示提示
updateMemory 抛错 → 原文输入保留、显示保存错误、允许重试
保存中重复点击 → 只调用一次 updateMemory
```

- [ ] **Step 2: 运行编辑页测试确认失败**

Run:

```powershell
npm run test:run -- tests/components/memory-edit-page.test.ts
```

Expected: FAIL because page file and handlers 尚未实现。

- [ ] **Step 3: 实现页面状态机**

页面最小状态：

```ts
const memoryId = ref<string | null>(null)
const text = ref('')
const initialText = ref('')
const isSaving = ref(false)
const saveError = ref(false)
const showReturnDialog = ref(false)
const parseError = ref<... | null>(null)
```

`isDirty = text.value !== initialText.value`；保存时先检查 `text.length > 2000`，再调用 Store。成功后更新 `initialText` 并 `nav.back()`；失败时不清除 `text`。

- [ ] **Step 4: 按原型与设计系统完成布局**

使用 `PageShell layout="task-form" title="编辑原话" show-back`，内容顺序固定；textarea 必须沿用现有页面的 `@focus="keyboardOpen = true"`、`@blur="keyboardOpen = false"`，并把 `:keyboard-open="keyboardOpen"` 传给 `PageShell`：

```text
编辑原话
→ “这里只修改你留下的话。已经确认的候选稿不会自动覆盖或重新生成。”
→ textarea
→ 保存修改
→ 这次先不改
```

不使用详情页内联编辑，不添加删除、AI 或照片修改控件。键盘打开时通过 `keyboardOpen` 交给 `PageShell`，不得固定底部操作遮挡输入区。

- [ ] **Step 5: 运行编辑页和类型检查**

Run:

```powershell
npm run test:run -- tests/components/memory-edit-page.test.ts tests/unit/local-memory-repository.test.ts
npm run typecheck
```

Expected: PASS；编辑成功只改变原话和更新时间，候选稿及照片资产不变。

---

## 8. Task 5：实现 11 AI 候选稿页面

**Files:**

- Create: `src/pages/ai-draft/index.vue`
- Test: `tests/components/ai-draft-page.test.ts`
- Modify: `src/types/ai.ts` only if the page state needs a type-safe helper already covered by the contract；不得在页面内重复定义 union。

**Interfaces:**

- Consumes: `AiDraftService` DI、`AiDraftPageState`、`MemoryStore.findMemory()`、`MemoryStore.updateMemory()`、`ConfirmDialog`、`PageShell`。
- Produces: 单路由、多状态、按次授权的候选稿流程。

- [ ] **Step 1: 写 AI 页面失败测试**

至少覆盖以下状态和操作：

| 状态 | 断言 | 可用操作 |
|---|---|---|
| `authorization-required` | 显示本次处理范围，未调用 service | 同意继续 / 继续使用原话 |
| `loading` | `150ms` 内不显示忙碌文案；超过后显示“正在整理这段原话…” | 禁止重复请求，原话引用仍可见 |
| `success` | 显示固定候选稿、可编辑输入区和原话参考 | 保存候选稿 / 继续只用原话 |
| `insufficient` | 显示“这段原话暂时不适合整理，保留现在的样子就很好。” | 继续使用原话 |
| `unavailable` | 显示“刚才没有整理出来。你的原话没有受到影响。” | 再试一次 / 先保留原话 |
| `save-pending` | 候选稿只读，按钮锁定 | 不可重复保存 |
| `save-error` | 候选稿完整保留 | 再试一次 / 继续使用原话 |

另外覆盖：

- 纯照片记忆直接进入 AI 路由时显示不可整理状态，不调用 service；
- service 的 `insufficient` / `unavailable` 不调用 `updateMemory`；
- 保存候选稿只调用 `updateMemory({ kind: 'ai-candidate', ... })`；
- 保存成功后原话仍存在并返回详情；
- 候选稿有未保存修改时返回触发退出保护；
- 页面卸载后迟到的 service 结果不会更新已离开的页面；
- service 抛出异常时转换为 `unavailable`，不把异常文本显示给用户。

- [ ] **Step 2: 运行 AI 页面测试确认失败**

Run:

```powershell
npm run test:run -- tests/components/ai-draft-page.test.ts
```

Expected: FAIL because `ai-draft` 页面尚未存在。

- [ ] **Step 3: 实现按次授权和请求生命周期**

初始状态固定为 `authorization-required`。只有点击“同意并继续”后才进入 `loading` 并调用：

```ts
const result = await getAiDraftService().createDraft({
  memoryId,
  originalText: memory.originalText,
})
```

使用 `requestToken` 或等价的递增序号保护迟到结果：页面卸载、返回原话或重新请求后，旧请求不能覆盖当前状态。`isRequesting` 和 `isSaving` 分开，避免服务请求锁影响候选稿保存。

- [ ] **Step 4: 实现成功、失败和候选稿编辑**

成功状态维护：

```ts
const candidate = ref(result.candidate)
const initialCandidate = ref(result.candidate)
const isCandidateDirty = computed(() => candidate.value !== initialCandidate.value)
```

保存前验证候选稿不超过 `2,000` 字且非空；保存成功只更新 `aiCandidateText`，不改原话。失败显示：

```text
刚才没有保存整理后的版本，候选稿还在这里。
```

`unavailable` 的“再试一次”回到 `loading` 并再次调用当前 Mock 场景；`success` 后不出现重新生成按钮。

- [ ] **Step 5: 实现返回保护与完成动作**

完成动作：

```text
保存这个候选稿 → updateMemory(ai-candidate) → nav.back()
继续只用原话 → 不写 Store → nav.back()
```

若候选稿未保存修改，页面返回和“继续只用原话”都先打开 `ConfirmDialog`；“继续编辑”留在页面，“先不保存”返回详情。`insufficient`、`unavailable` 和授权页没有候选编辑内容时可直接返回，不弹候选稿丢失确认。

- [ ] **Step 6: 按浏览器原型完成视觉结构**

使用 `PageShell layout="task-form" title="整理候选稿" show-back`，内容顺序固定；候选稿 textarea 必须沿用现有页面的 `@focus="keyboardOpen = true"`、`@blur="keyboardOpen = false"`，并把 `:keyboard-open="keyboardOpen"` 传给 `PageShell`：

```text
按次授权说明 / 状态说明
→ 候选版本 + 可以继续修改
→ 候选稿输入区
→ 原话仍然保留
→ 保存这个候选稿
→ 继续只用原话
```

loading 使用安静文本，不使用旋转动画、AI 头像或拟人化进度。AI 错误放在操作区附近，不覆盖原话引用。

- [ ] **Step 7: 运行 AI 页面测试确认通过**

Run:

```powershell
npm run test:run -- tests/components/ai-draft-page.test.ts tests/unit/mock-ai-draft-service.test.ts
```

Expected: PASS，所有页面状态、授权边界、保存边界和迟到请求保护均有断言。

---

## 9. Task 6：Store、Repository 与跨页面回归

**Files:**

- Modify: `tests/unit/local-memory-repository.test.ts`
- Modify: `tests/unit/memory-store.test.ts`
- Modify: `tests/components/memory-detail-page.test.ts`
- Modify: `tests/components/memory-edit-page.test.ts`
- Modify: `tests/components/ai-draft-page.test.ts`

**Interfaces:**

- Consumes: existing `UpdateMemoryInput` union and `RepositoryWriteResult<MemoryItem>`。
- Produces: 对原话优先、候选稿独立、失败原子性和 Store 快照提交的反证。

- [ ] **Step 1: 补 Repository 交叉字段测试**

使用同一条带原话、候选稿和照片资产的记忆：

```ts
const original = await repo.updateMemory({
  kind: 'original-text',
  memoryId,
  originalText: '修改后的原话',
})
expect(original.value.originalText).toBe('修改后的原话')
expect(original.value.aiCandidateText).toBe('已保存候选稿')

const candidate = await repo.updateMemory({
  kind: 'ai-candidate',
  memoryId,
  aiCandidateText: '新的候选稿',
})
expect(candidate.value.originalText).toBe('修改后的原话')
expect(candidate.value.aiCandidateText).toBe('新的候选稿')
```

再覆盖不存在 `memoryId`、Storage 写入失败和更新前后资产列表不变。

- [ ] **Step 2: 补 Store 快照提交测试**

断言 Repository 返回的 snapshot 进入 Store；Repository 抛错时 `memories` ref 保留旧值，页面输入状态由页面自己保留。

- [ ] **Step 3: 运行跨页面测试**

Run:

```powershell
npm run test:run -- tests/unit/local-memory-repository.test.ts tests/unit/memory-store.test.ts tests/components/memory-detail-page.test.ts tests/components/memory-edit-page.test.ts tests/components/ai-draft-page.test.ts
```

Expected: PASS；没有原话被候选稿覆盖、候选稿被原话编辑清空或照片资产被更新接口误改。

---

## 10. Task 7：自动门、构建和一次性验收路径

**Files:**

- Create: `scripts/verify-task8.mjs`
- Modify: `package.json`
- Create during verification only: `docs/project/gpt-review-output/task8-evidence/report.md`
- Create during verification only: `docs/project/gpt-review-output/task8-evidence/memory-detail.png`
- Create during verification only: `docs/project/gpt-review-output/task8-evidence/memory-edit.png`
- Create during verification only: `docs/project/gpt-review-output/task8-evidence/ai-draft-success.png`
- Create during verification only: `docs/project/gpt-review-output/task8-evidence/ai-draft-failure.png`

### 10.1 自动命令

`package.json` 增加：

```json
"verify:task8": "npm run test:run && npm run typecheck && npm run build:mp-weixin && node scripts/verify-task8.mjs"
```

`verify-task8.mjs` 必须只使用 Node 内置模块，并检查：

- `pages.json` 注册 `memory-detail`、`memory-edit`、`ai-draft`；
- `src/types/ai.ts`、三个 service 文件和两个新页面存在；
- Task 8 页面没有 `uni.navigateTo`、`uni.redirectTo`、`uni.reLaunch`、`uni.chooseMedia` 或 Repository/storage 直接调用；
- Task 8 页面不包含删除按钮、删除 action 或“删除占位”文本；
- `MockAiDraftService`、`AiDraftService`、三种场景和 `aiCandidateText` 均存在于源码边界中；
- `dist/build/mp-weixin` 包含两个新页面、AI 页面脚本和详情页面；
- 生产构建中没有真实 AI SDK、密钥占位或网络请求实现；
- WXSS 兼容性扫描继续通过。

### 10.2 自动化执行顺序

- [ ] **Step 1: 运行 Task 8 定向测试**

```powershell
npm run test:run -- tests/unit/mock-ai-draft-service.test.ts tests/unit/route-params.test.ts tests/unit/navigation.test.ts tests/unit/local-memory-repository.test.ts tests/unit/memory-store.test.ts tests/components/memory-detail-page.test.ts tests/components/memory-edit-page.test.ts tests/components/ai-draft-page.test.ts
```

Expected: 新增和受影响测试全部通过。

- [ ] **Step 2: 运行全量测试和类型检查**

```powershell
npm run test:run
npm run typecheck
```

Expected: 全量测试通过；`vue-tsc --noEmit` 退出码为 0。

- [ ] **Step 3: 构建生产微信包**

```powershell
npm run build:mp-weixin
```

Expected: `dist/build/mp-weixin` 生成，DevPanel 剥离链、WXSS 兼容性和页面注册均通过。

- [ ] **Step 4: 运行 Task 8 边界扫描和历史回归**

```powershell
npm run verify:task8
npm run verify:task5a
npm run verify:task5b
```

Expected: Task 8 自动门通过，Task 5A/5B 不受影响。若 `verify:task8` 内已包含全量构建，不得因此跳过命令输出记录。

### 10.3 微信开发者工具和浏览器原型验收路径

统一导入：

```text
D:\My_Grand_Projects2026\My-OPC\apps\pet-memory-miniapp\dist\build\mp-weixin
```

使用完整样本，逐条检查：

```text
04 → 08 → 09
09 → 编辑原话 → 修改 → 保存修改 → 09
09 → 编辑原话 → 修改 → 返回 → 继续修改 / 先不保存
09 → 整理一个候选稿 → 按次授权 → success → 修改候选稿 → 保存 → 09
09 → 整理一个候选稿 → insufficient → 继续使用原话 → 09
09 → 整理一个候选稿 → unavailable → 再试一次 / 先保留原话
```

必须检查：

- 09 原话和候选稿分区清晰，候选稿不替代原话；
- 10 键盘打开时底部操作不被遮挡，胶囊安全区不被右侧编辑操作覆盖；
- 11 授权前不调用服务，loading 超过 150ms 才显示安静等待文案；
- AI 失败、取消和保存失败均保留原话与当前编辑内容；
- 快速重复点击不产生重复请求或重复记忆；
- 09 的照片叠放、失效降级和 Task 7 行为没有回归；
- 页面没有删除入口、真实 AI 承诺、模型身份或夸张成功反馈。

### 10.4 视觉证据

Builder 默认提交以下证据：

```text
docs/project/gpt-review-output/task8-evidence/memory-detail.png
docs/project/gpt-review-output/task8-evidence/memory-edit.png
docs/project/gpt-review-output/task8-evidence/ai-draft-success.png
docs/project/gpt-review-output/task8-evidence/ai-draft-failure.png
docs/project/gpt-review-output/task8-evidence/report.md
```

截图必须来自微信开发者工具的真实构建产物，不使用浏览器原型截图冒充实现证据。若用户再次明确暂缓截图，报告必须标记“逻辑已验收、视觉待补”，不得写成 `visual-accepted`。

---

## 11. Builder 交付物

Builder 只能报告 `self-verified`，并提交：

1. 修改和新增文件清单，以及每个文件的职责；
2. `AiDraftService` 与 `MockAiDraftService` 的接口和 DI 说明；
3. 原话编辑、候选稿保存、拒绝、信息不足、暂不可用和重试的测试输出；
4. `npm run test:run`、`npm run typecheck`、`npm run build:mp-weixin`、`npm run verify:task8` 的真实输出；
5. `verify:task5a`、`verify:task5b` 回归输出；
6. 09 → 10 → 09 和 09 → 11 → 09 的实际路径结果；
7. 原话始终保留的证据，包括编辑原话后候选稿不被清除、候选稿保存后原话不被覆盖；
8. AI 三种受控场景的测试和开发面板触发说明；
9. 生产构建边界扫描结果，确认无真实 AI、删除入口和直接页面层持久化调用；
10. 截图证据或用户明确暂缓截图的记录；
11. 未验证项、设备风险和 Task 7 已知非阻断项，不得把它们隐藏在“全部通过”中。

Builder 不得在报告中写入 `logic-accepted`、`visual-accepted` 或 `reviewer-accepted`。

---

## 12. Logic Reviewer 与视觉负责人收口规则

以下任意一项都判定 `FAIL` 并退回：

- 原话被候选稿覆盖、清空或自动改写；
- 未授权就调用 AI service；
- AI service 根据用户临时文本动态编造候选内容；
- `insufficient` / `unavailable` 修改了记忆或删除了原话；
- 编辑原话失败后输入丢失；
- 候选稿保存失败后候选文本丢失；
- loading 或 save-pending 期间可重复提交；
- 页面直接调用 storage、Repository 或原始导航 API；
- 原话或候选稿进入 URL、日志、截图或错误文案；
- 详情页加入 Task 9 的删除占位或不可用按钮；
- 生产包包含真实 AI SDK、网络调用、模型名、密钥或 DevPanel 残留；
- 09/10/11 任一页面白屏、路由无法打开或关键返回栈错误。

以下问题可记为 `P2/P3`，不阻断逻辑主路径，但必须写入后续清单：

- 与浏览器原型的非核心间距、字号或文案细节偏差；
- 非核心按钮图标差异；
- 截图暂缓但自动化、类型和构建已通过；
- 真机未覆盖的设备特有安全区差异。

视觉负责人必须对照浏览器原型、Task 2 设计令牌和微信实现截图，确认 09/10/11 属于同一套产品语言；不能只看组件测试通过。

---

## 13. 完成定义

Task 8 只有满足以下全部条件，才可标记为 `reviewer-accepted`：

1. 09 详情可从 `04`、`08` 和新建成功路径进入，来源参数白名单正确；
2. 09 正确显示日期、照片/失效降级、原话和独立候选稿；
3. 09 有编辑原话和 AI 候选稿入口，但没有删除入口；
4. 10 支持预填、编辑、2,000 字上限、保存失败恢复和统一返回保护；
5. 11 支持按次授权、loading、success、insufficient、unavailable、保存失败和候选稿退出保护；
6. `MockAiDraftService` 固定返回三种场景，延迟为 700ms，不能根据用户文本动态编造；
7. 原话更新与候选稿更新通过现有 Store/Repository 原子快照链路完成，并互不覆盖；
8. 所有用户内容不进入路由、日志、错误文案或测试截图；
9. 不实现或伪装 Task 9 删除能力，不新增真实 AI 或生产依赖；
10. Task 7、Task 5A、Task 5B 回归通过；
11. 全量测试、类型检查、生产构建和 Task 8 边界扫描通过；
12. 微信开发者工具路径已真实验证，或按用户指令明确记录视觉/真机待补；
13. Builder 只报告 `self-verified`，Logic Reviewer、视觉负责人和用户分别完成独立验收。

Task 8 通过后，才进入 Task 9 的空间设置、隐私入口集成、删除记忆、删除空间和异常状态收口。
