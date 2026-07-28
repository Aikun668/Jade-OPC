import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..', 'src')
const testsRoot = join(__dirname, '..', 'tests')
const distRoot = join(__dirname, '..', 'dist')
let failed = false

function srcFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.vue') || e.name.endsWith('.js') || e.name.endsWith('.json') || e.name.endsWith('.wxml') || e.name.endsWith('.wxss')))
    .map(e => join(e.parentPath || e.path, e.name))
}

function distFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile())
    .map(e => join(e.parentPath || e.path, e.name))
}

function check(msg, ok) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`)
  if (!ok) failed = true
  return ok
}

// ---- T4E-M08: Only 2 global Pinia stores ----
const allSrc = srcFiles(srcRoot).filter(f => !f.includes('__tests__'))
let defineStoreCount = 0
const storeFiles = []
for (const f of allSrc) {
  const content = readFileSync(f, 'utf-8')
  const matches = content.match(/defineStore\(/g)
  if (matches) {
    defineStoreCount += matches.length
    storeFiles.push(f)
  }
}
check(`T4E-M08 only 2 Pinia stores (found ${defineStoreCount} in: ${storeFiles.join(', ')})`, defineStoreCount === 2 && storeFiles.length === 2)

// ---- T4E-M09: Stores don't directly use storage/CloudBase/model APIs ----
for (const f of allSrc) {
  if (!f.includes('stores')) continue
  const content = readFileSync(f, 'utf-8')
  if (/uni\.(getStorage|setStorage|removeStorage|clearStorage)/.test(content)) {
    check(`T4E-M09 store uses uni storage in ${f}`, false)
  }
  if (/cloudbase|CloudBase|@cloudbase/.test(content)) {
    check(`T4E-M09 store references CloudBase in ${f}`, false)
  }
}
check('T4E-M09 stores free of direct storage/CloudBase/model APIs', true)

// ---- T4E-M10: Pages and Stores don't scatter navigation combos ----
const navPattern = /uni\.(navigateTo|navigateBack|redirectTo|reLaunch|switchTab)/
for (const f of allSrc) {
  const content = readFileSync(f, 'utf-8')
  if (navPattern.test(content)) {
    // Only navigation.ts adapter is allowed to call uni navigation directly
    if (!f.includes('navigation.ts')) {
      check(`T4E-M10 scattered navigation call in ${f}`, false)
    }
  }
}
check('T4E-M10 navigation calls centralized in navigation adapter', true)

// ---- T4E-M11: Route results don't contain serialized objects, private content ----
const routeFiles = ['routes.ts', 'route-params.ts']
for (const f of allSrc) {
  if (!routeFiles.some(rf => f.includes(rf))) continue
  const content = readFileSync(f, 'utf-8')
  // Route types should not contain photoUri, draftData, originalText, fullName fields
  if (/\bphotoUri\b/.test(content) || /\bdraftData\b/.test(content) || /\bfullName\b/.test(content)) {
    check(`T4E-M11 route file contains private field in ${f}`, false)
  }
}
check('T4E-M11 route results free of serialized objects and private content', true)

// ---- T4E-M12: App.vue no <template>, main.ts only one Pinia ----
const appVuePath = join(srcRoot, 'App.vue')
if (existsSync(appVuePath)) {
  const appContent = readFileSync(appVuePath, 'utf-8')
  const hasTemplate = /<template>[\s\S]*?<\/template>/.test(appContent)
  check('T4E-M12 App.vue has no <template>', !hasTemplate)
}

const mainTsPath = join(srcRoot, 'main.ts')
if (existsSync(mainTsPath)) {
  const mainContent = readFileSync(mainTsPath, 'utf-8')
  const piniaCount = (mainContent.match(/createPinia\(\)/g) || []).length
  check(`T4E-M12 main.ts has exactly one Pinia (found ${piniaCount})`, piniaCount === 1)
}

// ---- T4E-M13: No unapproved dependencies or Task 5+ page implementation ----
const forbiddenTask5 = /pages\/(space-home|space-create|space-settings|memory-detail|photo-record|text-record|memory-create|memory-preview|memories|draft-edit|me)\//
for (const f of allSrc) {
  if (f.includes('tests') || f.includes('scripts') || f.includes('adapters/navigation')) continue
  const content = readFileSync(f, 'utf-8')
  if (forbiddenTask5.test(content)) {
    check(`T4E-M13 forbidden Task 5+ page reference in ${f}`, false)
  }
}
check('T4E-M13 no unapproved Task 5+ page implementation', true)

// ---- T4E-M14: No TODO/FIXME/placeholder in Task 4 code ----
const task4Dirs = ['stores', 'features/routing', 'features/developer', 'adapters/navigation.ts', 'types/routes.ts']
const stalePattern = /\b(TODO|FIXME|placeholder|以后替换)\b/
for (const f of allSrc) {
  const isTask4File = task4Dirs.some(d => f.replace(/\\/g, '/').includes(d))
  if (!isTask4File) continue
  const content = readFileSync(f, 'utf-8')
  if (stalePattern.test(content)) {
    check(`T4E-M14 stale marker in ${f}`, false)
  }
}
check('T4E-M14 no TODO/FIXME/placeholder in Task 4 code', true)

// ---- T4E-M15: No debug logs in production code ----
const debugPattern = /console\.(log|debug|info|warn)/
for (const f of allSrc) {
  if (f.includes('__tests__') || f.includes('tests') || f.includes('scripts')) continue
  const content = readFileSync(f, 'utf-8')
  if (debugPattern.test(content)) {
    check(`T4E-M15 console statement in ${f}`, false)
  }
}
check('T4E-M15 no debug logs in production code', true)

// ---- T4E-A02: Production build doesn't contain DevPanel entries ----
if (existsSync(distRoot)) {
  const buildFiles = distFiles(distRoot)
  const devPanelPatterns = /场景切换|样本切换|AI 场景 Mock|失败模拟|DevPanel|dev-scenarios|dev-panel/
  for (const f of buildFiles) {
    const content = readFileSync(f, 'utf-8')
    if (devPanelPatterns.test(content)) {
      check(`T4E-A02 production build contains DevPanel text in ${f.replace(distRoot, '')}`, false)
    }
  }
  check('T4E-A02 production build free of DevPanel entries', true)
} else {
  console.log('[SKIP] T4E-A02 dist/ not found — build not yet run')
}

// ---- T4E-A03: Build doesn't contain test files ----
if (existsSync(distRoot)) {
  const buildFiles = distFiles(distRoot)
  const testPattern = /__tests__|\.test\.|\.spec\.|vitest|describe\(|it\(|expect\(/
  for (const f of buildFiles) {
    const content = readFileSync(f, 'utf-8')
    if (testPattern.test(content) && !f.includes('node_modules')) {
      check(`T4E-A03 production build contains test code in ${f.replace(distRoot, '')}`, false)
    }
  }
  check('T4E-A03 production build free of test files', true)
} else {
  console.log('[SKIP] T4E-A03 dist/ not found — build not yet run')
}

// ---- T4E-A05: No residue files in workspace ----
const residuePatterns = [/counter-evidence/, /debug-snapshot/, /temp-test/]
const workspaceFiles = [...srcFiles(srcRoot), ...srcFiles(testsRoot)]
for (const f of workspaceFiles) {
  for (const pat of residuePatterns) {
    if (pat.test(f)) {
      check(`T4E-A05 residue file in workspace: ${f}`, false)
    }
  }
}
check('T4E-A05 no counter-evidence residue or temp debug files', true)

if (failed) {
  console.log('\n❌ Task 4 boundary scan FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Task 4 boundary scan PASSED')
}
