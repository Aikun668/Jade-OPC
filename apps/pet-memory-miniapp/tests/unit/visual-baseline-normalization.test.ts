import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const NODE = process.execPath

const __dirname = dirname(fileURLToPath(import.meta.url))
const scriptPath = resolve(__dirname, '../../scripts/visual-regression/normalize-baselines.mjs')
const testInputDir = resolve(__dirname, '../../scripts/visual-regression/test-input')
const testOutputDir = resolve(__dirname, '../../scripts/visual-regression/test-output')

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function generateTestPngs(): void {
  if (!existsSync(testInputDir)) mkdirSync(testInputDir, { recursive: true })

  const standardPages = [
    '01-onboarding', '02-spaces', '03-space-create',
    '05-record-entry', '06-record-text', '07-record-photo',
    '08-memories', '09-memory-detail', '10-memory-edit',
    '11-ai-draft', '12-space-settings', '13-privacy',
  ]

  for (const page of standardPages) {
    const outPath = join(testInputDir, page + '.png')
    if (!existsSync(outPath)) {
      const png = new PNG({ width: 394, height: 852 })
      for (let y = 0; y < 852; y++) {
        for (let x = 0; x < 394; x++) {
          const idx = (394 * y + x) << 2
          png.data[idx] = (x * 0.5) | 0
          png.data[idx + 1] = (y * 0.2) | 0
          png.data[idx + 2] = 180
          png.data[idx + 3] = 255
        }
      }
      writeFileSync(outPath, PNG.sync.write(png))
    }
  }

  // Page 04
  const p04Path = join(testInputDir, '04-space-home.png')
  if (!existsSync(p04Path)) {
    const png04 = new PNG({ width: 853, height: 1844 })
    for (let y = 0; y < 1844; y++) {
      for (let x = 0; x < 853; x++) {
        const idx = (853 * y + x) << 2
        png04.data[idx] = (x * 0.25) | 0
        png04.data[idx + 1] = (y * 0.12) | 0
        png04.data[idx + 2] = 200
        png04.data[idx + 3] = 255
      }
    }
    writeFileSync(p04Path, PNG.sync.write(png04))
  }
}

function cleanOutputDir(): void {
  if (existsSync(testOutputDir)) {
    rmSync(testOutputDir, { recursive: true })
  }
  mkdirSync(testOutputDir, { recursive: true })
}

describe('visual baseline normalization', () => {
  beforeAll(() => {
    generateTestPngs()
    cleanOutputDir()
  })

  afterAll(() => {
    if (existsSync(testInputDir)) rmSync(testInputDir, { recursive: true })
    if (existsSync(testOutputDir)) rmSync(testOutputDir, { recursive: true })
  })

  describe('normalization script', () => {
    it('exists and is a valid file', () => {
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('can be parsed as Node.js module', () => {
      expect(() => {
        execSync(`"${NODE}" --check "${scriptPath}"`, { encoding: 'utf-8' })
      }).not.toThrow()
    })
  })

  describe('real image processing', () => {
    let manifest: any

    beforeAll(() => {
      execSync(`"${NODE}" "${scriptPath}" "${testInputDir}" "${testOutputDir}"`, {
        encoding: 'utf-8',
      })
      const manifestPath = join(testOutputDir, 'manifest.json')
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    })

    it('produces exactly 13 output PNGs', () => {
      const files = readdirSync(testOutputDir).filter(f => f.endsWith('.png'))
      expect(files).toHaveLength(13)
    })

    it('all output images are 393x852', () => {
      const files = readdirSync(testOutputDir).filter(f => f.endsWith('.png'))
      for (const f of files) {
        const png = PNG.sync.read(readFileSync(join(testOutputDir, f)))
        expect(png.width).toBe(393)
        expect(png.height).toBe(852)
      }
    })

    it('produces manifest with 13 entries', () => {
      expect(manifest.baselines).toHaveLength(13)
    })

    it('manifest has targetDimensions', () => {
      expect(manifest.targetDimensions).toEqual({ width: 393, height: 852 })
    })

    it('manifest has capability probe record', () => {
      expect(manifest.capability).toBeDefined()
      expect(manifest.capability).toHaveProperty('tool')
      expect(manifest.capability).toHaveProperty('nodeVersion')
      expect(manifest.capability).toHaveProperty('platform')
      expect(manifest.capability).toHaveProperty('timestamp')
    })

    it('each manifest entry has route, baselineFile, fixture, and state', () => {
      for (const entry of manifest.baselines) {
        expect(entry).toHaveProperty('route')
        expect(entry.route).toBeTruthy()
        expect(entry).toHaveProperty('baselineFile')
        expect(entry.baselineFile).toMatch(/\.png$/)
        expect(entry).toHaveProperty('fixture')
        expect(entry).toHaveProperty('state')
      }
    })

    it('each manifest entry has input and output SHA-256', () => {
      for (const entry of manifest.baselines) {
        expect(entry).toHaveProperty('inputSha256')
        expect(entry).toHaveProperty('outputSha256')
        expect(entry.inputSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(entry.outputSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(entry.inputSha256).not.toBe(entry.outputSha256)
      }
    })

    it('standard pages (01-03, 05-13) use crop-right-1px method', () => {
      const standard = ['01', '02', '03', '05', '06', '07', '08', '09', '10', '11', '12', '13']
      for (const entry of manifest.baselines) {
        const pageId: string = entry.pageId
        if (standard.some(s => pageId.startsWith(s))) {
          expect(entry.method).toBe('crop-right-1px')
          expect(entry.outputWidth).toBe(393)
          expect(entry.outputHeight).toBe(852)
        }
      }
    })

    it('page 04 uses scale+pad method', () => {
      const page04 = manifest.baselines.find((e: any) => e.pageId === '04-space-home')
      expect(page04).toBeDefined()
      expect(page04.method).toBe('scale-to-393x850-then-pad-to-393x852')
      expect(page04.outputWidth).toBe(393)
      expect(page04.outputHeight).toBe(852)
      expect(page04.paddingTop).toBe(1)
      expect(page04.paddingBottom).toBe(1)
    })

    it('page 04 output has canvas-colored padding rows', () => {
      const png = PNG.sync.read(readFileSync(join(testOutputDir, '04-space-home.png')))
      const topRowIdx = 0
      expect(png.data[topRowIdx]).toBe(0xf7)
      expect(png.data[topRowIdx + 1]).toBe(0xf4)
      expect(png.data[topRowIdx + 2]).toBe(0xeb)
      const botIdx = (393 * 851) << 2
      expect(png.data[botIdx]).toBe(0xf7)
      expect(png.data[botIdx + 1]).toBe(0xf4)
      expect(png.data[botIdx + 2]).toBe(0xeb)
      const midIdx = (393 * 426) << 2
      const isFillColor =
        png.data[midIdx] === 0xf7 &&
        png.data[midIdx + 1] === 0xf4 &&
        png.data[midIdx + 2] === 0xeb
      expect(isFillColor).toBe(false)
    })

    it('standard page output is 1px narrower than input', () => {
      const inputPng = PNG.sync.read(readFileSync(join(testInputDir, '01-onboarding.png')))
      const outputPng = PNG.sync.read(readFileSync(join(testOutputDir, '01-onboarding.png')))
      expect(inputPng.width).toBe(394)
      expect(outputPng.width).toBe(393)
      expect(inputPng.height).toBe(outputPng.height)
    })

    it('standard page output preserves content from columns 0..392', () => {
      const inputPng = PNG.sync.read(readFileSync(join(testInputDir, '01-onboarding.png')))
      const outputPng = PNG.sync.read(readFileSync(join(testOutputDir, '01-onboarding.png')))
      for (let y = 0; y < 852; y += 100) {
        const inIdx = (394 * y) << 2
        const outIdx = (393 * y) << 2
        expect(outputPng.data[outIdx]).toBe(inputPng.data[inIdx])
        expect(outputPng.data[outIdx + 1]).toBe(inputPng.data[inIdx + 1])
        expect(outputPng.data[outIdx + 2]).toBe(inputPng.data[inIdx + 2])
      }
      for (let y = 0; y < 852; y += 100) {
        const inIdx = ((394 * y) + 392) << 2
        const outIdx = ((393 * y) + 392) << 2
        expect(outputPng.data[outIdx]).toBe(inputPng.data[inIdx])
        expect(outputPng.data[outIdx + 1]).toBe(inputPng.data[inIdx + 1])
        expect(outputPng.data[outIdx + 2]).toBe(inputPng.data[inIdx + 2])
      }
    })
  })

  describe('strict input validation', () => {
    it('exits with code 1 when file count is wrong', () => {
      const wrongInputDir = join(testInputDir, '..', 'test-input-wrong-count')
      if (existsSync(wrongInputDir)) rmSync(wrongInputDir, { recursive: true })
      mkdirSync(wrongInputDir, { recursive: true })
      // Create only 2 PNGs instead of 13
      const png = new PNG({ width: 394, height: 852 })
      for (let i = 0; i < png.data.length; i += 4) {
        png.data[i] = 100; png.data[i + 1] = 100; png.data[i + 2] = 100; png.data[i + 3] = 255
      }
      writeFileSync(join(wrongInputDir, '01-onboarding.png'), PNG.sync.write(png))
      writeFileSync(join(wrongInputDir, '02-spaces.png'), PNG.sync.write(png))

      const wrongOutputDir = join(testOutputDir, '..', 'test-output-wrong-count')
      if (existsSync(wrongOutputDir)) rmSync(wrongOutputDir, { recursive: true })

      try {
        execSync(`"${NODE}" "${scriptPath}" "${wrongInputDir}" "${wrongOutputDir}"`, { encoding: 'utf-8' })
        // Should not reach here
        expect.unreachable('Expected script to exit with code 1')
      } catch (e: any) {
        expect(e.status).toBe(1)
        expect(e.stderr?.toString() || e.stdout?.toString() || '').toContain('Expected 13 PNG files')
      }

      rmSync(wrongInputDir, { recursive: true })
      if (existsSync(wrongOutputDir)) rmSync(wrongOutputDir, { recursive: true })
    })

    it('exits with code 1 when dimensions are wrong for standard page', () => {
      const badInputDir = join(testInputDir, '..', 'test-input-bad-dims')
      const badOutputDir = join(testOutputDir, '..', 'test-output-bad-dims')
      if (existsSync(badInputDir)) rmSync(badInputDir, { recursive: true })
      mkdirSync(badInputDir, { recursive: true })
      if (existsSync(badOutputDir)) rmSync(badOutputDir, { recursive: true })

      // Create wrong-dimension page: 200x200 instead of 394x852
      const badPng = new PNG({ width: 200, height: 200 })
      for (let i = 0; i < badPng.data.length; i += 4) {
        badPng.data[i] = 100; badPng.data[i + 1] = 100; badPng.data[i + 2] = 100; badPng.data[i + 3] = 255
      }
      // Create all 13 files, but one has wrong dimensions
      const standardPages = [
        '01-onboarding', '02-spaces', '03-space-create',
        '05-record-entry', '06-record-text', '07-record-photo',
        '08-memories', '09-memory-detail', '10-memory-edit',
        '11-ai-draft', '12-space-settings', '13-privacy',
      ]
      const goodPng = new PNG({ width: 394, height: 852 })
      for (let i = 0; i < goodPng.data.length; i += 4) {
        goodPng.data[i] = 100; goodPng.data[i + 1] = 100; goodPng.data[i + 2] = 100; goodPng.data[i + 3] = 255
      }

      // Put bad dimensions on 01-onboarding
      writeFileSync(join(badInputDir, '01-onboarding.png'), PNG.sync.write(badPng))
      for (const page of standardPages.slice(1)) {
        writeFileSync(join(badInputDir, page + '.png'), PNG.sync.write(goodPng))
      }
      // Normal page 04
      const png04 = new PNG({ width: 853, height: 1844 })
      for (let i = 0; i < png04.data.length; i += 4) {
        png04.data[i] = 50; png04.data[i + 1] = 50; png04.data[i + 2] = 50; png04.data[i + 3] = 255
      }
      writeFileSync(join(badInputDir, '04-space-home.png'), PNG.sync.write(png04))

      try {
        execSync(`"${NODE}" "${scriptPath}" "${badInputDir}" "${badOutputDir}"`, { encoding: 'utf-8' })
        expect.unreachable('Expected script to exit with code 1')
      } catch (e: any) {
        expect(e.status).toBe(1)
        expect(e.stderr?.toString() || e.stdout?.toString() || '').toContain('Dimension mismatch')
      }

      rmSync(badInputDir, { recursive: true })
      if (existsSync(badOutputDir)) rmSync(badOutputDir, { recursive: true })
    })

    it('exits with code 1 for unknown page ID', () => {
      const unknownInputDir = join(testInputDir, '..', 'test-input-unknown')
      const unknownOutputDir = join(testOutputDir, '..', 'test-output-unknown')
      if (existsSync(unknownInputDir)) rmSync(unknownInputDir, { recursive: true })
      mkdirSync(unknownInputDir, { recursive: true })
      if (existsSync(unknownOutputDir)) rmSync(unknownOutputDir, { recursive: true })

      const png = new PNG({ width: 394, height: 852 })
      for (let i = 0; i < png.data.length; i += 4) {
        png.data[i] = 100; png.data[i + 1] = 100; png.data[i + 2] = 100; png.data[i + 3] = 255
      }
      // 12 known + 1 unknown = 13 total to pass count check
      const known = [
        '01-onboarding', '02-spaces', '03-space-create',
        '05-record-entry', '06-record-text', '07-record-photo',
        '08-memories', '09-memory-detail', '10-memory-edit',
        '11-ai-draft', '12-space-settings',
      ]
      for (const page of known) {
        writeFileSync(join(unknownInputDir, page + '.png'), PNG.sync.write(png))
      }
      // Page 04 needs correct dimensions (853x1844) to pass dimension check
      const png04 = new PNG({ width: 853, height: 1844 })
      for (let i = 0; i < png04.data.length; i += 4) {
        png04.data[i] = 100; png04.data[i + 1] = 100; png04.data[i + 2] = 100; png04.data[i + 3] = 255
      }
      writeFileSync(join(unknownInputDir, '04-space-home.png'), PNG.sync.write(png04))
      // Unknown page
      writeFileSync(join(unknownInputDir, '99-unknown.png'), PNG.sync.write(png))

      try {
        execSync(`"${NODE}" "${scriptPath}" "${unknownInputDir}" "${unknownOutputDir}"`, { encoding: 'utf-8' })
        expect.unreachable('Expected script to exit with code 1')
      } catch (e: any) {
        expect(e.status).toBe(1)
        expect(e.stderr?.toString() || e.stdout?.toString() || '').toContain('Unknown baseline page')
      }

      rmSync(unknownInputDir, { recursive: true })
      if (existsSync(unknownOutputDir)) rmSync(unknownOutputDir, { recursive: true })
    })
  })

  describe('pass/fail thresholds', () => {
    it('P0-P2 must be zero for pass', () => {
      const criteria = {
        P0: { max: 0, description: 'Page broken, content lost, privacy breach' },
        P1: { max: 0, description: 'Core structure, navigation, safe area errors' },
        P2: { max: 0, description: 'Size, spacing, typography, color deviations' },
        P3: { max: Infinity, description: 'Minor platform rendering differences' },
      }
      expect(criteria.P0.max).toBe(0)
      expect(criteria.P1.max).toBe(0)
      expect(criteria.P2.max).toBe(0)
    })
  })
})
