# Space Home Draft Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the visual weight of the new-memory entry when a draft already occupies the primary focus of the space home page.

**Architecture:** Keep the existing `goRecord` behavior and draft-resume flow. Render a `TextAction` for the new-memory entry only when a draft exists; keep the existing full-width `PrimaryButton` when no draft exists. Use a page-local class for the underline and vertical spacing.

**Tech Stack:** uni-app, Vue 3, TypeScript, SCSS, Vitest.

## Global Constraints

- Modify only the space-home entry presentation and its tests.
- Preserve existing draft resume behavior and navigation destinations.
- Do not add dependencies or change data models.
- Keep the no-draft primary button unchanged.

---

### Task 1: Replace the drafted-state primary button with a text entry

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/space-home/index.vue`
- Test: `apps/pet-memory-miniapp/tests/components/space-home-page.test.ts`

**Interfaces:**
- Consumes: existing `draft` computed state and `goRecord()` handler.
- Produces: a drafted-state `.space-home__new-memory-link` `TextAction` that emits the same `press` event as the existing button.

- [ ] **Step 1: Write failing tests**

  Assert that a space with a draft renders the text link, does not render the primary button for this entry, and keeps the no-draft primary button.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run `npx vitest run tests/components/space-home-page.test.ts --testTimeout=30000`.
  Expected: the drafted-state link assertion fails because the page still renders `PrimaryButton`.

- [ ] **Step 3: Implement the minimal template and style change**

  Branch the existing entry with `v-if="draft"` / `v-else`, route both to `goRecord`, and style the drafted-state action with a modest top and bottom margin plus a text underline.

- [ ] **Step 4: Run focused tests and verify they pass**

  Run `npx vitest run tests/components/space-home-page.test.ts --testTimeout=30000`.

- [ ] **Step 5: Run final verification**

  Run `npm run typecheck` and `npm run build:mp-weixin`.
