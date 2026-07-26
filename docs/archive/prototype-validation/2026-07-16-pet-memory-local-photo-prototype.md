# 本地照片体验原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fictional-cat photo chooser with a local-only photo selection flow that helps a tester describe their own pet memory.

**Architecture:** Keep the static browser-module prototype. The state machine stores only temporary selected-photo metadata; the renderer creates an `input[type=file]`, reads the selected image with `URL.createObjectURL`, and never sends it anywhere. The three text-first routes remain unchanged; the photo route and the “换一张照片” aid both use the same local photo screen.

**Tech Stack:** Existing semantic HTML, CSS, browser ES modules, Node.js built-in `node:test`; no dependencies or server APIs.

## Global Constraints

- Remove every user-facing reference to 沫沫, 示例照片, and fictional-pet examples.
- A selected photo must come from the tester's device, stay local to the current browser session, and never be uploaded or persisted.
- Photo selection must lead to the question `看到这张照片时，你最先想起了什么？`.
- “换一张照片” must reuse the same local selection state, not open a stock image chooser.
- The user can cancel selection, choose another photo, open the lighter-memory aids, or safely end at any time.
- Preserve the existing four routes, editable draft, and in-session memory home.

---

### Task 1: Define local-photo state behavior

**Files:**
- Modify: `tests/state.test.js`
- Modify: `prototype/src/state.js`

- [ ] Add failing tests asserting `CONTINUE_DEMO` on the photo route and `SELECT_AID` with `photos` both open `photoPicker`; `SELECT_LOCAL_PHOTO` stores metadata and opens the photo prompt; `CLEAR_LOCAL_PHOTO` clears it.
- [ ] Run `npm test` and confirm the new expectations fail because `SELECT_LOCAL_PHOTO` and `CLEAR_LOCAL_PHOTO` do not exist.
- [ ] Implement `SELECT_LOCAL_PHOTO` and `CLEAR_LOCAL_PHOTO`; preserve only `{ name, previewUrl }` as temporary state and use the real photo prompt.
- [ ] Run `npm test` and confirm all state tests pass.

### Task 2: Render the local-only photo entry

**Files:**
- Modify: `prototype/src/app.js`
- Modify: `prototype/styles.css`

- [ ] Delete the static photo list and all 沫沫/example copy.
- [ ] Render a local file picker with `accept="image/*"`, a clear privacy statement, and a fallback that allows the user to choose a lighter entrance or finish without selecting.
- [ ] Read a selected file into a temporary object URL, dispatch `SELECT_LOCAL_PHOTO`, show that preview in the following prompt, and offer `换一张照片`.
- [ ] Revoke the previous object URL when the user replaces or clears the image.
- [ ] Keep the calm, existing visual hierarchy and button system.

### Task 3: Align the validation specification

**Files:**
- Modify: `docs/superpowers/specs/2026-07-16-pet-memory-clickable-validation-prototype-design.md`

- [ ] Replace the former sample-cat/no-real-upload constraints with local-only temporary selection, no upload, no cloud persistence, and no hidden reuse of the selected image.
- [ ] Update the photo route and the “想不起来” photo aid description to describe user-selected local photos.

### Task 4: Verify local photo flow

**Files:**
- Test: `tests/state.test.js`
- Test artifact: `output/playwright/local-photo-*.png`

- [ ] Run `npm test` and confirm all tests pass.
- [ ] Use the user's selected in-app browser, if available, to select a local photo and verify the preview/question/replace path. If browser automation is unavailable, report that limitation and verify the state-machine behavior through tests.
- [ ] Confirm there are no visible references to 沫沫, fictional examples, or example photos in the prototype source.
