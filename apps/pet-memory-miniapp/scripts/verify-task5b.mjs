import { readFileSync, readdirSync, existsSync, statSync, openSync, readSync, closeSync } from 'fs'
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
    .filter(e => e.isFile() && /\.(ts|vue|js|json)$/.test(e.name))
    .map(e => join(e.parentPath || e.path, e.name))
}

function distFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter(e => e.isFile())
    .map(e => join(e.parentPath || e.path, e.name))
}

// ---- T5B-M50: Build output contains 01/03/13 pages ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const requiredPages = [
      'pages/onboarding/index',
      'pages/space-create/index',
      'pages/privacy/index',
    ]
    for (const page of requiredPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      if (hasWxml && hasJs) {
        check(`T5B-M50 build contains ${page}`, true)
      } else {
        const missing = []
        if (!hasWxml) missing.push('.wxml')
        if (!hasJs) missing.push('.js')
        check(`T5B-M50 build contains ${page} (missing: ${missing.join(', ')})`, false)
      }
    }
  } else {
    console.log('[SKIP] T5B-M50 dist/build/mp-weixin/ not found')
  }
}

// ---- T5B-M51: Regression — 02/04/08 still in build ----
{
  const buildDist = join(distRoot, 'build', 'mp-weixin')
  if (existsSync(buildDist)) {
    const regressionPages = [
      'pages/spaces/index',
      'pages/space-home/index',
      'pages/memories/index',
    ]
    for (const page of regressionPages) {
      const hasWxml = existsSync(join(buildDist, `${page}.wxml`))
      const hasJs = existsSync(join(buildDist, `${page}.js`))
      if (hasWxml && hasJs) {
        check(`T5B-M51 regression: ${page} in build`, true)
      } else {
        check(`T5B-M51 regression: ${page} MISSING from build`, false)
      }
    }
  } else {
    console.log('[SKIP] T5B-M51 dist/build/mp-weixin/ not found')
  }
}

// ---- T5B-M52: Build free of test files, debug logs ----
{
  const buildFiles = distFiles(distRoot)
  for (const f of buildFiles) {
    const bn = f.replace(/\\/g, '/')
    if (bn.includes('/common/vendor.js')) continue

    if (/(?:__tests__|\.test\.|\.spec\.)/i.test(bn)) {
      check(`T5B-M52 build contains test file: ${bn}`, false)
    }

    if (bn.includes('/build/') && bn.endsWith('.js')) {
      const content = readFileSync(f, 'utf-8')
      if (/console\.(log|debug|info|warn)/.test(content)) {
        check(`T5B-M52 debug console in build: ${bn}`, false)
      }
    }
  }
  check('T5B-M52 build free of test files and debug logs', true)
}

// ---- T5B-M53: No unapproved future page placeholders ----
{
  const forbiddenPages = ['space-settings']
  const pagesDir = join(srcRoot, 'pages')
  if (existsSync(pagesDir)) {
    const entries = readdirSync(pagesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && forbiddenPages.includes(entry.name)) {
        check(`T5B-M53 placeholder page directory exists: pages/${entry.name}`, false)
      }
    }
  }

  const pagesJson = join(srcRoot, 'pages.json')
  if (existsSync(pagesJson)) {
    const content = readFileSync(pagesJson, 'utf-8')
    for (const fp of forbiddenPages) {
      if (content.includes(`pages/${fp}/`)) {
        check(`T5B-M53 pages.json registers placeholder page: ${fp}`, false)
      }
    }
  }
  check('T5B-M53 no 05/09/12 placeholder pages', true)
}

// ---- T5B-M54: No unapproved dependencies ----
{
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
      check(`T5B-M54 unapproved dependency: ${dep}`, false)
    }
  }
  for (const dep of Object.keys(pkgJson.devDependencies || {})) {
    if (!approvedDevDeps.includes(dep)) {
      check(`T5B-M54 unapproved devDependency: ${dep}`, false)
    }
  }
  check('T5B-M54 only approved dependencies present', true)
}

// ---- T5B-M55: No TODO/FIXME/placeholder/以后替换 ----
{
  const stalePattern = /\b(TODO|FIXME|以后替换)\b/
  const placeholderPattern = /\bplaceholder\b/i

  for (const f of srcFiles(srcRoot)) {
    if (f.includes('__tests__') || f.includes('tests') || f.includes('scripts')) continue
    const content = readFileSync(f, 'utf-8')

    if (stalePattern.test(content)) {
      check(`T5B-M55 stale marker in ${f.replace(srcRoot, '')}`, false)
    }

    const lines = content.split('\n')
    for (const line of lines) {
      if (placeholderPattern.test(line)) {
        // Skip BEM class names
        if (/placeholder__|__placeholder|placeholder--|--placeholder/.test(line)) continue
        // Skip CSS custom properties / utility classes
        if (/-placeholder/.test(line)) continue
        // Skip legitimate HTML/Vue template attributes
        if (/\bplaceholder\s*[=:]/.test(line)) continue
        check(`T5B-M55 'placeholder' marker in ${f.replace(srcRoot, '')}: ${line.trim().substring(0, 120)}`, false)
      }
    }
  }
  check('T5B-M55 no TODO/FIXME/placeholder/以后替换', true)
}

// ---- T5B-M56: pages.json custom navigation for 01/03/13 ----
{
  const pagesJson = join(srcRoot, 'pages.json')
  if (existsSync(pagesJson)) {
    const pages = JSON.parse(readFileSync(pagesJson, 'utf-8')).pages || []
    const customNavPages = [
      'pages/onboarding/index',
      'pages/space-create/index',
      'pages/privacy/index',
    ]
    for (const p of customNavPages) {
      const pageEntry = pages.find(pe => pe.path === p)
      if (!pageEntry) {
        check(`T5B-M56 pages.json missing page: ${p}`, false)
      } else if (pageEntry.style?.navigationStyle !== 'custom') {
        check(`T5B-M56 pages.json ${p} navigationStyle is not custom`, false)
      } else {
        check(`T5B-M56 pages.json ${p} navigationStyle=custom`, true)
      }
    }
  }
}

// ---- T5B-M57: Fixed page content text audit (01/03/13) ----
{
  const textContracts = [
    { file: join(srcRoot, 'pages', 'onboarding', 'index.vue'), text: '给 Ta 留一个安静的位置', label: '01 title' },
    { file: join(srcRoot, 'pages', 'onboarding', 'index.vue'), text: "PAGE_URLS['space-create']", label: '01 navigate to space-create' },
    { file: join(srcRoot, 'pages', 'onboarding', 'index.vue'), text: 'completeOnboarding', label: '01 completeOnboarding call' },
    { file: join(srcRoot, 'pages', 'space-create', 'index.vue'), text: '创建 Ta 的空间', label: '03 title' },
    { file: join(srcRoot, 'pages', 'space-create', 'index.vue'), text: 'validateSpaceName', label: '03 validateSpaceName import' },
    { file: join(srcRoot, 'pages', 'space-create', 'index.vue'), text: 'getPhotoPicker', label: '03 PhotoPicker adapter' },
    { file: join(srcRoot, 'pages', 'space-create', 'index.vue'), text: 'createSpace', label: '03 createSpace call' },
    { file: join(srcRoot, 'pages', 'space-create', 'index.vue'), text: 'space-home', label: '03 navigate to space-home' },
    { file: join(srcRoot, 'pages', 'privacy', 'index.vue'), text: '默认只属于你', label: '13 privacy content' },
  ]

  for (const tc of textContracts) {
    if (!existsSync(tc.file)) {
      check(`T5B-M57 ${tc.label}: file not found ${tc.file}`, false)
      continue
    }
    const content = readFileSync(tc.file, 'utf-8')
    if (content.includes(tc.text)) {
      check(`T5B-M57 ${tc.label}: "${tc.text.substring(0, 30)}"`, true)
    } else {
      check(`T5B-M57 ${tc.label}: "${tc.text.substring(0, 30)}" NOT FOUND`, false)
    }
  }
}

// ---- T5B-M58: No direct uni.chooseMedia in pages (must use PhotoPicker adapter) ----
{
  const pageFiles = srcFiles(join(srcRoot, 'pages'))
  for (const f of pageFiles) {
    if (!f.endsWith('.vue') && !f.endsWith('.ts')) continue
    const content = readFileSync(f, 'utf-8')
    if (content.includes('uni.chooseMedia')) {
      check(`T5B-M58 direct uni.chooseMedia in page: ${f.replace(srcRoot, '')}`, false)
    }
  }
  // Verify PhotoPicker adapter exists
  const adapterPath = join(srcRoot, 'adapters', 'uni-photo-picker.ts')
  if (existsSync(adapterPath)) {
    check('T5B-M58 PhotoPicker adapter exists (uni-photo-picker.ts)', true)
  } else {
    check('T5B-M58 PhotoPicker adapter MISSING', false)
  }
  // Verify it's registered in main.ts
  const mainPath = join(srcRoot, 'main.ts')
  if (existsSync(mainPath)) {
    const mainContent = readFileSync(mainPath, 'utf-8')
    if (mainContent.includes('providePhotoPicker')) {
      check('T5B-M58 PhotoPicker registered in main.ts', true)
    } else {
      check('T5B-M58 PhotoPicker NOT registered in main.ts', false)
    }
  }
  check('T5B-M58 no direct uni.chooseMedia in pages', true)
}

// ---- T5B-M59: No duplicate Store/Repository/NavigationAdapter/PhotoPicker ----
{
  const srcAll = srcFiles(srcRoot)
  let storeCount = 0
  let navAdapterCount = 0
  let photoPickerCount = 0

  for (const f of srcAll) {
    const content = readFileSync(f, 'utf-8')
    if (content.includes('defineStore(')) storeCount++
    if (content.includes('implements NavigationAdapter')) navAdapterCount++
    if (content.includes('implements PhotoPicker')) photoPickerCount++
  }

  if (storeCount > 2) check(`T5B-M59 duplicate stores detected: ${storeCount} (expected 2)`, false)
  else check(`T5B-M59 store count: ${storeCount}`, true)

  if (navAdapterCount > 1) check(`T5B-M59 duplicate NavigationAdapter: ${navAdapterCount} (expected 1)`, false)
  else check(`T5B-M59 NavigationAdapter count: ${navAdapterCount}`, true)

  if (photoPickerCount > 1) check(`T5B-M59 duplicate PhotoPicker: ${photoPickerCount} (expected 1)`, false)
  else check(`T5B-M59 PhotoPicker count: ${photoPickerCount}`, true)
}

// ---- T5B-M60: No direct uni.navigateTo / uni.redirectTo / uni.reLaunch in pages ----
{
  const pageFiles = srcFiles(join(srcRoot, 'pages'))
  for (const f of pageFiles) {
    if (!f.endsWith('.vue')) continue
    const content = readFileSync(f, 'utf-8')
    if (/uni\.(navigateTo|redirectTo|reLaunch|navigateBack|switchTab)\s*\(/.test(content)) {
      check(`T5B-M60 direct uni navigation in page: ${f.replace(srcRoot, '')}`, false)
    }
  }
  check('T5B-M60 no direct uni navigation in pages', true)
}

// ---- T5B-M61: Visual evidence hard gate ----
{
  const evidenceDir = join(__dirname, '..', '..', '..', 'docs', 'project', 'gpt-review-output', 'task5b-evidence')

  if (!existsSync(evidenceDir)) {
    // Evidence directory not required to exist before visual calibration step
    console.log('[SKIP] T5B-M61 evidence directory not found (expected before visual calibration)')
    console.log(`  Expected: ${evidenceDir}`)
  } else {
    const requiredFiles = [
      '01-onboarding-implementation.png',
      '03-space-create-implementation.png',
      '13-privacy-implementation.png',
      'report.md',
    ]

    const existingFiles = readdirSync(evidenceDir)
    const missing = []

    for (const f of requiredFiles) {
      if (existingFiles.includes(f)) {
        const filePath = join(evidenceDir, f)
        const st = statSync(filePath)
        if (st.size === 0) {
          check(`T5B-M61 ${f} is empty (0 bytes)`, false)
        } else if (f.endsWith('.png')) {
          try {
            const header = Buffer.alloc(8)
            const fd = openSync(filePath, 'r')
            readSync(fd, header, 0, 8, 0)
            closeSync(fd)
            const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
            if (isPng) {
              check(`T5B-M61 ${f}`, true)
            } else {
              check(`T5B-M61 ${f} not a valid PNG`, false)
            }
          } catch {
            check(`T5B-M61 ${f} cannot read PNG header`, false)
          }
        } else {
          check(`T5B-M61 ${f}`, true)
        }
      } else {
        missing.push(f)
      }
    }

    if (missing.length > 0) {
      for (const f of missing) {
        check(`T5B-M61 ${f} MISSING`, false)
      }
    }

    // Check implementation screenshots aren't copies of baselines
    const baselineRoot = join(__dirname, '..', '..', '..', 'docs', 'product', 'assets', 'm0-page-baselines')
    const implBaselinePairs = [
      { impl: '01-onboarding-implementation.png', baseline: '01-onboarding.png' },
      { impl: '03-space-create-implementation.png', baseline: '03-space-create.png' },
      { impl: '13-privacy-implementation.png', baseline: '13-privacy.png' },
    ]
    for (const pair of implBaselinePairs) {
      const implPath = join(evidenceDir, pair.impl)
      const baselinePath = join(baselineRoot, pair.baseline)
      if (existsSync(implPath) && existsSync(baselinePath)) {
        const implSize = statSync(implPath).size
        const baselineSize = statSync(baselinePath).size
        if (implSize === baselineSize) {
          check(`T5B-M61 ${pair.impl} appears to be a copy of baseline (same size: ${implSize} bytes)`, false)
        }
      }
    }
  }
}

// ---- T5B-M62: Non-page source files audited for forbidden patterns ----
{
  const nonPageFiles = srcFiles(srcRoot).filter(f => !f.includes('\\pages\\') && !f.includes('/pages/'))
  for (const f of nonPageFiles) {
    if (!f.endsWith('.vue') && !f.endsWith('.ts')) continue
    if (f.includes('scripts') || f.includes('tests') || f.includes('__tests__')) continue

    const content = readFileSync(f, 'utf-8')

    // No hardcoded secrets
    if (/api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/i.test(content)) {
      check(`T5B-M62 hardcoded API key in ${f.replace(srcRoot, '')}`, false)
    }
    if (/secret\s*[:=]\s*['"][^'"]{8,}['"]/i.test(content)) {
      check(`T5B-M62 hardcoded secret in ${f.replace(srcRoot, '')}`, false)
    }
  }
  check('T5B-M62 no hardcoded secrets in non-page source', true)
}

// ---- T5B-M63: space-form.ts pure function exists ----
{
  const formPath = join(srcRoot, 'features', 'spaces', 'space-form.ts')
  if (existsSync(formPath)) {
    const content = readFileSync(formPath, 'utf-8')
    if (content.includes('export function validateSpaceName')) {
      check('T5B-M63 validateSpaceName exported from space-form.ts', true)
    } else {
      check('T5B-M63 validateSpaceName NOT exported from space-form.ts', false)
    }
  } else {
    check('T5B-M63 space-form.ts not found', false)
  }
}

// ---- T5B-M64: photo-picker-deps.ts follows navigation-deps.ts pattern ----
{
  const photoDepsPath = join(srcRoot, 'adapters', 'photo-picker-deps.ts')
  const navDepsPath = join(srcRoot, 'adapters', 'navigation-deps.ts')
  if (existsSync(photoDepsPath) && existsSync(navDepsPath)) {
    const photoContent = readFileSync(photoDepsPath, 'utf-8')
    if (photoContent.includes('providePhotoPicker') && photoContent.includes('getPhotoPicker') && photoContent.includes('_resetPhotoPicker')) {
      check('T5B-M64 photo-picker-deps.ts follows navigation-deps.ts pattern', true)
    } else {
      check('T5B-M64 photo-picker-deps.ts missing expected exports', false)
    }
  } else {
    check('T5B-M64 adapter dep files missing', false)
  }
}

// ---- T5B-M65: Pages registered in correct order in pages.json ----
{
  const pagesJson = join(srcRoot, 'pages.json')
  if (existsSync(pagesJson)) {
    const pages = JSON.parse(readFileSync(pagesJson, 'utf-8')).pages || []
    const onboardingIdx = pages.findIndex(p => p.path === 'pages/onboarding/index')
    if (onboardingIdx === 0) {
      check('T5B-M65 onboarding is first page in pages.json', true)
    } else {
      check(`T5B-M65 onboarding is NOT first page (index: ${onboardingIdx})`, false)
    }
  }
}

if (failed) {
  console.log('\n❌ Task 5B boundary scan FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Task 5B boundary scan PASSED')
}
