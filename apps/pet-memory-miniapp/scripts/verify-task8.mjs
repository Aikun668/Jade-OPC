import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..', 'src')
const distRoot = join(__dirname, '..', 'dist')
const testRoot = join(__dirname, '..', 'tests')
let failed = false

function check(msg, ok) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`)
  if (!ok) failed = true
  return ok
}

// ---- T8-V01: New page source files exist ----
check('T8-V01 src/pages/memory-edit/index.vue exists', existsSync(join(srcRoot, 'pages', 'memory-edit', 'index.vue')))
check('T8-V02 src/pages/ai-draft/index.vue exists', existsSync(join(srcRoot, 'pages', 'ai-draft', 'index.vue')))

// ---- T8-V03: pages.json entries ----
{
  const pagesJsonPath = join(srcRoot, 'pages.json')
  const fs = await import('fs')
  const raw = fs.readFileSync(pagesJsonPath, 'utf-8')
  const config = JSON.parse(raw)
  const paths = config.pages.map(p => p.path)
  check('T8-V03 pages.json contains pages/memory-edit/index', paths.includes('pages/memory-edit/index'))
  check('T8-V04 pages.json contains pages/ai-draft/index', paths.includes('pages/ai-draft/index'))

  // Verify custom navigationStyle
  const memEdit = config.pages.find(p => p.path === 'pages/memory-edit/index')
  const aiDraft = config.pages.find(p => p.path === 'pages/ai-draft/index')
  check('T8-V05 memory-edit has navigationStyle: custom', memEdit?.style?.navigationStyle === 'custom')
  check('T8-V06 ai-draft has navigationStyle: custom', aiDraft?.style?.navigationStyle === 'custom')
}

// ---- T8-V07: New service files exist ----
check('T8-V07 src/services/ai-draft-service.ts exists', existsSync(join(srcRoot, 'services', 'ai-draft-service.ts')))
check('T8-V08 src/services/ai-draft-service-deps.ts exists', existsSync(join(srcRoot, 'services', 'ai-draft-service-deps.ts')))
check('T8-V09 src/services/mock-ai-draft-service.ts exists', existsSync(join(srcRoot, 'services', 'mock-ai-draft-service.ts')))
check('T8-V10 src/types/ai.ts exists', existsSync(join(srcRoot, 'types', 'ai.ts')))

// ---- T8-V11: Test files exist ----
check('T8-V11 tests/components/memory-edit-page.test.ts exists', existsSync(join(testRoot, 'components', 'memory-edit-page.test.ts')))
check('T8-V12 tests/components/ai-draft-page.test.ts exists', existsSync(join(testRoot, 'components', 'ai-draft-page.test.ts')))

// ---- T8-V13: Build output contains new pages ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const newPages = ['pages/memory-edit/index', 'pages/ai-draft/index']
    for (const page of newPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      if (hasWxml && hasJs) {
        check(`T8-V13 build contains ${page}`, true)
      } else {
        const missing = []
        if (!hasWxml) missing.push('.wxml')
        if (!hasJs) missing.push('.js')
        check(`T8-V13 build contains ${page} (missing: ${missing.join(', ')})`, false)
      }
    }
  } else {
    console.log('[SKIP] T8-V13 dist/build/mp-weixin/ not found')
  }
}

// ---- T8-V14: No regressions — critical pages still in build ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const criticalPages = [
      'pages/spaces/index',
      'pages/space-home/index',
      'pages/memories/index',
      'pages/memory-detail/index',
      'pages/record-entry/index',
      'pages/record-text/index',
      'pages/record-photo/index',
    ]
    for (const page of criticalPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      check(`T8-V14 build contains ${page}`, hasWxml && hasJs)
    }
  }
}

// ---- T8-V15: Navigation PAGE_URLS has new entries ----
{
  const navFilePath = join(srcRoot, 'adapters', 'navigation.ts')
  const fs = await import('fs')
  const content = fs.readFileSync(navFilePath, 'utf-8')
  check('T8-V15 navigation.ts contains memory-edit URL', content.includes("'memory-edit'"))
  check('T8-V16 navigation.ts contains ai-draft URL', content.includes("'ai-draft'"))
  check('T8-V17 navigation.ts has StableDestination.memory-detail with source', content.includes('source'))
}

// ---- T8-V18: Route parser has parseMemoryDetailRoute ----
{
  const routeFilePath = join(srcRoot, 'features', 'routing', 'route-params.ts')
  const fs = await import('fs')
  const content = fs.readFileSync(routeFilePath, 'utf-8')
  check('T8-V18 route-params.ts exports parseMemoryDetailRoute', content.includes('export function parseMemoryDetailRoute'))
}

// ---- Summary ----
console.log('')
if (failed) {
  console.log('Verify:task8 FAILED — see failures above')
  process.exit(1)
} else {
  console.log('Verify:task8 PASSED')
  process.exit(0)
}
