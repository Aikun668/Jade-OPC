import { describe, it, expect } from 'vitest'
import type { PlatformLayout } from '../../src/adapters/platform-layout'

const FALLBACK_NAV_HEIGHT = '88rpx'

function computeLayout(
  windowWidth: number,
  statusBarH: number,
  capsuleTop: number,
  capsuleRight: number,
  capsuleBottom: number,
  capsuleWidth: number,
  capsuleHeight: number,
  capsuleLeft: number,
  safeBottom: number,
): PlatformLayout {
  const rectValid =
    capsuleWidth > 0 &&
    capsuleHeight > 0 &&
    capsuleRight > capsuleLeft &&
    capsuleBottom > capsuleTop &&
    capsuleLeft >= 0 &&
    capsuleTop >= statusBarH &&
    capsuleRight <= windowWidth

  if (!rectValid) {
    return {
      statusBarHeight: `${statusBarH}px`,
      navRowHeight: FALLBACK_NAV_HEIGHT,
      capsuleTop: '0px',
      capsuleLeft: '0px',
      capsuleRight: '0px',
      capsuleBottom: '0px',
      capsuleWidth: '0px',
      capsuleHeight: '0px',
      capsuleRightInset: '0px',
      capsuleGuardRight: '0px',
      safeBottom: `${safeBottom}px`,
      keyboardHeight: '0px',
    }
  }

  const capsuleGap = capsuleTop - statusBarH
  const navH = capsuleHeight + capsuleGap * 2
  const capsuleRightInset = Math.max(windowWidth - capsuleRight, 0)
  const capsuleGuardRight = Math.max(windowWidth - capsuleLeft, 0)

  return {
    statusBarHeight: `${statusBarH}px`,
    navRowHeight: `${navH}px`,
    capsuleTop: `${capsuleTop}px`,
    capsuleLeft: `${capsuleLeft}px`,
    capsuleRight: `${capsuleRight}px`,
    capsuleBottom: `${capsuleBottom}px`,
    capsuleWidth: `${capsuleWidth}px`,
    capsuleHeight: `${capsuleHeight}px`,
    capsuleRightInset: `${capsuleRightInset}px`,
    capsuleGuardRight: `${capsuleGuardRight}px`,
    safeBottom: `${safeBottom}px`,
    keyboardHeight: '0px',
  }
}

describe('platform layout computation', () => {
  describe('capsuleGuardRight', () => {
    it('computers capsuleGuardRight as windowWidth - capsuleLeft (iPhone style)', () => {
      // windowWidth=393, capsule left=281 → guardRight = 112
      const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)
      expect(result.capsuleGuardRight).toBe('112px')
      expect(result.capsuleRight).toBe('368px')
      expect(result.capsuleBottom).toBe('94px')
    })

    it('computers capsuleRightInset as windowWidth - capsuleRight', () => {
      // windowWidth=393, capsule right=368 → inset = 25
      const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)
      expect(result.capsuleRightInset).toBe('25px')
    })

    it('computers different capsuleGuardRight for Android-style dimensions', () => {
      // Android: windowWidth=360, capsule left=261, width=87 → guardRight = 99
      const result = computeLayout(360, 24, 32, 348, 64, 87, 32, 261, 0)
      expect(result.capsuleGuardRight).toBe('99px')
      expect(result.capsuleRightInset).toBe('12px')
    })

    it('capsuleGuardRight accounts for right inset + capsule width', () => {
      // windowWidth - capsuleLeft = (windowWidth - capsuleRight) + capsuleWidth
      // 393 - 281 = 112, 393 - 368 = 25, 87 → 25 + 87 = 112
      const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)
      const guardRightPx = parseInt(result.capsuleGuardRight)
      const rightInsetPx = parseInt(result.capsuleRightInset)
      const widthPx = parseInt(result.capsuleWidth)
      expect(guardRightPx).toBe(rightInsetPx + widthPx)
    })
  })

  describe('capsule validity checks and fallback', () => {
    it('falls back when capsule width is 0', () => {
      const result = computeLayout(393, 54, 62, 368, 94, 0, 32, 281, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
      expect(result.capsuleGuardRight).toBe('0px')
    })

    it('falls back when capsule height is 0', () => {
      const result = computeLayout(393, 54, 62, 368, 94, 87, 0, 281, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when right <= left', () => {
      const result = computeLayout(393, 54, 62, 281, 94, 87, 32, 368, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when bottom <= top', () => {
      const result = computeLayout(393, 54, 62, 368, 60, 87, 32, 281, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when left < 0', () => {
      const result = computeLayout(393, 54, 62, 368, 94, 87, 32, -1, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when top < statusBarHeight', () => {
      const result = computeLayout(393, 54, 40, 368, 94, 87, 32, 281, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when right > windowWidth', () => {
      const result = computeLayout(393, 54, 62, 400, 94, 87, 32, 281, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
    })

    it('falls back when all capsule values are 0', () => {
      const result = computeLayout(393, 54, 0, 0, 0, 0, 0, 0, 34)
      expect(result.navRowHeight).toBe(FALLBACK_NAV_HEIGHT)
      expect(result.capsuleGuardRight).toBe('0px')
    })
  })

  describe('valid capsules pass all checks', () => {
    it('passes for iPhone-style rect', () => {
      const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)
      expect(result.navRowHeight).toBe('48px')
      expect(result.capsuleTop).toBe('62px')
    })

    it('passes for Android-style rect', () => {
      const result = computeLayout(360, 24, 32, 348, 64, 87, 32, 261, 0)
      expect(result.navRowHeight).toBe('48px')
    })

    it('passes for boundary case: top === statusBarHeight', () => {
      const result = computeLayout(393, 62, 62, 368, 94, 87, 32, 281, 34)
      expect(result.navRowHeight).toBe('32px') // gap = 0, navH = 32 + 0
    })

    it('passes for boundary case: right === windowWidth', () => {
      const result = computeLayout(393, 54, 62, 393, 94, 87, 32, 281, 34)
      expect(result.capsuleRightInset).toBe('0px')
    })
  })

  // ---- original tests preserved ----

  it('computes nav height from capsule position for real device', () => {
    const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)

    const gap = 62 - 54
    expect(result.navRowHeight).toBe(`${32 + gap * 2}px`)
    expect(result.statusBarHeight).toBe('54px')
    expect(result.capsuleWidth).toBe('87px')
    expect(result.capsuleHeight).toBe('32px')
    expect(result.capsuleLeft).toBe('281px')
    expect(result.safeBottom).toBe('34px')
  })

  it('computes nav height with standard Android dimensions', () => {
    const result = computeLayout(360, 24, 32, 348, 64, 87, 32, 261, 0)

    const gap = 32 - 24
    expect(result.navRowHeight).toBe(`${32 + gap * 2}px`)
    expect(result.statusBarHeight).toBe('24px')
    expect(result.safeBottom).toBe('0px')
  })

  it('uses correct formula: navH = capsuleH + (capsuleTop - statusBarH) * 2', () => {
    const result = computeLayout(393, 30, 40, 350, 72, 87, 36, 263, 0)
    expect(result.navRowHeight).toBe('56px')
  })

  it('all layout values are pixel strings except fallback', () => {
    const result = computeLayout(393, 44, 52, 350, 84, 87, 32, 263, 34)

    expect(result.statusBarHeight).toMatch(/px$/)
    expect(result.capsuleTop).toMatch(/px$/)
    expect(result.capsuleWidth).toMatch(/px$/)
    expect(result.capsuleHeight).toMatch(/px$/)
    expect(result.capsuleLeft).toMatch(/px$/)
    expect(result.capsuleRight).toMatch(/px$/)
    expect(result.capsuleBottom).toMatch(/px$/)
    expect(result.capsuleRightInset).toMatch(/px$/)
    expect(result.capsuleGuardRight).toMatch(/px$/)
    expect(result.safeBottom).toMatch(/px$/)
  })

  it('keyboardHeight defaults to 0px', () => {
    const result = computeLayout(393, 54, 62, 368, 94, 87, 32, 281, 34)
    expect(result.keyboardHeight).toBe('0px')
  })
})
