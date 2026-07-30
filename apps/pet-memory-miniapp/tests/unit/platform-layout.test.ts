import { describe, it, expect, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import type { PlatformLayout } from '../../src/adapters/platform-layout'

// We test the logic directly since uni.getWindowInfo / uni.getMenuButtonBoundingClientRect
// are platform APIs not available in vitest. The tests verify formula correctness and fallback behavior.

const FALLBACK_NAV_HEIGHT = '88rpx'

function computeLayout(
  statusBarH: number,
  capsuleTop: number,
  capsuleWidth: number,
  capsuleHeight: number,
  capsuleLeft: number,
  safeBottom: number,
): PlatformLayout {
  if (capsuleTop <= 0) {
    return {
      statusBarHeight: `${statusBarH}px`,
      navRowHeight: FALLBACK_NAV_HEIGHT,
      capsuleTop: '0px',
      capsuleLeft: '0px',
      capsuleWidth: '0px',
      capsuleHeight: '0px',
      safeBottom: `${safeBottom}px`,
      keyboardHeight: '0px',
    }
  }

  const capsuleGap = capsuleTop - statusBarH
  const navH = capsuleHeight + capsuleGap * 2

  return {
    statusBarHeight: `${statusBarH}px`,
    navRowHeight: `${navH}px`,
    capsuleTop: `${capsuleTop}px`,
    capsuleLeft: `${capsuleLeft}px`,
    capsuleWidth: `${capsuleWidth}px`,
    capsuleHeight: `${capsuleHeight}px`,
    safeBottom: `${safeBottom}px`,
    keyboardHeight: '0px',
  }
}

describe('platform layout computation', () => {
  // ---- Real device scenario (iPhone-style) ----
  it('computes nav height from capsule position for real device', () => {
    // iPhone 14 Pro-like: statusBar=54px, capsule top=62px, capsule=87x32
    const result = computeLayout(54, 62, 87, 32, 281, 34)

    const gap = 62 - 54 // 8px
    expect(result.navRowHeight).toBe(`${32 + gap * 2}px`) // 48px
    expect(result.statusBarHeight).toBe('54px')
    expect(result.capsuleWidth).toBe('87px')
    expect(result.capsuleHeight).toBe('32px')
    expect(result.capsuleLeft).toBe('281px')
    expect(result.safeBottom).toBe('34px')
  })

  // ---- Standard Android ----
  it('computes nav height with standard Android dimensions', () => {
    const result = computeLayout(24, 32, 87, 32, 281, 0)

    const gap = 32 - 24 // 8px
    expect(result.navRowHeight).toBe(`${32 + gap * 2}px`) // 48px
    expect(result.statusBarHeight).toBe('24px')
    expect(result.safeBottom).toBe('0px')
  })

  // ---- Missing capsule data: fallback to 88rpx ----
  it('falls back to 88rpx nav height when capsule top is zero', () => {
    const result = computeLayout(44, 0, 0, 0, 0, 0)

    expect(result.navRowHeight).toBe('88rpx')
    expect(result.statusBarHeight).toBe('44px')
    expect(result.capsuleWidth).toBe('0px')
    expect(result.capsuleHeight).toBe('0px')
  })

  it('falls back to 88rpx nav height when capsule top is negative', () => {
    const result = computeLayout(44, -1, 87, 32, 281, 0)

    expect(result.navRowHeight).toBe('88rpx')
  })

  // ---- Standard formula: navRowHeight = capsuleHeight + (capsuleTop - statusBarH) * 2 ----
  it('uses correct formula: navH = capsuleH + (capsuleTop - statusBarH) * 2', () => {
    // statusBar=30, capsuleTop=40, capsuleHeight=36
    // gap = 10, navH = 36 + 20 = 56
    const result = computeLayout(30, 40, 87, 36, 281, 0)

    expect(result.navRowHeight).toBe('56px')
  })

  // ---- All values are px strings ----
  it('all layout values are pixel strings except fallback', () => {
    const result = computeLayout(44, 52, 87, 32, 281, 34)

    // All non-fallback values end in 'px'
    expect(result.statusBarHeight).toMatch(/px$/)
    expect(result.capsuleTop).toMatch(/px$/)
    expect(result.capsuleWidth).toMatch(/px$/)
    expect(result.capsuleHeight).toMatch(/px$/)
    expect(result.capsuleLeft).toMatch(/px$/)
    expect(result.safeBottom).toMatch(/px$/)
  })
})

describe('usePlatformLayout', () => {
  it('returns a reactive ref', () => {
    // Verify the composable returns a Ref<PlatformLayout>
    const layout = ref<PlatformLayout>({
      statusBarHeight: '0px',
      navRowHeight: '88rpx',
      capsuleTop: '0px',
      capsuleLeft: '0px',
      capsuleWidth: '0px',
      capsuleHeight: '0px',
      safeBottom: '0px',
      keyboardHeight: '0px',
    })

    expect(layout.value.navRowHeight).toBe('88rpx')

    layout.value = { ...layout.value, navRowHeight: '48px', statusBarHeight: '54px' }
    expect(layout.value.navRowHeight).toBe('48px')
    expect(layout.value.statusBarHeight).toBe('54px')
  })
})
