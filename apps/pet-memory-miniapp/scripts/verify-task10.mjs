import { existsSync, readFileSync, readdirSync } from 'fs'
import { spawnSync } from 'child_process'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const appRoot = join(scriptDir, '..')
const srcRoot = join(appRoot, 'src')
const testRoot = join(appRoot, 'tests')
const distRoot = join(appRoot, 'dist', 'build', 'mp-weixin')
const repoRoot = join(appRoot, '..', '..')
const evidenceRoot = join(repoRoot, 'docs', 'project', 'gpt-review-output', 'task10-evidence')

let failed = false

function check(label, condition) {
  const ok = Boolean(condition)
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (!ok) failed = true
  return ok
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function walk(dir) {
  if (!existsSync(dir)) return []
  const result = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(full))
    else result.push(full)
  }
  return result
}

const expectedPages = [
  'pages/onboarding/index',
  'pages/spaces/index',
  'pages/space-home/index',
  'pages/memories/index',
  'pages/space-create/index',
  'pages/privacy/index',
  'pages/record-entry/index',
  'pages/record-text/index',
  'pages/record-photo/index',
  'pages/memory-detail/index',
  'pages/memory-edit/index',
  'pages/ai-draft/index',
  'pages/space-settings/index',
]

// T10-V01: route inventory and navigation parity
{
  const pagesJson = JSON.parse(read(join(srcRoot, 'pages.json')))
  const pagePaths = pagesJson.pages.map(page => page.path)
  const navigationSource = read(join(srcRoot, 'adapters', 'navigation.ts'))
  check('T10-V01 pages.json contains exactly the 13 M0 pages',
    pagePaths.length === expectedPages.length && expectedPages.every(path => pagePaths.includes(path)))
  check('T10-V02 PAGE_URLS contains every formal page route',
    expectedPages.every(path => navigationSource.includes(`/${path}`)))
}

// T10-V03: scenario and evidence files
check('T10-V03 scenario matrix exists', existsSync(join(testRoot, 'm0-scenario-matrix.md')))
check('T10-V04 manual device record exists', existsSync(join(testRoot, 'manual-device-results.md')))
check('T10-V05 evidence README exists', existsSync(join(evidenceRoot, 'README.md')))
check('T10-V06 Task 10 journey test exists', existsSync(join(testRoot, 'components', 'task10-journey.test.ts')))

const matrixSource = read(join(testRoot, 'm0-scenario-matrix.md'))
const deviceSource = read(join(testRoot, 'manual-device-results.md'))
check('T10-V07 matrix contains empty, draft, complete, and failure groups',
  ['T10-E01', 'T10-D01', 'T10-C01', 'T10-C02', 'T10-C03', 'T10-F01'].every(id => matrixSource.includes(id)))
check('T10-V08 device record keeps external checks pending until executed',
  deviceSource.includes('device-pending') && deviceSource.includes('No physical-device'))

// T10-V09: complete fixture contract
{
  const fixture = read(join(srcRoot, 'fixtures', 'complete-snapshot.ts'))
  check('T10-V09 complete fixture has both spaces',
    fixture.includes("id: 's_tuantu'") && fixture.includes("id: 's_doudou'"))
  check('T10-V10 complete fixture has two Tuantuan memories and one draft',
    fixture.includes("id: 'm_tuantu_daily1'") &&
    fixture.includes("id: 'm_tuantu_photo1'") &&
    fixture.includes("id: 'd_tuantu_draft1'"))
  check('T10-V11 complete fixture has a two-photo memory and a no-photo space',
    fixture.includes("assetIds: ['a_tuantu_photo1', 'a_tuantu_photo2']") &&
    fixture.includes('coverAssetId: null'))
}

// T10-V12: production source boundary
const pageFiles = walk(join(srcRoot, 'pages')).filter(file => ['.vue', '.ts'].includes(extname(file)))
const pageSource = pageFiles.map(read).join('\n')
check('T10-V12 pages do not directly use Storage, Repository, or raw uni navigation',
  !/getRepository|LocalMemoryRepository|StorageAdapter|uni\.(navigateTo|redirectTo|reLaunch|navigateBack)/.test(pageSource))

const allSource = walk(srcRoot).filter(file => ['.vue', '.ts', '.scss', '.json'].includes(extname(file))).map(read).join('\n')
check('T10-V13 source contains no CloudBase, real AI SDK, or network request entry point',
  !/(?:from|require\()\s*['"][^'"]*cloudbase|wx\.cloud|uni\.request|wx\.request|fetch\(|openai|anthropic|deepseek|https?:\/\//i.test(allSource))
check('T10-V14 source contains no obvious secret or credential literal',
  !/(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{16,}|client_secret\s*[:=]|appSecret\s*[:=])/i.test(allSource))

// T10-V15: production build boundary and route artifacts
if (existsSync(distRoot)) {
  const buildFiles = walk(distRoot)
  const buildSource = buildFiles.map(file => read(file)).join('\n')
  check('T10-V15 production build contains no DevPanel artifact or reference',
    !/DevPanel|dev-panel/i.test(buildSource))
  for (const page of expectedPages) {
    check(`T10-V16 production build contains ${page}`,
      existsSync(join(distRoot, `${page}.js`)) && existsSync(join(distRoot, `${page}.wxml`)))
  }
} else {
  check('T10-V15 production build exists before boundary verification', false)
}

// T10-V17: existing regression gates are still present
for (const script of ['verify-task5a.mjs', 'verify-task5b.mjs', 'verify-task8.mjs', 'verify-task9.mjs']) {
  check(`T10-V17 ${script} exists`, existsSync(join(appRoot, 'scripts', script)))
}

// T10-V18: run legacy regression gates without hiding known historical/external gaps.
// Task 5A/5B were authored before Task 9 replaced the space-settings placeholder,
// and Task 5B still waits for three DevTools screenshots. Those exact failures are
// recorded as pending; any other legacy failure remains a Task 10 failure.
const allowedPendingFailures = {
  'verify-task5a.mjs': [
    /^\[FAIL\] T5A-M52 placeholder page directory exists: pages\/space-settings$/,
    /^\[FAIL\] T5A-M52 pages\.json registers placeholder page: space-settings$/,
  ],
  'verify-task5b.mjs': [
    /^\[FAIL\] T5B-M53 placeholder page directory exists: pages\/space-settings$/,
    /^\[FAIL\] T5B-M53 pages\.json registers placeholder page: space-settings$/,
    /^\[FAIL\] T5B-M61 (01-onboarding|03-space-create|13-privacy)-implementation\.png MISSING$/,
  ],
  'verify-task8.mjs': [],
  'verify-task9.mjs': [],
}

for (const [script, allowed] of Object.entries(allowedPendingFailures)) {
  const result = spawnSync(process.execPath, [join(appRoot, 'scripts', script)], {
    cwd: appRoot,
    encoding: 'utf8',
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  process.stdout.write(`\n--- ${script} ---\n${output}`)
  const failures = output.split(/\r?\n/).filter(line => line.startsWith('[FAIL]'))
  const onlyAllowed = failures.length > 0 && failures.every(line => allowed.some(pattern => pattern.test(line)))
  if (result.status === 0) {
    console.log(`[PASS] T10-V18 ${script} regression gate`)
  } else if (onlyAllowed) {
    console.log(`[PENDING] T10-V18 ${script} has only documented legacy/device gaps`)
  } else {
    check(`T10-V18 ${script} regression gate has no unexpected failures`, false)
  }
}

console.log('')
if (failed) {
  console.log('Verify:task10 FAILED - see failures above')
  process.exit(1)
}

console.log('Verify:task10 PASSED')
