# AI Draft Single-State Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the memory detail page show exactly one AI-draft state: an invitation before a saved candidate exists, or an editable saved-draft entry after it exists.

**Architecture:** Use `memory.aiCandidateText` as the persisted source of truth. Remove the detail page's transient `showCandidate` flag. The AI draft page initializes in editable success state when a saved candidate exists, otherwise it keeps the existing authorization flow. No changes to the AI service, repository schema, or original-text save behavior.

**Tech Stack:** uni-app, Vue 3, TypeScript, Pinia, Vitest.

## Global Constraints

- Do not change AI generation, original-text saving, or navigation APIs.
- Preserve the original text and keep saved AI output editable.
- Do not add runtime dependencies or change the memory data model.
- Keep the change limited to the memory detail and AI draft flows.

### Task 1: Add regression coverage for the single-state flow

**Files:**
- Modify: `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`
- Modify: `apps/pet-memory-miniapp/tests/components/ai-draft-page.test.ts`

- [x] Add a memory-detail regression asserting that entering AI draft without a saved candidate does not render a candidate section.
- [x] Add a memory-detail regression asserting that a saved candidate hides the invitation and exposes a view/edit entry.
- [x] Add an AI-draft regression asserting that an existing `aiCandidateText` opens directly in editable success state.
- [x] Run both focused test files and confirm the new assertions fail against the current transient-state implementation.

### Task 2: Make persisted candidate state the only source of truth

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`
- Modify: `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`

- [x] Remove `showCandidate` and stop setting transient candidate visibility before navigation.
- [x] Render the invitation only when original text exists and no saved candidate exists.
- [x] Render the saved candidate with a single “view/edit draft” action when `aiCandidateText` exists.
- [x] Initialize the AI draft page from `memory.aiCandidateText` when present; otherwise initialize authorization state.
- [x] Keep save, retry, back, AI service calls, and original text unchanged.
- [x] Run focused tests and confirm they pass.

### Task 3: Verify the implementation

**Files:**
- Test: `apps/pet-memory-miniapp/tests/components/memory-detail-page.test.ts`
- Test: `apps/pet-memory-miniapp/tests/components/ai-draft-page.test.ts`
- Source: `apps/pet-memory-miniapp/src/pages/memory-detail/index.vue`
- Source: `apps/pet-memory-miniapp/src/pages/ai-draft/index.vue`

- [x] Run the full test suite.
- [x] Run TypeScript type checking.
- [x] Build the WeChat mini-program and run WXSS compatibility checking.
- [x] Inspect the diff for unintended behavior or formatting changes.
