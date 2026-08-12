# Task 6 记录入口、文字记录、单草稿与正式原话实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. 本计划采用一次性大收口，不设置 Phase A/B/C 小收口；Builder 完成全部范围后统一提交自证材料，Logic Reviewer 与视觉负责人一次性验收。

**Goal:** 将空间首页的“留下一段”移植为可真实使用的文字记录闭环：记录入口 → 单个首问 → 输入原话 → 保存草稿或正式记忆 → 只读记忆详情 → 返回空间首页。

**Architecture:** 视觉结构直接移植浏览器原型的 `RecordEntryScreen`、`RecordTextScreen`、`MemoryDetailScreen` 与对应 CSS 关系；业务状态继续由 Vue 页面持有，数据写入只经过 Pinia `memory` Store 和 `MemoryRepository`。Task 6 创建一个真实的只读 09 详情落点，Task 8 在同一页面上继续增加编辑、删除与 Mock AI，不创建临时占位页。

**Tech Stack:** uni-app、Vue 3、TypeScript、Pinia、微信小程序、Vitest、现有 `MemoryRepository` / `NavigationAdapter` / 设计令牌。

## Global Constraints

- 当前阶段固定为 `M0` 本地 Mock；不接入 CloudBase、真实 AI、微信登录或云端照片存储。
- 浏览器原型是视觉标准：`apps/pet-memory-design-prototype/src/Prototype.tsx` 与 `prototype.css`；原型事件实现不能直接复制到 Vue，也不能把浏览器 CSS 原样复制到 WXSS。
- 正式业务合同优先于原型交互：页面不得直接访问 storage、Repository、`uni.chooseMedia` 或原始 `uni.navigate*`。
- 路由只传白名单参数和稳定 ID，不传原话、完整空间对象、照片对象或快照。
- 一次记录只保留一段原话，只展示一个首问，不自动追问，不自动生成内容。
- 原话永远优先；草稿和保存失败不得覆盖或丢失用户当前输入。
- Task 6 只完成纯文字记录。照片选择、照片记录、文字加图和 session-only 照片状态留给 Task 7；不得复制原型中尚未进入本 Task 的照片按钮行为。
- 微信组件 WXSS 只能使用允许的 class 选择器；不得使用 tag、ID、attribute、通配或 `:root` 选择器。
- 不新增 UI 组件库、状态管理库、云服务 SDK 或生产运行时依赖。
- 不创建 05、06、07、08、09 以外的未来页面；本计划中的 09 是真实只读详情页面，不是空壳占位页。

---

## 1. 视觉与业务真源

Builder 开始施工前必须同时打开以下文件，并在报告中写明实际读取过的区段：

### 1.1 浏览器原型

- `apps/pet-memory-design-prototype/src/Prototype.tsx`
  - `SpaceHomeScreen`
  - `RecordEntryScreen`
  - `RecordTextScreen`
  - `MemoryDetailScreen`
- `apps/pet-memory-design-prototype/src/prototype.css`
  - `.entry-list`
  - `.entry-card`
  - `.prompt-block`
  - `.editor-panel`
  - `.editor-help-row`
  - `.page-actions--bottom`
  - `.detail-date`
  - `.original-memory`

### 1.2 微信现有实现

- `apps/pet-memory-miniapp/src/pages/space-home/index.vue`
- `apps/pet-memory-miniapp/src/components/PageShell.vue`
- `apps/pet-memory-miniapp/src/components/PrimaryButton.vue`
- `apps/pet-memory-miniapp/src/components/TextAction.vue`
- `apps/pet-memory-miniapp/src/components/DraftNotice.vue`
- `apps/pet-memory-miniapp/src/components/MemoryList.vue`
- `apps/pet-memory-miniapp/src/types/domain.ts`
- `apps/pet-memory-miniapp/src/types/repository.ts`
- `apps/pet-memory-miniapp/src/stores/memory.ts`
- `apps/pet-memory-miniapp/src/repositories/local-memory-repository.ts`
- `apps/pet-memory-miniapp/src/adapters/navigation.ts`

### 1.3 已确认的业务合同

- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md` 的 Task 6 与 Task 8 相关段落；
- `docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md`；
- `docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md`；
- `docs/project/acceptance/2026-07-28-task-5b-onboarding-space-creation-acceptance-standard.md` 的工程与状态边界。

### 1.4 原型到小程序映射

| 浏览器原型 | 微信小程序目标 | 移植要求 |
|---|---|---|
| `SpaceHomeScreen` 主操作 | `pages/space-home/index.vue` | 保留现有 PageShell、Store、Repository 边界，只接通真实导航 |
| `RecordEntryScreen` | `pages/record-entry/index.vue` | 保留标题、说明、平面入口列表、返回操作和低强调退出 |
| `RecordTextScreen` | `pages/record-text/index.vue` | 保留首问、编辑区、帮助操作、主操作和底部次操作比例 |
| `MemoryDetailScreen` | `pages/memory-detail/index.vue` | Task 6 只实现原话、日期、可用照片展示和返回 04；编辑/AI/删除留给 Task 8 |
| 原型 `navigate(...)` | `NavigationAdapter` | 只传 `spaceId`、`memoryId`、`entry`、`source` 等白名单参数 |
| 原型 `useState` | 页面 `ref` / `computed` | 页面临时输入与面板状态不进入 Store |

---

## 2. 文件施工地图

### 2.1 创建

- `apps/pet-memory-miniapp/src/pages/record-entry/index.vue`
- `apps/pet-memory-miniapp/src/pages/record-text/index.vue`
- `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`
- `apps/pet-memory-miniapp/src/features/recording/entry-prompts.ts`
- `apps/pet-memory-miniapp/src/features/recording/draft-exit.ts`
- `apps/pet-memory-miniapp/tests/unit/entry-prompts.test.ts`
- `apps/pet-memory-miniapp/tests/unit/draft-exit.test.ts`
- `apps/pet-memory-miniapp/tests/components/record-entry-page.test.ts`
- `apps/pet-memory-miniapp/tests/components/record-text-page.test.ts`
- `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`

### 2.2 修改

- `apps/pet-memory-miniapp/src/pages.json`：注册 `record-entry`、`record-text`、`memory-detail`，全部使用 `navigationStyle: custom`；
- `apps/pet-memory-miniapp/src/adapters/navigation.ts`：补齐 `record-text` 路径与需要的稳定目标；
- `apps/pet-memory-miniapp/src/features/routing/route-params.ts`：增加记录入口、文字记录、记忆详情的白名单参数解析；
- `apps/pet-memory-miniapp/src/pages/space-home/index.vue`：接通“留下一段”、草稿继续写和新建记录入口；
- `apps/pet-memory-miniapp/src/stores/memory.ts`：让 `saveMemory()` 返回新建的 `MemoryItem`，让 `saveDraft()` 返回写入的 `MemoryDraft`，保持 Store 先等待 Repository 成功再提交快照；
- `apps/pet-memory-miniapp/tests/components/space-home-page.test.ts`：改为验证真实记录入口与草稿恢复合同；
- `apps/pet-memory-miniapp/tests/unit/memory-store.test.ts`：补充保存结果返回值与失败不提交断言。

### 2.3 明确不修改

- 不修改 `LocalMemoryRepository` 的数据模型和事务语义，除非现有测试证明 Task 6 合同无法成立；
- 不创建第二套 Draft、Memory 或 Navigation Store；
- 不提前创建 `memory-edit`、`ai-draft`、`record-photo` 页面；
- 不修改 Task 5A 页面视觉，只做记录入口接线和必要回归修正；
- 不把浏览器原型中的照片按钮、AI 按钮和编辑按钮带入 Task 6。

---

## 3. 业务合同与状态矩阵

### 3.1 入口与首问

```ts
export type TextEntry = Exclude<TextRecordEntry, 'photo'>

export const TEXT_ENTRY_PROMPTS: Record<TextEntry, string> = {
  daily: 'Ta 平时最喜欢待在哪个地方？',
  meeting: '还记得第一次见到 Ta 时，Ta 是什么样子吗？',
  relationship: '如果用一句话形容你和 Ta 的关系，会是什么？',
}
```

实现要求：

- `daily`、`meeting`、`relationship` 进入同一个 `record-text` 页面；
- `entry` 只作为白名单 query 参数传递；
- 首问只由 `entry-prompts.ts` 提供，页面不得复制三份文案；
- 当前 Task 6 不实现照片入口的业务动作，不能导航到不存在的页面或伪造照片成功状态。

### 3.2 文字页状态

| 状态 | 页面行为 | 可用操作 |
|---|---|---|
| `empty` | 显示首问和空编辑区 | 返回、打开“想不起来”、输入 |
| `dirty` | 保留用户原话 | 返回保护、保存草稿、保存原话 |
| `over-limit` | 显示中性超限提示，不截断原话 | 修改输入、返回 |
| `saving-draft` | 锁定重复提交，显示准备中 | 无二次提交 |
| `saving-memory` | 锁定重复提交，显示保存中 | 无二次提交 |
| `save-error` | 保留输入、入口和当前草稿引用 | 重试、返回保护 |
| `writing-assist` | 点击后直接切换输入框里的写作提示，不改输入 | 重复点击循环切换提示 |
| `return-protection` | 提供保存草稿、继续填写、放弃 | 三选一，不能叠加第二层确认 |

### 3.3 草稿合同

- 脏状态定义为：文字非空；Task 6 不含照片脏状态；
- 保存草稿调用 `memoryStore.saveDraft()`，写入 `spaceId`、`entry`、当前 `text`、空资产数组；
- 保存草稿成功后回到 04，04 立即通过 Store 显示 `DraftNotice`；
- 保存草稿失败时保留输入并显示可重试错误；
- 04 已存在草稿时点击“留下一段”必须先显示：继续写这段 / 不保留这段，另起一段 / 先不动；
- 继续写使用现有草稿的 `draftId`、`entry`、`text`；
- 不保留这段，另起一段调用 `memoryStore.deleteDraft()`，成功后才进入空白记录；
- 先不动停留 04，不修改 Store；
- 同一空间最多一个草稿，沿用 Repository 已有 upsert 和校验合同。

### 3.4 正式保存合同

```text
输入有效原话
→ memoryStore.saveMemory({
    spaceId,
    entry,
    originalText,
    assets: [],
    sourceDraftId,
  })
→ Repository 单次快照提交
→ Store 提交完整快照
→ 返回新建 MemoryItem
→ resetTo({ page: 'memory-detail', memoryId })
```

- `originalText.trim()` 为空时不得保存；
- 技术上最多 2,000 字，超过后不得静默截断；
- `sourceDraftId` 有值时，Repository 同一快照内创建记忆并删除来源草稿；
- 保存失败时正式记忆、草稿、输入和入口全部保持不变；
- 详情页只读展示原话和日期，返回稳定落点为 `04 → 02`（空间首页 → 空间列表）；
- 09 的编辑、AI、删除操作本轮不显示，Task 8 在同一详情页上追加。

---

## 4. 实施顺序（单次大收口，不设置中间放行门）

Builder 可以按以下顺序施工，但不需要每项单独提交小收口；所有步骤完成后统一验证。

### 4.1 建立失败测试与纯函数合同

先新增测试，覆盖：

```ts
TEXT_ENTRY_PROMPTS 为三个文字入口提供稳定首问
非法 entry 不生成可用页面状态
draft-exit 三选一结果互斥
empty / whitespace 不属于 dirty
dirty 文本属于 return-protection
```

运行：

```powershell
npm run test:run -- tests/unit/entry-prompts.test.ts tests/unit/draft-exit.test.ts
```

测试必须先因实现缺失或合同不完整而失败，再实现最小纯函数。

### 4.2 接通 Store 返回值与路由白名单

实现：

- `saveMemory()` 返回 `MemoryItem`；
- `saveDraft()` 返回 `MemoryDraft`；
- 失败时不调用 `_commitSnapshot()`；
- 增加 `record-entry`、`record-text`、`memory-detail` 参数解析；
- 对 `entry`、`spaceId`、`memoryId` 做白名单和稳定 ID 校验；
- 不把完整内容放入 URL。

必须新增或修改 Store / routing 测试，证明返回值来自 Repository 提交结果，而不是页面猜测最新数组项。

### 4.3 移植记录入口页

以原型 `RecordEntryScreen` 为视觉标准实现：

- PageShell 自定义导航，返回 04；
- 标题：`今天想从哪里开始？`；
- 说明：`不用全部完成。选一个此刻比较容易靠近的方向就好。`；
- 入口采用平面列表、细分隔线、左侧标题/说明、右侧进入指示；
- `daily`、`meeting`、`relationship` 进入文字页；
- 不显示完成率、连续天数或压力性提示；
- 底部保留低强调 `这次先看看`，返回 04；
- 不复制原型中的照片页面和照片操作。

组件测试必须触发真实点击事件并断言完整 URL：`spaceId` 和 `entry` 只来自白名单。

### 4.4 移植文字输入页

以原型 `RecordTextScreen` 为视觉标准实现：

- PageShell 标题为 `留下一段`，返回记录入口；
- 显示 `一个小问题` eyebrow 与对应首问；
- 使用微信 `textarea`，保留原型编辑区的留白、边框、圆角和表面层级；
- 默认 placeholder 使用 `想到什么，就写下什么……`；点击帮助操作后直接切换具体写作提示，并聚焦输入框；
- 不显示常驻字数统计；
- 超过 2,000 字只显示中性提示；
- 当前 Task 6 不显示 `加一张照片`；
- `有点想不起来` 不打开二次面板，直接在输入框中显示写作提示；
- 主操作为 `留下这段原话`；
- 次操作为 `先留在草稿里`；
- 保存中锁定按钮，防止连续点击；
- Repository 失败时保留输入并显示重试。

组件测试必须覆盖 `daily`、`meeting`、`relationship` 三个首问和以下状态：空文本、正常文本、超限、保存中、保存失败、重试成功。

### 4.5 实现“想不起来”写作提示

帮助操作直接提供低压力、可立即执行的写作提示：

- Ta 当时在哪里？
- 你先注意到了谁？
- 那一刻最先发生了什么？

实现要求：

- 不自动填写输入框；
- 不调用 Mock AI；
- 不生成候选稿；
- 不改变当前首问和已有原话；
- 每次点击直接切换到下一条提示，循环显示；
- 用户开始输入后恢复默认 placeholder；
- 键盘打开时提示和底部操作不能被遮挡。

### 4.6 实现草稿退出与恢复

统一使用 `draft-exit.ts` 的结果类型，页面不得各自发明三选一逻辑。

覆盖：

```text
空页面返回 → 直接返回
有文字返回 → 保存草稿 / 继续填写 / 放弃
已有草稿进入 → 继续写这段 / 另起一段 / 先不动
保存草稿失败 → 留在当前页，输入不丢失
放弃草稿失败 → 不导航，错误可重试
```

### 4.7 创建只读 09 详情落点

以原型 `MemoryDetailScreen` 的结构为标准，但严格收缩本轮范围：

- PageShell 返回 04；
- 显示创建日期；
- 显示明确的 `你留下的话` 标识；
- 显示 `originalText` 原话；
- 若有可用 bundled 资产，保留现有图片展示能力；本 Task 文字保存使用空资产；
- 不显示编辑、删除、AI 整理按钮；
- 非法 `memoryId` 显示 MissingContentState，并提供返回 04；
- 不从路由接收原话。

详情页测试覆盖：合法 ID、非法 ID、非当前空间 ID、原话优先、返回事件。

### 4.8 接通 04 与全链路

修改 `space-home/index.vue`：

- 无草稿时“留下一段”进入 `record-entry`；
- 有草稿时先进入恢复选择，不直接覆盖草稿；
- 草稿继续写使用草稿入口与文本；
- 04 最近记忆列表能显示新保存记忆的摘要；
- 不在页面直接调用 Repository；
- 不改变 Task 5A 已验收的空间、导航和视觉合同。

### 4.9 统一构建与清理

- 生产构建不包含 DevPanel；
- 开发构建和生产构建均注册新增页面；
- 新增 WXSS 通过现有兼容性扫描；
- `dist/dev/mp-weixin` 和 `dist/build/mp-weixin` 都包含 04、record-entry、record-text、memory-detail 所需产物；
- 不修改或删除用户现有未提交改动。

---

## 5. 自动化验证

Builder 完成全部实现后一次性运行：

```powershell
npm run test:run -- tests/unit/entry-prompts.test.ts tests/unit/draft-exit.test.ts tests/unit/memory-store.test.ts tests/unit/route-params.test.ts tests/components/record-entry-page.test.ts tests/components/record-text-page.test.ts tests/components/memory-detail-page.test.ts tests/components/space-home-page.test.ts
npm run test:run
npm run typecheck
npm run build:mp-weixin
npm run verify:task5a
```

必须满足：

- 定向测试通过；
- 全量测试通过；
- 类型检查退出码为 0；
- 生产构建退出码为 0；
- Task 5A 回归退出码为 0；
- `dist/build/mp-weixin` 无 DevPanel 残留；
- 生产构建页面 JS/WXML/JSON 不含无效组件引用；
- 无新增生产依赖。

若全量测试中出现既有负向夹具的预期错误输出，只以测试进程退出码和失败数量判断，不得把预期负向日志当成构建失败隐藏。

---

## 6. 微信开发者工具一次性大收口路径

使用最新的：

```text
apps/pet-memory-miniapp/dist/build/mp-weixin
```

标准视口优先使用 393×852。一次性完成以下路径，不拆成阶段放行：

### 6.1 主成功路径

```text
完整样本 → 04 团团首页
→ 留下一段
→ 日常
→ 输入原话
→ 保存
→ 09 只读详情
→ 返回 04
→ 最近留下出现新摘要
```

### 6.2 三个文字首问

```text
日常       → Ta 平时最喜欢待在哪个地方？
相遇       → 还记得第一次见到 Ta 时，Ta 是什么样子吗？
你们的关系 → 如果用一句话形容你和 Ta 的关系，会是什么？
```

### 6.3 草稿路径

```text
输入文字 → 返回 → 保存为草稿 → 回到 04
→ 继续写这段 → 输入保留 → 保存正式记忆 → 09
```

另测：

```text
已有草稿 → 另起一段 → 旧草稿删除 → 新记录为空
已有草稿 → 先不动 → 仍停留 04 且草稿不变
```

### 6.4 失败与保护路径

- 空文本不能保存；
- 连续点击保存只产生一次 Repository 写入；
- 保存失败后输入仍在，重试成功；
- 草稿保存失败后输入仍在；
- 退出时选择继续填写不导航；
- 退出时选择放弃后回到 04，且没有产生草稿；
- 键盘打开时主操作和退出操作仍可触达；
- 系统返回与 PageShell 返回行为一致；
- 非法 `spaceId` / `memoryId` 不泄露内容。

### 6.5 视觉检查

对照浏览器原型检查：

- 入口列表不是厚重卡片堆叠；
- 首问、编辑区和底部操作的留白关系一致；
- 主操作与次操作层级一致；
- 文字页没有照片按钮或 AI 按钮；
- 详情页优先呈现原话，不用候选稿替代；
- 只有一个自定义导航，不与微信原生导航重复；
- 胶囊、安全区和键盘不遮挡内容；
- 微信按钮默认边框没有泄漏；
- 页面在 loading、error、empty、dirty、saving 状态下仍保持可读。

---

## 7. Builder 交付物

Builder 只能报告 `self-verified`，并提交：

1. 修改文件清单及每个文件职责；
2. 定向测试、全量测试、类型检查、构建和 Task 5A 回归的真实命令输出；
3. 微信开发者工具 393×852 截图：
   - `docs/project/gpt-review-output/task6-evidence/record-entry.png`
   - `docs/project/gpt-review-output/task6-evidence/record-text.png`
   - `docs/project/gpt-review-output/task6-evidence/memory-detail.png`
4. `docs/project/gpt-review-output/task6-evidence/report.md`；
5. 主成功路径、草稿路径、失败路径、退出保护路径的实际结果；
6. 与浏览器原型的差异清单，区分“平台适配差异”和“实现偏差”；
7. 未验证项与风险，尤其是微信键盘、系统返回和真机相册边界；
8. 不得把 `visual-accepted` 或 `reviewer-accepted` 写入 Builder 报告。

---

## 8. Logic Reviewer 与视觉负责人收口规则

本轮不采用“小收口通过后继续”的流程，而是一次大收口：

- 自动化失败、核心路由错误、数据写入不一致、原话丢失、页面白屏、生产构建失败：`FAIL`，整轮退回；
- 低风险间距、颜色、字号或非核心文案偏差：记录为 `P2/P3`，不阻断 Task 6 主路径，但必须进入后续修正清单；
- 浏览器原型与微信平台的必要差异：记录原因，不按像素机械复制；
- 任何未实现的照片、AI、编辑或删除能力不得伪装成已完成；
- Reviewer 必须实际触发保存失败、重复点击、草稿恢复和非法路由，不能只搜索字符串；
- 视觉负责人对照原型源码和微信截图，确认页面仍属于同一个产品，而不是只确认节点存在。

---

## 9. 完成定义

Task 6 只有在以下条件全部满足后才可标记为 `reviewer-accepted`：

1. 04 → 记录入口 → 文字输入 → 正式保存 → 09 → 04 主路径在微信开发者工具真实走通；
2. 三个文字首问与原型文案映射正确；
3. 草稿保存、恢复、另起一段、放弃和失败恢复真实走通；
4. 保存失败不产生部分记忆、不删除来源草稿、不丢失输入；
5. 原话保留且详情页优先显示原话；
6. 09 是真实只读页面，不是未来功能占位页；
7. Task 5A 回归通过；
8. 全量测试、类型检查、生产构建通过；
9. 生产构建不含 DevPanel 和无效页面引用；
10. 浏览器原型到 Vue/WXSS 的映射可追溯；
11. 三张实现截图和收口报告齐全；
12. Builder 只报告 `self-verified`，Logic Reviewer 与视觉负责人分别完成独立验收；
13. Task 7 的照片能力、Task 8 的编辑/AI 能力仍保持清晰边界；
14. 状态文档只记录真实证据，不提前更新 M0 总体完成状态。

Task 6 通过后，才进入 Task 7 的会话照片与照片记录计划；不得因为 09 已存在就提前实现 Task 8 的编辑、删除或 AI 候选稿。
