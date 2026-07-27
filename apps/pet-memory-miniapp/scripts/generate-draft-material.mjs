import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ==========================================
// Generate draft-notice-paper.png (1340×416)
// Paper fiber + torn edge + tape + shadow
// ==========================================

const __dirname = dirname(fileURLToPath(import.meta.url))
const W = 1340
const H = 416
const png = new PNG({ width: W, height: H })

// Seeded random for reproducible texture
let seed = 42
function rand() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

// ---- Paper fiber noise (subtle brightness variation) ----
function fiberValue(x, y) {
  let v = 0
  // Multi-octave noise for paper-like texture
  const scales = [
    { freq: 0.008, amp: 0.7 },
    { freq: 0.025, amp: 0.2 },
    { freq: 0.07, amp: 0.08 },
    { freq: 0.003, amp: 0.02 }, // large-scale variation
  ]
  for (const s of scales) {
    const sx = x * s.freq + 1000
    const sy = y * s.freq + 2000
    // Simple value noise
    const ix = Math.floor(sx)
    const iy = Math.floor(sy)
    const fx = sx - ix
    const fy = sy - iy
    const n00 = ((ix * 157 + iy * 31337) % 65536) / 65536
    const n10 = (((ix + 1) * 157 + iy * 31337) % 65536) / 65536
    const n01 = ((ix * 157 + (iy + 1) * 31337) % 65536) / 65536
    const n11 = (((ix + 1) * 157 + (iy + 1) * 31337) % 65536) / 65536
    const nx0 = n00 + (n10 - n00) * (fx * fx * (3 - 2 * fx))
    const nx1 = n01 + (n11 - n01) * (fx * fx * (3 - 2 * fx))
    v += (nx0 + (nx1 - nx0) * (fy * fy * (3 - 2 * fy))) * s.amp
  }
  return v
}

// ---- Torn right edge: wavy displacement from base x ----
function tornEdgeX(y) {
  let x = W - 20 // base right edge position (20px from canvas right)
  // Large waves
  x += Math.sin(y * 0.012 + 1.3) * 12
  x += Math.sin(y * 0.028 + 3.7) * 6
  x += Math.sin(y * 0.05 + 5.1) * 3
  // Micro-tears
  x += Math.sin(y * 0.09 + 2.2) * 1.5
  return x
}

// ---- Tape region (top-left, double-layer semi-transparent) ----
function isTape(x, y) {
  // Tape 1: angled tape strip
  const cx1 = 140
  const cy1 = 30
  const angle1 = -0.09 // slight counter-clockwise
  const hw1 = 55 // half width
  const hh1 = 18 // half height

  const dx1 = x - cx1
  const dy1 = y - cy1
  const rx1 = dx1 * Math.cos(-angle1) - dy1 * Math.sin(-angle1)
  const ry1 = dx1 * Math.sin(-angle1) + dy1 * Math.cos(-angle1)

  if (Math.abs(rx1) < hw1 && Math.abs(ry1) < hh1) {
    const edgeFade = Math.min(
      1,
      (hw1 - Math.abs(rx1)) / 4,
      (hh1 - Math.abs(ry1)) / 3
    )
    return { inside: true, alpha: Math.min(1, edgeFade) * 0.32 }
  }

  // Tape 2: slightly offset overlap
  const cx2 = 128
  const cy2 = 26
  const angle2 = -0.14
  const hw2 = 48
  const hh2 = 16

  const dx2 = x - cx2
  const dy2 = y - cy2
  const rx2 = dx2 * Math.cos(-angle2) - dy2 * Math.sin(-angle2)
  const ry2 = dx2 * Math.sin(-angle2) + dy2 * Math.cos(-angle2)

  if (Math.abs(rx2) < hw2 && Math.abs(ry2) < hh2) {
    const edgeFade = Math.min(
      1,
      (hw2 - Math.abs(rx2)) / 4,
      (hh2 - Math.abs(ry2)) / 3
    )
    return { inside: true, alpha: Math.min(1, edgeFade) * 0.28 }
  }

  return { inside: false, alpha: 0 }
}

// ---- Shadow: soft gradient on right and bottom edges ----
function shadowAlpha(x, y, tornX) {
  // Shadow extends right from the torn edge
  const distFromTorn = x - tornX
  if (distFromTorn <= 0) return 0
  if (distFromTorn > 30) return 0
  // Soft falloff
  let a = (1 - distFromTorn / 30) * 0.22
  // Bottom edge shadow
  const distFromBottom = H - y
  if (distFromBottom < 12) {
    a = Math.max(a, (1 - distFromBottom / 12) * 0.18)
  }
  // Top edge very subtle shadow
  if (y < 6) {
    a = Math.max(a, (1 - y / 6) * 0.1)
  }
  return a * (0.7 + rand() * 0.3) // slight noise
}

// ---- Render ----
for (let y = 0; y < H; y++) {
  const tornX = tornEdgeX(y)
  for (let x = 0; x < W; x++) {
    const idx = (W * y + x) << 2

    // Check if pixel is on the paper (left of torn edge + left margin)
    const paperLeft = 0
    const paperRight = tornX

    if (x < paperLeft || x > paperRight) {
      // Outside paper: transparent
      png.data[idx] = 0
      png.data[idx + 1] = 0
      png.data[idx + 2] = 0
      png.data[idx + 3] = 0
      continue
    }

    // Base paper color: warm white #fffdf8
    const fiber = fiberValue(x, y) // 0..1 noise value
    const brightnessShift = (fiber - 0.5) * 12 // ±6 brightness variation

    let r = 0xff + brightnessShift
    let g = 0xfd + brightnessShift
    let b = 0xf8 + brightnessShift

    // Slight yellow shift for fiber variation
    const yellowShift = (fiber - 0.5) * 4
    r = Math.min(255, Math.max(245, r))
    g = Math.min(255, Math.max(245, g + yellowShift * 0.3))
    b = Math.min(255, Math.max(240, b - yellowShift * 0.5))

    // Tape overlay
    const tape = isTape(x, y)
    if (tape.inside) {
      // Tape is semi-transparent warm beige
      const tapeBlend = tape.alpha
      r = r * (1 - tapeBlend) + 0xe8 * tapeBlend
      g = g * (1 - tapeBlend) + 0xe0 * tapeBlend
      b = b * (1 - tapeBlend) + 0xd2 * tapeBlend
      // Slightly more opaque near edges of tape
      r = Math.round(r)
      g = Math.round(g)
      b = Math.round(b)
    }

    // Edge darkening near tear
    const edgeDist = tornX - x
    const edgeFade = edgeDist < 15 ? (edgeDist / 15) : 1
    if (edgeFade < 1) {
      const darkenFactor = 1 - (1 - edgeFade) * 0.15
      r = Math.round(r * darkenFactor)
      g = Math.round(g * darkenFactor)
      b = Math.round(b * darkenFactor)
    }

    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)

    // Shadow
    const s = shadowAlpha(x, y, tornX)

    // Alpha: paper is fully opaque, except at torn edge micro-variations
    let alpha = 255
    if (edgeDist < 3) {
      alpha = Math.round(200 + edgeDist / 3 * 55)
    }

    // Composite shadow into output
    if (s > 0) {
      // Shadow color: #2e302b * s
      const sr = 0x2e
      const sg = 0x30
      const sb = 0x2b
      const sa = Math.round(s * 255)
      // Alpha blend shadow onto transparent background
      const outA = alpha / 255 + sa / 255 * (1 - alpha / 255)
      if (outA > 0) {
        png.data[idx] = Math.round((r * alpha / 255 + sr * sa / 255 * (1 - alpha / 255)) / outA)
        png.data[idx + 1] = Math.round((g * alpha / 255 + sg * sa / 255 * (1 - alpha / 255)) / outA)
        png.data[idx + 2] = Math.round((b * alpha / 255 + sb * sa / 255 * (1 - alpha / 255)) / outA)
        png.data[idx + 3] = Math.round(Math.min(255, outA * 255))
      }
    } else {
      png.data[idx] = r
      png.data[idx + 1] = g
      png.data[idx + 2] = b
      png.data[idx + 3] = alpha
    }
  }
}

// ---- Save ----
const outDir = join(__dirname, '..', '..', 'static', 'ui')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'draft-notice-paper.png')
writeFileSync(outPath, PNG.sync.write(png))
console.log(`Generated: ${outPath} (${W}×${H})`)
