# 整理草稿自然流式布局实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让“整理草稿”页面的说明、候选稿和操作按钮按自然阅读顺序紧密衔接，消除 task-form 底部弹性空白，同时保持 AI 生成、保存和返回逻辑不变。

**Architecture:** 仅调整 `ai-draft` 页面使用的布局契约。页面从 `task-form` 切换为自然流式布局，使 `#actions` 跟随当前状态内容；授权态收紧说明卡与操作区间距，成功态收紧编辑框与保存按钮间距。共享 `PageShell`、AI 服务和 Memory Store 不改。

**Tech Stack:** uni-app、Vue 3、TypeScript、SCSS、Vitest、vue-tsc。

## Global Constraints

- 不改变 AI 草稿生成、保存、失败重试和返回行为。
- 不新增运行时依赖。
- 复用现有设计令牌和 `PageShell` / `PrimaryButton` / `TextAction`。
- 保留原有文案，除非测试或用户另行确认。
- 页面在微信小程序构建产物中必须通过 WXSS 兼容检查。

### Task 1: 锁定自然流式布局回归

**Files:**
- Modify: `apps/pet-memory-miniapp/tests/components/ai-draft-page.test.ts`

**Interfaces:**
- Consumes: `ai-draft/index.vue` 当前授权态和成功态 DOM。
- Produces: 能证明页面不再使用 `task-form` 底部撑开、操作区紧跟内容区的回归断言。

- [x] **Step 1: Write the failing tests**

  在授权态测试中断言页面使用 `standard-flow`，并断言授权说明与操作区之间存在页面专用的紧凑布局类；在成功态测试中断言候选编辑区与操作区使用对应的紧凑布局类。

- [x] **Step 2: Run focused tests to verify failure**

  Run:

  ```powershell
  npm run test -- --run tests/components/ai-draft-page.test.ts --reporter=dot
  ```

  Expected: 新增布局断言失败，原因是页面仍声明 `layout="task-form"` 且没有页面专用的自然流式布局类。

### Task 2: 实现方案 A 的页面布局

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`

**Interfaces:**
- Consumes: 现有 `pageState` 状态分支和 `PageShell` 插槽。
- Produces: 授权态与成功态的内容/操作区自然流式排列；业务事件处理函数保持原签名和行为。

- [x] **Step 1: Switch the page shell to natural flow**

  将页面 `PageShell` 的布局从 `task-form` 调整为 `standard-flow`，不改标题、返回事件和状态分支。

- [x] **Step 2: Add state-specific compact layout classes**

  给授权说明容器和成功态编辑容器添加页面专用类，并以现有 `$pm-space-*` 令牌控制：原话与说明/编辑区之间使用中等间距，说明/编辑区与主按钮之间使用较小间距，次要操作继续位于主按钮下方。

- [x] **Step 3: Keep action width and behavior unchanged**

  保留现有 `.ai-draft__actions` 的全宽主按钮规则，不修改 `handleAuthorize`、`handleSave`、`handleRetry`、`handleBack` 或任何服务调用。

- [x] **Step 4: Run focused tests to verify green**

  Run:

  ```powershell
  npm run test -- --run tests/components/ai-draft-page.test.ts --reporter=dot
  ```

  Expected: AI draft page tests pass，且原有授权、生成、保存、失败重试测试继续通过。

### Task 3: 完成工程验证

**Files:**
- Test: `apps/pet-memory-miniapp/tests/components/ai-draft-page.test.ts`
- Source: `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`

- [x] **Step 1: Run the full test suite**

  ```powershell
  npm run test -- --run --reporter=dot
  ```

- [x] **Step 2: Run TypeScript validation**

  ```powershell
  npm run typecheck
  ```

- [x] **Step 3: Build the WeChat mini-program**

  ```powershell
  npm run build:mp-weixin
  ```

  Expected: build completes and WXSS compatibility reports no forbidden selectors.
