// Generates side-by-side, overlay, and diff comparison images
// Usage: node scripts/visual-regression/generate-comparison.mjs <baseline> <implementation> <output-dir> <output-prefix>

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { PNG } from 'pngjs'

const TARGET_W = 393
const TARGET_H = 852

function readPNG(path) {
  return PNG.sync.read(readFileSync(path))
}

function writePNG(path, png) {
  writeFileSync(path, PNG.sync.write(png))
}

function resizeTo(png, w, h) {
  if (png.width === w && png.height === h) return png
  const out = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.floor((x / w) * png.width)
      const sy = Math.floor((y / h) * png.height)
      const si = (png.width * sy + sx) << 2
      const di = (w * y + x) << 2
      out.data[di] = png.data[si]
      out.data[di + 1] = png.data[si + 1]
      out.data[di + 2] = png.data[si + 2]
      out.data[di + 3] = png.data[si + 3]
    }
  }
  return out
}

function padTo(png, w, h, r, g, b, a) {
  if (png.width === w && png.height === h) return png
  const out = new PNG({ width: w, height: h })
  // Fill with pad color
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = r
    out.data[i + 1] = g
    out.data[i + 2] = b
    out.data[i + 3] = a
  }
  const ox = Math.floor((w - png.width) / 2)
  const oy = Math.floor((h - png.height) / 2)
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const si = (png.width * y + x) << 2
      const di = (w * (y + oy) + (x + ox)) << 2
      out.data[di] = png.data[si]
      out.data[di + 1] = png.data[si + 1]
      out.data[di + 2] = png.data[si + 2]
      out.data[di + 3] = png.data[si + 3]
    }
  }
  return out
}

function normalize(png) {
  return resizeTo(png, TARGET_W, TARGET_H)
}

function generateSideBySide(baseline, impl) {
  const w = TARGET_W * 2
  const h = TARGET_H
  const out = new PNG({ width: w, height: h })
  // Left: baseline
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < TARGET_W; x++) {
      const si = (TARGET_W * y + x) << 2
      const di = (w * y + x) << 2
      out.data[di] = baseline.data[si]
      out.data[di + 1] = baseline.data[si + 1]
      out.data[di + 2] = baseline.data[si + 2]
      out.data[di + 3] = 255
    }
  }
  // Right: implementation
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < TARGET_W; x++) {
      const si = (TARGET_W * y + x) << 2
      const di = (w * y + (x + TARGET_W)) << 2
      out.data[di] = impl.data[si]
      out.data[di + 1] = impl.data[si + 1]
      out.data[di + 2] = impl.data[si + 2]
      out.data[di + 3] = 255
    }
  }
  return out
}

function generateOverlay(baseline, impl) {
  const out = new PNG({ width: TARGET_W, height: TARGET_H })
  for (let y = 0; y < TARGET_H; y++) {
    for (let x = 0; x < TARGET_W; x++) {
      const i = (TARGET_W * y + x) << 2
      out.data[i] = Math.round((baseline.data[i] + impl.data[i]) / 2)
      out.data[i + 1] = Math.round((baseline.data[i + 1] + impl.data[i + 1]) / 2)
      out.data[i + 2] = Math.round((baseline.data[i + 2] + impl.data[i + 2]) / 2)
      out.data[i + 3] = 255
    }
  }
  return out
}

function generateDiff(baseline, impl) {
  const out = new PNG({ width: TARGET_W, height: TARGET_H })
  for (let y = 0; y < TARGET_H; y++) {
    for (let x = 0; x < TARGET_W; x++) {
      const i = (TARGET_W * y + x) << 2
      const dr = Math.abs(baseline.data[i] - impl.data[i])
      const dg = Math.abs(baseline.data[i + 1] - impl.data[i + 1])
      const db = Math.abs(baseline.data[i + 2] - impl.data[i + 2])
      const diff = Math.max(dr, dg, db)
      // Amplify differences for visibility: diff * 4
      const v = Math.min(255, diff * 4)
      out.data[i] = v
      out.data[i + 1] = v
      out.data[i + 2] = v
      out.data[i + 3] = 255
    }
  }
  return out
}

function main() {
  const args = process.argv.slice(2)
  if (args.length < 4) {
    console.error('Usage: generate-comparison.mjs <baseline> <implementation> <output-dir> <output-prefix>')
    process.exit(1)
  }
  const [baselinePath, implPath, outputDir, prefix] = args

  if (!existsSync(baselinePath)) {
    console.error(`Baseline not found: ${baselinePath}`)
    process.exit(1)
  }
  if (!existsSync(implPath)) {
    console.error(`Implementation not found: ${implPath}`)
    process.exit(1)
  }
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  console.log(`Reading baseline: ${baselinePath}`)
  const baseline = readPNG(baselinePath)
  console.log(`  ${baseline.width}×${baseline.height}`)

  console.log(`Reading implementation: ${implPath}`)
  const impl = readPNG(implPath)
  console.log(`  ${impl.width}×${impl.height}`)

  const bNorm = normalize(baseline)
  const iNorm = normalize(impl)

  console.log('Generating side-by-side...')
  const sbs = generateSideBySide(bNorm, iNorm)
  writePNG(resolve(outputDir, `${prefix}-side-by-side.png`), sbs)
  console.log(`  -> ${prefix}-side-by-side.png (${sbs.width}×${sbs.height})`)

  console.log('Generating overlay...')
  const overlay = generateOverlay(bNorm, iNorm)
  writePNG(resolve(outputDir, `${prefix}-overlay.png`), overlay)
  console.log(`  -> ${prefix}-overlay.png (${overlay.width}×${overlay.height})`)

  console.log('Generating diff...')
  const diff = generateDiff(bNorm, iNorm)
  writePNG(resolve(outputDir, `${prefix}-diff.png`), diff)
  console.log(`  -> ${prefix}-diff.png (${diff.width}×${diff.height})`)

  console.log('\nDone.')
}

main()
