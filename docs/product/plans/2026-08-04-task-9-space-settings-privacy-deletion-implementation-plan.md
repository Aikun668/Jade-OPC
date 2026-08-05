# Task 9 空间设置、隐私入口与删除控制实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本计划采用“两次施工收口 + 最终总收口”：Builder 先完成非破坏性控制并提交中途证据，再完成破坏性数据控制，最后统一回归 Task 5A–Task 9。

**Goal:** 在 M0 本地 Mock 中完成 12 空间设置、13 隐私来源返回、09 单条记忆删除和空间级联删除，确保用户知道删除范围、数据不会误删、失效页面栈不会残留。

**Architecture:** 视觉结构以浏览器原型的 `SpaceSettingsScreen`、`PrivacyScreen`、`MemoryDetailScreen` 及对应 CSS 为迁移母版；React 事件、浏览器历史和演示数据不直接复制。页面只读取路由参数、编排 Pinia Store 和 NavigationAdapter，不直接访问 Storage、Repository 或原始 `uni.navigate*`。空间资料修改继续调用 `memory` Store 的 `updateSpace()`；单条记忆和空间删除继续调用已有 `deleteMemory()` / `deleteSpace()`，由 Repository 返回完整快照后整体提交。删除完成后的页面去向由稳定 ID 与白名单来源参数决定，不把私人内容、照片 URI 或完整对象放进路由。

**Tech Stack:** uni-app、Vue 3、TypeScript、Pinia、微信小程序、Vitest、现有 `PageShell`、`ConfirmDialog`、`MissingContentState`、`PhotoPicker`、`NavigationAdapter`、`MemoryRepository`。

## Global Constraints

- 当前阶段固定为 `M0` 本地 Mock；不接入 CloudBase、真实 AI、微信登录、云端照片、导出、分享或商业化能力。
- Task 8 Reviewer 状态为 `accepted`，40 个测试文件 / 797 个测试通过，`verify:task8` 24/24 通过；Task 8 报告中的 4 个 P3 只进入后续清单，本计划不顺手重开 Task 8。
- Task 7 的截图和真机权限验证仍按用户决定暂缓；Task 9 不得用新的删除页面掩盖该状态。
- 浏览器原型是 Task 9 的视觉迁移母版：`apps/pet-memory-design-prototype/src/Prototype.tsx` 和 `prototype.css`。必须参考 `MemoryDetailScreen`、`SpaceSettingsScreen`、`PrivacyScreen`，并对照 09/12/13 的视觉基准图；不得把 React 事件、浏览器 CSS、固定 px 或原型中的静态演示数据原样搬入 uni-app。
- 正式产品规则优先于浏览器演示导航：12 保存资料后留在 12（不回 04）；13 必须返回实际来源 01 或 12（不固定回 01）；删除范围、确认和删除后恢复以本计划为准。
- `LocalMemoryRepository.updateSpace()`、`deleteMemory()`、`deleteSpace()` 和 `MemoryStore` 对应 Store action 是现有合同；除非新增反证测试失败，不重新设计接口、不新增第二套数据层。
- 删除空间必须同时删除该空间、其正式记忆、草稿、空间封面、记忆照片和草稿照片；不得影响其他空间的任何记录或资产。
- 删除单条记忆必须同时删除该记忆记录、AI 候选稿和 owner 为该记忆的照片资产；不得删除所属空间、草稿、空间封面或其他记忆。
- 删除是不可恢复操作。确认前必须显示明确范围；未确认不得调用 Store；确认后按钮防抖，等待期间不得重复提交。
- 空间资料保存只影响空间名称和空间封面：`keep` 保留现有封面，`remove` 删除封面，`replace` 原子替换封面；名称校验沿用现有空间表单规则。
- 13 隐私说明只允许 `source=onboarding|settings`；首次说明进入后返回 01，空间设置进入后返回 12。缺失或非法来源必须有安全的返回出口，不静默跳到错误业务页。
- 09 记忆详情继续允许 `source=space-home|memories|new-memory`；删除后不得回到已经完成的 05/06/07 记录流程。
- 失败状态必须保留原页面数据和用户输入，使用低压力恢复文案；不得展示异常名、系统错误码或真实用户内容到日志、路由、截图和错误文案。
- 新增页面继续使用现有 `PageShell`、设计令牌、键盘规则、安全区和共享组件；不新增 UI 组件库、生产依赖或全局视觉语言。
- 不提交 Git commit、不推送远程、不覆盖用户已有工作区修改；Builder、Reviewer 和视觉验收均只在当前工作区内留证。

---

## 1. 开工前事实来源与当前边界

### 1.1 浏览器原型与视觉基准（必须读取）

Builder 开工前必须同时打开以下视觉真源，并在 Builder 自证报告中列出实际读取过的组件和 CSS 区段：

- `apps/pet-memory-design-prototype/src/Prototype.tsx`
  - `MemoryDetailScreen`：日期、照片叠放、原话、候选稿邀请和底部操作区的阅读层级；
  - `SpaceSettingsScreen`：封面与更换/移除操作的并列关系、名称表单、隐私入口和底部危险区的顺序；
  - `PrivacyScreen`：阅读页标题、导语、四段隐私说明和“我知道了”的随内容流动布局；
- `apps/pet-memory-design-prototype/src/prototype.css`
  - `.detail-date`、`.detail-photo-stack`、`.original-memory`、`.detail-actions`；
  - `.settings-cover`、`.settings-section`、`.settings-row`、`.danger-zone`；
  - `.privacy-sections` 及其 section / heading / body 层级；
- `docs/product/assets/m0-page-baselines/09-memory-detail.png`、`12-space-settings.png`、`13-privacy.png`：小程序视觉验收的最终基准。

迁移纪律：保留信息顺序、阅读层级、区块边界、操作轻重和留白关系；用现有设计令牌、共享组件和 rpx 布局重新实现。原型中的“团团、2 段记忆、1 条草稿”等数量只能作为版式示例，页面必须展示真实 Store 数据或中性范围文案；不得把示例文案当作用户数据。

### 1.2 业务与工程真源（必须读取）

- `docs/README.md`；
- `docs/product/mvp/2026-07-20-formal-mvp-decision.md`；
- `docs/product/technical/2026-07-20-wechat-miniapp-engineering-decision.md`；
- `docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md` 中 12/13、返回栈、删除范围和 M0 数据边界；
- `docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md` 中 12/13 页面装配、危险区、确认弹窗、标准视觉基准和验收门；
- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md` 中稳定导航结果、Repository 合同和 Task 9 原始范围；
- `docs/product/plans/2026-08-04-task-8-memory-detail-edit-mock-ai-implementation-plan.md`；
- `docs/project/gpt-review-output/task8-evidence/2026-08-04-task-8-reviewer-code-audit.md`；
- `apps/pet-memory-miniapp/src/repositories/local-memory-repository.ts`、`src/stores/memory.ts`、`src/adapters/navigation.ts` 及对应测试。

### 1.3 推荐施工顺序

```text
Task 9-A 非破坏性控制
  12 空间设置 → 13 隐私来源返回 → 中途验收

Task 9-B 破坏性数据控制
  Repository 反证 → 09 单条记忆删除 → 12 删除空间 → 删除后栈恢复

Task 9-C 最终总收口
  Task 5A–Task 8 回归 → Task 9 自动门 → 微信路径/截图 → 最终报告
```

Task 9-A 未通过时不得开始 Task 9-B；Task 9-B 未通过时不得把 Task 9 标为完成。

---

## 2. 文件施工地图

### 2.1 创建

- `apps/pet-memory-miniapp/src/pages/space-settings/index.vue`：12 空间设置页，资料保存、隐私入口和删除空间危险区。
- `apps/pet-memory-miniapp/tests/components/space-settings-page.test.ts`：12 页面状态、保存、失败恢复、隐私入口和删除确认测试。
- `apps/pet-memory-miniapp/tests/components/task9-journey.test.ts`：Task 9 两阶段主旅程与删除后返回栈测试。
- `apps/pet-memory-miniapp/scripts/verify-task9.mjs`：页面注册、生产边界、删除入口和路由白名单扫描。
- `docs/project/gpt-review-output/task9-evidence/README.md`：Task 9 证据命名、阶段门和截图目录说明。

### 2.2 修改

- `apps/pet-memory-miniapp/src/pages.json`：注册 `pages/space-settings/index`，使用 `navigationStyle: custom`。
- `apps/pet-memory-miniapp/src/types/routes.ts`：新增 `PrivacySource`、`PRIVACY_SOURCES`，保留现有 `MemoryDetailSource` 白名单。
- `apps/pet-memory-miniapp/src/features/routing/route-params.ts`：新增 `parsePrivacyRoute()` 和 `parseSpaceSettingsRoute()`；拒绝缺失/非法 ID 或 source。
- `apps/pet-memory-miniapp/src/adapters/navigation.ts`：补齐空间设置、隐私和删除后稳定目的地所需的 URL/类型；不得把用户内容加入 URL。
- `apps/pet-memory-miniapp/src/pages/space-home/index.vue`：保留现有 `spaceId`，让“更多”进入 12；空间不存在时走现有恢复出口。
- `apps/pet-memory-miniapp/src/pages/privacy/index.vue`：使用白名单 source，来源为 onboarding 时返回 01，来源为 settings 时返回 12；保留 M0 隐私文案语义。
- `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`：读取并保留详情来源，加入删除确认、删除中/失败状态和删除后按来源返回；不影响编辑和 AI 候选稿链路。
- `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`、`tests/components/privacy-page.test.ts` 和 `tests/components/space-home-page.test.ts`：补充删除后详情不存在、来源和回归断言；复用现有测试 helper，不新建重复 helper。
- `apps/pet-memory-miniapp/tests/unit/route-params.test.ts`：覆盖空间设置和隐私来源合法、缺失、非法输入。
- `apps/pet-memory-miniapp/tests/unit/navigation.test.ts`：覆盖设置、隐私和删除后稳定导航结果。
- `apps/pet-memory-miniapp/tests/unit/local-memory-repository.test.ts`：补充删除单条记忆的独占资产、删除空间跨空间隔离、写入失败不变更快照反证。
- `apps/pet-memory-miniapp/tests/unit/memory-store.test.ts`：补充 `updateSpace`、`deleteMemory`、`deleteSpace` 成功整体提交和失败不提交断言。
- `apps/pet-memory-miniapp/package.json`：增加 `verify:task9`，不增加依赖。

### 2.3 明确不修改

- 不修改 `MemoryRepository` 公共方法签名、`MemorySnapshot` schemaVersion 或资产 owner 语义。
- 不实现导出、撤销删除、回收站、云端删除、账户删除或照片永久存储。
- 不把 Task 8 的 4 个 P3 改进混入本轮；Reviewer 可单独登记后续清单。
- 不替换 13 张视觉基准图，不把截图裁切或差异阈值调整成“通过”。

---

## 3. Task 9-A：空间设置与隐私来源返回（第一次收口）

### 3.1 路由与页面注册

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages.json`
- Modify: `apps/pet-memory-miniapp/src/types/routes.ts`
- Modify: `apps/pet-memory-miniapp/src/features/routing/route-params.ts`
- Modify: `apps/pet-memory-miniapp/src/adapters/navigation.ts`
- Test: `apps/pet-memory-miniapp/tests/unit/route-params.test.ts`
- Test: `apps/pet-memory-miniapp/tests/unit/navigation.test.ts`

**Interfaces:**
- `parseSpaceSettingsRoute(query): RouteParseResult<{ spaceId: string }>`
- `parsePrivacyRoute(query): RouteParseResult<{ source: PrivacySource }>`
- `PrivacySource = 'onboarding' | 'settings'`
- `PAGE_URLS['space-settings']` remains `/pages/space-settings/index`; privacy URL remains `/pages/privacy/index`.

- [ ] 写失败测试：缺失/空白/对象形式的 `spaceId` 必须返回 `invalid`；`source=onboarding|settings` 必须返回 `valid`；缺失或未知 source 必须返回 `invalid-source`。
- [ ] 运行 `npm run test:run -- tests/unit/route-params.test.ts tests/unit/navigation.test.ts`，确认新增断言先失败。
- [ ] 实现最小路由解析和页面注册；所有页面 URL 继续集中在 `navigation.ts`。
- [ ] 重新运行同一命令，确认路由和导航测试通过。

### 3.2 实现 12 空间设置

**Files:**
- Create: `apps/pet-memory-miniapp/src/pages/space-settings/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/space-home/index.vue`
- Test: `apps/pet-memory-miniapp/tests/components/space-settings-page.test.ts`

**Required behavior:**

- 页面加载 `spaceId`，从 Store 读取空间名称、封面和资产可用性；缺参、加载中、空间不存在均使用现有状态组件。
- 内容顺序固定为：空间照片 → 名称字段 → 保存资料 → 隐私说明入口 → 独立危险区。
- 视觉结构直接参考原型 `.settings-cover`（封面与两项照片操作并列）、表单区、`.settings-section > .settings-row` 和底部 `.danger-zone`；使用现有 `PageShell`、`PhotoPicker`、`PrimaryButton`、`TextAction` 和设计令牌重建，不复制 React DOM 或浏览器固定 px。
- 名称使用现有空间表单校验：去除首尾空白后不能为空，超出既有上限不得提交；失败时保留输入和当前封面。
- 不改封面时传 `{ kind: 'keep' }`；移除时传 `{ kind: 'remove' }`；更换时传 `{ kind: 'replace', photo: { uri } }`。
- 保存成功回到 12 页面稳定态，不跳回 04；资料变更在 Store 快照中立即可见，记忆/草稿/记忆照片不变。
- 保存中禁用重复提交；失败显示可重试提示，不清空名称或封面选择。
- 点击隐私入口只传 `source=settings`，不传空间名称、照片 URI 或完整空间对象。
- 危险区的范围文案使用真实可计算的数量或中性“当前空间中的记忆、草稿和关联照片”描述；不得把原型中的“2 段记忆、1 条草稿”写死到产品界面。

- [ ] 先写页面测试：预填名称与封面、名称保存传 `keep`、移除传 `remove`、替换传 `replace`、空名称不调用 Store、保存失败保留输入、重复点击只调用一次、隐私入口 URL 为 `source=settings`。
- [ ] 运行 `npm run test:run -- tests/components/space-settings-page.test.ts`，确认新增测试先失败。
- [ ] 按现有 `space-create`、`PageShell`、`PhotoPicker` 和 `ConfirmDialog` 模式实现 12，不创建新的表单或弹窗组件。
- [ ] 重新运行页面测试并执行 `npm run typecheck`，确认页面接口和事件类型通过。

### 3.3 接通 13 隐私返回

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/privacy/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/onboarding/index.vue`（仅在 source 白名单或返回行为需要时）
- Test: `apps/pet-memory-miniapp/tests/components/privacy-page.test.ts`
- Test: `apps/pet-memory-miniapp/tests/components/task9-journey.test.ts`

- [ ] 先写测试：01 → 13 → “我知道了”返回 01；12 → 13 → 返回 12；非法 source 不进入错误业务页，并提供安全返回。
- [ ] 运行 `npm run test:run -- tests/components/privacy-page.test.ts tests/components/task9-journey.test.ts`，确认新增 source 测试先失败。
- [ ] 让页面通过 `parsePrivacyRoute()` 保存来源，使用 `nav.back()` 或等价稳定适配器返回实际来源；不得复制第二个隐私页面。
- [ ] 保持原型 `PrivacyScreen` 的 reading-layout：标题/导语 → 四个有分隔线的说明区 → 随内容流动的“我知道了”；用现有 `PageShell` 和 tokens 实现，返回行为只按白名单来源分支处理。
- [ ] 重新运行上述测试，确认文案仍准确描述 M0：本地文字、会话照片、固定 Mock AI、不可恢复删除。

### 3.4 Task 9-A 中途收口门

Builder 必须提交 `docs/project/gpt-review-output/task9-evidence/phase-a-settings-privacy-report.md`，至少证明：

```text
04 → 12 → 修改名称/封面 → 保存 → 12 → 返回 04
01 → 13 → 我知道了 → 01
12 → 13 → 我知道了 → 12
空间资料变化不影响记忆、草稿和照片资产
```

中途门通过条件：Task 9-A 页面测试、路由测试、类型检查通过；12/13 在开发产物中可打开；没有删除操作误触、白屏、路由参数泄露或 P0/P1。中途门未通过时，只修复 A 阶段，不提前实现删除空间。

---

## 4. Task 9-B：单条记忆与空间删除（第二次收口）

### 4.1 Repository 与 Store 删除反证

**Files:**
- Modify: `apps/pet-memory-miniapp/tests/unit/local-memory-repository.test.ts`
- Modify: `apps/pet-memory-miniapp/tests/unit/memory-store.test.ts`
- Modify only if a test exposes a real contract defect: `apps/pet-memory-miniapp/src/repositories/local-memory-repository.ts`, `src/stores/memory.ts`

- [ ] 先写并运行单条记忆删除测试：删除记录、AI 候选稿和该记忆独占资产；其他记忆、空间封面、草稿和其他空间保持不变。
- [ ] 先写并运行空间级联测试：删除空间、其记忆、草稿、空间资产、记忆资产和草稿资产；另一个空间的实体和资产完整保留。
- [ ] 先写并运行错误测试：不存在 memory/space 删除失败，存储提交失败时原快照保持不变，Store 不更新本地数组。
- [ ] 运行 `npm run test:run -- tests/unit/local-memory-repository.test.ts tests/unit/memory-store.test.ts`，确认反证能够抓到范围错误或失败提交。
- [ ] 仅在测试失败且代码确实违反现有合同的情况下做最小修复；不得借机改 schema 或重新建数据层。
- [ ] 重新运行同一命令，确认删除成功、隔离和失败原子性全部通过。

### 4.2 09 单条记忆删除

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`
- Modify: `apps/pet-memory-miniapp/src/adapters/navigation.ts` only if the current stable destination types cannot represent the existing `spaces` / `space-home` / `memories` return results
- Test: `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`
- Test: `apps/pet-memory-miniapp/tests/components/task9-journey.test.ts`

**Required behavior:**

- 删除入口只出现在已找到的 09 详情页危险操作区域；缺参、加载中、已不存在状态不显示可误触的删除按钮。
- 保持 Task 8 已接受的日期、照片、原话和候选稿阅读层级；删除入口只在内容末端扩展原型 `.detail-actions` 的危险操作语义，不能为了加入删除而重排、遮挡或回退已有详情内容。
- 点击删除先打开 `ConfirmDialog`，明确说明“这段记忆、候选版本和这段记忆附带的照片”；取消不调用 Store，原话和页面内容保持不变。
- 确认后调用 `memStore.deleteMemory(memoryId)`；删除中禁止再次确认；失败保留页面和所有数据，提供重试。
- 删除成功后按真实来源返回：`space-home` / `new-memory` 回到 04；`memories` 回到 08；不得回到 05/06/07，也不得把 memoryId 或原话留在新 URL。
- 页面重新打开已删除 memoryId 时显示 `MissingContentState`，提供回到安全列表的出口，不白屏。

- [ ] 先写测试：取消确认、确认调用、双击防抖、删除失败保留、三种 source 的返回、已删除详情缺失态、删除后 Store 快照不含记忆和其资产。
- [ ] 运行 `npm run test:run -- tests/components/memory-detail-page.test.ts tests/components/task9-journey.test.ts`，确认新增测试先失败。
- [ ] 复用现有 `ConfirmDialog`、`MissingContentState` 和 NavigationAdapter 实现；不把确认逻辑下沉到 Repository。
- [ ] 重新运行页面测试、Task 9 journey 测试和 `npm run typecheck`。

### 4.3 12 删除整个空间

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/space-settings/index.vue`
- Test: `apps/pet-memory-miniapp/tests/components/space-settings-page.test.ts`
- Test: `apps/pet-memory-miniapp/tests/components/task9-journey.test.ts`

**Required behavior:**

- 删除区位于保存区之后，并与资料保存保持清晰间隔；不是页面主按钮，不使用连续天数、完成率或煽情压力文案。
- 点击删除先显示独立确认弹窗，范围必须列出：当前空间、该空间的全部记忆、草稿、空间照片、记忆照片和草稿照片；明确不可恢复；不把具体原话放进弹窗。
- 只有确认后调用 `memStore.deleteSpace(spaceId)`；删除中禁用确认和返回竞争操作。
- 删除成功使用 `nav.resetTo({ page: 'spaces' })` 清理失效页面栈并进入 02；不能回到已删除的 04/12/09/08。
- 删除失败停留在 12，保留名称/封面展示，提供再次确认/重试；不能显示成功状态或清空 Store。
- 空间已不存在时 12 显示可恢复缺失态；不得再次调用删除。

- [ ] 先写测试：未确认不删除、确认一次删除、范围文案完整、重复点击只调用一次、失败恢复、成功回到 02、成功后页面栈不再引用旧 spaceId。
- [ ] 运行 `npm run test:run -- tests/components/space-settings-page.test.ts tests/components/task9-journey.test.ts`，确认新增测试先失败。
- [ ] 实现空间删除状态机，复用现有确认组件和 Store action；不为删除创建新的 Repository 方法。
- [ ] 重新运行页面和旅程测试，确认成功/失败/缺失三类状态完整。

### 4.4 Task 9-B 第二次收口门

Builder 必须提交 `docs/project/gpt-review-output/task9-evidence/phase-b-deletion-report.md`，至少证明：

```text
04 → 08 → 09 → 取消删除：数据不变
04 → 09 → 确认删除：仅删除该记忆及其独占照片，返回 04
08 → 09 → 确认删除：仅删除该记忆及其独占照片，返回 08
12 → 隐私：返回 12
12 → 删除空间 → 确认：空间/记忆/草稿/关联资产全部删除，回到 02
删除另一个空间：不影响当前保留空间
```

第二次收口通过条件：Repository 反证、页面测试、Task 9 journey、类型检查通过；开发产物中 09/12 可打开；删除范围、隐私边界和返回栈没有 P0/P1。任何范围错误均阻断，不得以“后续优化”接受。

---

## 5. Task 9-C：最终总收口与证据

### 5.1 自动边界门

**Files:**
- Create/Modify: `apps/pet-memory-miniapp/scripts/verify-task9.mjs`
- Modify: `apps/pet-memory-miniapp/package.json`

`verify:task9` 必须实际检查：

- `pages.json` 注册 `space-settings`，且 12/13/09 页面均为 custom navigation；
- 12、09、13 的页面文件存在；
- 删除入口只出现在批准的设置/详情页面；列表、首次说明和隐私页面不出现删除按钮；
- 生产边界没有真实 AI SDK、网络调用、密钥、用户原话、照片 URI 或 DevPanel 残留；
- 页面没有直接导入 Storage、Repository 或原始导航 API；
- `parsePrivacyRoute`、`parseSpaceSettingsRoute` 与现有 memory source 白名单存在并被使用；
- 失败/确认/删除后的恢复测试文件已纳入 Task 9 门。

- [ ] 先写脚本测试或可执行 fixture，故意制造缺页、错误注册和删除入口残留，确认脚本会失败。
- [ ] 运行 `node scripts/verify-task9.mjs`，确认测试样本先失败。
- [ ] 实现最小扫描逻辑，输出逐项 `PASS/FAIL`，任何一项失败都以非零退出码结束。
- [ ] 将 `verify:task9` 接入 `package.json`，顺序固定为全量测试 → typecheck → production build → boundary scan。
- [ ] 运行 `npm run verify:task9`，确认真实工程产物和边界扫描通过。

### 5.2 全量回归与视觉/微信证据

**Files:**
- Create: `docs/project/gpt-review-output/task9-evidence/README.md`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/2026-08-04-task-9-builder-self-verification.md`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/phase-a-settings-privacy-report.md`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/phase-b-deletion-report.md`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/actual/12-space-settings.png`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/actual/13-privacy-from-settings.png`
- Create during execution: `docs/project/gpt-review-output/task9-evidence/actual/09-memory-detail-delete.png`

- [ ] 运行 `npm run test:run`，记录完整测试文件数和通过数。
- [ ] 运行 `npm run typecheck`，记录零错误结果。
- [ ] 运行 `npm run build:mp-weixin`，确认 `dist/build/mp-weixin` 生成 12/13/09 相关产物，且无 DevPanel 残留。
- [ ] 运行 `npm run verify:task5a`、`npm run verify:task5b`、`npm run verify:task8`，确认 Task 5A/5B/8 没有回归。
- [ ] 按现有微信开发者工具路径验证 04→12、01/12→13、04/08→09、12→02 删除后路径；若工具或权限不可用，报告写明外部阻碍，不伪造截图通过。
- [ ] 用户手动截图统一放入 `docs/project/gpt-review-output/task9-evidence/actual/`；标准页面命名保持 `12-space-settings.png`、`13-privacy-from-settings.png`、`09-memory-detail-delete.png`，高风险状态另加清晰状态后缀。
- [ ] 视觉复核以 `docs/product/assets/m0-page-baselines/09-memory-detail.png`、`12-space-settings.png`、`13-privacy.png` 为基准，只比较受影响的 09/12/13 和共享组件波及页面；重点复核详情底部操作区、设置封面/表单/危险区、隐私四段阅读区。不得修改基准图或遮罩规则来隐藏偏差。

### 5.3 最终完成定义

Task 9 只有满足全部条件才可标记为 `reviewer-accepted`：

1. 12 可以编辑名称、保留/移除/替换封面，保存失败可恢复，且不影响记忆/草稿/资产；
2. 01→13→01、12→13→12 返回来源准确，非法 source 有安全出口；
3. 09 单条删除有明确确认范围，取消/失败/重复点击均安全，成功后按 source 返回 04 或 08；
4. 12 删除空间有独立危险区和完整范围说明，确认后级联清理并回到 02；
5. 单条删除和空间删除均有跨空间隔离反证，失败提交不改变快照；
6. 已删除实体、缺参和非法参数均显示可恢复状态，不白屏；
7. 用户内容、照片 URI 和资产归属不进入路由、日志、错误文案或证据截图；
8. Task 5A、Task 5B、Task 8 回归通过，Task 8 的既有 P3 被如实保留；
9. 全量测试、类型检查、生产构建和 `verify:task9` 通过；
10. Builder 提交 self-verification，Logic Reviewer 独立复核删除范围/调用链，视觉负责人独立复核 09/12/13，用户完成最终路径验收；
11. 未把 M0 描述为真实云端能力，未新增未经确认的生产依赖或产品范围。

---

## 6. 风险与明确处理

| 风险 | 处理方式 |
|---|---|
| `space-settings` 在 URL map 中已有但页面未注册 | Task 9-A 先补页面注册和失败测试，避免先让用户进入白屏路由 |
| 详情页删除后返回旧记录页或记录流程 | 详情页保留白名单 source；删除成功按 source 使用稳定返回策略，不依赖盲目 `navigateBack` |
| 删除空间遗漏草稿或照片资产 | Repository 反证同时建立记忆、草稿、空间封面和多空间 fixture，并验证保留空间完整不变 |
| 保存/删除失败后 Store 假成功 | Store 测试要求 Repository reject 后数组和页面内容都保持原快照 |
| 危险操作视觉上过于突出造成压力 | 复用现有设计令牌，危险区置底、单独间隔、明确范围，不用夸张颜色或煽情文案 |
| 微信开发者工具无法自动截图 | 记录能力探测结果；用户只补最终受影响页面截图，不能把未验证写成 passed |

本计划完成后，Task 9 的产品闭环为：资料可以被温和地修改，隐私说明从哪里来就回哪里去，删除前知道范围，删除后不会留下失效页面和孤立资产。 
