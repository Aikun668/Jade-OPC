# Manual Device Results

Task 10 requires evidence from the actual WeChat DevTools and representative iPhone/Android runs. This file is intentionally a record template until those external environments are available.

## Run metadata

| Field | Value |
|---|---|
| Date | 2026-08-06 |
| Miniapp build | record the exact `dist/dev/mp-weixin` or `dist/build/mp-weixin` build |
| WeChat DevTools version | pending |
| iPhone model / iOS | pending |
| Android model / Android | pending |
| Operator | Codex / user confirmation required for physical devices |

## WeChat DevTools

| Check | Steps | Result | Evidence | Status |
|---|---|---|---|---|
| Import dev build | Generate dev build and import `dist/dev/mp-weixin` | pending | `task10-evidence/device/wechat-dev-import.*` | device-pending |
| Import production build | Generate production build and import `dist/build/mp-weixin` | pending | `task10-evidence/device/wechat-build-import.*` | device-pending |
| 13 routes | Open every route from the route list; verify no blank page | pending | route checklist / screenshots | device-pending |
| Back stack | 04 → 05 → 06 → 09 → back; 02 → 12 → 02 | pending | navigation screenshots | device-pending |
| DevPanel boundary | Dev build shows panel; production build does not | source/build scan passed; GUI pending | build scan output and screenshot | device-pending |
| Keyboard / safe area | Long text in 06 and bottom actions on a safe-area device | pending | screenshots | device-pending |
| Photo permission / session expiry | cancel, denied, unavailable, restart session | pending | screenshots / console-free result | device-pending |

## iPhone

| Path | Checks | Result | Evidence | Status |
|---|---|---|---|---|
| 04 → 06 → 09 | text input, keyboard dismissal, detail readability | pending | `task10-evidence/device/iphone/` | device-pending |
| 04 → 07 → 09 | photo selection, cancel/denied recovery, photo detail | pending | `task10-evidence/device/iphone/` | device-pending |
| 09 → 12 → 02 | deletion confirmation, safe-area spacing, cascade return | pending | `task10-evidence/device/iphone/` | device-pending |
| 13 | privacy content and return action | pending | `task10-evidence/device/iphone/` | device-pending |

## Android

| Path | Checks | Result | Evidence | Status |
|---|---|---|---|---|
| 04 → 06 → 09 | text input, keyboard dismissal, detail readability | pending | `task10-evidence/device/android/` | device-pending |
| 04 → 07 → 09 | photo selection, permission denial/retry, photo detail | pending | `task10-evidence/device/android/` | device-pending |
| 09 → 12 → 02 | deletion confirmation, safe-area spacing, cascade return | pending | `task10-evidence/device/android/` | device-pending |
| 13 | privacy content and return action | pending | `task10-evidence/device/android/` | device-pending |

## External blockers

2026-08-06 environment probe: the Windows Computer Use Sky runtime was unavailable, so no safe GUI import or screenshot run was performed. No physical-device or WeChat GUI result is claimed by this file. Until the tools/devices are actually exercised, Task 10 remains `device-pending` even when automated tests and builds pass.
