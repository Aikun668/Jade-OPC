import { ref, type Ref } from 'vue'

export interface PlatformLayout {
  statusBarHeight: string
  navRowHeight: string
  capsuleTop: string
  capsuleLeft: string
  capsuleRight: string
  capsuleBottom: string
  capsuleWidth: string
  capsuleHeight: string
  capsuleRightInset: string
  capsuleGuardRight: string
  safeBottom: string
  keyboardHeight: string
}

// ---- Default fallback values ----
const FALLBACK: PlatformLayout = {
  statusBarHeight: '0px',
  navRowHeight: '88rpx',
  capsuleTop: '0px',
  capsuleLeft: '0px',
  capsuleRight: '0px',
  capsuleBottom: '0px',
  capsuleWidth: '0px',
  capsuleHeight: '0px',
  capsuleRightInset: '0px',
  capsuleGuardRight: '0px',
  safeBottom: '0px',
  keyboardHeight: '0px',
}

const layout = ref<PlatformLayout>({ ...FALLBACK })

function isCapsuleRectValid(
  rect: { top: number; right: number; bottom: number; left: number; width: number; height: number },
  statusBarH: number,
  windowWidth: number,
): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > rect.left &&
    rect.bottom > rect.top &&
    rect.left >= 0 &&
    rect.top >= statusBarH &&
    rect.right <= windowWidth
  )
}

function readPlatformValues(): PlatformLayout {
  try {
    const windowInfo = uni.getWindowInfo()
    const menuRect = uni.getMenuButtonBoundingClientRect()

    const statusBarH = windowInfo.statusBarHeight ?? 0
    const windowWidth = windowInfo.windowWidth ?? 375

    if (!isCapsuleRectValid(menuRect, statusBarH, windowWidth)) {
      return {
        ...FALLBACK,
        statusBarHeight: `${statusBarH}px`,
        safeBottom: `${windowInfo.safeAreaInsets?.bottom ?? 0}px`,
      }
    }

    const capsuleGap = Math.max(menuRect.top - statusBarH, 0)
    const navH = menuRect.height + capsuleGap * 2
    const capsuleRightInset = Math.max(windowWidth - menuRect.right, 0)
    const capsuleGuardRight = Math.max(windowWidth - menuRect.left, 0)
    const safeBottom = windowInfo.safeAreaInsets?.bottom ?? 0

    return {
      statusBarHeight: `${statusBarH}px`,
      navRowHeight: `${navH}px`,
      capsuleTop: `${menuRect.top}px`,
      capsuleLeft: `${menuRect.left}px`,
      capsuleRight: `${menuRect.right}px`,
      capsuleBottom: `${menuRect.bottom}px`,
      capsuleWidth: `${menuRect.width}px`,
      capsuleHeight: `${menuRect.height}px`,
      capsuleRightInset: `${capsuleRightInset}px`,
      capsuleGuardRight: `${capsuleGuardRight}px`,
      safeBottom: `${safeBottom}px`,
      keyboardHeight: '0px',
    }
  } catch {
    return { ...FALLBACK }
  }
}

export function initPlatformLayout(): void {
  layout.value = readPlatformValues()
}

export function destroyPlatformLayout(): void {
  // Keyboard layout is controlled by page-level focus/blur state. Keeping
  // this lifecycle hook preserves the adapter contract without registering
  // a global listener that is unstable in the WeChat DevTools bridge.
}

export function usePlatformLayout(): Ref<PlatformLayout> {
  return layout
}
