// Normalizes M0 page baseline images to the standard 393 × 852 comparison canvas.
// Uses pngjs for real pixel-level cropping, scaling, and padding.
// Usage: node scripts/visual-regression/normalize-baselines.mjs <baselines-dir> <output-dir>

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, basename, extname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const STANDARD_WIDTH = 394
const STANDARD_HEIGHT = 852
const TARGET_WIDTH = 393
const TARGET_HEIGHT = 852
const EXPECTED_FILE_COUNT = 13

const PAGE_META = {
  '01-onboarding':   { route: 'pages/index/index#onboarding',    fixture: 'default', state: 'intro' },
  '02-spaces':       { route: 'pages/index/index#spaces',        fixture: 'default', state: 'list-empty' },
  '03-space-create': { route: 'pages/index/index#space-create',  fixture: 'default', state: 'form-empty' },
  '04-space-home':   { route: 'pages/index/index#space-home',    fixture: 'default', state: 'filled' },
  '05-record-entry': { route: 'pages/index/index#record-entry',  fixture: 'default', state: 'empty' },
  '06-record-text':  { route: 'pages/index/index#record-text',   fixture: 'default', state: 'filled' },
  '07-record-photo': { route: 'pages/index/index#record-photo',  fixture: 'default', state: 'filled' },
  '08-memories':     { route: 'pages/index/index#memories',      fixture: 'default', state: 'list' },
  '09-memory-detail':{ route: 'pages/index/index#memory-detail', fixture: 'default', state: 'filled' },
  '10-memory-edit':  { route: 'pages/index/index#memory-edit',   fixture: 'default', state: 'filled' },
  '11-ai-draft':     { route: 'pages/index/index#ai-draft',      fixture: 'default', state: 'draft-generated' },
  '12-space-settings':{ route: 'pages/index/index#space-settings', fixture: 'default', state: 'filled' },
  '13-privacy':      { route: 'pages/index/index#privacy',       fixture: 'default', state: 'default' },
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function writePng(png, outputPath) {
  const buffer = PNG.sync.write(png)
  writeFileSync(outputPath, buffer)
  return buffer
}

function validateInputDimensions(file, png, expectedW, expectedH) {
  if (png.width !== expectedW || png.height !== expectedH) {
    const msg = `Dimension mismatch for ${file}: expected ${expectedW}×${expectedH}, got ${png.width}×${png.height}`
    console.error(msg)
    throw new Error(msg)
  }
}

/**
 * Pages 01-03, 05-13: 394 × 852 → crop rightmost 1px to get 393 × 852
 */
function normalizeStandard(inputPath, outputPath, meta) {
  const buffer = readFileSync(inputPath)
  const png = PNG.sync.read(buffer)
  const { width, height } = png

  validateInputDimensions(basename(inputPath), png, STANDARD_WIDTH, STANDARD_HEIGHT)

  // Create output PNG: 393 × 852
  const out = new PNG({ width: TARGET_WIDTH, height: TARGET_HEIGHT })

  for (let y = 0; y < TARGET_HEIGHT; y++) {
    for (let x = 0; x < TARGET_WIDTH; x++) {
      const srcIdx = (width * y + x) << 2
      const dstIdx = (TARGET_WIDTH * y + x) << 2
      out.data[dstIdx] = png.data[srcIdx]
      out.data[dstIdx + 1] = png.data[srcIdx + 1]
      out.data[dstIdx + 2] = png.data[srcIdx + 2]
      out.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }

  const outBuffer = writePng(out, outputPath)
  const pageId = basename(inputPath, extname(inputPath))

  return {
    pageId,
    route: meta.route,
    inputFile: basename(inputPath),
    baselineFile: basename(outputPath),
    fixture: meta.fixture,
    state: meta.state,
    inputWidth: width,
    inputHeight: height,
    method: 'crop-right-1px',
    outputWidth: TARGET_WIDTH,
    outputHeight: TARGET_HEIGHT,
    cropRight: 1,
    inputSha256: sha256(buffer),
    outputSha256: sha256(outBuffer),
  }
}

/**
 * Page 04 (space-home): 853 × 1844 → scale to 393 × 850 → pad to 393 × 852
 * Uses bilinear interpolation for scaling.
 */
function normalize04(inputPath, outputPath, meta) {
  const buffer = readFileSync(inputPath)
  const png = PNG.sync.read(buffer)
  const { width: srcW, height: srcH } = png

  validateInputDimensions(basename(inputPath), png, 853, 1844)

  const targetW = 393
  const targetH = 850
  const scaleX = srcW / targetW
  const scaleY = srcH / targetH

  // Step 1: Scale to 393 × 850
  const scaled = new PNG({ width: targetW, height: targetH })

  for (let dy = 0; dy < targetH; dy++) {
    for (let dx = 0; dx < targetW; dx++) {
      const sx = dx * scaleX
      const sy = dy * scaleY
      const sxFloor = Math.floor(sx)
      const syFloor = Math.floor(sy)
      const sxCeil = Math.min(sxFloor + 1, srcW - 1)
      const syCeil = Math.min(syFloor + 1, srcH - 1)
      const fx = sx - sxFloor
      const fy = sy - syFloor

      const dstIdx = (targetW * dy + dx) << 2

      for (let c = 0; c < 4; c++) {
        const tl = png.data[((srcW * syFloor + sxFloor) << 2) + c]
        const tr = png.data[((srcW * syFloor + sxCeil) << 2) + c]
        const bl = png.data[((srcW * syCeil + sxFloor) << 2) + c]
        const br = png.data[((srcW * syCeil + sxCeil) << 2) + c]

        const top = tl + (tr - tl) * fx
        const bottom = bl + (br - bl) * fx
        scaled.data[dstIdx + c] = Math.round(top + (bottom - top) * fy)
      }
    }
  }

  // Step 2: Pad 1px top and bottom to 393 × 852, fill with #f7f4eb
  const fillR = 0xf7
  const fillG = 0xf4
  const fillB = 0xeb
  const fillA = 0xff

  const out = new PNG({ width: 393, height: 852 })

  // Fill entire canvas with fill color
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = fillR
    out.data[i + 1] = fillG
    out.data[i + 2] = fillB
    out.data[i + 3] = fillA
  }

  // Copy scaled image, offset by 1 row from top
  for (let y = 0; y < targetH; y++) {
    const srcRowStart = (targetW * y) << 2
    const dstRowStart = (393 * (y + 1)) << 2
    for (let x = 0; x < targetW; x++) {
      const srcIdx = srcRowStart + (x << 2)
      const dstIdx = dstRowStart + (x << 2)
      out.data[dstIdx] = scaled.data[srcIdx]
      out.data[dstIdx + 1] = scaled.data[srcIdx + 1]
      out.data[dstIdx + 2] = scaled.data[srcIdx + 2]
      out.data[dstIdx + 3] = scaled.data[srcIdx + 3]
    }
  }

  const outBuffer = writePng(out, outputPath)

  return {
    pageId: '04-space-home',
    route: meta.route,
    inputFile: basename(inputPath),
    baselineFile: basename(outputPath),
    fixture: meta.fixture,
    state: meta.state,
    inputWidth: srcW,
    inputHeight: srcH,
    method: 'scale-to-393x850-then-pad-to-393x852',
    outputWidth: 393,
    outputHeight: 852,
    paddingTop: 1,
    paddingBottom: 1,
    fillColor: '#f7f4eb',
    inputSha256: sha256(buffer),
    outputSha256: sha256(outBuffer),
  }
}

function normalize(inputDir, outputDir) {
  if (!existsSync(inputDir)) {
    console.error(`ERROR: Input directory not found: ${inputDir}`)
    process.exit(1)
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const files = readdirSync(inputDir).filter(f => f.endsWith('.png')).sort()
  if (files.length === 0) {
    console.error(`ERROR: No PNG files found in ${inputDir}`)
    process.exit(1)
  }

  // Strict count validation
  if (files.length !== EXPECTED_FILE_COUNT) {
    console.error(`ERROR: Expected ${EXPECTED_FILE_COUNT} PNG files, found ${files.length}`)
    process.exit(1)
  }

  const manifest = []

  for (const file of files) {
    const inputPath = join(inputDir, file)
    const outputPath = join(outputDir, file)

    const pageId = basename(file, extname(file))
    const meta = PAGE_META[pageId]
    if (!meta) {
      console.error(`ERROR: Unknown baseline page: ${file} (pageId: ${pageId})`)
      process.exit(1)
    }

    console.log(`Processing: ${file} → route=${meta.route} state=${meta.state}`)

    let record
    if (file.startsWith('04-')) {
      record = normalize04(inputPath, outputPath, meta)
    } else {
      record = normalizeStandard(inputPath, outputPath, meta)
    }

    manifest.push(record)
    console.log(`  → ${record.method}: ${record.inputWidth}×${record.inputHeight} → ${record.outputWidth}×${record.outputHeight}`)
  }

  // Capability probe record
  const capability = {
    tool: 'node + pngjs',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    wechatDevToolsAvailable: false,
    automationSdk: 'none',
    timestamp: new Date().toISOString(),
  }

  const manifestPath = join(outputDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify({
    targetDimensions: { width: TARGET_WIDTH, height: TARGET_HEIGHT },
    capability,
    baselines: manifest,
  }, null, 2))

  console.log(`\nProcessed ${manifest.length} baseline images.`)
  console.log(`Manifest written to ${manifestPath}`)
  return manifest
}

// CLI entry
const args = process.argv.slice(2)
if (args.length >= 2) {
  normalize(args[0], args[1])
} else {
  console.log('Usage: node normalize-baselines.mjs <baselines-dir> <output-dir>')
}
