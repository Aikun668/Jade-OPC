import { readFileSync, existsSync } from 'fs'
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

// ---- T9-V01: New/modified page source files exist ----
check('T9-V01 src/pages/space-settings/index.vue exists', existsSync(join(srcRoot, 'pages', 'space-settings', 'index.vue')))
check('T9-V02 src/pages/privacy/index.vue exists', existsSync(join(srcRoot, 'pages', 'privacy', 'index.vue')))

// ---- T9-V03: pages.json entries ----
{
  const pagesJsonPath = join(srcRoot, 'pages.json')
  const raw = readFileSync(pagesJsonPath, 'utf-8')
  const config = JSON.parse(raw)
  const paths = config.pages.map(p => p.path)
  check('T9-V03 pages.json contains pages/space-settings/index', paths.includes('pages/space-settings/index'))
  check('T9-V04 pages.json contains pages/privacy/index', paths.includes('pages/privacy/index'))

  const ssEntry = config.pages.find(p => p.path === 'pages/space-settings/index')
  check('T9-V05 space-settings has navigationStyle: custom', ssEntry?.style?.navigationStyle === 'custom')
}

// ---- T9-V06: Test files exist ----
check('T9-V06 tests/components/space-settings-page.test.ts exists', existsSync(join(testRoot, 'components', 'space-settings-page.test.ts')))
check('T9-V07 tests/components/privacy-page.test.ts exists', existsSync(join(testRoot, 'components', 'privacy-page.test.ts')))

// ---- T9-V08: Route parsers have new functions ----
{
  const routePath = join(srcRoot, 'features', 'routing', 'route-params.ts')
  const content = readFileSync(routePath, 'utf-8')
  check('T9-V08 route-params.ts exports parseSpaceSettingsRoute', content.includes('export function parseSpaceSettingsRoute'))
  check('T9-V09 route-params.ts exports parsePrivacyRoute', content.includes('export function parsePrivacyRoute'))
}

// ---- T9-V10: Types have PrivacySource and PRIVACY_SOURCES ----
{
  const typesPath = join(srcRoot, 'types', 'routes.ts')
  const content = readFileSync(typesPath, 'utf-8')
  check('T9-V10 routes.ts exports PrivacySource', content.includes("export type PrivacySource"))
  check('T9-V11 routes.ts exports PRIVACY_SOURCES', content.includes('export const PRIVACY_SOURCES'))
}

// ---- T9-V12: Navigation PAGE_URLS has privacy and space-settings ----
{
  const navPath = join(srcRoot, 'adapters', 'navigation.ts')
  const content = readFileSync(navPath, 'utf-8')
  check('T9-V12 navigation.ts PAGE_URLS has privacy', content.includes("privacy:"))
  check('T9-V13 navigation.ts PAGE_URLS has space-settings', content.includes("'space-settings'"))
}

// ---- T9-V14: memory-detail page has delete functionality ----
{
  const mdPath = join(srcRoot, 'pages', 'memory-detail', 'index.vue')
  const content = readFileSync(mdPath, 'utf-8')
  check('T9-V14 memory-detail imports ConfirmDialog', content.includes('ConfirmDialog'))
  check('T9-V15 memory-detail uses deleteMemory', content.includes('deleteMemory'))
  check('T9-V16 memory-detail has delete button text', content.includes('删除这段记忆'))
}

// ---- T9-V17: space-settings page has delete functionality ----
{
  const ssPath = join(srcRoot, 'pages', 'space-settings', 'index.vue')
  const content = readFileSync(ssPath, 'utf-8')
  check('T9-V17 space-settings imports ConfirmDialog', content.includes('ConfirmDialog'))
  check('T9-V18 space-settings uses deleteSpace', content.includes('deleteSpace'))
  check('T9-V19 space-settings uses resetTo spaces', content.includes("resetTo({ page: 'spaces' })") || content.includes("resetTo({page:'spaces'})"))
}

// ---- T9-V20: privacy page uses parsePrivacyRoute ----
{
  const pPath = join(srcRoot, 'pages', 'privacy', 'index.vue')
  const content = readFileSync(pPath, 'utf-8')
  check('T9-V20 privacy page uses parsePrivacyRoute', content.includes('parsePrivacyRoute'))
}

// ---- T9-V21: Build output contains space-settings page ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const hasWxml = existsSync(join(buildDist, 'pages/space-settings/index.wxml'))
    const hasJs = existsSync(join(buildDist, 'pages/space-settings/index.js'))
    check('T9-V21 build contains space-settings page', hasWxml && hasJs)
  } else {
    console.log('[SKIP] T9-V21 dist/build/mp-weixin/ not found')
  }
}

// ---- T9-V22: Regression — all critical pages still in build ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const criticalPages = [
      'pages/onboarding/index',
      'pages/spaces/index',
      'pages/space-home/index',
      'pages/space-create/index',
      'pages/memories/index',
      'pages/memory-detail/index',
      'pages/privacy/index',
      'pages/record-entry/index',
      'pages/record-text/index',
      'pages/record-photo/index',
    ]
    for (const page of criticalPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      check(`T9-V22 build contains ${page}`, hasWxml && hasJs)
    }
  } else {
    console.log('[SKIP] T9-V22 dist/build/mp-weixin/ not found')
  }
}

// ---- T9-V23: Memory store has deleteMemory and deleteSpace ----
{
  const storePath = join(srcRoot, 'stores', 'memory.ts')
  const content = readFileSync(storePath, 'utf-8')
  check('T9-V23 memory store has deleteMemory action', content.includes('deleteMemory'))
  check('T9-V24 memory store has deleteSpace action', content.includes('deleteSpace'))
}

// ---- T9-V25: Repository has deleteMemory and deleteSpace ----
{
  const repoTypePath = join(srcRoot, 'types', 'repository.ts')
  const content = readFileSync(repoTypePath, 'utf-8')
  check('T9-V25 repository type has deleteMemory', content.includes('deleteMemory'))
  check('T9-V26 repository type has deleteSpace', content.includes('deleteSpace'))
}

// ---- T9-V27: No broken placeholder remains ----
{
  const ssPath = join(srcRoot, 'pages', 'space-settings', 'index.vue')
  const content = readFileSync(ssPath, 'utf-8')
  const hasPlaceholder = content.includes('Placeholder — deletion implementation')
  check('T9-V27 no deletion placeholder in space-settings', !hasPlaceholder)
}

// ---- Summary ----
console.log('')
if (failed) {
  console.log('Verify:task9 FAILED — see failures above')
  process.exit(1)
} else {
  console.log('Verify:task9 PASSED')
  process.exit(0)
}
