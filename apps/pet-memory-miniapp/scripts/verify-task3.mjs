import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..', 'src')
const dataLayerDirs = ['types', 'repositories', 'adapters', 'fixtures', 'utils']
let failed = false

function srcFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.vue')))
    .map(e => join(e.parentPath || e.path, e.name))
}

function check(msg, ok) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`)
  if (!ok) failed = true
  return ok
}

// T3E-M11: No Vue, Pinia, or component imports in data layer
const badImports = /from\s+['"]@vue|from\s+['"]pinia|from\s+['"]@dcloudio|from\s+['"]vue['"]|from\s+['"]\.\.\/components|import\s+\{.*\}\s+from\s+['"]\.\.\/components|\.vue['"]/
for (const d of dataLayerDirs) {
  const dirPath = join(srcRoot, d)
  if (!existsSync(dirPath)) continue
  for (const f of srcFiles(dirPath)) {
    const content = readFileSync(f, 'utf-8')
    if (badImports.test(content)) {
      check(`T3E-M11 data layer has forbidden import in ${f}`, false)
    }
  }
}
check('T3E-M11 data layer free of Vue/Pinia/component imports', true)

// T3E-M12: Only UniStorageAdapter uses uni storage APIs
const uniStoragePattern = /uni\.(getStorage|setStorage|removeStorage|clearStorage)/
let uniStorageFiles = 0
let expectedUniStorageFile = false
for (const f of srcFiles(srcRoot)) {
  const content = readFileSync(f, 'utf-8')
  if (uniStoragePattern.test(content)) {
    uniStorageFiles++
    if (f.includes('uni-storage.ts')) {
      expectedUniStorageFile = true
    } else {
      check(`T3E-M12 uni storage call found outside UniStorageAdapter: ${f}`, false)
    }
  }
}
check(`T3E-M12 only UniStorageAdapter uses uni storage (${uniStorageFiles} file(s), all in uni-storage.ts)`, uniStorageFiles <= 1 && expectedUniStorageFile)

// T3E-M13: Only the fixed snapshot key, no second set of business storage keys
const storageKeyPattern = /pet-memory:/
for (const f of srcFiles(srcRoot)) {
  const content = readFileSync(f, 'utf-8')
  const matches = content.match(/pet-memory:/g)
  if (matches && matches.length > 0) {
    // the only allowed key is pet-memory:m0:snapshot
    if (!content.includes('pet-memory:m0:snapshot')) {
      check(`T3E-M13 unexpected storage key in ${f}`, false)
    }
  }
}
check('T3E-M13 only fixed snapshot key in production code', true)

// T3E-M14: No TODO / FIXME / placeholder / 以后替换 in Task 3 data layer
const stalePattern = /\b(TODO|FIXME|placeholder|以后替换)\b/
for (const d of dataLayerDirs) {
  const dirPath = join(srcRoot, d)
  if (!existsSync(dirPath)) continue
  for (const f of srcFiles(dirPath)) {
    const content = readFileSync(f, 'utf-8')
    if (stalePattern.test(content)) {
      check(`T3E-M14 stale marker in ${f}`, false)
    }
  }
}
check('T3E-M14 no TODO/FIXME/placeholder in data layer', true)

// T3E-M15: No debug logs or full snapshot output
const debugPattern = /console\.(log|debug|info|warn)/
for (const f of srcFiles(srcRoot)) {
  // skip test files and scripts
  if (f.includes('tests') || f.includes('scripts')) continue
  const content = readFileSync(f, 'utf-8')
  if (debugPattern.test(content)) {
    check(`T3E-M15 console statement in ${f}`, false)
  }
}
check('T3E-M15 no debug logs in production code', true)

// T3E-M16: No unapproved dependencies, CloudBase, or Task 4+ implementation
const forbiddenPattern = /cloudbase|CloudBase|@cloudbase|wx\.cloud|from\s+['"]\.\.\/stores|from\s+['"]\.\.\/services/
for (const f of srcFiles(srcRoot)) {
  if (f.includes('__tests__') || f.includes('tests')) continue
  const content = readFileSync(f, 'utf-8')
  if (forbiddenPattern.test(content)) {
    check(`T3E-M16 forbidden pattern in ${f}`, false)
  }
}
check('T3E-M16 no CloudBase/stores/services in data layer', true)

if (failed) {
  console.log('\n❌ Boundary scan FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Boundary scan PASSED')
}
