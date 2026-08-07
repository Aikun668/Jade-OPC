# M0 Scenario Matrix

This matrix is the repeatable acceptance contract for Task 10. It uses the existing `emptySnapshot` and `completeSnapshot` fixtures and the real Pinia → `LocalMemoryRepository` path. It does not add product scope.

## Status vocabulary

- `automated-passed`: covered by a repeatable test or boundary command with fresh output.
- `visual-pending`: the browser prototype and baselines are known, but a real visual capture/diff has not been completed.
- `device-pending`: the scenario still requires WeChat DevTools or a real iPhone/Android run.
- `blocked`: an external tool or environment prevents execution; record the reason and the smallest substitute evidence.

## Browser prototype migration reference

The browser project is the visual and semantic reference, not a second runtime implementation:

- Source: `apps/pet-memory-design-prototype/src/Prototype.tsx`
- Styles: `apps/pet-memory-design-prototype/src/prototype.css`
- Baselines: `docs/product/assets/m0-page-baselines/01-onboarding.png` through `13-privacy.png`

The miniapp must preserve the same information hierarchy, reading order, high-risk states, and calm visual language. It must not copy React state, browser history, demo-only content, or prototype navigation into production logic.

## Automated journey matrix

| ID | Fixture / setup | User actions | Expected pages / state | Expected Store / Repository change | Recovery / evidence | Status |
|---|---|---|---|---|---|---|
| T10-E01 | `emptySnapshot` | Complete onboarding; create a space without a cover; choose daily; save original text; open detail; go back; open all memories | `01 → 13 → 01 → 03 → 04 → 05 → 06 → 09 → 04 → 08` | One space, one formal memory, no draft, no stale complete sample | Missing data remains explicit; covered by `task10-journey.test.ts` | automated-passed |
| T10-D01 | `completeSnapshot` draft or a new empty-space draft | Save partial text; resume it; convert it to a formal memory; create and discard another draft | `04 → 05 → 06 → 04 → 06 → 09` | At most one draft per space; source draft is removed after formal save; draft asset ownership transfers | Store remains usable after discard; covered by `task10-journey.test.ts` | automated-passed |
| T10-C01 | `completeSnapshot` | Inspect Tuantuan/Doudou ordering; recent/all memories; open two-photo detail; edit original; request AI in success/insufficient/unavailable states | `02 → 04 → 08 → 09 → 10 → 11` | Two spaces; two Tuantuan memories; one draft; two-photo asset stack; original and candidate remain separate | AI candidate is optional and never overwrites original; covered by test plus existing Task 8 tests | automated-passed |
| T10-C02 | `completeSnapshot` | Delete the photo memory from detail reached from space home and from all memories | `04/08 → 09 → 04/08` | Only selected memory and its assets are removed; other memory, draft, and spaces remain | Confirmation and error behavior covered by Task 9 page tests | automated-passed |
| T10-C03 | `completeSnapshot` | Delete Tuantuan space from settings and return to spaces | `02 → 12 → 02` | Tuantuan space, memories, draft, and owned assets are removed; Doudou is unchanged | Cascade behavior covered by `task10-journey.test.ts` | automated-passed |
| T10-F01 | Empty/complete plus injected failures | Save failure; photo cancel/failure/denied; AI insufficient/unavailable; missing ID; unsupported snapshot version | Current page remains usable or shows `MissingContentState`; no destructive partial commit | Failed repository write leaves the previous snapshot; invalid routes/version are rejected | Repository, route, and AI fallback checks covered by `task10-journey.test.ts`; picker cases remain existing unit/page coverage | automated-passed |

## Visual matrix

The 13-page mapping is defined in the Task 10 plan. Each page needs a standard state and its highest-risk state checked against the corresponding prototype screen and baseline.

| Width | Required check | Evidence | Status |
|---|---|---|---|
| 320px | no horizontal overflow; readable long text; buttons remain reachable | real capture or explicit blocked record | visual-pending |
| 393px | baseline comparison for all 13 pages | normalized capture, side-by-side, overlay, and diff | visual-pending |
| 480px | calm max-width behavior; no stretched controls | real capture or explicit blocked record | visual-pending |

High-risk pages are 09 memory detail, 12 space settings, and 13 privacy. Check photo stacks, deletion affordances, privacy copy, safe-area spacing, and empty/error states first.

## Device matrix

| Target | Required paths | Required checks | Evidence | Status |
|---|---|---|---|---|
| WeChat DevTools | 13 routes and back stack | build import, DevPanel dev-only, long list, keyboard, safe area, photo permission/session expiry | DevTools version, steps, result, screenshots | device-pending |
| iPhone representative | 04, 06, 07, 09, 12, 13 | text input, keyboard, photo selection, safe area, deletion confirmation | device record and screenshots | device-pending |
| Android representative | 04, 06, 07, 09, 12, 13 | same checks plus permission denial/retry | device record and screenshots | device-pending |

## Boundary checklist

- M0 only: no CloudBase, real AI SDK, identity, sharing, export, reminders, or commercial entry points.
- Pages/components use Store and injected adapters; they do not directly use storage, repositories, or raw `uni.navigate*`.
- No private user text, photo URI, secret, AppID, or real user identity appears in logs, routes, screenshots, or evidence.
- Production build must not contain `DevPanel` or `dev-panel` output.
- A visual or device check cannot be marked passed from Vitest, a browser preview, or a build artifact alone.
