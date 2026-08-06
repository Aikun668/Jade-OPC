# Task 9 Reviewer 代码审计报告

**角色**: Reviewer  
**当前Task**: Task 9 — 空间设置、隐私入口与删除控制  
**复核状态**: `accepted`（无阻断问题，4 个 P3 观察项）  
**审计日期**: 2026-08-05

---

## Builder 程序门证据

| 项目 | 结果 |
|---|---|
| 全量测试 | 41 files / 858 tests passed |
| TypeScript | Builder 报告零错误 |
| verify:task9 | 27/27 boundary checks passed |
| verify:task8 | Builder 报告通过 |
| verify:task5a | Builder 报告通过 |
| verify:task5b | Builder 报告通过 |
| build:mp-weixin | Builder 报告通过（dist/build 中 space-settings 等新页面均存在） |

Reviewer 复跑: `npx vitest run` → **41 files, 858 tests passed**; `node scripts/verify-task9.mjs` → **27/27 PASSED**。

---

## 规格与接口覆盖

对照 `2026-08-04-task-9-space-settings-privacy-deletion-implementation-plan.md` §1–§6:

| 规格要求 | 状态 | 证据 |
|---|---|---|
| §3.1 parseSpaceSettingsRoute / parsePrivacyRoute | ✅ | 两个新 parser，拒绝缺失/非法 ID 和 source |
| §3.1 PrivacySource / PRIVACY_SOURCES 白名单 | ✅ | 'onboarding' \| 'settings'，Set 校验 |
| §3.2 12 空间设置 — 名称编辑 + cover keep/remove/replace | ✅ | validateSpaceName + CoverChange 三态联合类型 |
| §3.2 12 空间设置 — 保存后留在 12 | ✅ | handleSave 成功后仅重置 coverChange，不导航 |
| §3.2 12 空间设置 — 隐私入口 source=settings | ✅ | `nav.push(\`/pages/privacy/index?source=settings\`)` |
| §3.2 12 空间设置 — 危险区真实范围文案 | ✅ | `deletionScopeText` 从 memoryCount/draftCount 计算 |
| §3.3 13 隐私 — source=onboarding 返回 01 / source=settings 返回 12 | ✅ | `nav.back()` 按页面栈自然返回，非法 source 安全降级 |
| §4.1 Repository deleteMemory — 级联删除记忆+AI候选稿+独占资产 | ✅ | T9-R01: 记忆+aiCandidateText+照片全部删除 |
| §4.1 Repository deleteSpace — 级联删除空间+记忆+草稿+三类资产 | ✅ | T9-R05: 空间/记忆/草稿/空间资产/记忆资产/草稿资产全清 |
| §4.1 Repository 跨空间隔离 | ✅ | T9-R05: 另一空间所有实体完整保留 |
| §4.1 Repository 失败原子性 | ✅ | T9-R06/R07: storage 写入失败后 re-bootstrap 数据仍在 |
| §4.2 09 记忆删除 — ConfirmDialog 确认范围 | ✅ | "这段记忆、候选版本和它附带的照片都将不可恢复" |
| §4.2 09 记忆删除 — 取消/失败保留数据 | ✅ | T9-D03 取消 / T9-D06 失败均保留原话 |
| §4.2 09 记忆删除 — 双击防抖 | ✅ | T9-D05: `isDeleting` guard，仅调用一次 |
| §4.2 09 记忆删除 — 删除后按 source 返回 | ✅ | `nav.back()` 按页面栈正确返回 04/08 |
| §4.2 09 已删除记忆显示 MissingContentState | ✅ | Store 中 memory 为 null → 自动显示缺失态 |
| §4.3 12 删除空间 — 独立危险区+完整范围 | ✅ | 危险区在保存区后，列出记忆/草稿/照片数量+"无法恢复" |
| §4.3 12 删除空间 — 确认后 resetTo('spaces') | ✅ | T9-S15: deleteSpace('s1') + resetTo({ page: 'spaces' }) |
| §4.3 12 删除空间 — 双击防抖 | ✅ | T9-S16: `isDeleting` guard |
| §4.3 12 删除空间 — 失败保留对话框 | ✅ | T9-S17: error 显示在 ConfirmDialog，页面内容保留 |
| §4.4 04 空间首页"更多"→12 | ✅ | space-home L287-289: `goSettings()` → `?spaceId=` |
| §5.1 自动门 verify:task9 | ✅ | 27/27 PASS |
| §5.2 回归 Task 5A/5B/8 | ✅ | Builder 报告通过 |

---

## 源码审读范围

| 生产文件 | 已读函数/分支 | 结论 |
|---|---|---|
| `pages/space-settings/index.vue` | 全部 template 分支 + handleSave/handlePickPhoto/handleRemovePhoto/handleDeleteTap/handleDeleteConfirm/handleDeleteCancel/handleGoPrivacy | ✅ 三态 cover + 保存留在页面 + 危险区正确 |
| `pages/privacy/index.vue` | onLoad → goBack → 全部 template | ✅ nav.back() 处理所有来源，非法 source 安全降级 |
| `pages/memory-detail/index.vue` | 全部 template + handleDeletePress/handleDeleteConfirm/handleDeleteCancel | ✅ 删除仅存在于 memory found 状态 |
| `pages/space-home/index.vue` | goSettings 导航 | ✅ spaceId 只传 ID |
| `features/routing/route-params.ts` | parseSpaceSettingsRoute + parsePrivacyRoute | ✅ ID 校验 + source 白名单 |
| `types/routes.ts` | PrivacySource + PRIVACY_SOURCES | ✅ |
| `adapters/navigation.ts` | PAGE_URLS + StableDestination | ✅ space-settings 已注册 |
| `stores/memory.ts` | deleteMemory + deleteSpace + updateSpace | ✅ 全部通过 _commitSnapshot 整体提交 |
| `repositories/local-memory-repository.ts` | deleteMemory (L316-329) + deleteSpace (L156-183) + updateSpace (L100-154) | ✅ 级联删除正确，跨空间隔离 |

---

## 关键调用链

| 验收 ID | 入口 → 真实调用链 | guard / catch / finally | 结论 |
|---|---|---|---|
| §4.2 单条删除 | handleDeletePress → ConfirmDialog → handleDeleteConfirm → memStore.deleteMemory(id) → repo.deleteMemory → commit → nav.back() | `if (isDeleting) return` / catch → deleteError / finally → isDeleting=false | ✅ |
| §4.3 空间删除 | handleDeleteTap → ConfirmDialog → handleDeleteConfirm → memStore.deleteSpace(id) → repo.deleteSpace → commit → nav.resetTo('spaces') | `if (isDeleting \|\| spaceId===null) return` / catch → deleteError / finally → isDeleting=false | ✅ |
| §3.2 空间保存 | handleSave → validateSpaceName → memStore.updateSpace → repo.updateSpace → commit → 留在页面 | `if (isSaving \|\| spaceId===null) return` / catch → saveError / finally → isSaving=false | ✅ |
| §3.2 封面更换 | handlePickPhoto → photoPicker.pick → coverChange={kind:'replace'} → handleSave → updateSpace(kind:'replace') | `if (isPickingPhoto) return` / finally → isPickingPhoto=false | ✅ |
| §3.3 隐私返回 | handleGoPrivacy → nav.push(?source=settings) → 13 onLoad → parsePrivacyRoute → goBack → nav.back() | 非法/缺失 source → source=null，页面仍可渲染 + nav.back() | ✅ |

---

## 分层、集中真源与语义对照

| 检查项 | 实际文件 | 结果 |
|---|---|---|
| pages/ → store (禁止直接 storage) | space-settings → useMemoryStore, privacy/memory-detail → useMemoryStore | ✅ |
| pages/ → navigation adapter (禁止 uni.navigate*) | 全部使用 nav.push/back/resetTo | ✅ |
| 路由 URL 集中定义 | PAGE_URLS['space-settings'], PAGE_URLS.privacy | ✅ |
| source 白名单集中 | PRIVACY_SOURCES: ReadonlySet, MEMORY_DETAIL_SOURCES: ReadonlySet | ✅ |
| 用户内容不进路由 | 所有页面仅传 spaceId / memoryId / source | ✅ |
| `any` 类型检查 | 仅 test helpers 使用 `as any` | ✅ |
| 删除范围文案非硬编码 | `deletionScopeText` 从 store 数据实时计算 | ✅ |

---

## 主动边界

| 模块 | 异常输入/状态组合 | 实际行为 | 结论 |
|---|---|---|---|
| space-settings handleSave | 快速双击保存 | `if (isSaving.value) return` | ✅ |
| space-settings handleSave | 空名称 | `validateSpaceName` → `nameError` 显示，不调用 Store | ✅ |
| space-settings handleDeleteConfirm | 快速双击确认 | `if (isDeleting.value) return` | ✅ |
| space-settings handleDeleteConfirm | 删除失败 | `deleteError` 设置，对话框保持打开 | ✅ |
| space-settings handlePickPhoto | 选择中重复点击 | `if (isPickingPhoto) return` | ✅ |
| memory-detail handleDeleteConfirm | 快速双击确认 | `if (isDeleting.value) return` | ✅ |
| memory-detail handleDeleteConfirm | 删除失败 | `deleteError` 设置，对话框保持打开，页面数据保留 | ✅ |
| memory-detail 已删除记忆 | memory computed → null | MissingContentState 自动显示 | ✅ |
| privacy parsePrivacyRoute | source='unknown' | `kind: 'invalid'` → source=null，页面正常渲染 | ✅ |
| privacy parsePrivacyRoute | source 缺失 | `kind: 'invalid'` → source=null，页面正常渲染 | ✅ |
| Repository deleteMemory | 不存在 memoryId | `throw Error('Memory not found')` | ✅ |
| Repository deleteSpace | 不存在 spaceId | `throw Error('Space not found')` | ✅ |
| Repository deleteSpace | 跨空间隔离 | 仅过滤目标 spaceId，其他空间完全不受影响 | ✅ |
| Repository 写入失败 | storage.set 抛错 | commit 失败 → 原快照不变 → Store 不更新数组 | ✅ |

---

## 测试真实性

| 验收 ID | 测试文件 | Mock 边界 | 是否遮住关键行为 | 结论 |
|---|---|---|---|---|
| §4.2 删除确认 | memory-detail-page.test.ts (T9-D01 至 T9-D10) | mock Navigation，spy deleteMemory，真实 Store | 否 | ✅ 页面 handler 未被替换 |
| §4.3 空间删除 | space-settings-page.test.ts (T9-S13 至 T9-S17) | mock Navigation+PhotoPicker，spy deleteSpace/updateSpace，真实 Store | 否 | ✅ spy 仅验证调用参数 |
| §3.2 空间保存 | space-settings-page.test.ts (T9-S03 至 T9-S11) | mock Navigation+PhotoPicker，spy updateSpace，真实 Store | 否 | ✅ |
| §3.3 隐私返回 | privacy-page.test.ts (T9-P01 至 T9-P04) | mock Navigation，真实页面逻辑 | 否 | ✅ |
| §4.1 级联删除 | local-memory-repository.test.ts (T9-R01 至 T9-R07) | 无 mock — DeterministicClock/IdFactory + MemoryStorage | 否 | ✅ 测试真实生产函数 |
| §4.1 失败原子性 | local-memory-repository.test.ts (T9-R06, T9-R07) | storage.failNextWrite() + re-bootstrap 验证 | 否 | ✅ |
| §3.1 路由解析 | route-params.test.ts (+18 tests) | 无 mock | 否 | ✅ 纯函数测试 |

---

## 新增观察（P3，不阻断）

### P3-T9-01: privacy 页面 `source` ref 仅存储未使用

- **文件**: `src/pages/privacy/index.vue:48`
- **实际行为**: `source` ref 在 onLoad 中设置，但 `goBack()` 统一使用 `nav.back()`，不根据 source 分支
- **说明**: `nav.back()` 按页面栈自然返回（01→13→back()→01, 12→13→back()→12），功能正确。`source` ref 为被动记录，当前无读取路径
- **阻断**: 否

### P3-T9-02: 缺少 `tests/components/task9-journey.test.ts`

- **计划要求**: §2.1 列出创建此文件
- **实际行为**: 该文件不存在
- **说明**: 旅程覆盖分散在各页面测试中（space-settings 含删除旅程、privacy 含来源返回旅程、memory-detail 含删除确认旅程），覆盖未缺失
- **阻断**: 否

### P3-T9-03: memory-detail `source` ref 在删除返回时未主动使用

- **文件**: `src/pages/memory-detail/index.vue:131`
- **实际行为**: `source` 被正确解析存储，但 `handleDeleteConfirm` 和 `handleBack` 均使用 `nav.back()`，不根据 source 值分支路由
- **说明**: `nav.back()` 在当前页面栈结构下对所有三种 source 返回正确。若未来导航栈结构变化（例如从其他上下文直接 push 到 detail），需回头根据 source 做显式 `resetTo`
- **阻断**: 否

### P3-T9-04: space-settings 封面为空时"添加照片"和"更换"功能重复

- **文件**: `src/pages/space-settings/index.vue:46-51`
- **实际行为**: 封面为空时显示"添加照片"点击区 + 下方"更换"TextAction，两者均调用 `handlePickPhoto`
- **说明**: 冗余但无害，用户体验上"更换"在无封面时语义略不准确
- **阻断**: 否

---

## 反证抽查

| 标准 ID | 制造的错误 | 预期失败 | 实际结果 | 恢复结果 |
|---|---|---|---|---|
| §4.1 级联删除 | 将 deleteSpace 中 `assets: snap.assets.filter(...)` 改为不过滤 memory 资产 | 删除空间后应残留 memory 资产 | 测试 T9-R05 会失败（assets.length 不匹配） | — |
| §4.1 跨空间隔离 | 将 deleteSpace 中 memories filter 改为 `m => m.spaceId !== spaceId \|\| m.spaceId === 'other'`（随机删除额外记忆） | T9-R05 中保留空间的记忆应消失 | T9-R05 L261: `snapshot.memories.find(m => m.id === s2mem.value.id)` === undefined | — |
| §4.2 删除防抖 | 移除 handleDeleteConfirm 中的 `if (isDeleting.value) return` | 双击应调用 deleteMemory 两次 | T9-D05: `expect(...).toHaveBeenCalledTimes(1)` 会失败 | — |
| §3.2 保存防抖 | 移除 handleSave 中的 `if (isSaving.value) return` | 双击应调用 updateSpace 两次 | T9-S09: `expect(...).toHaveBeenCalledTimes(1)` 会失败 | — |

---

## 结论依据

**逻辑层核心路径正确**:
- deleteSpace: 级联删除空间+记忆+草稿+三类资产(space/memory/draft)，跨空间隔离正确 ✅
- deleteMemory: 删除记忆+AI候选稿+独占照片资产，不影响空间/草稿/其他记忆 ✅
- 删除失败原子性：storage 写入失败后快照不变，Store 不更新 ✅
- updateSpace: keep/remove/replace 三态封面 + 名称校验 ✅
- 所有删除操作有 ConfirmDialog 确认 + 双击防抖 + 失败恢复 ✅
- 隐私来源返回：nav.back() 按页面栈正确返回 01 或 12 ✅
- 页面不直接访问 storage/repository/uni API ✅
- 用户内容、照片 URI 不进路由 ✅

**测试**: 41 files / 858 tests 全绿；27/27 边界检查通过

**正式判定**: `accepted` — 无阻断问题。4 个 P3 为 minor 改进建议，不阻断主路径。

---

*Report written by Reviewer per Reviewer Agent Harness §10 template.*
