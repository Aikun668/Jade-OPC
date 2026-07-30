import { ref, type Ref } from 'vue'

export interface PlatformLayout {
  statusBarHeight: string
  navRowHeight: string
  capsuleTop: string
  capsuleLeft: string
  capsuleWidth: string
  capsuleHeight: string
  safeBottom: string
  keyboardHeight: string
}

// ---- Default fallback values ----
const FALLBACK: PlatformLayout = {
  statusBarHeight: '0px',
  navRowHeight: '88rpx',
  capsuleTop: '0px',
  capsuleLeft: '0px',
  capsuleWidth: '0px',
  capsuleHeight: '0px',
  safeBottom: '0px',
  keyboardHeight: '0px',
}

const layout = ref<PlatformLayout>({ ...FALLBACK })

let keyboardCallback: ((res: { height: number }) => void) | null = null

function readPlatformValues(): PlatformLayout {
  try {
    const windowInfo = uni.getWindowInfo()
    const menuRect = uni.getMenuButtonBoundingClientRect()

    const statusBarH = windowInfo.statusBarHeight ?? 0
    const capsuleGap = menuRect.top > 0 ? menuRect.top - statusBarH : 4
    // Standard WeChat custom nav: center capsule vertically in nav row
    const navH = menuRect.height + capsuleGap * 2

    const safeBottom = windowInfo.safeAreaInsets?.bottom ?? 0

    return {
      statusBarHeight: `${statusBarH}px`,
      navRowHeight: `${navH}px`,
      capsuleTop: `${menuRect.top}px`,
      capsuleLeft: `${menuRect.left}px`,
      capsuleWidth: `${menuRect.width}px`,
      capsuleHeight: `${menuRect.height}px`,
      safeBottom: `${safeBottom}px`,
      keyboardHeight: '0px',
    }
  } catch {
    return { ...FALLBACK }
  }
}

export function initPlatformLayout(): void {
  layout.value = readPlatformValues()

  // Keyboard height listener
  try {
    keyboardCallback = (res: { height: number }) => {
      layout.value = { ...layout.value, keyboardHeight: `${res.height}px` }
    }
    uni.onKeyboardHeightChange(keyboardCallback)
  } catch {
    // Keyboard listener not available on all platforms
  }
}

export function destroyPlatformLayout(): void {
  if (keyboardCallback) {
    try {
      uni.offKeyboardHeightChange(keyboardCallback)
    } catch {
      // offKeyboardHeightChange not available on all platforms
    }
    keyboardCallback = null
  }
}

export function usePlatformLayout(): Ref<PlatformLayout> {
  return layout
}
