import { readFileSync, readdirSync, statSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dirArg = process.argv.find(a => a.startsWith('--dir='))
const BUILD_DIR = dirArg
  ? dirArg.slice('--dir='.length)
  : join(__dirname, '..', 'dist', 'build', 'mp-weixin')

const componentsDir = join(BUILD_DIR, 'components')
const pagesDir = join(BUILD_DIR, 'pages')

// Components/pages known to use <button> elements (from source grep)
const BUTTON_FILES = [
  'components/DraftNotice.wxss',
  'components/MemoryEntry.wxss',
  'components/PageShell.wxss',
  'components/PrimaryButton.wxss',
  'components/TextAction.wxss',
  'pages/spaces/index.wxss',
]

// List-item buttons that must have text-align: left
const LIST_ITEM_FILES = [
  'components/MemoryEntry.wxss',
  'pages/spaces/index.wxss',
]

function collectWxss(dir) {
  if (!exists(dir)) return []
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...collectWxss(full))
    } else if (extname(entry) === '.wxss') {
      out.push(full)
    }
  }
  return out
}

function exists(p) {
  try { statSync(p); return true } catch { return false }
}

let failed = false

function check(msg, ok) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`)
  if (!ok) failed = true
  return ok
}

// ---- Step 1: Verify ::after reset in all button components ----
for (const relPath of BUTTON_FILES) {
  const fullPath = join(BUILD_DIR, relPath)
  if (!exists(fullPath)) {
    check(`Button reset: ${relPath} not found in build`, false)
    continue
  }

  const content = readFileSync(fullPath, 'utf-8')

  // Check ::after / :after reset exists (uni-app may compress double-colon to single-colon)
  const hasAfterReset = /:after\s*\{[^}]*border\s*:\s*none/.test(content)
    || /:after\s*\{[^}]*display\s*:\s*none/.test(content)
    || /:after\s*\{[^}]*content\s*:\s*none/.test(content)

  check(`Button reset: ${relPath} has ::after { border: none }`, hasAfterReset)
}

// ---- Step 2: Verify list-item buttons have text-align: left ----
for (const relPath of LIST_ITEM_FILES) {
  const fullPath = join(BUILD_DIR, relPath)
  if (!exists(fullPath)) continue

  const content = readFileSync(fullPath, 'utf-8')

  // Check if any button-like class rule block has text-align: left
  const hasTextAlignLeft = /text-align\s*:\s*left/.test(content)

  check(`List button: ${relPath} has text-align: left`, hasTextAlignLeft)
}

// ---- Step 3: Verify no button tag selector in component WXSS (already covered by compat check, double-check) ----
for (const f of collectWxss(componentsDir)) {
  const content = readFileSync(f, 'utf-8')
  // Strip property values to avoid false positives (e.g. content: "button")
  const selectors = content.replace(/\{[^}]*\}/g, '{}')
  if (/(?:^|\}|,)\s*button\b/.test(selectors)) {
    const rel = f.replace(BUILD_DIR, '')
    check(`Button reset: ${rel} uses button tag selector`, false)
  }
}

if (failed) {
  console.log('\n❌ Button reset check FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Button reset check PASSED')
}
