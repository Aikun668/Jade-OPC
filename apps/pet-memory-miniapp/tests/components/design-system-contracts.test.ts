import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function tokensContent(): string {
  return readFileSync(
    resolve(__dirname, '../../src/styles/tokens.scss'),
    'utf-8'
  )
}

const REQUIRED_COLORS = [
  '$pm-color-canvas',
  '$pm-color-surface',
  '$pm-color-ink',
  '$pm-color-muted',
  '$pm-color-line',
  '$pm-color-olive',
  '$pm-color-olive-pressed',
  '$pm-color-olive-soft',
  '$pm-color-danger',
  '$pm-color-overlay',
  '$pm-color-on-primary',
]

const REQUIRED_FONTS = [
  '$pm-font-display',
  '$pm-font-page-title',
  '$pm-font-section-title',
  '$pm-font-item-title',
  '$pm-font-body',
  '$pm-font-support',
  '$pm-font-meta',
]

const REQUIRED_FONT_WEIGHTS = [
  '$pm-weight-regular',
  '$pm-weight-medium',
  '$pm-weight-semibold',
]

const REQUIRED_LEADINGS = [
  '$pm-leading-title',
  '$pm-leading-compact',
  '$pm-leading-body',
]

const REQUIRED_SPACING = [
  '$pm-space-1',
  '$pm-space-2',
  '$pm-space-3',
  '$pm-space-4',
  '$pm-space-5',
  '$pm-space-6',
  '$pm-space-8',
  '$pm-space-10',
  '$pm-space-12',
  '$pm-space-16',
]

const REQUIRED_SEMANTIC_SPACING = [
  '$pm-page-inline',
  '$pm-section-gap',
  '$pm-content-gap',
  '$pm-control-gap',
  '$pm-text-gap',
  '$pm-safe-bottom-extra',
]

const REQUIRED_RADII = [
  '$pm-radius-sm',
  '$pm-radius-md',
  '$pm-radius-lg',
  '$pm-radius-dialog',
  '$pm-radius-round',
]

const REQUIRED_CONTROLS = [
  '$pm-control-height-primary',
  '$pm-control-height-regular',
  '$pm-hit-target-min',
  '$pm-icon-sm',
  '$pm-icon-md',
]

const REQUIRED_MOTION = [
  '$pm-motion-fast',
  '$pm-motion-base',
  '$pm-motion-sheet',
  '$pm-ease-standard',
]

const FORBIDDEN_INTERMEDIATE_SIZES = [
  '11px', '11rpx',
  '14px', '14rpx',
  '17px', '17rpx',
  '20px', '20rpx',
  '22px', '22rpx',
]

describe('M0 design tokens contract', () => {
  let content: string

  beforeAll(() => {
    content = tokensContent()
  })

  describe('4.1 Color tokens', () => {
    it.each(REQUIRED_COLORS)('defines %s', (name) => {
      expect(content).toContain(name)
    })
  })

  describe('4.2 Typography tokens', () => {
    it.each(REQUIRED_FONTS)('defines %s', (name) => {
      expect(content).toContain(name)
    })

    it.each(REQUIRED_FONT_WEIGHTS)('defines %s', (name) => {
      expect(content).toContain(name)
    })

    it.each(REQUIRED_LEADINGS)('defines %s', (name) => {
      expect(content).toContain(name)
    })
  })

  describe('4.3 Spacing tokens', () => {
    it.each(REQUIRED_SPACING)('defines %s', (name) => {
      expect(content).toContain(name)
    })

    it.each(REQUIRED_SEMANTIC_SPACING)('defines %s', (name) => {
      expect(content).toContain(name)
    })
  })

  describe('4.4 Border, radius & shadow tokens', () => {
    it.each(REQUIRED_RADII)('defines %s', (name) => {
      expect(content).toContain(name)
    })

    it('defines $pm-border-hairline', () => {
      expect(content).toContain('$pm-border-hairline')
    })

    it('defines $pm-shadow-paper', () => {
      expect(content).toContain('$pm-shadow-paper')
    })
  })

  describe('4.5 Control & hit target tokens', () => {
    it.each(REQUIRED_CONTROLS)('defines %s', (name) => {
      expect(content).toContain(name)
    })
  })

  describe('4.6 Motion tokens', () => {
    it.each(REQUIRED_MOTION)('defines %s', (name) => {
      expect(content).toContain(name)
    })
  })

  describe('forbidden values', () => {
    it.each(FORBIDDEN_INTERMEDIATE_SIZES)(
      'does not contain intermediate font size %s',
      (size) => {
        // check that size values don't appear as SCSS variable declarations
        const varDeclarations = content.match(/^(\$[\w-]+):\s*(.+);$/gm) || []
        const found = varDeclarations.some(
          (line) => line.includes(size) && line.includes('font')
        )
        expect(found).toBe(false)
      }
    )
  })

  describe('photo tokens (Section 8.1)', () => {
    it('defines photo size tokens', () => {
      expect(content).toContain('$pm-photo-space-list')
      expect(content).toContain('$pm-photo-space-create')
      expect(content).toContain('$pm-photo-space-home')
      expect(content).toContain('$pm-photo-memory-thumb')
      expect(content).toContain('$pm-photo-editor-thumb')
    })

    it('defines photo ratio tokens', () => {
      expect(content).toContain('$pm-photo-preview-ratio')
      expect(content).toContain('$pm-photo-detail-ratio')
    })

    it('defines photo stack tokens', () => {
      expect(content).toContain('$pm-photo-stack-reserve-x')
      expect(content).toContain('$pm-photo-stack-reserve-y')
      expect(content).toContain('$pm-photo-viewer-bg')
    })
  })

  describe('draft notice tokens (Section 9.1)', () => {
    it('defines draft notice dimension tokens', () => {
      expect(content).toContain('$pm-draft-notice-width')
      expect(content).toContain('$pm-draft-notice-height')
      expect(content).toContain('$pm-draft-notice-padding-left')
      expect(content).toContain('$pm-draft-notice-padding-right')
    })
  })

  describe('layout constants (Section 5.2)', () => {
    it('defines layout constants', () => {
      expect(content).toContain('$pm-nav-row-height')
      expect(content).toContain('$pm-nav-content-gap')
      expect(content).toContain('$pm-page-bottom')
      expect(content).toContain('$pm-layout-max-width')
    })
  })
})
