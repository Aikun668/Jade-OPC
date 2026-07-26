# 宠物记忆可点击验证原型 v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the prototype's first-use context and make its four memory entrances genuinely different before they converge into the shared save flow.

**Architecture:** Retain the existing static HTML/CSS/browser-module implementation, but replace the state machine and renderer with an explicit `intro -> entries -> demo disclosure -> route-specific prompt -> shared draft/save` model. Copy the selected user-provided, non-watermarked images into `prototype/assets/` so the prototype never depends on `temp-file/` at runtime.

**Tech Stack:** Existing semantic HTML, CSS, browser ES modules and Node.js built-in `node:test`; no additional dependencies.

## Global Constraints

- The first screen must not mention 沫沫 or a fictional pet.
- The first screen must state the product purpose and that the demo does not upload or save content.
- All four entrances must have different explanatory copy and different first questions.
- Only the photo entrance displays a photo chooser before its first question.
- 沫沫 appears only after the user selects an entrance and is explicitly identified as a fictional, unsaved example.
- User-facing questions use `Ta`, never require the tester to invent facts about 沫沫.
- `想不起来` choices must each change the following prompt, except “看看其他照片”, which opens the photo chooser.
- Saving or safely ending always goes to a memory-space home that retains completed pieces in the current browser session.
- Do not use `temp-file/2adbe34d-5774-4435-a26e-0b7b7f7605ce.png` because the asset contains a visible watermark.
- Do not add login, real upload, persistence, notifications, sharing, progress tracking or AI network calls.
- Use the approved button system: primary action 48px/15px/500/14px radius with only a 0 3px 10px rgba(66,62,55,.08) shadow; entry card 92px/18px radius/no shadow; secondary action 44px/14px radius/no shadow; text action 14px/background-free/no shadow.
- Never use a 999px radius for a primary action; use 14px controls, 18px entry cards, 22px content cards and 28px large containers.

---

### Task 1: Replace the route model with a real four-entrance state machine

**Files:**
- Modify: `prototype/src/state.js`
- Modify: `tests/state.test.js`

- [ ] Write failing tests that assert: the initial screen is `intro`; `START_DEMO` reaches `entries`; each entrance records a distinct `route`; only the photo route reaches `photoPicker`; and daily, meeting and relationship routes each reach `prompt` with their own first question.
- [ ] Run `npm test` and confirm the tests fail because the current state machine starts on `start` and sends every route to `photo`.
- [ ] Implement `intro`, `entries`, `disclosure`, `photoPicker`, `prompt`, `aids`, `followup`, `draft`, and `saved` states. Define the four route objects in one exported `ROUTES` constant with their labels, explanations and first questions.
- [ ] Run `npm test` and confirm all state tests pass.

### Task 2: Replace the uncontextualized opening with product explanation and differentiated entrance cards

**Files:**
- Modify: `prototype/src/app.js`
- Modify: `prototype/styles.css`

- [ ] Render the initial `intro` state with the approved product statement, `用示例体验一次`, and `无需账号 · 不会上传或保存你的内容`; remove all 沫沫 copy and pause control from this state.
- [ ] Render the `entries` state with four cards containing their approved explanation lines; each card must dispatch its own route action.
- [ ] Render `disclosure` after selection, with the exact meaning that 沫沫 is fictional and nothing will be saved, then continue to its route-specific first question.
- [ ] Render daily, meeting and relationship prompts as text-first screens; render the photo route with photo choice followed by its distinct question.
- [ ] Apply the approved button hierarchy: one restrained primary action per screen; entrance cards carry a title, explanation and line icon; secondary actions and safe exits are quiet outlined or text controls; no normal control has a heavy or floating shadow.
- [ ] Set entrance-card titles to 18px/500 and explanations to 12.5px/400, with enough contrast and spacing to make the hierarchy obvious.
- [ ] Run `npm test` and manually confirm the first two states do not expose 沫沫 before an entrance is selected.

### Task 3: Replace the illustrated cat with approved local demonstration photos

**Files:**
- Create: `prototype/assets/momo-black-white.png` copied from `temp-file/9f83bc55-3fcf-484b-a768-a26ee6b70086.png`
- Create: `prototype/assets/momo-tabby.png` copied from `temp-file/d1f5d648-8d09-4fa3-9ced-083bfe84174a.png`
- Create: `prototype/assets/momo-fluffy.jpg` copied from `temp-file/cutie-cat-relaxing-couch-home.jpg`
- Modify: `prototype/src/app.js`
- Modify: `prototype/styles.css`

- [ ] Copy the three approved non-watermarked source assets without modifying their contents; do not copy the watermarked asset.
- [ ] Render the three images only in the photo-route chooser, each with `示例照片` labeling and an accessible alt string describing it as an example image of 沫沫.
- [ ] On selection, retain the chosen image in state and present `你为什么会停在这张照片上？`.
- [ ] Manually verify that the photo chooser is never shown in the other three routes.

### Task 4: Verify all four routes and the shared safety exits at mobile size

**Files:**
- Test: `tests/state.test.js`
- Test artifact: `output/playwright/v2-*.png`

- [ ] Run `npm test` and confirm all tests pass.
- [ ] Serve with `python -m http.server 4173 --directory prototype`.
- [ ] At a 390×844 viewport, capture these accepted screenshots: intro; entrance selection; one text-first route prompt; photo chooser; each route's draft; and the `想不起来 -> 今天就到这里` safe exit.
- [ ] Inspect each screenshot and confirm: no 沫沫 before the disclosure; no watermarked image; route labels and questions differ; no screenshot contains login, upload, reminder, progress or guilt language.
- [ ] Stop the test server after verification.

## Plan Self-Review

- The first-use context issue is covered by Tasks 1, 2 and 4.
- The false four-entrance issue is covered by Tasks 1, 2 and 4.
- The fake-image issue is covered by Task 3.
- The shared draft/save behavior is retained after route-specific first questions through Task 1.
- No production product scope is added; all work remains local, unsaved validation behavior.
