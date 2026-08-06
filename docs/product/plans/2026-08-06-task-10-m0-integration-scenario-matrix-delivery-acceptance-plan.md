# Task 10 M0 集成、场景矩阵与最终交付验收实施计划

> **For agentic workers:** 本计划由 Codex 在当前工作区内直接 inline 执行；本轮不派 Builder、不启动 Reviewer 工作流、不创建提交。步骤使用 checkbox 追踪，并以实际命令输出、测试结果和证据文件为准。

**Goal:** 证明 M0 不是静态页面集合，而是可以连续体验、失败恢复、重复验收并清楚交付边界的完整本地产品骨架。

**Architecture:** Task 10 不新增产品页面或云端能力，而是在现有 Pinia、LocalMemoryRepository、NavigationAdapter、开发者场景面板和 13 页页面之上补齐可重复的场景矩阵、跨页面旅程测试、生产边界扫描和验收证据。浏览器原型是视觉与页面状态母版：对照 `Prototype.tsx`、`prototype.css` 和 13 张基准图核对信息顺序、阅读层级、间距和状态；不复制 React 事件、浏览器 history 或静态演示数据。

**Tech Stack:** uni-app、Vue 3、TypeScript、Pinia、Vitest、微信小程序构建链、现有视觉归一化脚本、浏览器设计原型。

## Global Constraints

- 当前阶段仍为 `M0` 本地 Mock；不接入 CloudBase、真实 AI、微信身份、云端照片、导出、分享、提醒或商业化。
- Task 9 Reviewer 状态为 `accepted`：41 files / 858 tests、`verify:task9` 27/27 通过；Task 9 的 4 个 P3 观察项记录在最终交付清单中，不在 Task 10 中无范围重开。
- 浏览器视觉真源为 `apps/pet-memory-design-prototype/src/Prototype.tsx`、`src/prototype.css` 和 `docs/product/assets/m0-page-baselines/`；13 个页面必须按既有编号与页面语义验收。
- 浏览器原型的静态样本、固定日期、React 路由和演示数量不能进入生产业务逻辑；自动化使用 `completeSnapshot` / `emptySnapshot` 或明确的测试 fixture。
- 页面与组件不得直接访问 Storage、Repository 或原始 `uni.navigate*`；跨页面测试必须通过真实 Store、Repository、NavigationAdapter 注入链路验证。
- 用户原话、照片 URI、密钥、AppID、私人身份信息不得进入日志、路由、截图、公开样本或正式报告。
- 现有用户改动全部保留；不执行 `git reset`、`git checkout`、大范围删除、提交或推送。
- 外部 GUI/真机能力必须先实际探测；无法访问时记录为未验证或外部阻碍，不把 Builder 报告或计划文本当作实机证据。
- Task 10 的最终状态分为：`automated-passed`、`visual-pending`、`device-pending` 或 `m0-accepted`；不能用单一测试通过替代全部交付门。

---

## 1. 开工事实与浏览器原型迁移参考

### 1.1 开工前必须读取

- `docs/README.md`；
- `docs/product/mvp/2026-07-20-formal-mvp-decision.md`；
- `docs/product/technical/2026-07-20-wechat-miniapp-engineering-decision.md`；
- `docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md`；
- `docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md` 第 10–12 节；
- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md` Task 10 原始范围；
- `docs/product/plans/2026-08-04-task-9-space-settings-privacy-deletion-implementation-plan.md`；
- `docs/project/gpt-review-output/task9-evidence/2026-08-05-task-9-reviewer-code-audit.md`；
- `apps/pet-memory-design-prototype/src/Prototype.tsx` 的 `Screen` 路由映射以及 13 个页面组件；
- `apps/pet-memory-design-prototype/src/prototype.css` 的页面骨架、列表、输入、详情、设置、危险区、隐私和响应式样式；
- `docs/product/assets/m0-page-baselines/README.md` 与 `01-onboarding.png` 至 `13-privacy.png`。

### 1.2 原型到小程序的验收映射

| 原型来源 | 小程序页面/证据 | Task 10 要检查的内容 |
|---|---|---|
| `OnboardingScreen` / `.page-shell--onboarding` | 01 + `onboarding-page.test.ts` | 首次说明、低压力隐私提示、开始入口 |
| `SpacesScreen` / `.space-list` | 02 + `spaces-page.test.ts` | 空/完整样本、空间排序、创建入口 |
| `SpaceCreateScreen` / `.cover-picker` / `.form-stack` | 03 + `space-create-page.test.ts` | 名称校验、照片取消/失败、创建后 04 |
| `SpaceHomeScreen` / `.pet-identity` / `.draft-notice` / `.memory-row` | 04 + `space-home-page.test.ts` | 草稿优先、最近记忆、全部记忆和设置入口 |
| `RecordEntryScreen` / `.entry-list` | 05 + `record-entry-page.test.ts` | 四类入口和返回 04 |
| `RecordTextScreen` / `.prompt-block` / `.editor-panel` | 06 + `record-text-page.test.ts` | 单首问、原话、草稿、失败恢复 |
| `RecordPhotoScreen` / `.photo-preview` / `.photo-choice-list` | 07 + `record-photo-page.test.ts` | 相册取消/失败/权限、多图、仅保存照片 |
| `MemoriesScreen` / `.archive-heading` / `.memory-row` | 08 + `memories-page.test.ts` | 全量列表、空态、进入详情 |
| `MemoryDetailScreen` / `.detail-date` / `.detail-photo-stack` / `.original-memory` / `.detail-actions` | 09 + `memory-detail-page.test.ts` | 日期、照片、原话、候选稿、编辑和删除 |
| `MemoryEditScreen` / `.editing-note` / `.text-area--large` | 10 + `memory-edit-page.test.ts` | 原话优先、保存、取消和未保存保护 |
| `AiDraftScreen` / `.ai-scope-note` / `.candidate-label` / `.original-reference` | 11 + `ai-draft-page.test.ts` | 授权、三场景、候选稿可编辑、原话不被覆盖 |
| `SpaceSettingsScreen` / `.settings-cover` / `.settings-section` / `.danger-zone` | 12 + `space-settings-page.test.ts` | 封面三态、资料保存、隐私和删除空间 |
| `PrivacyScreen` / `.privacy-sections` / `.page-actions--flow` | 13 + `privacy-page.test.ts` | 四段隐私说明、来源返回和 M0 能力边界 |

原型只决定视觉结构与页面语义，不决定 Task 10 的运行时导航。正式导航、删除范围、失败状态和 M0 能力以现有规格与已接受 Task 5–9 实现为准。

---

## 2. 文件施工地图

### 2.1 创建

- `apps/pet-memory-miniapp/tests/components/task10-journey.test.ts`：跨页面空样本、草稿、完整样本、编辑/AI/删除旅程。
- `apps/pet-memory-miniapp/tests/m0-scenario-matrix.md`：可重复场景、入口 fixture、步骤、预期数据变化、返回目标和证据要求。
- `apps/pet-memory-miniapp/tests/manual-device-results.md`：微信开发者工具、iPhone、Android 的执行记录模板与未验证项。
- `apps/pet-memory-miniapp/scripts/verify-task10.mjs`：M0 交付边界、13 页路由、场景文件、生产隔离和证据文件扫描。
- `docs/project/gpt-review-output/task10-evidence/README.md`：最终证据目录、命名、状态和报告约束。
- `docs/project/gpt-review-output/task10-evidence/2026-08-06-task-10-codex-execution-report.md`：本次直接执行的事实报告。

### 2.2 修改

- `apps/pet-memory-miniapp/package.json`：增加 `verify:task10`，串联 Task 5A/5B/8/9 回归、全量测试、类型检查、生产构建和 Task 10 边界扫描。
- `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md`：只在证据满足后勾选 Task 10 实际完成步骤，并保留未验证项。
- `docs/README.md`：同步 Task 3–10 的真实执行状态、Task 9 accepted 证据和 Task 10 最终状态；不把视觉/真机未验证写成通过。

### 2.3 只有测试暴露合同缺陷时才修改

- `apps/pet-memory-miniapp/src/features/developer/dev-scenarios.ts`：仅补齐已有失败场景的可验证接线，不新增隐式生产行为。
- `apps/pet-memory-miniapp/src/components/DevPanel.vue`：仅在已有场景无法被用户操作验证时做最小修复；生产构建必须继续剥离。
- 现有页面、Store、Repository、NavigationAdapter：Task 10 默认只验收，不为“集成计划”重构已接受功能。

---

## 3. Task 10.1：建立场景矩阵与交付记录

**Files:**
- Create: `apps/pet-memory-miniapp/tests/m0-scenario-matrix.md`
- Create: `apps/pet-memory-miniapp/tests/manual-device-results.md`
- Create: `docs/project/gpt-review-output/task10-evidence/README.md`

**Required content:**

- 空状态主旅程：`01 → 13 → 01 → 03 → 04 → 05 → 06 → 09 → 04 → 08`；
- 草稿旅程：`04 → 05 → 06 输入 → 保存草稿 → 04 草稿优先 → 06 继续 → 另起一段 → 06 保存正式记忆 → 09`；
- 完整样本旅程：团团/豆豆、空间排序、最近三条、全部记忆、多图详情、编辑、AI 三场景、删除记忆、删除空间；
- 失败恢复矩阵：保存失败、照片选择失败、照片权限不足、AI 信息不足、AI 暂时不可用、内容不存在、不支持快照版本；
- 视觉矩阵：13 个页面、标准状态、高风险状态、`320/393/480px`、证据文件和基准图；
- 设备矩阵：微信开发者工具、iPhone、Android，记录工具/系统版本、是否执行、结果、证据路径和阻碍原因；
- 每个场景都记录：fixture、入口、用户动作、预期页面、预期 Store 数据变化、返回目标、失败恢复、证据文件和状态。

- [ ] 写入矩阵和记录模板，明确所有当前可执行与外部依赖项。
- [ ] 执行 `Get-Content` 检查标题、场景编号、13 页编号和未验证项均存在。
- [ ] 不在文档中写入真实私人原话、用户照片路径、密钥或未经验证的通过结论。

---

## 4. Task 10.2：跨页面自动化旅程（TDD）

**Files:**
- Create: `apps/pet-memory-miniapp/tests/components/task10-journey.test.ts`
- Reuse: `apps/pet-memory-miniapp/tests/components/task5-journey.test.ts`
- Reuse: `apps/pet-memory-miniapp/tests/components/task6-journey.test.ts`
- Reuse: `apps/pet-memory-miniapp/tests/helpers/memory-storage.ts`

**Test interfaces and fixtures:**

- 使用 `createPinia()`、`useAppStore()`、`useMemoryStore()`、`provideNavigation()` 和真实页面组件；Navigation 只 mock 平台跳转函数，不 mock 页面 handler、Store 或 Repository 业务逻辑。
- 使用 `completeSnapshot` 和 `emptySnapshot` 的副本，不修改导入的 fixture；所有时间、ID 和照片 URI 使用测试专用值。
- 每个测试在 `beforeEach` 重置 Pinia、Navigation、PhotoPicker 和全局 `uni`，防止页面状态跨测试泄漏。

### 4.1 空样本主旅程

- [ ] 先写测试 `T10-E01`：空样本完成 onboarding 后进入 03，创建无照片空间后进入 04，04 进入 05，05 选择 daily 进入 06，06 保存原话后通过 `resetTo({ page: 'memory-detail', source: 'new-memory' })` 进入 09，09 返回使用 `nav.back()`，04 进入 08。
- [ ] 运行 `npm run test:run -- tests/components/task10-journey.test.ts`，确认测试因文件/用例不存在而失败。
- [ ] 写入最小测试 fixture、页面装配和断言；不修改生产代码。
- [ ] 重新运行同一测试，确认 `T10-E01` 通过。

### 4.2 草稿旅程

- [ ] 先写测试 `T10-D01`：06 输入一部分后保存草稿，Store 只有一条草稿；04 显示草稿优先；继续草稿后再次选择“另起一段”删除旧草稿；正式保存后草稿为空且详情可打开。
- [ ] 运行同一测试文件，确认新增断言先失败。
- [ ] 复用现有 `draft-exit`、`saveDraft`、`deleteDraft` 和 `saveMemory` 真实调用链补齐测试。
- [ ] 重新运行同一测试，确认 `T10-D01` 通过。

### 4.3 完整样本与破坏性操作旅程

- [ ] 先写测试 `T10-C01`：完整样本中 02 有团团/豆豆，团团最近记忆和 08 全部记忆一致；多图详情可见；编辑原话保留候选稿；AI success/insufficient/unavailable 均不覆盖原话。
- [ ] 先写测试 `T10-C02`：从 04 和 08 分别进入同一记忆详情并确认删除，Store 只删除该记忆与其独占资产，返回来源正确。
- [ ] 先写测试 `T10-C03`：从 12 确认删除团团空间后回到 02，团团空间/记忆/草稿/关联资产消失，豆豆空间和实体保持不变。
- [ ] 运行同一测试文件，确认 C01–C03 新增断言先失败。
- [ ] 复用现有 Task 8/9 页面逻辑；只在测试暴露真实集成缺陷时按 TDD 修复生产代码。
- [ ] 重新运行同一测试文件，确认 C01–C03 通过。

### 4.4 失败恢复与不存在状态旅程

- [ ] 先写测试 `T10-F01`：保存失败保留输入；照片取消/失败/权限不足保留页面；AI insufficient/unavailable 可恢复；不存在 memory/space 显示 `MissingContentState`；非法快照版本不覆盖旧快照。
- [ ] 运行同一测试文件，确认新增断言先失败。
- [ ] 使用已有失败注入、Repository 写入失败 fixture 和页面测试 helper 实现最小验证。
- [ ] 重新运行同一测试文件，确认 F01 通过。

---

## 5. Task 10.3：自动边界门与统一验证命令

**Files:**
- Create: `apps/pet-memory-miniapp/scripts/verify-task10.mjs`
- Modify: `apps/pet-memory-miniapp/package.json`

`verify:task10` 必须检查：

- `pages.json` 有 13 个正式页面，页面路径与 `PAGE_URLS` 一致；
- `tests/m0-scenario-matrix.md`、`tests/manual-device-results.md`、Task 10 evidence README 存在且包含所有场景分组；
- `completeSnapshot` 有两个空间、两段团团记忆、一条草稿、多图和豆豆空空间；
- DevPanel 只出现在开发源码路径，生产构建中无 `DevPanel` / `dev-panel` 残留；
- 生产源码无真实 AI SDK、网络调用、密钥、用户原话、照片 URI、CloudBase 或导出/分享假入口；
- 页面不直接导入 Storage、Repository 或原始 `uni.navigate*`；
- Task 5A、Task 5B、Task 8、Task 9 的验证脚本和 Task 10 旅程测试存在；
- Task 10 报告存在，并明确自动化、视觉、微信工具和真机各自状态。

- [ ] 先写脚本 fixture 测试，故意移除一个矩阵文件或向生产构建放入 DevPanel 字样，确认脚本非零失败。
- [ ] 运行 `node scripts/verify-task10.mjs`，确认反例先失败。
- [ ] 实现最小扫描器，逐项输出 `PASS/FAIL`，失败返回非零退出码。
- [ ] 将 `verify:task10` 定义为：全量测试 → typecheck → production build → Task 5A/5B/8/9 boundary checks → Task 10 boundary checks。
- [ ] 运行 `npm run verify:task10`，保存完整输出到 Task 10 执行报告。

---

## 6. Task 10.4：视觉与浏览器原型对照

**Files:**
- Reuse: `apps/pet-memory-design-prototype/src/Prototype.tsx`
- Reuse: `apps/pet-memory-design-prototype/src/prototype.css`
- Reuse: `docs/product/assets/m0-page-baselines/README.md`
- Reuse: `apps/pet-memory-miniapp/scripts/visual-regression/normalize-baselines.mjs`
- Reuse: `apps/pet-memory-miniapp/scripts/visual-regression/generate-comparison.mjs`
- Evidence: `docs/project/gpt-review-output/task10-evidence/visual/`

- [ ] 建立 13 页基准 manifest，记录 pageId、原型组件、实现路由、fixture、标准状态、基准文件、原始尺寸、归一化方法和 SHA-256；不改写原始基准。
- [ ] 探测微信开发者工具 CLI/GUI 是否可由当前环境实际调用；记录探测命令、退出码和限制。
- [ ] 若可用，按 `393 × 852` 标准状态采集 13 张实现图；若不可用，生成明确的 `visual-pending` 记录，不伪造截图。
- [ ] 对实际可获得的截图生成 normalized、side-by-side、50% overlay 和 diff；差异超过规格阈值时记录问题，不调整基准规避。
- [ ] 对照原型检查 01–13 的页面模板、内容顺序、照片裁切、按钮层级、危险区、隐私区和安全区；重点记录 09/12/13 的 Task 9 变更。
- [ ] 运行 320/393/480 宽度的可达性和横向滚动检查；没有 GUI 时用组件断言和现有布局测试，并把限制写入报告。

---

## 7. Task 10.5：微信开发者工具与真机记录

**Files:**
- Modify: `apps/pet-memory-miniapp/tests/manual-device-results.md`
- Evidence: `docs/project/gpt-review-output/task10-evidence/device/`

- [ ] 生成 `dist/dev/mp-weixin`，验证开发构建保留 DevPanel；生成 `dist/build/mp-weixin`，验证生产构建剥离 DevPanel。
- [ ] 探测并尝试导入微信开发者工具；检查 13 个路由、页面返回、长列表、键盘、安全区、照片权限、session-only 重启降级和删除后栈。
- [ ] 若工具可用，记录版本、入口、路径、步骤、结果和截图；若工具不可用，记录实际阻碍和用户可补的最小证据。
- [ ] 检查 iPhone 与 Android 代表路径：04、06、07、09、12、13；记录系统/微信/设备尺寸、键盘、照片、手势、安全区和异常。
- [ ] 不把浏览器预览、Vitest 或构建产物存在当作微信/真机通过证据。

---

## 8. Task 10.6：文档同步与最终交付报告

**Files:**
- Create: `docs/project/gpt-review-output/task10-evidence/2026-08-06-task-10-codex-execution-report.md`
- Modify: `docs/README.md`
- Modify: `docs/product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md`

报告必须包含：

- 当前代码状态与执行日期；
- 原型和 13 页基准引用；
- Task 5A–Task 9 既有证据引用；
- Task 10 旅程测试、全量测试、typecheck、build、boundary scan 的真实命令和输出；
- 空样本、草稿、完整样本、失败恢复的结果；
- 视觉、微信开发者工具、iPhone、Android 的 `passed / pending / blocked` 状态；
- Task 9 的 4 个 P3：privacy source ref 未主动使用、缺少独立 task9 journey 文件、memory source ref 未主动分支、空封面时“添加/更换”语义重复；
- 未完成项、外部阻碍、下一步和最终 M0 状态。

- [ ] 只有自动化、构建和边界证据真实存在后，勾选总计划中 Task 10 对应步骤。
- [ ] 更新 `docs/README.md`，让 Task 3–10 状态与实际证据一致；不能继续保留“全部尚未实施”的旧结论。
- [ ] 运行 `git diff --check`，扫描报告中的真实用户内容、密钥、路径泄露和未经证实的通过词。

---

## 9. 完成定义与执行顺序

执行顺序固定为：

```text
写计划
→ 写场景矩阵与失败测试
→ 观察失败
→ 最小实现/修复
→ 通过跨页面测试
→ 通过统一自动门
→ 尝试视觉/微信/真机
→ 同步文档与报告
```

Task 10 的最终状态只有在以下条件全部满足时才可写为 `m0-accepted`：

1. 空样本、草稿、完整样本、失败恢复自动化旅程通过；
2. 全量测试、TypeScript、生产构建和 Task 10 boundary scan 通过；
3. Task 5A、5B、8、9 回归命令真实通过；
4. 13 页视觉检查有真实证据，未验证的页面明确标为 pending；
5. 微信开发者工具与真机结果如实记录；
6. M0 范围没有混入 M1 能力；
7. 文档索引、总计划、场景矩阵、设备记录和执行报告状态一致；
8. 没有临时文件、调试残留、虚假能力或隐私泄露。

如果视觉/微信/真机由于外部工具仍无法执行，自动化部分可以标记 `automated-passed`，但不能标记整个 M0 为 `m0-accepted`。

