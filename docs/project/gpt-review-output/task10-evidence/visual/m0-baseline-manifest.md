# M0 Browser Prototype Baseline Manifest

This is the static baseline inventory for Task 10. It records the browser prototype source, the miniapp route, fixture state, baseline dimensions, and SHA-256. It is not a claim that the miniapp has been captured in WeChat DevTools.

Reference sources:

- Visual source: `apps/pet-memory-design-prototype/src/Prototype.tsx`
- Shared prototype styles: `apps/pet-memory-design-prototype/src/prototype.css`
- Baseline directory: `docs/product/assets/m0-page-baselines/`
- Standard viewport: `393 × 852 CSS px`; baseline images are normally `394 × 852` because of the source capture edge.
- `04-space-home.png` is the approved special master at `853 × 1844` and must not be resized into the standard baseline.

| ID | Browser component | Miniapp route | Fixture / state | Baseline | Dimensions | SHA-256 | Capture status |
|---|---|---|---|---|---|---|---|
| 01 | `OnboardingScreen` | `pages/onboarding/index` | first entry, empty sample | `01-onboarding.png` | 394×852 | `F6A9642B1F35CEE5C44D2F44B3A77D90C263C4E1660F9DE734A6BCE817C23264` | visual-pending |
| 02 | `SpacesScreen` | `pages/spaces/index` | complete sample: Tuantuan + Doudou | `02-spaces.png` | 394×852 | `28F63883BD66F152148E108692778D74780EE4FBA16C16852F6EADB6D4C70606` | visual-pending |
| 03 | `SpaceCreateScreen` | `pages/space-create/index` | valid name, optional photo area | `03-space-create.png` | 394×852 | `FAEEB8E1EE339F21E4937656A4F3B0EADB9AE96AC3DD644C43DB29A4C5CE97B2` | visual-pending |
| 04 | `SpaceHomeScreen` | `pages/space-home/index` | one draft and recent memory | `04-space-home.png` | 853×1844 | `445B88067A750E84AE53085D37D958D97C82A28292976A8C5E1E86E9597338DD` | visual-pending |
| 05 | `RecordEntryScreen` | `pages/record-entry/index` | four record entry choices | `05-record-entry.png` | 394×852 | `2DBD919BADD390B21307678FE55E4B1AF3D3B3A57893C8693BC02B3D78AABAC0` | visual-pending |
| 06 | `RecordTextScreen` | `pages/record-text/index` | original text entered, keyboard closed | `06-record-text.png` | 394×852 | `8F8B389F3BCCC52E8B18D0985F8372C1A2E57224AE4818FE851D6C92677BC744` | visual-pending |
| 07 | `RecordPhotoScreen` | `pages/record-photo/index` | one selected photo | `07-record-photo.png` | 394×852 | `BA8D3B3D98447CB766E501D82AA2F4A53163B4E860EA296EBA1F5484CF48279B` | visual-pending |
| 08 | `MemoriesScreen` | `pages/memories/index` | two formal Tuantuan memories | `08-memories.png` | 394×852 | `C5D68780E4CB2EC41A09D8B34EFE68974DC77C2CD369160A1FDA92E2CBAC0ED2` | visual-pending |
| 09 | `MemoryDetailScreen` | `pages/memory-detail/index` | text + two-photo memory, AI invitation | `09-memory-detail.png` | 394×852 | `11523C4082BD786DDF6F9587867B157C488694E6F072E3C9FEDA7836F054777D` | visual-pending |
| 10 | `MemoryEditScreen` | `pages/memory-edit/index` | original text loaded, keyboard closed | `10-memory-edit.png` | 394×852 | `D2D06F90AE6C9D12E3A94732BBF41AA03FCCCC03A49B3F0B6D7E4A176D9EDA0A` | visual-pending |
| 11 | `AiDraftScreen` | `pages/ai-draft/index` | editable successful candidate | `11-ai-draft.png` | 394×852 | `4BAA41B403B03CBF0B203C880D287BAC485C23A78234CE477C6C7FB41CCD784F` | visual-pending |
| 12 | `SpaceSettingsScreen` | `pages/space-settings/index` | full settings and danger zone | `12-space-settings.png` | 394×852 | `15D8B6F3B44A44F4BE8E7FE46DCB37871F2D776A9F73476CE5FEEF82172919C2` | visual-pending |
| 13 | `PrivacyScreen` | `pages/privacy/index` | M0 privacy explanation | `13-privacy.png` | 394×852 | `EE23B0702708ED572D340A4C89985600481936D9D7DFE2A6671B87BF1C955DD1` | visual-pending |

## Comparison protocol

Once real WeChat captures exist, preserve the originals, normalize through the existing visual-regression scripts, and generate side-by-side, 50% overlay, and diff outputs under a run-specific evidence directory. A passing automated build or browser prototype screenshot cannot replace those captures.
