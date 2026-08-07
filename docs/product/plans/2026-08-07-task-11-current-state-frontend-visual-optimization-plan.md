# Task 11 M0 当前状态前端视觉优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变 M0 当前业务状态、数据、路由或交互结果的前提下，使 13 个微信小程序页面的现有状态更贴近已确认浏览器原型的视觉语言与布局层级。

**Architecture:** 当前 `wechat-393x852/` 中的 13 张截图是本轮页面内容和状态的唯一事实来源；`m0-page-baselines/` 与浏览器原型只约束视觉语言、组件几何、排版层级和材质，不要求把页面强制改造成资产图中的样例数据状态。优先修复共享展示组件，再按页面批次完成局部布局；页面继续经由现有 Pinia Store、Repository、路由和服务层工作，本轮不得改动这些边界。

**Tech Stack:** uni-app、Vue 3、TypeScript、SCSS、Vitest、微信小程序构建。

**执行状态（2026-08-07）：** 展示层代码与自动化验证已完成，见 `docs/project/gpt-review-output/task10-evidence/2026-08-07-task-11-frontend-visual-optimization-report.md`。`PageShell` 与 `TextAction` 经审阅后保持不变：前者的安全区/键盘布局已满足本轮页面装配，后者的 88rpx 触控热区不应为视觉紧凑而缩小。实施后 13 页微信开发者工具截图和实机检查仍为待验收项，不得以修改前截图替代。

## Global Constraints

- 当前阶段仍为 `M0`；本计划不引入 CloudBase、真实 AI、生产依赖或新的 UI 库。
- 仅修改页面模板、页面样式、共享展示组件及视觉测试；不得修改 `stores/`、`repositories/`、`services/`、`adapters/`、`fixtures/`、`features/`、路由契约或业务状态转换。
- 不改变当前截图中的记录文本、日期、照片有无、AI 所处状态、列表数据或页面流程；入口排序和重要文案如需改变，另行提出产品确认，不夹带进本计划。
- `docs/project/gpt-review-output/task10-evidence/visual/wechat-393x852/` 是当前状态截图目录；`docs/product/assets/m0-page-baselines/` 是视觉参考目录。微信胶囊、状态栏与设备边框是平台壳层，不要求复刻到资产图。
- `04-space-home.png` 是空间首页唯一视觉母版，保留现有 `DraftNotice` 资产方案，不在运行时用 CSS 重造纸纤维、撕边或胶带。
- 截图中的 `DEV` 开关属于开发环境辅助层，不视为产品页面的一部分；正式视觉验收使用生产构建或关闭开发辅助层后的内容区截图。
- 不创建 Git 分支、提交、PR 或 worktree；当前工作区包含尚未提交的 Task 10 证据，必须保留并绕开无关改动。

## 1. 视觉验收模式与页面清单

每页都按以下两种模式之一验收：

| 编号 | 当前状态模式 | 本轮视觉目标 |
| --- | --- | --- |
| 01 | 首次进入 | 左对齐信息层级、全宽主按钮、安静的隐私提示 |
| 02 | 完整空间列表 | 紧凑的空间条目、清晰创建入口、统一缩略图与文字层级 |
| 03 | 空创建表单 | 不伪造已选照片；优化空照片、姓名字段、底部提交区 |
| 04 | 有草稿与两条记忆 | 保留当前数据；以母版修正导航、身份区、草稿和最近记录装配 |
| 05 | 四个记录入口 | 保留当前入口数据和顺序；修正标题、说明、条目密度与操作层级 |
| 06 | 空文字输入 | 不填入示例原话；修正问题区、编辑器内照片入口和保存区 |
| 07 | 空照片输入 | 不预置照片；将空态、会话说明和底部行动做成与照片态同一语言 |
| 08 | 两条记忆且第二条无缩略图 | 保留数据；让有图和无图条目均保持稳定对齐和节奏 |
| 09 | 含照片、原话、AI 邀请与候选稿 | 降低卡片堆叠感，恢复阅读页层级与底部危险操作可见性 |
| 10 | 已载入短原话 | 增加编辑器有效高度，恢复全宽保存操作与紧凑底部节奏 |
| 11 | AI 授权前 | 不强制切到成功候选稿；优化授权范围说明、原话引用和行动层级 |
| 12 | 完整空间资料 | 调整照片编辑区、资料表单、隐私行与危险区层级 |
| 13 | 隐私说明 | 收紧阅读密度，并使用浅色 quiet 确认按钮 |

## 2. 文件施工地图

### 2.1 共享展示层

- Modify: `apps/pet-memory-miniapp/src/components/PrimaryButton.vue`：增加不改变点击语义的 `quiet` 外观变体；保留既有 `primary`、`danger`、loading 与 disabled 行为。
- Modify: `apps/pet-memory-miniapp/src/components/PageShell.vue`：仅调整展示性间距、任务表单操作区的伸展布局与阅读页节奏；不改安全区、导航计算或 slot 调用顺序。
- Modify: `apps/pet-memory-miniapp/src/components/MemoryEntry.vue`：让无缩略图条目保留与有缩略图条目一致的文字列对齐规则，不构造虚假图片。
- Modify: `apps/pet-memory-miniapp/src/components/TextAction.vue`：只收紧默认文字操作的视觉尺寸，不降低既有 `88rpx` 触控热区。
- Test: `apps/pet-memory-miniapp/tests/components/content-components.test.ts`、`apps/pet-memory-miniapp/tests/components/PageShell.test.ts` 与新增的 `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`。

### 2.2 页面装配层

- Modify: `src/pages/onboarding/index.vue`、`src/pages/spaces/index.vue`、`src/pages/space-create/index.vue`。
- Modify: `src/pages/record-entry/index.vue`、`src/pages/record-text/index.vue`、`src/pages/record-photo/index.vue`。
- Modify: `src/pages/space-home/index.vue`、`src/pages/memories/index.vue`、`src/pages/memory-detail/index.vue`。
- Modify: `src/pages/memory-edit/index.vue`、`src/pages/ai-draft/index.vue`、`src/pages/space-settings/index.vue`、`src/pages/privacy/index.vue`。
- Modify: `docs/README.md`：把 Task 11 的范围、视觉状态和证据目录更新为真实状态。

### 2.3 不在本计划内

- 不修改 `completeSnapshot`、`emptySnapshot`、资产 URI、日期、记录正文或照片附着关系。
- 不修改 `features/recording/entry-prompts.ts` 的入口排序和文案。
- 不修改任何路由参数、导航返回栈、保存/删除/AI/相册权限逻辑。
- 不新增截图素材、图标库、第三方组件库或运行时依赖。

## 3. 实施任务

### Task 11.1：建立前端视觉合同测试与共享按钮变体

**Files:**
- Create: `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`
- Modify: `apps/pet-memory-miniapp/src/components/PrimaryButton.vue`
- Modify: `apps/pet-memory-miniapp/src/components/TextAction.vue`

**Interfaces:**
- Extends `PrimaryButtonVariant` with `'quiet'`; existing callers remain valid.
- Keeps `PrimaryButton` emitting only `press` and `TextAction` emitting only `press`.

- [ ] Write a failing component test proving `variant="quiet"` renders `primary-button--quiet` and still emits `press`.
- [ ] Run only the new test and confirm it fails because `quiet` is not in the current prop union/style contract.
- [ ] Add the smallest `quiet` variant: olive text, `$pm-color-olive-soft` background, no new dependency, no change to disabled/loading semantics.
- [ ] Write a failing source-level visual contract test requiring form-page action wrappers to expose full-width primary button styling without changing the component's semantic `width="content"` API.
- [ ] Add display-only wrapper rules for full-width primary actions; keep `content` width only where the current-state screenshot intentionally uses a compact secondary action.
- [ ] Run the focused tests and confirm they pass.

### Task 11.2：修正共享页面节奏与记忆列表的无图展示

**Files:**
- Modify: `apps/pet-memory-miniapp/src/components/PageShell.vue`
- Modify: `apps/pet-memory-miniapp/src/components/MemoryEntry.vue`
- Modify: `apps/pet-memory-miniapp/tests/components/PageShell.test.ts`
- Modify: `apps/pet-memory-miniapp/tests/components/content-components.test.ts`

**Interfaces:**
- `PageShellProps` and emits remain unchanged.
- `MemoryEntryViewModel` remains unchanged; missing `thumbnailUri` is rendered as a no-photo layout, not an invented asset.

- [ ] Write a failing test that a missing thumbnail receives the no-photo presentation class while preserving summary, date and `select` emission.
- [ ] Run the focused component test and confirm the expected failure.
- [ ] Add a semantic no-photo modifier and compact text-column rules so 08's second row does not look like a broken card.
- [ ] Write a failing PageShell test covering a full-width task-form action wrapper class and unchanged keyboard flex-space behavior.
- [ ] Make only spacing/alignment changes to PageShell styles; retain safety-area calculation, native page scroll and slot order.
- [ ] Run the focused PageShell and content-component tests.

### Task 11.3：完成首次说明、空间列表与空创建页的视觉迁移

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/onboarding/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/spaces/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/space-create/index.vue`
- Modify: `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`

**Interfaces:**
- Keep onboarding completion, space navigation, photo picker and creation validation unchanged.
- Do not prefill the create-space page or introduce baseline-only photos.

- [ ] Write failing source contract tests for: 01 mark before title content; 01 primary action stretches; 03 has an explicit field label and a visual secondary leave action that reuses existing back behavior.
- [ ] Run the test file and confirm the page contracts fail.
- [ ] Recompose 01 within existing slots so the mark, eyebrow, title and body are left aligned in the reference order; retain its existing copy and privacy navigation.
- [ ] Tighten 02 list row rhythm, create affordance and text hierarchy without changing space summaries or list order.
- [ ] Rebuild 03's empty-state presentation as a left-aligned form: compact empty photo tile, explicit name label, helper copy, full-width create action and visual secondary exit action wired to the existing back handler.
- [ ] Run the page-contract tests and the existing Task 5B component/page tests.

### Task 11.4：完成记录入口、空文字记录与空照片记录的视觉迁移

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/record-entry/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/record-text/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/record-photo/index.vue`
- Modify: `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`

**Interfaces:**
- Keep the four current entry values, their current order, query parameters, draft behavior, picker behavior and save behavior unchanged.
- Empty text and empty photo states remain empty; no fixture content is injected.

- [ ] Write failing source contract tests for left-aligned record intros, block primary actions and editor-contained photo affordance.
- [ ] Run the test file and confirm it fails for the current centered/fragmented layout.
- [ ] Make 05's heading and description left aligned; reduce row vertical padding and preserve existing item array ordering and click handlers.
- [ ] Move 06's visual photo affordance into the editor footer while retaining the exact existing picker handler and selected-photo rendering.
- [ ] Make 06 and 07 primary actions stretch to page width; make 07's empty picker tile, session note and secondary action use the same calm hierarchy as the selected-photo reference without changing the empty state.
- [ ] Run focused tests and the Task 6/Task 7 regression suites.

### Task 11.5：完成空间首页、全部记忆与记忆详情的阅读层级迁移

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/space-home/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/memories/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`
- Modify: `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`

**Interfaces:**
- Preserve current space/memory data, draft continuation, memory selection, photo viewer, edit, AI and delete handlers.
- Keep `DraftNotice` and its packaged paper material; do not recreate its texture in page CSS.

- [ ] Write failing source contract tests for: 04 uses a compact visual more-control, 09 does not wrap original text and AI invitation in identical surface cards, and 09 retains separate candidate styling.
- [ ] Run the test file and confirm the expected failures.
- [ ] Align 04's identity block, draft rhythm, centered primary action and recent-memory spacing with the special space-home master; preserve its current two memory rows and draft text.
- [ ] Align 08 section header and list rhythm; use the shared no-photo presentation for the current second record instead of adding an image.
- [ ] Flatten 09 reading hierarchy: date → photo stack → original text with divider → pale AI invitation → candidate section → visible destructive action. Replace the visible edit text with a compact visual control while preserving `goEdit`.
- [ ] Run focused tests and Task 5A/Task 8/Task 9 regression suites.

### Task 11.6：完成编辑、AI 授权、设置与隐私页的视觉迁移

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/memory-edit/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/space-settings/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/privacy/index.vue`
- Modify: `apps/pet-memory-miniapp/tests/components/task11-visual-contracts.test.ts`

**Interfaces:**
- Preserve original-text editing, AI consent/result states, space update/delete and privacy return-source behavior.
- Do not transform the current AI authorization state into a generated candidate state.

- [ ] Write failing source contract tests for full-width edit/save actions, an AI scope note in authorization state, a horizontal settings cover-control arrangement and a quiet privacy confirmation button.
- [ ] Run the test file and confirm it fails before styling changes.
- [ ] Increase 10's effective textarea height and remove excess action-area whitespace while retaining keyboard behavior and existing save/cancel handlers.
- [ ] Make 11's authorization state visually explicit: compact scope note, stable original-text reference, no false candidate editor, full-width consent button and secondary original-text action.
- [ ] Reassemble 12 as a compact left-aligned cover/control block, full-width settings save action, separated privacy row and clearly bounded danger zone; preserve all existing event handlers and delete scope text.
- [ ] Apply `variant="quiet"` to 13's confirmation action and reduce reading-page section density without editing privacy statements.
- [ ] Run focused tests and Task 8/Task 9 regression suites.

### Task 11.7：构建、静态边界与视觉证据收口

**Files:**
- Modify: `docs/README.md`
- Evidence: `docs/project/gpt-review-output/task10-evidence/visual/wechat-393x852/`
- Evidence report: `docs/project/gpt-review-output/task10-evidence/`

- [ ] Run the complete TypeScript, unit/component, production build and Task 10 verification commands.
- [ ] Confirm `git diff` changes only the plan/index, tests, shared visual components and page Vue files listed above; specifically verify no Store, Repository, Service, Adapter, Fixture, Feature or route file changed.
- [ ] Capture the same 13 current page states at `393×852`; do not stage asset-baseline-only data to obtain a screenshot.
- [ ] Compare app-owned content against the browser baseline by hierarchy, spacing, typography, button treatment, cards, image geometry and color; exclude device chrome and the development-only `DEV` panel.
- [ ] Update `docs/README.md` with the real Task 11 status and add an evidence report that identifies any remaining visual P2/P3 items rather than declaring unverified device acceptance.

## 4. Verification Commands

Run from `apps/pet-memory-miniapp`:

```powershell
npm run test:run -- tests/components/task11-visual-contracts.test.ts tests/components/PageShell.test.ts tests/components/content-components.test.ts
npm run verify:task5a
npm run verify:task5b
npm run verify:task8
npm run verify:task9
npm run verify:task10
```

The final command already includes the full test suite, typecheck, `build:mp-weixin`, Task 10 scenario test and boundary scan. A passing command does not replace the 13-page screenshot comparison or real-device checks.

## 5. Completion Definition

Task 11 is complete only when:

- all 13 current-state pages have been updated without changing their business state;
- focused visual contracts and the complete Task 10 verification command pass;
- production build succeeds;
- a source-diff check confirms the frontend-only boundary;
- the 13 matching-state `393×852` screenshots have been captured and assessed;
- the evidence report separates verified visual results from any unperformed WeChat device checks;
- no P0/P1 visual discrepancy remains in app-owned UI.
