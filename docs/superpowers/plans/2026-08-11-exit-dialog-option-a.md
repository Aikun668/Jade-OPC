# Exit Dialog Option A Implementation Plan

> **For agentic workers:** Execute this plan inline with the approved Option A design.

**Goal:** Make the photo-record exit confirmation dialog a centered, borderless action list with a larger title and short, subtle separators.

**Architecture:** Keep `ConfirmDialog` as the shared dialog component. Opt the photo-record exit dialog into its existing list layout, then refine that shared list layout so no inner frame is introduced and separators remain inset. Preserve all confirm, discard, cancel, and pending behavior.

**Tech Stack:** uni-app, Vue 3, TypeScript, SCSS, Vitest.

## Global Constraints

- Do not change photo data flow, navigation, or confirmation behavior.
- Keep the outer dialog as the only visible container; add no nested card or border.
- Preserve shared design tokens and existing action hit targets.
- Verify with focused tests, typecheck, and the WeChat build.

### Task 1: Lock the approved dialog structure

**Files:**
- Modify: `apps/pet-memory-miniapp/src/pages/record-photo/index.vue`
- Test: `apps/pet-memory-miniapp/tests/components/record-photo-page.test.ts`

- [ ] Add a regression test that opens the unsaved-photo exit dialog and expects the centered list layout with all three actions.
- [ ] Run the focused test and confirm it fails because the page currently uses the default button layout.
- [ ] Add `action-layout="list"` to the photo-record exit `ConfirmDialog` only.
- [ ] Run the focused test and confirm it passes.

### Task 2: Refine the shared list presentation

**Files:**
- Modify: `apps/pet-memory-miniapp/src/components/ConfirmDialog.vue`
- Test: `apps/pet-memory-miniapp/tests/components/overlay-components.test.ts`

- [ ] Add a regression assertion for the larger list-dialog title and inset divider styling.
- [ ] Run the focused overlay test and confirm it fails against the full-width divider styling.
- [ ] Increase only list-dialog title emphasis, remove full-width row borders, and render short centered separators between rows.
- [ ] Run focused tests, typecheck, and build.

### Task 3: Final verification

- [ ] Run the full Vitest suite.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build:mp-weixin` and the WXSS compatibility check.
- [ ] Inspect the diff for scope and whitespace errors.
