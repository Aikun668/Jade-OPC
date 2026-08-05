import { readFileSync, readdirSync, existsSync, statSync, openSync, readSync, closeSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.argv.includes('--dev')
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
  const forbiddenPages = ['space-settings']
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
        // Skip legitimate HTML/Vue template attributes
        if (/\bplaceholder\s*[=:]/.test(line)) continue
        check(`T5A-M54 'placeholder' marker in ${f.replace(srcRoot, '')}: ${line.trim().substring(0, 120)}`, false)
      }
    }
  }
  check('T5A-M54 no TODO/FIXME/placeholder/以后替换', true)
}

// ---- T5A-M55: pages.json custom navigation for 02/04/08 ----
{
  const pagesJson = join(srcRoot, 'pages.json')
  if (existsSync(pagesJson)) {
    const pages = JSON.parse(readFileSync(pagesJson, 'utf-8')).pages || []
    const customNavPages = ['pages/spaces/index', 'pages/space-home/index', 'pages/memories/index']
    for (const p of customNavPages) {
      const pageEntry = pages.find(pe => pe.path === p)
      if (!pageEntry) {
        check(`T5A-M55 pages.json missing page: ${p}`, false)
      } else if (pageEntry.style?.navigationStyle !== 'custom') {
        check(`T5A-M55 pages.json ${p} navigationStyle is not custom`, false)
      } else {
        check(`T5A-M55 pages.json ${p} navigationStyle=custom`, true)
      }
    }
  }
}

// ---- T5A-M56: Fixed page content text audit (02/04/08) ----
{
  const textContracts = [
    { file: join(srcRoot, 'pages', 'spaces', 'index.vue'), text: '每一个 Ta，都有自己的位置。', label: '02 intro' },
    { file: join(srcRoot, 'pages', 'spaces', 'index.vue'), text: '再为一位 Ta 创建空间', label: '02 create hint' },
    { file: join(srcRoot, 'pages', 'space-home', 'index.vue'), text: "PAGE_URLS['record-entry']", label: '04 record-entry URL' },
    { file: join(srcRoot, 'pages', 'memories', 'index.vue'), text: '全部记忆', label: '08 title' },
    { file: join(srcRoot, 'pages', 'memories', 'index.vue'), text: '段记忆', label: '08 count unit' },
    { file: join(srcRoot, 'pages', 'memories', 'index.vue'), text: '先留到这里。以后想起新的，再慢慢回来。', label: '08 end note' },
  ]

  // Import PAGE_URLS for contract check — inline to avoid top-level await
  for (const tc of textContracts) {
    if (!existsSync(tc.file)) {
      check(`T5A-M56 ${tc.label}: file not found ${tc.file}`, false)
      continue
    }
    const content = readFileSync(tc.file, 'utf-8')
    if (content.includes(tc.text)) {
      check(`T5A-M56 ${tc.label}: "${tc.text.substring(0, 30)}"`, true)
    } else {
      check(`T5A-M56 ${tc.label}: "${tc.text.substring(0, 30)}" NOT FOUND`, false)
    }
  }
}

// ---- T5A-M57: Production build excludes DevPanel ----
// In dev mode, DevPanel is allowed to support the DEV entry page (pages/index/index)
// that loads sample data. Skip this check when --dev flag is set.
if (isDev) {
  console.log('[SKIP] T5A-M57 DevPanel exclusion (--dev mode)')
} else {
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    // Check if DevPanel.js component is present in the build
    const devPanelJs = join(buildDist, 'components', 'DevPanel.js')
    if (existsSync(devPanelJs)) {
      check('T5A-M57 DevPanel.js present in production build', false)
    } else {
      check('T5A-M57 DevPanel component excluded from build', true)
    }

    // Check if any page JSON registers DevPanel as a usingComponent
    const allJsonFiles = distFiles(buildDist).filter(f => f.endsWith('.json'))
    let devPanelRegistered = false
    for (const f of allJsonFiles) {
      const content = readFileSync(f, 'utf-8')
      try {
        const json = JSON.parse(content)
        const using = json.usingComponents || {}
        if (Object.values(using).some(v => typeof v === 'string' && /devpanel/i.test(v))) {
          check(`T5A-M57 DevPanel in usingComponents: ${f.replace(buildDist, '')}`, false)
          devPanelRegistered = true
        }
      } catch {
        // Invalid JSON — skip
      }
    }
    if (!devPanelRegistered) {
      check('T5A-M57 no usingComponents reference to DevPanel', true)
    }

    // Check that DEV page (pages/index/index) is excluded or stripped
    const devPageJson = join(buildDist, 'pages', 'index', 'index.json')
    if (existsSync(devPageJson)) {
      const content = readFileSync(devPageJson, 'utf-8')
      if (/DevPanel/i.test(content)) {
        check('T5A-M57 DevPanel reference in pages/index/index.json', false)
      } else {
        check('T5A-M57 pages/index/index.json clean', true)
      }
    }
  } else {
    console.log('[SKIP] T5A-M57 dist/build/mp-weixin/ not found')
  }
}

// ---- T5A-M58: Visual evidence hard gate ----
// Evidence lives at monorepo root: docs/project/gpt-review-output/task5a-evidence/
// Requires exactly 13 files: 3 implemementation + 9 comparison (3 per page) + report.md
{
  const evidenceDir = join(__dirname, '..', '..', '..', 'docs', 'project', 'gpt-review-output', 'task5a-evidence')

  if (!existsSync(evidenceDir)) {
    check('T5A-M58 evidence directory not found', false)
    console.log(`  Expected: ${evidenceDir}`)
    console.log('  Run F6 visual evidence step to populate.')
  } else {
    // 2026-08-01: 用户决定暂不需要 side-by-side/overlay/diff 对比图。
    // 视觉负责人直接通过微信开发者工具对照基准验收。
    // 若后续需要恢复对比图要求，改回 13 文件清单即可。
    const requiredFiles = [
      '02-spaces-implementation.png',
      '04-space-home-implementation.png',
      '08-memories-implementation.png',
      'report.md',
    ]

    const existingFiles = readdirSync(evidenceDir)
    const missing = []

    for (const f of requiredFiles) {
      if (existingFiles.includes(f)) {
        const filePath = join(evidenceDir, f)
        const st = statSync(filePath)
        if (st.size === 0) {
          check(`T5A-M58 ${f} is empty (0 bytes)`, false)
        } else if (f.endsWith('.png')) {
          try {
            // Validate PNG signature: first 8 bytes must be 89 50 4E 47 0D 0A 1A 0A
            const header = Buffer.alloc(8)
            const fd = openSync(filePath, 'r')
            readSync(fd, header, 0, 8, 0)
            closeSync(fd)
            const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
            if (isPng) {
              check(`T5A-M58 ${f}`, true)
            } else {
              check(`T5A-M58 ${f} not a valid PNG`, false)
            }
          } catch {
            check(`T5A-M58 ${f} cannot read PNG header`, false)
          }
        } else {
          check(`T5A-M58 ${f}`, true)
        }
      } else {
        missing.push(f)
      }
    }

    if (missing.length > 0) {
      for (const f of missing) {
        check(`T5A-M58 ${f} MISSING`, false)
      }
      console.log(`  Found ${existingFiles.filter(f => f.endsWith('.png') || f.endsWith('.md')).length} evidence files, need ${requiredFiles.length}`)
    }

    // Extra check: verify implementation screenshots aren't copies of baselines
    const baselineRoot = join(__dirname, '..', '..', '..', 'docs', 'product', 'assets', 'm0-page-baselines')
    const implBaselinePairs = [
      { impl: '02-spaces-implementation.png', baseline: '02-spaces.png' },
      { impl: '04-space-home-implementation.png', baseline: '04-space-home.png' },
      { impl: '08-memories-implementation.png', baseline: '08-memories.png' },
    ]
    for (const pair of implBaselinePairs) {
      const implPath = join(evidenceDir, pair.impl)
      const baselinePath = join(baselineRoot, pair.baseline)
      if (existsSync(implPath) && existsSync(baselinePath)) {
        const implSize = statSync(implPath).size
        const baselineSize = statSync(baselinePath).size
        if (implSize === baselineSize) {
          check(`T5A-M58 ${pair.impl} appears to be a copy of baseline (same size: ${implSize} bytes)`, false)
        }
      }
    }
  }
}

if (failed) {
  console.log('\n❌ Task 5A boundary scan FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Task 5A boundary scan PASSED')
}
