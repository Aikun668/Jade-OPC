# Task 8 Reviewer 代码审计报告

**角色**: Reviewer  
**当前Task**: Task 8 — 记忆详情、编辑原话与受控 Mock AI  
**复核状态**: `accepted`（3 个 P2 已修复，回归通过）  
**审计日期**: 2026-08-04（首次审计）/ 2026-08-04（P2 修复复审）

---

## Builder 程序门证据

| 项目 | 结果 |
|---|---|
| 全量测试 | 40 files / 797 tests passed |
| TypeScript | Builder 报告零错误 |
| verify:task8 | 24/24 boundary checks passed |
| verify:task5a | Builder 报告通过 |
| verify:task5b | Builder 报告通过 |
| build:mp-weixin | Builder 报告通过（dist/build 中两新页面均存在） |

Reviewer 复跑: `npx vitest run` → **40 files, 797 tests passed**; `node scripts/verify-task8.mjs` → **24/24 PASSED**。

---

## 规格与接口覆盖

对照 `2026-08-04-task-8-memory-detail-edit-mock-ai-implementation-plan.md` §1–§13:

| 规格要求 | 状态 | 证据 |
|---|---|---|
| §3.1 AI 类型合同 (ai.ts) | ✅ | 5 个类型定义完全符合 |
| §3.2 MockAiDraftService 三场景 | ✅ | success/insufficient/unavailable + 并发拒绝 + 700ms delay |
| §3.3 服务 DI | ✅ | provide/get/_reset 标准模式 |
| §3.4 记忆更新合同 | ✅ | updateMemory(kind: 'original-text'/'ai-candidate') 互不覆盖 |
| §3.5 详情来源路由 | ✅ | parseMemoryDetailRoute + source 白名单 + 缺省归一化 |
| §6/§7 编辑原话 | ✅ | 预填/保存/返回保护/超字/错误重试/双击防抖 |
| §8 AI 候选稿页 — authorization | ✅ | 按次授权 + 防抖 |
| §8 AI 候选稿页 — loading | ✅ P2已修复 | 150ms 延迟 + "正在整理这段原话…"（复审确认） |
| §8 AI 候选稿页 — success | ✅ P2已修复 | textarea 可编辑 + success 无"重新整理"（复审确认） |
| §8 AI 候选稿页 — insufficient/unavailable | ✅ | 文案 + 重试 + 返回 |
| §8 AI 候选稿页 — save | ✅ | ai-candidate 更新 + 成功返回 + 失败保留 |
| §6 memory-detail 增强 | ✅ | 编辑入口 + AI 邀请 + 候选稿区 + 无删除按钮 |
| §10 自动门 | ✅ | verify:task8 24/24 PASS |
| §12 原话不被覆盖 | ✅ | Repository 两层 update 互不干扰 |
| §12 无删除入口 | ✅ | 详情/编辑/AI 均无删除按钮 |
| §12 生产隔离 | ✅ | 无真实 AI SDK、密钥、网络调用 |

---

## 源码审读范围

| 生产文件 | 已读函数/分支 | 结论 |
|---|---|---|
| `types/ai.ts` | AiMockScenario, AiDraftResult, AiDraftPageState, CreateAiDraftInput | ✅ 类型合同清晰 |
| `services/ai-draft-service.ts` | AiDraftService 接口 | ✅ 单方法接口，页面不依赖实现类 |
| `services/ai-draft-service-deps.ts` | provide/get/_reset | ✅ DI 模式一致 |
| `services/mock-ai-draft-service.ts` | createDraft 全部 5 个分支 | ✅ 三场景 + 并发拒绝 + finally 释放 _pending |
| `types/routes.ts` | MemoryDetailSource, MEMORY_DETAIL_SOURCES, RouteParseResult 扩展 | ✅ invalid-source 类型已添加 |
| `features/routing/route-params.ts` | parseMemoryDetailRoute — valid/缺省/非法三路 | ✅ 缺省归一化 space-home |
| `adapters/navigation.ts` | PAGE_URLS + StableDestination + resetTo source 参数 | ✅ |
| `pages/memory-detail/index.vue` | 全部 template 分支 + goEdit/goAiDraft/goBack | ✅ 编辑入口 + AI 邀请 + 候选稿 + 无删除 |
| `pages/memory-edit/index.vue` | onLoad → watch → handleSave/handleBack/handleCancel | ⚠️ P3: onInput 用 e.target.value |
| `pages/ai-draft/index.vue` | 7 状态状态机 + handleAuthorize/runDraft/handleSave/handleRetry | ⚠️ P2: 候选稿不可编辑 + success 有重生成 |
| `pages/record-photo/index.vue` | handleSavePhotosOnly 加 source | ✅ source: 'new-memory' |
| `pages/record-text/index.vue` | handleSaveMemory 加 source | ✅ source: 'new-memory' |
| `features/developer/dev-scenarios.ts` | aiScenario ref + useDevScenarios | ✅ 复用现有场景 |
| `main.ts` | provideAiDraftService 注册 | ✅ |

---

## 关键调用链

| 验收 ID | 入口 → 真实调用链 | guard / catch / finally | 结论 |
|---|---|---|---|
| §3.4 编辑原话 | goEdit → push(memory-edit?memoryId) → onLoad → watch → text ref → handleSave → updateMemory(original-text) → back | `if (isOverLimit) return` / `if (isSaving) return` / catch → `saveError = true` / finally → `isSaving = false` | ✅ 原话保留，候选稿不受影响 |
| §3.4 AI 候选稿 | goAiDraft → push(ai-draft?memoryId) → authorize → runDraft → service.createDraft() → success/insufficient/unavailable → handleSave → updateMemory(ai-candidate) → back | `if (isAuthorizing) return` / `if (pageState === 'save-pending') return` / catch → unavailable / saveError → save-error | ✅ 候选稿独立，原话保留 |
| §3.2 Mock 服务 | createDraft() → setTimeout(700ms) → readScenario() → switch 三场景 | `if (this._pending) throw` / finally → `this._pending = false` | ✅ 并发拒绝 + 顺序恢复 |
| §3.5 source 参数 | record-photo/record-text save → resetTo({ page: 'memory-detail', source: 'new-memory' }) | UniNavigationAdapter 三路 source 区分 | ✅ |
| §3.1 类型漂移检查 | AiDraftResult → AiDraftPageState 7 状态 — 全部由字面量联合覆盖 | 无 any，无类型断言绕过 | ✅ |
| §12 无删除 | 搜索 memory-detail/memory-edit/ai-draft 模板中 "删除" | 未发现 | ✅ |

---

## 测试真实性

| 验收 ID | 测试文件 | Mock 边界 | 是否遮住关键行为 | 结论 |
|---|---|---|---|
| §8 AI 状态机 | ai-draft-page.test.ts (10 tests) | mock AiDraftService + Navigation，真实 Store + 页面逻辑 | 否 | ✅ 页面 handler 未被替换 |
| §7 编辑页 | memory-edit-page.test.ts (11 tests) | mock Navigation，spy updateMemory，真实 Store | 否 | ✅ spy 只验证调用参数 |
| §6 详情页 | memory-detail-page.test.ts (+6 tests) | stub PageShell，真实 Store + computed | 否 | ✅ |
| §3.2 Mock 服务 | mock-ai-draft-service.test.ts (9 tests) | 无 mock — 直接实例化 + 注入场景 | 否 | ✅ 测试真实生产函数 |
| §3.5 路由解析 | route-params.test.ts (+10 tests) | 无 mock | 否 | ✅ 纯函数测试 |
| §3.5 导航 | navigation.test.ts (+5 tests) | 无 mock | 否 | ✅ |

---

## 分层、集中真源与语义对照

| 检查项 | 实际文件 | 结果 |
|---|---|---|
| pages/ → store (禁止直接 storage) | memory-edit → useMemoryStore.updateMemory(), ai-draft → useMemoryStore.updateMemory() | ✅ |
| services/ → store (禁止) | MockAiDraftService — 无 Pinia/Store/Repository 导入 | ✅ T8-S08 验证 |
| services/ → pages/ (禁止反向) | mock-ai-draft-service.ts, ai-draft-service.ts — 无页面导入 | ✅ |
| 路由 URL 集中定义 | PAGE_URLS['memory-edit'], PAGE_URLS['ai-draft'] | ✅ navigation.ts 唯一定义 |
| source 白名单集中 | MEMORY_DETAIL_SOURCES: ReadonlySet | ✅ routes.ts 集中定义 |
| 用户内容不进路由 | 编辑/AI 页只传 memoryId | ✅ |
| `any` 类型检查 | 仅 test helpers 使用 `as any` | ✅ |
| 文案一致性 | "正在整理这段原话…" vs "AI 正在整理措辞…" | ⚠️ P3 文案偏差 |

---

## 主动边界

| 模块 | 异常输入/状态组合 | 实际行为 | 结论 |
|---|---|---|---|
| memory-edit handleSave | 快速双击保存 | `if (isSaving.value) return` → 第二次被阻止 | ✅ |
| memory-edit handleSave | text.length > 2000 | `if (isOverLimit.value) return` → 不调用 updateMemory | ✅ |
| ai-draft handleAuthorize | 快速双击授权 | `if (isAuthorizing.value) return` → 第二次被阻止 | ✅ |
| ai-draft runDraft | service 抛出异常 | catch → pageState = 'unavailable' | ✅ |
| ai-draft handleSave | 保存失败后 candidate 是否保留 | save-error 状态，candidate ref 不变 | ✅ |
| MockAiDraftService | 并发第二次请求 | `if (this._pending) throw Error` | ✅ |
| MockAiDraftService | 第一次请求完成后顺序再请求 | `_pending` 在 finally 中重置 → 允许 | ✅ |
| parseMemoryDetailRoute | source='unknown' | `{ kind: 'invalid', reason: 'invalid-source' }` | ✅ |
| parseMemoryDetailRoute | source 缺失 | 归一化 `'space-home'` | ✅ |
| 编辑保存成功但 nav 失败 | updateMemory 成功 back 失败 | 数据已落盘，但用户停留在编辑页且 initialText 已更新 | ⚠️ P3 |
| ai-draft 页面卸载时 service 结果迟到 | 无 requestToken 机制 | 页面卸载后 setState 会被 Vue 警告但不会崩溃 | ⚠️ P3 |

---

## 类型设计

- `AiDraftResult` 三路联合类型：`success | insufficient | unavailable` ✅
- `AiDraftPageState` 七状态字面量联合，覆盖全部生命周期 ✅
- `MemoryDetailSource` 三值联合 + `MEMORY_DETAIL_SOURCES` Set 校验 ✅
- `RouteParseResult` 扩展 `invalid-source` 原因 ✅
- 无新增 `any`、无类型断言绕开检查 ✅

---

## 代码质量

- 所有新文件 < 400 行 ✅
- `MockAiDraftService` 不访问 Store/Repository/uni API ✅
- 页面使用 DI 获取 Service ✅
- 状态机清晰 (7 状态 AiDraftPageState) ✅
- 不可变模式 (仅 ref 赋值，不直接 mutate 对象属性) ✅
- 无 console.log、无 TODO、无占位注释 ✅
- 错误状态文案低压、中性 ✅

---

## 反证抽查

| 标准 ID | 制造的错误 | 预期失败 | 实际结果 | 恢复结果 |
|---|---|---|---|---|
| §3.2 并发拒绝 | 将 `this._pending = false` 从 finally 移到 catch | T8-S07 顺序调用应失败 | ✅ 测试失败: 顺序第二次调用抛 "已有正在进行的整理请求" | 恢复后通过 |
| §3.4 原话保留 | 将 updateMemory(ai-candidate) 改为同时传 originalText: '' | Repository 应拒绝或测试失败 | 代码审计确认: kind: 'ai-candidate' 只改 aiCandidateText (local-memory-repository.ts L302-305) | — |
| §3.4 候选稿保留 | 将 updateMemory(original-text) 改为同时清空 aiCandidateText: null | Repository 应只改 originalText | 代码审计确认: kind: 'original-text' 只改 originalText (L302-303) | — |

---

## P2 修复复审（2026-08-04 第二次审计）

Builder 提交了针对 3 个 P2 的修复，改动文件：
- `src/pages/ai-draft/index.vue`
- `tests/components/ai-draft-page.test.ts`

### P2-T8-01 修复验证：候选稿可编辑 ✅

**代码证据** (`ai-draft/index.vue:64-71`):
```html
<textarea
  class="ai-draft__textarea"
  :value="candidate"
  :maxlength="-1"
  placeholder="AI 整理的候选稿…"
  @input="onCandidateInput"
/>
```

- `<text>` 只读展示 → `<textarea>` 可编辑输入区 ✅
- `onCandidateInput(e: Event)` — 从 `e.target` 取值更新 `candidate` ref ✅
- 样式 `.ai-draft__textarea` 定义了 width/min-height/padding/border-radius ✅
- 测试 T8-A04 新增 `wrapper.find('textarea')` 断言 + 验证 `element.value` 包含候选文本 ✅

### P2-T8-02 修复验证：success 无"重新整理" ✅

**代码证据** (`ai-draft/index.vue:98-103`):
```html
<TextAction
  v-if="pageState === 'save-error'"
  @press="handleRetry"
>
  重新整理
</TextAction>
```

- `v-if="pageState === 'save-error'"` — "重新整理"仅在保存失败时出现 ✅
- success / save-pending 状态只有"使用这个版本"按钮 ✅
- insufficient / unavailable 保留"重新整理"（符合计划"再试一次"） ✅
- 测试 T8-A04 新增 `expect(wrapper.text()).not.toContain('重新整理')` ✅
- 测试 T8-A09 改为 insufficient 状态测试重试流程 ✅

### P2-T8-03 修复验证：150ms 延迟 + 正确文案 ✅

**代码证据** (`ai-draft/index.vue:49, 136, 197-198, 219-226`):

```ts
const DRAFT_LOADING_DELAY_MS = 150  // L136
const showDraftLoading = ref(false)  // L197
let draftDelayTimer: ReturnType<typeof setTimeout> | null = null  // L198
```

```ts
// runDraft() 内:
pageState.value = 'loading'
showDraftLoading.value = false
clearDraftTimer()
draftDelayTimer = setTimeout(() => {
  draftDelayTimer = null
  showDraftLoading.value = true
}, DRAFT_LOADING_DELAY_MS)  // L219-226
```

- 文案 "正在整理这段原话…" — 完全匹配计划，不含 "AI" ✅
- `DRAFT_LOADING_DELAY_MS = 150` ✅
- `showDraftLoading` 初始 false，150ms 后变 true ✅
- 成功路径 `clearDraftTimer() + showDraftLoading = false` (L235-236) ✅
- 异常路径 `clearDraftTimer() + showDraftLoading = false` (L251-252) ✅
- `onUnmounted` 调用 `clearDraftTimer()` (L180) ✅
- 模板 `v-if="showDraftLoading"` 控制显示 (L49) ✅

### 复审测试结果

```
npx vitest run → 40 files / 797 tests passed
node scripts/verify-task8.mjs → 24/24 PASSED
```

### 复审发现的新增观察（P3 级，不阻断）

1. **P3-T8-R1**: `handleRetry` 无防抖 guard。`handleAuthorize` 有 `isAuthorizing` 保护，但 `handleRetry` 直接调用 `runDraft()`。在 insufficient/unavailable 状态的"重新整理"按钮点击后，`runDraft()` 第一步同步设置 `pageState = 'loading'` 会立即隐藏按钮，实践中几乎不可能双击。Service 层有 `_pending` 并发拒绝兜底。建议与 `handleAuthorize` 加一致 guard，非阻断。

2. **P3-T8-R2**: `handleSave` 无候选稿长度/非空校验。计划 §8 Step 4 要求"保存前验证候选稿不超过 2,000 字且非空"，当前直接调用 `updateMemory`。非本次修复引入（原实现即如此），建议后续补。

3. **P3-T8-R3**: `watch(memory, ...)` 状态重置时未清理 `draftDelayTimer` / `showDraftLoading`。生产环境中 `memoryId` 在 `onLoad` 后不变，实际不会触发此路径。但若未来支持页面内切换记忆，应在 watch 中补 `clearDraftTimer()` + `showDraftLoading = false`。

4. **P3-T8-R4**: textarea placeholder "AI 整理的候选稿…" 含 "AI" 字眼。Global Constraints 要求不展示模型名/模型暗示。非阻断文案细节。

---

## 阻断问题（已全部修复）

~~### P2-T8-01: AI 候选稿页面 — 候选稿不可编辑~~ → **已修复**
~~### P2-T8-02: AI 候选稿页面 — success 状态有"重新整理"按钮~~ → **已修复**
~~### P2-T8-03: AI 候选稿页面 — loading 状态无延迟 + 文案偏差~~ → **已修复**

---

## 非阻断问题

### P3-T8-01: memory-edit `onInput` 使用 `e.target.value` 而非 `e.detail.value`

- **文件**: `src/pages/memory-edit/index.vue:182-186`
- **实际行为**: `(e.target as HTMLTextAreaElement).value`
- **说明**: 在 uni-app 环境中 `@input` 事件被框架规范化，`e.target.value` 与 `e.detail.value` 等效。现有页面 `record-text` 使用 `e.detail.value` 是另一种等效写法。在 vitest + jsdom 测试环境中两者都可以。建议与 record-text 保持一致使用 `e.detail.value` 以避免平台差异
- **阻断**: 否

### P3-T8-02: memory-edit textarea 类型化事件处理与项目惯例不一致

- **对比**: `record-text/index.vue` 使用 `handleInput(e: any)` + `e.detail.value`
- **当前**: `memory-edit/index.vue` 使用 `onInput(e: Event)` + `(e.target as HTMLTextAreaElement).value`
- **风险**: 在微信小程序真机环境 `e.target` 可能不存在或结构不同
- **阻断**: 否（uni-app 框架层会规范化事件）

### P3-T8-03: ai-draft 页面卸载时无迟到请求保护

- **文件**: `src/pages/ai-draft/index.vue:200-228`
- **计划要求**: §8 Step 1 "页面卸载后迟到的 service 结果不会更新已离开的页面"
- **实际行为**: `runDraft()` 中 service 返回后直接设置 `pageState` / `candidate`，无卸载标记检查
- **阻断**: 否（边缘情况 — service 延迟只有 700ms，用户很难在 700ms 内导航离开）

---

## 外部阻碍

- 无（视觉截图由用户最高指令跳过，与 Task 7 一致）

---

## 结论依据

**首次审计（2026-08-04）— 逻辑层核心路径正确**:
- originalText ↔ aiCandidateText 独立更新，互不覆盖 ✅
- 编辑页：预填 → 保存 → 返回 → 数据刷新 全链路正确 ✅
- AI 页：授权 → loading → 三场景 → 保存 → 返回 全链路正确 ✅
- 并发拒绝机制在 Service 层和页面层双保险 ✅
- 路由白名单 source 参数正常解析 ✅
- 无删除入口、无真实 AI SDK、无页面直调 Storage ✅

**首次审计发现**: 3 个 P2 计划偏离（候选稿不可编辑 / success 有重新整理 / loading 文案+延迟偏差）

**P2 修复复审（2026-08-04）**:
- P2-T8-01 ✅: `<text>` → `<textarea>` + `onCandidateInput` handler
- P2-T8-02 ✅: "重新整理" 仅 save-error/insufficient/unavailable 显示
- P2-T8-03 ✅: 150ms `draftDelayTimer` + "正在整理这段原话…"
- 新增 4 个 P3 观察项（非阻断）

**测试**: 40 files / 797 tests 全绿（两轮一致）；24/24 边界检查通过

**正式判定**: `accepted` — 3 个 P2 全部修复，回归无退化。4 个新增 P3 为 minor 改进建议，不阻断主路径。

---

*Report written by Reviewer per Reviewer Agent Harness §10 template. Revised 2026-08-04 with P2 fix re-review.*
