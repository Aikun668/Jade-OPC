# Formal MVP Foundation and Repository Cleanup Implementation Plan

> **For agentic workers:** Execute the tasks in order and verify every listed file move before reporting completion.

**Goal:** Preserve the validation prototype as an archive, make the repository root ready for formal product work, and add one non-duplicative MVP decision document.

**Architecture:** Product decisions live under `docs/product`; prototype-only specifications and implementation plans become historical records under `docs/archive/prototype-validation`. The runnable validation prototype, tests, screenshots, and temporary reference assets move together under `archive/prototype-validation` so no production source directory is implied before the formal application exists.

**Tech Stack:** Markdown documentation, static HTML/CSS/JavaScript validation prototype, PowerShell filesystem moves.

## Global Constraints

- Preserve all existing files; do not delete validation artifacts.
- Keep the validation prototype runnable after it is archived.
- Do not alter the prototype implementation or its behavior during this cleanup.
- Do not duplicate established product principles; the new MVP document must reference them.
- The workspace is not a Git repository; no commit steps apply.

---

### Task 1: Create the target directory structure

**Files:**
- Create: `docs/product/foundation/`
- Create: `docs/product/mvp/`
- Create: `docs/product/plans/`
- Create: `docs/archive/prototype-validation/`
- Create: `archive/prototype-validation/evidence/`
- Create: `archive/prototype-validation/reference-assets/`

- [ ] Create only the directories required by the agreed structure.
- [ ] Verify every directory exists before moving files.

### Task 2: Move and classify documentation

**Files:**
- Move: `docs/superpowers/specs/2026-07-15-pet-memory-core-design.md` → `docs/product/foundation/`
- Move: `docs/superpowers/specs/2026-07-16-pet-memory-core-business-rules.md` → `docs/product/foundation/`
- Move: `docs/superpowers/specs/2026-07-16-pet-memory-scenario-map.md` → `docs/product/foundation/`
- Move: `docs/superpowers/specs/2026-07-16-pet-memory-user-scenarios.md` → `docs/product/foundation/`
- Move: `docs/superpowers/specs/2026-07-16-pet-memory-document-map.md` → `docs/product/foundation/`
- Move prototype-specific design documents and all prior prototype plans → `docs/archive/prototype-validation/`

- [ ] Move each product-foundation document without renaming it.
- [ ] Move each validation-only design document and plan without renaming it.
- [ ] Verify no document is lost and the old `docs/superpowers` directory is empty except for this execution plan.

### Task 3: Archive validation-runtime artifacts

**Files:**
- Move: `prototype/` → `archive/prototype-validation/prototype/`
- Move: `tests/` → `archive/prototype-validation/tests/`
- Move: `output/playwright/` → `archive/prototype-validation/evidence/playwright/`
- Move: `temp-file/` → `archive/prototype-validation/reference-assets/`
- Move: `package.json` → `archive/prototype-validation/package.json`

- [ ] Move the prototype, its tests, screenshots, reference assets, and its package manifest as one archive unit.
- [ ] Leave no empty runtime-output or temporary-material directories at the repository root.
- [ ] Run `npm test` from `archive/prototype-validation` and require all existing tests to pass.

### Task 4: Write the formal MVP decision document

**Files:**
- Create: `docs/product/mvp/2026-07-20-formal-mvp-decision.md`

- [ ] Define the product’s first formal release as an invite-only private alpha, not a public commercial launch.
- [ ] State the P0 user outcome and the closed-loop first release flow.
- [ ] Specify in-scope and explicitly out-of-scope capabilities.
- [ ] Define the minimum information architecture and data entities.
- [ ] Translate existing privacy and AI principles into implementation decisions that must precede launch.
- [ ] Set product-quality and private-alpha learning metrics without making revenue a launch gate.
- [ ] Add a small “future commercial boundary” section that prohibits grief-driven upsells.

### Task 5: Replace the old document map with a current project index

**Files:**
- Create: `docs/README.md`
- Update: `docs/product/foundation/2026-07-16-pet-memory-document-map.md`

- [ ] Create a concise index showing where product foundations, MVP decisions, and historical validation records now live.
- [ ] Update the document map so future work does not write new documents back into `docs/superpowers`.
- [ ] Verify all Markdown links and referenced paths resolve in the new structure.

### Task 6: Final integrity check

- [ ] Compare the pre-move inventory with the final file list.
- [ ] Confirm there are no references to the old `docs/superpowers`, root `prototype`, root `tests`, root `output`, or root `temp-file` paths in current documents.
- [ ] Confirm the archived validation prototype still passes its test suite.
- [ ] Report the new project structure and the one decision still needed before technical planning: formal first-release platform.
