import { readFileSync, readdirSync, statSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Allow override via --dir flag (for testing)
const dirArg = process.argv.find(a => a.startsWith('--dir='))
const BUILD_DIR = dirArg
  ? dirArg.slice('--dir='.length)
  : join(__dirname, '..', 'dist', 'build', 'mp-weixin')

// WeChat mini-program tag names that cannot appear as selectors in component WXSS
const TAG_NAMES = [
  'page', 'view', 'text', 'image', 'button', 'input', 'textarea',
  'scroll-view', 'swiper', 'swiper-item', 'icon', 'label', 'navigator',
  'video', 'map', 'canvas', 'picker', 'picker-view',
]

const FORBIDDEN_ALL = [
  { pattern: /(?<![a-zA-Z0-9_-])\*(?!\/)/, label: 'universal selector *' },
  { pattern: /:root\b/, label: ':root pseudo-class' },
]

function collectWxss(dir) {
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

/** Strip property blocks {…} and comments, leaving selector text only. */
function stripPropertyBlocks(css) {
  let result = css.replace(/\/\*[\s\S]*?\*\//g, '') // comments
    .replace(/@import\s+[^;]+;/g, '')                // @import
  for (let i = 0; i < 3; i++) {
    result = result.replace(/\{[^{}]*\}/g, '{}')     // flatten {…} blocks
  }
  return result
}

const files = collectWxss(BUILD_DIR)
if (files.length === 0) {
  console.error('ERROR: No .wxss files found in', BUILD_DIR)
  process.exit(1)
}

let failures = 0

function fail(file, label, ctx) {
  const rel = file.replace(BUILD_DIR, '')
  console.error(`[WXSS COMPAT FAIL] ${rel}: ${label}  ...${ctx}...`)
  failures++
}

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const rel = file.replace(/\\/g, '/')

  // ---- All WXSS: forbid * and :root ----
  for (const { pattern, label } of FORBIDDEN_ALL) {
    if (pattern.test(content)) {
      const match = content.match(pattern)
      const ctx = match ? content.slice(Math.max(0, match.index - 20), match.index + 20) : ''
      fail(file, label, ctx)
    }
  }

  // ---- Component WXSS only: forbid tag / ID / attribute selectors ----
  if (rel.includes('/components/')) {
    const selectors = stripPropertyBlocks(content)

    // Tag selectors: known mini-program tags at selector start
    const tagPattern = new RegExp(
      `(?:^|\\}|\\,)\\s*(${TAG_NAMES.join('|')})\\b`,
      'gm',
    )
    let m
    while ((m = tagPattern.exec(selectors)) !== null) {
      const ctx = selectors.slice(Math.max(0, m.index - 5), m.index + m[1].length + 15)
      fail(file, `tag selector "${m[1]}" in component`, ctx)
    }

    // ID selectors
    const idPattern = /#[a-zA-Z]/g
    while ((m = idPattern.exec(selectors)) !== null) {
      const ctx = selectors.slice(Math.max(0, m.index - 5), m.index + 15)
      fail(file, 'ID selector in component', ctx)
    }

    // Attribute selectors
    const attrPattern = /\[[a-z][a-zA-Z-]*/g
    while ((m = attrPattern.exec(selectors)) !== null) {
      const ctx = selectors.slice(Math.max(0, m.index - 5), m.index + 15)
      fail(file, 'attribute selector in component', ctx)
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} WXSS compatibility issue(s) found. Fix source SCSS and rebuild.`)
  process.exit(1)
}

console.log(`[WXSS COMPAT OK] ${files.length} file(s) checked — no forbidden selectors found.`)
