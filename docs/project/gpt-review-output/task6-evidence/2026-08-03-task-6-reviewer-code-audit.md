# Task 6 Reviewer 代码逻辑审计报告

日期：2026-08-03
审查范围：Task 6 全量代码（record-entry、record-text、memory-detail + Store/Router + space-home 修改）
审查人：Logic Reviewer（独立审查，未修改代码）

## 审查方法

逐文件源码审计，覆盖：
- 6 个 Reviewer 重点审查项（用户指定）
- 数据流调用链追踪（页面 → Store → Repository）
- 路由参数白名单与边界校验
- 错误恢复路径、重复提交锁、状态机完整性
- 计划合同 vs 实际代码一致性

## 自动化门

| 检查项 | 结果 |
|---|---|
| 全量测试 (vitest run) | 690 tests, 35 files, **全部通过** |
| TypeScript 类型检查 | 通过 |
| 生产构建 | 通过 |
| WXSS 兼容扫描 | 通过 |
| verify:task5a 回归 | 通过 |
| DevPanel 生产排除 | 通过 |

---

## 六项重点审查逐项结果

### 1. 路由白名单：URL 参数只传白名单值

**审查方式**：追踪每个页面的 `onLoad` → 参数解析函数 → 校验逻辑

| 页面 | 解析函数 | spaceId | entry | draftId | memoryId | source |
|---|---|---|---|---|---|---|
| record-entry | `parseRecordEntryRoute` | ✅ 校验 | N/A | N/A | N/A | N/A |
| record-text | `parseTextRecordRoute` | ✅ 校验 | ✅ 白名单+可选 | ✅ 可选+校验 | N/A | N/A |
| memory-detail | `parseMemoryRoute` | N/A | N/A | N/A | ✅ 校验 | 未校验 (页面不使用) |
| space-home | `parseSpaceRoute` | ✅ 校验 | N/A | N/A | N/A | N/A |

`parseId()` 防御层级（route-params.ts:20-39）：
1. `typeof !== 'string'` → 拒绝（number/object/array/function）
2. `trim().length === 0` → 拒绝（纯空格/空串）
3. `startsWith('{') && endsWith('}')` → 拒绝（JSON 串注入）
4. `startsWith('[') && endsWith(']')` → 拒绝（数组串注入）

**结论：通过。** 所有页面均通过集中式解析函数校验路由参数，无页面自行读取原始 query。

---

### 2. 数据流：页面 → Store → Repository

**审查方式**：grep 每个页面文件，搜索 `uni\.`、`Repository`、`storage`、`localStorage`

| 页面 | uni.chooseMedia | uni.navigate* | uni.*Storage | Repository | 直接 localStorage |
|---|---|---|---|---|---|
| record-entry | 无 | 无 | 无 | 无 | 无 |
| record-text | 无 | 无 | 无 | 无 | 无 |
| memory-detail | 无 | 无 | 无 | 无 | 无 |
| space-home | 无 | 无 | 无 | 无 | 无 |

调用链验证（以 record-text 保存为例）：

```
record-text/index.vue:156
  memStore.saveMemory({spaceId, entry, originalText, assets, sourceDraftId})
    → memory.ts:54-58: repo.saveMemory(input) → _commitSnapshot(result.snapshot) → return result.value
      → Repository: 同一快照内创建 MemoryItem + 删除 sourceDraft
```

**结论：通过。** 无越层调用，所有数据操作经过 Store，Store 等待 Repository 成功后才提交快照。

---

### 3. saveMemory() 返回值

**现有代码**（memory.ts:54-58）：
```ts
async function saveMemory(input: SaveMemoryInput): Promise<MemoryItem> {
    const repo = getRepository()
    const result = await repo.saveMemory(input)
    _commitSnapshot(result.snapshot)
    return result.value  // ← 来自 RepositoryWriteResult.value
}
```

**调用方**（record-text/index.vue:156-163）：
```ts
const result = await memStore.saveMemory({...})
await nav.resetTo({ page: 'memory-detail', memoryId: result.id })
```

`result.id` 来自 `RepositoryWriteResult.value.id`（Repository 分配），非页面从 `memories` 数组推测最新项。

失败时不调用 `_commitSnapshot()`（异常在 `repo.saveMemory()` 抛出，被页面 catch 捕获，`_commitSnapshot` 不会执行）。

**结论：通过。** 返回的是 Repository 分配的确定值，页面不自行猜测 ID。失败时不提交快照。

---

### 4. 草稿合同

**单草稿保证**：`draftForSpace(spaceId)` 返回 `drafts.find(d => d.spaceId === spaceId)`，Repository upsert 保证同空间只有一个草稿。

**三选一对话框**（space-home/index.vue:79-89）：
```html
<ConfirmDialog
  :open="showResumeDialog"
  title="你还有一段没写完的"
  confirm-label="继续写这段"
  discard-label="不保留，另起一段"
  cancel-label="先不动"
/>
```

三路处理（space-home/index.vue:251-270）：
| 选择 | 行为 |
|---|---|
| 继续写这段 | `push record-text?spaceId=X&entry=Y&draftId=Z` — 携带草稿数据 |
| 另起一段 | `deleteDraft(id)` → 成功后 `push record-entry` |
| 先不动 | 关闭对话框 |

**sourceDraftId 传递链**：
```
space-home → push: ?draftId=Z
  → record-text onLoad: parseTextRecordRoute → draftId
    → 查找 memStore.drafts → 恢复 text + entry + sourceDraftId
      → handleSaveMemory: sourceDraftId 传入 saveMemory()
        → Repository 同一快照: create Memory + delete Draft(sourceDraftId)
```

**草稿保存失败保护**（record-text/index.vue:171-190）：
```ts
async function handleSaveDraft(): Promise<void> {
  if (isSavingDraft.value || isSavingMemory.value) return  // 锁
  ...
  try {
    await memStore.saveDraft({...})
    await nav.back()
  } catch {
    saveError.value = true  // 保留输入，设置错误
  } finally {
    isSavingDraft.value = false
  }
}
```

**退出保护中的草稿保存**（record-text/index.vue:225-243）：Builder 修复后 catch 分支设置 `saveError = true` 并 `return`，不导航。

**结论：通过。** 合同完整实现：单草稿、三选一恢复、sourceDraftId 传递、失败保留输入。

---

### 5. 09 只读：memory-detail 页面

逐项检查：

| 要求 | 实现 | 状态 |
|---|---|---|
| 无编辑按钮 | 模板无编辑相关元素 | ✅ |
| 无删除按钮 | 模板无删除相关元素 | ✅ |
| 无 AI 按钮 | 模板无 AI 相关元素 | ✅ |
| 显示 originalText | `{{ memory.originalText }}` (line 46) | ✅ |
| 不显示 aiCandidateText | 无引用 | ✅ |
| 不从 URL 读原话 | 通过 parseMemoryRoute 只取 memoryId | ✅ |
| 非法 memoryId → MissingContentState | `v-else-if="memory === null"` | ✅ |
| 返回 04 | `nav.back()` | ✅ |
| 有 "你留下的话" 标识 | `memory-detail__eyebrow` | ✅ |
| 照片展示能力保留 | photos computed + v-for | ✅ |

**结论：通过。** 09 是真实的只读详情页，不是占位壳。

---

### 6. 退回保护

**空文本 → 直接返回**（record-text/index.vue:217-222）：
```ts
function handleBack(): void {
  if (isDirty()) { showReturnDialog.value = true }
  else { nav.back() }
}
```

**脏文本 → 三选一对话框**（record-text/index.vue:82-93）：
```html
<ConfirmDialog
  title="这段还没保存，要先留着吗？"
  confirm-label="保存草稿"
  discard-label="放弃"
  cancel-label="继续写"
/>
```

**三路处理**：
| 选择 | 函数 | 行为 |
|---|---|---|
| 保存草稿 | `handleConfirmLeave` | 保存草稿 → 成功后 `nav.back()` |
| 放弃 | `handleDiscardLeave` | 直接 `nav.back()` |
| 继续写 | `showReturnDialog = false` | 留在当前页 |

**保存草稿失败**：设置 `saveError`、`isSavingDraft = false`、`return`（不导航。）

**sourceDraftId 传递**：handleSaveMemory line 161 传入 `sourceDraftId: sourceDraftId.value`

**帮助面板的 "这次先不写"**：调用 `handleBack()` → 脏文本触发返回保护对话框（符合 spec 的 "进入统一退出保护"）

**结论：通过。** 三选一逻辑完整，sourceDraftId 正确传递，空文本直接返回，失败不丢输入。

---

## 修复验证（P1 缺陷）

上一轮 Reviewer 审查发现 2 个 P1 缺陷，Builder 均已修复：

| 缺陷 | 修复状态 |
|---|---|
| record-entry 未调用 parseSpaceRoute | ✅ 已修复 — 使用 `parseRecordEntryRoute` + MissingContentState |
| record-text spaceId 无校验 | ✅ 已修复 — 使用 `parseTextRecordRoute`，entry/draftId 均白名单化 |

---

## 代码质量问题（P2/P3）

### P2-01：parseTextRecordRoute 的 draftId 测试缺口

`route-params.test.ts` 的 `parseTextRecordRoute` 测试段（lines 286-443）覆盖了 spaceId 和 entry 的校验，但未显式测试 draftId：
- 无 draftId=空字符串 的测试
- 无 draftId=JSON 串 的测试
- 无 draftId 跨空间场景的测试

代码实现本身正确（line 82-85：`isValidId` 校验 + `trim()`），但测试未覆盖。

**影响**：低。代码逻辑由 `isValidId` 继承。建议后续补一条 draftId 测试。

### P3-01：handleConfirmLeave 先关对话框再保存

record-text/index.vue:226：`showReturnDialog.value = false` 在 try 之前。如果 `saveDraft()` 失败，用户看到 `saveError` 但对话框已关闭，需要再次点击返回才能重新触发保护。

**影响**：极低。用户仍被保护在页面上，不会丢数据。只是多一次点击。

### P3-02：textarea 使用 `:value` + `@input` 而非 `v-model`

record-text/index.vue:24-30：使用手动绑定。在 uni-app 下功能等价，但 `v-model` 更简洁。

**影响**：无功能性影响。

---

## 层级架构审计

```
┌────────────────────────────────────────┐
│              页面层                      │
│  record-entry / record-text /           │
│  memory-detail / space-home             │
├────────────────────────────────────────┤
│              Adapter 层                  │
│  NavigationAdapter / (PhotoPicker N/A)  │
├────────────────────────────────────────┤
│              Store 层                    │
│  useAppStore / useMemoryStore           │
├────────────────────────────────────────┤
│            Repository 层                 │
│  LocalMemoryRepository                  │
├────────────────────────────────────────┤
│            持久化层                      │
│  UniStorageAdapter → wx.setStorageSync  │
└────────────────────────────────────────┘
```

- 无跨层调用
- 无重复的胶囊/导航/存储逻辑
- 页面通过 DI（provideNavigation / providePhotoPicker）注入平台依赖

---

## 审查结论

```
┌──────────────────────────────────────────────┐
│  Task 6 Logic Reviewer 结论                   │
│                                              │
│  自动化门：    PASS（690 tests, 35 files）     │
│  路由白名单：  PASS（3/3 页面集中校验）         │
│  数据流：      PASS（无越层调用）              │
│  saveMemory：  PASS（返回值来自 Repository）   │
│  草稿合同：    PASS（单草稿+三选一+失败保护）    │
│  09 只读：     PASS（无编辑/删除/AI 按钮）     │
│  退回保护：    PASS（三选一+sourceDraftId）    │
│  DevPanel：    PASS（生产构建排除）            │
│  代码质量：    无 console.log，无 any 滥用      │
│                                              │
│  CRITICAL：0    HIGH：0                       │
│  P2：1（draftId 测试缺口）                     │
│  P3：2（对话框时序 + textarea 绑定风格）        │
│                                              │
│  判定：logic-accepted                         │
└──────────────────────────────────────────────┘
```

### 待人类任务

- 微信 DevTools 真实路径：04→05→06→09→04 主旅程
- 三个文字首问切换路径
- 草稿保存/恢复/另起/放弃路径
- 三张微信截图（record-entry / record-text / memory-detail）
- 视觉负责人对照浏览器原型确认

以上完成后 Task 6 可标记为 `reviewer-accepted`。
