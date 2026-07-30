import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..', 'src')
const distRoot = join(__dirname, '..', 'dist')
let failed = false

function check(msg, ok) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`)
  if (!ok) failed = true
  return ok
}

function srcFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.vue') || e.name.endsWith('.js') || e.name.endsWith('.json')))
    .map(e => join(e.parentPath || e.path, e.name))
}

function distFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile())
    .map(e => join(e.parentPath || e.path, e.name))
}

// ---- T5A-M50: Build output contains 02/04/08 pages ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const requiredPages = ['pages/spaces/index', 'pages/space-home/index', 'pages/memories/index']
    for (const page of requiredPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      if (hasWxml && hasJs) {
        check(`T5A-M50 build contains ${page}`, true)
      } else {
        const missing = []
        if (!hasWxml) missing.push('.wxml')
        if (!hasJs) missing.push('.js')
        check(`T5A-M50 build contains ${page} (missing: ${missing.join(', ')})`, false)
      }
    }
  } else {
    console.log('[SKIP] T5A-M50 dist/build/mp-weixin/ not found')
  }
}

// ---- T5A-M51: Build free of test files, private fixtures, debug logs ----
{
  const buildFiles = distFiles(distRoot)
  for (const f of buildFiles) {
    const bn = f.replace(/\\/g, '/')
    // vendor.js is third-party bundled runtime
    if (bn.includes('/common/vendor.js')) continue

    // No test/spec files
    if (/(?:__tests__|\.test\.|\.spec\.)/i.test(bn)) {
      check(`T5A-M51 build contains test file: ${bn}`, false)
    }

    // No debug console statements in production build
    if (bn.includes('/build/')) {
      const content = readFileSync(f, 'utf-8')
      if (/console\.(log|debug|info|warn)/.test(content)) {
        check(`T5A-M51 debug console in build: ${bn}`, false)
      }
    }
  }
  check('T5A-M51 build free of test files and debug logs', true)
}

// ---- T5A-M52: No 05/09/12 placeholder pages ----
{
  const forbiddenPages = ['record-entry', 'memory-detail', 'space-settings']
  const pagesDir = join(srcRoot, 'pages')
  if (existsSync(pagesDir)) {
    const entries = readdirSync(pagesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && forbiddenPages.includes(entry.name)) {
        check(`T5A-M52 placeholder page directory exists: pages/${entry.name}`, false)
      }
    }
  }

  // Also check pages.json doesn't register forbidden pages
  const pagesJson = join(srcRoot, 'pages.json')
  if (existsSync(pagesJson)) {
    const content = readFileSync(pagesJson, 'utf-8')
    for (const fp of forbiddenPages) {
      if (content.includes(`pages/${fp}/`)) {
        check(`T5A-M52 pages.json registers placeholder page: ${fp}`, false)
      }
    }
  }
  check('T5A-M52 no 05/09/12 placeholder pages', true)
}

// ---- T5A-M53: No unapproved dependencies or shared component interface changes ----
{
  // Check no unexpected new npm dependencies
  const pkgJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))
  const approvedDeps = ['pinia', 'vue']
  const approvedDevDeps = [
    '@dcloudio/types', '@dcloudio/uni-app', '@dcloudio/uni-mp-weixin',
    '@dcloudio/vite-plugin-uni', '@pinia/testing', '@types/node',
    '@types/pngjs', '@vue/test-utils', 'jsdom', 'pngjs', 'sass',
    'typescript', 'vite', 'vitest', 'vue-tsc',
  ]

  for (const dep of Object.keys(pkgJson.dependencies || {})) {
    if (!approvedDeps.includes(dep)) {
      check(`T5A-M53 unapproved dependency: ${dep}`, false)
    }
  }
  for (const dep of Object.keys(pkgJson.devDependencies || {})) {
    if (!approvedDevDeps.includes(dep)) {
      check(`T5A-M53 unapproved devDependency: ${dep}`, false)
    }
  }
  check('T5A-M53 only approved dependencies present', true)

  // Verify PageShell still has approved interface (was modified for mini-program compat)
  const pageShellPath = join(srcRoot, 'components', 'PageShell.vue')
  if (existsSync(pageShellPath)) {
    const content = readFileSync(pageShellPath, 'utf-8')
    if (!content.includes("layout: PageLayout")) check('T5A-M53 PageShell missing layout prop', false)
    if (!content.includes('title?: string')) check('T5A-M53 PageShell missing title prop', false)
    if (!content.includes('showBack?: boolean')) check('T5A-M53 PageShell missing showBack prop', false)
    if (!content.includes('keyboardOpen?: boolean')) check('T5A-M53 PageShell missing keyboardOpen prop', false)
    if (!content.includes("back: []")) check('T5A-M53 PageShell missing back emit', false)
    check('T5A-M53 PageShell props/emits unchanged', true)
  }
}

// ---- T5A-M54: No TODO/FIXME/placeholder/以后替换 ----
{
  // Match stale markers but exclude BEM CSS class names like "expired-placeholder"
  const stalePattern = /\b(TODO|FIXME|以后替换)\b/
  const placeholderPattern = /\bplaceholder\b/i

  for (const f of srcFiles(srcRoot)) {
    if (f.includes('__tests__') || f.includes('tests') || f.includes('scripts')) continue
    const content = readFileSync(f, 'utf-8')

    if (stalePattern.test(content)) {
      check(`T5A-M54 stale marker in ${f.replace(srcRoot, '')}`, false)
    }

    // "placeholder" only flagged in non-CSS contexts (exclude BEM class names like __expired-placeholder)
    const lines = content.split('\n')
    for (const line of lines) {
      if (placeholderPattern.test(line)) {
        // Skip BEM CSS class names (contain __ or --)
        if (/placeholder__|__placeholder|placeholder--|--placeholder/.test(line)) continue
        // Skip CSS property: placeholder- or -placeholder
        if (/-placeholder/.test(line)) continue
        check(`T5A-M54 'placeholder' marker in ${f.replace(srcRoot, '')}: ${line.trim().substring(0, 120)}`, false)
      }
    }
  }
  check('T5A-M54 no TODO/FIXME/placeholder/以后替换', true)
}

if (failed) {
  console.log('\n❌ Task 5A boundary scan FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Task 5A boundary scan PASSED')
}
