import { vi } from 'vitest'

// @dcloudio/uni-app shim — vitest jsdom environment doesn't support
// uni-app's internal Vue lifecycle hooks. Mock lifecycle registrars
// as no-ops to prevent "vue.injectHook is not a function" errors.
vi.mock('@dcloudio/uni-app', () => {
  return {
    onLoad: (fn: (options?: Record<string, unknown>) => void) => {
      // Fire synchronously with empty options — mimics a real page load
      // where onLoad callback fires immediately with route query.
      fn({})
    },
    onShow: () => {},
    onHide: () => {},
    onReady: () => {},
    onUnload: () => {},
  }
})
