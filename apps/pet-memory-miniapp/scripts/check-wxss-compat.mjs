import { readFileSync, readdirSync, statSync } from 'fs'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUILD_DIR = join(__dirname, '..', 'dist', 'build', 'mp-weixin')

const FORBIDDEN = [
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

const files = collectWxss(BUILD_DIR)
if (files.length === 0) {
  console.error('ERROR: No .wxss files found in', BUILD_DIR)
  process.exit(1)
}

let failures = 0
for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  for (const { pattern, label } of FORBIDDEN) {
    if (pattern.test(content)) {
      const rel = file.replace(BUILD_DIR, '')
      const match = content.match(pattern)
      const ctx = match ? content.slice(Math.max(0, match.index - 20), match.index + 20) : ''
      console.error(`[WXSS COMPAT FAIL] ${rel}: contains ${label}  ...${ctx}...`)
      failures++
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} WXSS compatibility issue(s) found. Fix source SCSS and rebuild.`)
  process.exit(1)
}

console.log(`[WXSS COMPAT OK] ${files.length} file(s) checked — no * or :root found.`)
