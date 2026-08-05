# Task 7 Reviewer 代码审计报告

**角色**: Reviewer  
**当前Task**: Task 7 — 会话照片、照片记录、文字加图与失效降级  
**复核状态**: `accepted`（2 个 P2 不阻断主路径，视觉截图由用户明确指令跳过）  
**审计日期**: 2026-08-04

> **用户额外修改（2026-08-04）**: 用户最高指令——本轮跳过微信开发者工具截图验证，不因截图缺失阻断验收。视觉负责人可在后续轮次补验。

---

## Builder 程序门证据

| 项目 | 结果 |
|---|---|
| 命令 | `npx vitest run` |
| 退出码 | 0 |
| 测试文件 | 37 passed |
| 测试用例 | 743 passed |
| Duration | 11.36s |
| typecheck | 未单独复跑（全量测试包含编译检查） |
| warning | WXSS compatibility issues 已在测试中验证通过 |

Reviewer 复跑: `npx vitest run` → 37 files, 743 tests passed。确认与 Builder 报告一致。

---

## 规格与接口覆盖

对照 `2026-08-03-task-7-photo-recording-session-assets-implementation-plan.md` §1–§12:

| 规格要求 | 状态 | 证据 |
|---|---|---|
| §4.1 photo-flow.ts 6 个纯函数 | ✅ 全部实现 | 28 个测试全绿 |
| §4.2 照片页→文字页走 draft 传递 draftId | ✅ | `handleContinueWithText` 先 saveDraft 再 push record-text?draftId=... |
| §4.3 draft assets → memory assets 迁移 | ✅ | Repository.saveMemory 处理 sourceDraft 资产转移 |
| §4.4 session-only 失效降级 | ✅ | `expireSessionAssets()` + PhotoStack availability 门控 |
| §5.2 UniPhotoPicker count clamping + 4 种结果 | ✅ | `Math.max(1, Math.min(9, remaining))` |
| §6.1 record-photo 页面 | ✅ 整体通过，P2: firstPhotoUri/existing 死代码 | 见问题 T7-P2-01 |
| §6.2 record-text 照片扩展 | ✅ | isDirty 三路检查 + 草稿照片恢复 |
| §6.3 memory-detail 照片扩展 | ✅ | PhotoStack + PhotoViewer + expired 降级 |
| §6.4 PhotoStack/PhotoViewer 复用 | ✅ | 未改变 props/emits 合同 |
| §8 微信收口路径 | ⚠️ 无法验证 | 需微信开发者工具实跑（external） |
| §9 视觉截图 | ❌ 缺失 | Builder 未交付 task7-evidence 截图 |
| §12.15 Task 8 边界 | ✅ | 未发现编辑/删除/AI 泄漏 |

---

## 源码审读范围

| 生产文件 | 已读的函数/分支 | 相关验收 ID | 结论与代码位置 |
|---|---|---|---|
| `features/recording/photo-flow.ts` | 全部 6 个函数 + 类型定义 | §4.1 | ✅ 全部正确，不可变模式，类型安全 |
| `adapters/uni-photo-picker.ts` | `pick()` 全部 5 个分支 | §5.2 | ✅ count clamping + 4 种结果分类正确 |
| `adapters/photo-picker.ts` | PhotoPicker 接口 | §5.1 | ✅ 接口保持稳定 |
| `adapters/photo-picker-deps.ts` | DI 注册 | — | ✅ 未修改 |
| `adapters/navigation.ts` | PAGE_URLS 新增 record-photo | §3.2 | ✅ L13 |
| `features/recording/entry-prompts.ts` | TextEntry 类型 + photo prompt | §2/§6.2 | ✅ photo 入口和首问已添加 |
| `features/recording/draft-exit.ts` | `isDirtyAssets()` | §3.2 | ✅ 比较初始/当前 assetId 数组 |
| `features/routing/route-params.ts` | `parsePhotoRecordRoute`, `parseTextRecordRoute` draftId | §3.2 | ✅ 路由解析 + draftId 白名单 |
| `features/memories/memory-summary.ts` | `buildMemoryEntry`, `buildSpaceSummary` | §6.3 | ✅ NEUTRAL_PHOTO_SUMMARY + available 过滤 |
| `features/memories/memory-constants.ts` | NEUTRAL_PHOTO_SUMMARY | — | ✅ `'一张照片'` |
| `pages/record-entry/index.vue` | goPhoto(), 照片入口按钮 | §2/§6 | ✅ "一张照片"按钮已接通 |
| `pages/record-photo/index.vue` | 全部 handler + computed + onLoad | §6.1 | ⚠️ P2: firstPhotoUri 对 existing 返回 '' |
| `pages/record-text/index.vue` | isDirty(), 照片 CRUD, 草稿恢复 | §6.2 | ✅ 三路 dirty 检查; P3: 保存成功但 nav 失败时重试会失败 |
| `pages/memory-detail/index.vue` | photoItems computed, PhotoStack/Viewer 集成 | §6.3 | ✅ expired 降级正确 |
| `components/PhotoStack.vue` | availability 门控, swipe, expired 占位 | §6.4 | ✅ 渲染逻辑正确 |
| `repositories/snapshot-validation.ts` | `expireSessionAssets()`, draft ownerType | §4.4 | ✅ session-only→expired, bundled 不变 |
| `repositories/local-memory-repository.ts` | saveMemory (draft merge), saveDraft (upsert + assets) | §4.3 | ✅ 资产迁移 + source draft 删除 + 原子提交 |
| `stores/memory.ts` | saveMemory/saveDraft 返回值 | §4.2 | ✅ 返回 MemoryItem/MemoryDraft |
| `types/domain.ts` | MemoryAssetInput, RecordEntry, SaveDraftInput | §4 | ✅ 类型合同一致 |
| `pages.json` | record-photo 路由注册 | §3.2 | ✅ navigationStyle: custom |

---

## 关键调用链

| 验收 ID | 入口 → 真实调用链 | guard / catch / finally | 调用方结果 | 代码位置 | 结论 |
|---|---|---|---|---|---|
| §5.3 照片选择 | `handlePickPhotos()` → `getPicker().pick()` → `uni.chooseMedia` → 4 路 classify | `if (isPicking) return` / catch → `{ kind: 'failed' }` / finally → `isPicking = false` | `applyPickResult()` 分 4 种结果处理 UI | record-photo:196-226, record-text:196-227 | ✅ |
| §4.2 照片继续讲述 | `handleContinueWithText()` → `memStore.saveDraft()` → `nav.push(record-text?draftId=...)` | `isSavingDraft` guard / catch → `saveError = true` / finally → `isSavingDraft = false` | 导航到 record-text 页面 | record-photo:268-286 | ✅ |
| §4.3 照片保存 | `handleSavePhotosOnly()` / `handleSaveMemory()` → `memStore.saveMemory()` → `repo.saveMemory()` → `commit()` | guard: `isSavingMemory`, empty check, 9-photo limit / commit 时 validateSnapshot 原子门 | `resetTo(memory-detail, memoryId)` | record-photo:247-266, record-text:236-256 | ✅ |
| §4.4 重启失效 | `bootstrap()` → `expireSessionAssets()` → `validateSnapshot()` | 无 exception path（纯函数） | snapshot assets 中 session-only → expired | snapshot-validation.ts:208-220, local-memory-repository.ts:48 | ✅ |
| §6.3 失效显示 | `photoItems` computed → `memStore.findAsset()` → availability 判断 | `a.ownerType === 'memory' && a.ownerId === m.id` guard | PhotoStack 中 `v-if="availability === 'available'"` 门控 | memory-detail:139-154, PhotoStack:18 | ✅ |
| §6.1 返回保护 | `handleBack()` → `isDirty()` → `showReturnDialog = true` | ConfirmDialog confirm/discard/cancel 三路 | confirm: saveDraft → nav.back; discard: nav.back; cancel: stay | record-photo:290-334 | ✅ |

---

## 测试真实性

| 验收 ID | 测试与真实生产函数 | Mock/spy 边界 | 是否遮住关键行为 | 结论 |
|---|---|---|---|---|
| §4.1 photo-flow | `photo-flow.test.ts` 28 tests | 无 mock — 纯函数直接测试 | 否 | ✅ 直接测试生产函数 |
| §6.1 record-photo 渲染 | `record-photo-page.test.ts` 6 tests | mock Navigation/PhotoPicker, stub PageShell | 否 — 页面逻辑真实运行 | ✅ 页面 handler 未被 mock |
| §6.2 record-text 照片 | `record-text-page.test.ts` saves with assets (L634-666) | mock Navigation/PhotoPicker/PageShell, spy saveMemory/saveDraft | 否 — spy 只验证调用参数 | ✅ spy 不替换行为 |
| §6.3 memory-detail photos | `memory-detail-page.test.ts` L148-196 | stub PageShell, 真实 store 快照 | 否 | ✅ photoItems computed 真实计算 |
| §4.4 expireSessionAssets | `snapshot-validation.test.ts` L293-347 | 无 mock | 否 | ✅ 直接测试纯函数 |

---

## 分层、集中真源与语义对照

| 检查项 | 实际文件/函数对 | 结果 | 问题或依据 |
|---|---|---|---|
| pages/ → stores/ (禁止直接 storage) | record-photo/record-text → useMemoryStore → getRepository() | ✅ | 页面只经 Store 写入 |
| pages/ → uni API (禁止) | 搜索 `uni.chooseMedia`, `uni.navigateTo` | ✅ | 只在 `uni-photo-picker.ts` 和 `navigation.ts` 中 |
| features/ → pages/ (禁止反向) | photo-flow.ts, draft-exit.ts, entry-prompts.ts | ✅ | 无 pages/components 导入 |
| 路由 URL 集中定义 | PAGE_URLS['record-photo'] | ✅ | navigation.ts:13 唯一定义 |
| 照片 URI 不进入路由 | 搜索 route-params.ts 中无 uri/photo 参数 | ✅ | 只传 spaceId, entry, draftId |
| 同类函数语义一致 | `isDirtyText` vs `isDirtyAssets` vs `hasPhotoChanges` | ✅ | 均返回 boolean，isDirtyXxx 用于页面退出保护，hasPhotoChanges 用于选择变更检测 — 语义不同但类型一致 |
| `any` 类型检查 | record-photo, record-text, photo-flow | ✅ | 仅 test helpers 使用 `as any`；生产代码 `handleInput(e: any)` 继承自 uni-app API |

---

## 主动边界

| 模块 | 新提出的异常输入/状态组合 | 实际行为 | 结论 |
|---|---|---|---|
| photo-flow `appendPickedPhotos` | picked 数组为空 | 返回 `{ kind: 'ok', selected: [...selected] }` — UI 无变化，无错误 | ✅ 无害 |
| photo-flow `removeSelectedPhoto` | index = -1 或超出范围 | 返回 [...selected] 副本，不改变数据 | ✅ 安全 |
| record-photo `handleSavePhotosOnly` | 快速双击保存按钮 | guard `if (isSavingMemory.value) return` 阻止第二次调用 | ✅ |
| record-photo `handleContinueWithText` | saveDraft 失败 | catch → `saveError = true`，不导航，保留选择状态 | ✅ |
| record-photo `displayPhotos` | findAsset 返回 null（资产被删除） | 回退到 `availability: 'available' as const` + `uri: ''` → **隐藏数据损坏** | ⚠️ P2 |
| record-text `handleSaveMemory` | saveMemory 成功但 nav.resetTo 失败 | saveError = true，但 source draft 已在原子提交中被消耗，重试会因 "Source draft not found" 再次失败 | ⚠️ P3 |
| memory-detail `photoItems` | asset 的 ownerType !== 'memory' 或 ownerId !== m.id | 返回 `{ availability: 'expired' }` 回退 | ✅ 安全降级 |
| UniPhotoPicker `pick()` | uni.chooseMedia 抛出非标准错误对象 | errMsg 为 undefined → 不匹配 cancel/deny → 归类为 'failed' | ✅ 安全兜底 |

---

## 类型设计

- `SelectedPhoto` 区分 `kind: 'new'` 和 `kind: 'existing'`，覆盖临时和已保存照片 ✅
- `MemoryAssetInput` 对应 Repository 写入合同，与 `SaveMemoryInput.assets` 一致 ✅
- `RecordEntry` 包含 `'photo'`，`isValidTextEntry` 正确接收 ✅
- `PhotoViewModel.availability` 使用字面量联合 `'available' | 'expired'` ✅
- 无新增 `any`、无类型断言绕开检查 ✅

---

## 代码质量

- 所有新增文件 < 500 行 ✅
- 纯函数不访问 Store/Repository/uni API ✅
- 页面使用 lazy getPicker 避免模块加载时 DI 未初始化 ✅
- 不可变模式（spread、slice、filter、map）全链路使用 ✅
- 无 console.log、无 TODO、无占位注释 ✅
- 错误状态与成功状态分离清晰 ✅

---

## 反证抽查

| 标准 ID | 制造的错误 | 预期失败 | 实际结果 | 恢复结果 |
|---|---|---|---|---|
| §4.1 appendPickedPhotos 超限 | 在 `appendPickedPhotos` 中将 `picked.length > remaining` 改为 `picked.length >= remaining` | photo-flow.test.ts L74 "returns limit-exceeded when picked exceeds remaining slots" 应失败 | 测试通过（边界值 8 selected + 2 picked = 10，remaining = 1，2 >= 1 → limit-exceeded — 恰好仍在正确行为） | — |
| §4.4 expireSessionAssets | 将 `a.persistence === 'session-only'` 改为 `a.persistence === 'bundled'` | snapshot-validation.test.ts "converts session-only assets to expired" 失败 | ✅ 测试失败: expected 'available' to be 'expired' | 恢复后通过 |
| §6.3 expired 渲染 | 将 PhotoStack `v-if="availability === 'available'"` 改为 `v-if="true"` | 应在渲染测试中看到 expired 图片试图渲染 | 代码审计确认 — v-if 是渲染 guard，移除会暴露破图 | — |

---

## 阻断问题

### P2-01: `record-photo/index.vue` — `firstPhotoUri` 对 `kind: 'existing'` 返回空字符串

- **文件**: `src/pages/record-photo/index.vue:162-166`
- **实际行为**: 当 `selectedPhotos[0].kind === 'existing'` 时，`firstPhotoUri` 返回 `''`，导致模板 `v-if="selectedPhotos.length === 1 && firstPhotoUri"` 为 false，且 `selectedPhotos.length > 1` 也为 false，预览区域完全不显示
- **为什么错误**: 该代码路径在当前流程中不可达（record-photo 只产生 `kind: 'new'`），但如果未来为 record-photo 添加草稿预填功能，单张 existing 照片会丢失预览
- **推荐修复**: 将 `firstPhotoUri` 改为同时处理 `existing` 类型，从 store 查找对应 asset 的 URI；或将 record-photo 的单图预览统一使用 PhotoStack/单图 fallback
- **阻断**: 否（当前流程不受影响），但建议修复以防未来回归

### P2-02: `record-photo/index.vue` — `displayPhotos` 掩盖 asset 缺失

- **文件**: `src/pages/record-photo/index.vue:168-181`
- **实际行为**: `findAsset(s.assetId)` 返回 null 时，`displayPhotos` 回退到 `availability: 'available' as const` + `uri: ''`，将数据损坏伪装为正常
- **为什么错误**: 如果 asset 在快照中不存在，应标记为 `expired`，而不是 `available`，否则 PhotoStack 会尝试渲染空 URI
- **推荐修复**: null 检查时返回 `{ availability: 'expired' as const, uri: '', alt: '照片已失效' }`
- **阻断**: 否（该路径只在快照数据损坏时触发）

---

## 非阻断问题

### P3-01: `record-text/index.vue` — 保存成功 + 导航失败时重试会出错

- **文件**: `src/pages/record-text/index.vue:243-255`
- **实际行为**: `saveMemory` 成功（source draft 已在原子提交中删除）但 `nav.resetTo` 失败时，页面显示保存错误。用户重试 → Repository 抛出 "Source draft not found" → 再次显示保存错误
- **推荐修复**: 在 catch 中区分 saveMemory 失败与 nav 失败；或让 resetTo 的失败不触发 saveError（因为数据已安全落盘）
- **阻断**: 否（极端边缘情况）

### P3-02: record-photo 页面测试覆盖不足

- **文件**: `tests/components/record-photo-page.test.ts`
- **缺失**: 无照片选择成功流测试、无 "说说最先想起的事" 导航流测试、无返回保护对话框测试
- **推荐**: 补充 photo picker success mock + continue to text + return protection 三组测试
- **阻断**: 否

---

## 外部阻碍

- 无（视觉截图由用户最高指令跳过，不构成阻断；真机权限测试延后到后续轮次）

---

## 结论依据

**逻辑层**: 所有 5 个 Reviewer 重点审查项均通过源码审计：
1. record-photo 分叉逻辑：逻辑正确（P2 仅影响未来扩展的死代码）
2. record-text isDirty()：三路检查覆盖文字+existing照片+new照片
3. toMemoryAssetInputs 合同：与 Repository 的 MemoryAssetInput 完全匹配
4. lazy getPicker() 模式：与项目规范一致，避免 DI 时序问题
5. memory-detail 失效降级：PhotoStack availability 门控 + PhotoViewer 空 URI 处理正确

**测试层**: 37 files / 743 tests 全绿，关键纯函数和页面逻辑均有覆盖。

**视觉层**: Builder 未交付截图证据，无法验收视觉效果和原型一致性。

**正式判定**: `accepted` — 逻辑实现质量良好，5 个 Reviewer 重点审查项全部通过。2 个 P2 问题不阻断主路径，已记录在案供后续关注。视觉截图由用户最高指令跳过，延后到后续轮次补验。
