import { vi } from 'vitest'

const uniLifecycle = vi.hoisted(() => ({
  onShow: [] as Array<() => void>,
  nextLoadOptions: undefined as Record<string, unknown> | undefined,
}))

;(globalThis as typeof globalThis & {
  __uniLifecycle: typeof uniLifecycle
}).__uniLifecycle = uniLifecycle

// @dcloudio/uni-app shim — vitest jsdom environment doesn't support
// uni-app's internal Vue lifecycle hooks. Mock lifecycle registrars
// as no-ops to prevent "vue.injectHook is not a function" errors.
vi.mock('@dcloudio/uni-app', () => {
  return {
    onLoad: (fn: (options?: Record<string, unknown>) => void) => {
      // Fire synchronously with empty options — mimics a real page load
      // where onLoad callback fires immediately with route query.
      const options = uniLifecycle.nextLoadOptions ?? {}
      uniLifecycle.nextLoadOptions = undefined
      fn(options)
    },
    onShow: (fn: () => void) => {
      uniLifecycle.onShow.push(fn)
    },
    onHide: () => {},
    onReady: (fn: () => void) => {
      // Simulate the mini-program page-ready boundary asynchronously so tests
      // can distinguish first render from post-ready navigation.
      queueMicrotask(fn)
    },
    onUnload: () => {},
  }
})
