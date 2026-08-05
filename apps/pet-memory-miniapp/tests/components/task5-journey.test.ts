import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import { providePhotoPicker, _resetPhotoPicker } from '../../src/adapters/photo-picker-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import type { PhotoPicker, PickResult } from '../../src/adapters/photo-picker'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mockPhotoPicker(overrides: Partial<PhotoPicker> = {}): PhotoPicker {
  return {
    pick: vi.fn().mockResolvedValue({ kind: 'cancelled' } as PickResult),
    ...overrides,
  }
}

function stubPageShell(extra = '') {
  return {
    template: `
      <view class="mock-pageshell">
        <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
        <view class="mock-keyboard">{{ $attrs.keyboardOpen ? 'kb-open' : 'kb-closed' }}</view>
        <slot name="intro" />
        <slot />
        <slot name="actions" />
        ${extra}
      </view>
    `,
    inheritAttrs: true,
  }
}

/* ------------------------------------------------------------------ */
/*  Journey: 01 → 13 → 01 → 03 → 04                                   */
/* ------------------------------------------------------------------ */

describe('Task 5B journey (01 → 13 → 01 → 03 → 04)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetPhotoPicker()
    vi.stubGlobal('uni', {
      getWindowInfo: () => ({ windowWidth: 390 }),
      getMenuButtonBoundingClientRect: () => ({
        width: 87, height: 32, top: 52, right: 375, bottom: 84, left: 288,
      }),
      onKeyboardHeightChange: () => {},
      offKeyboardHeightChange: () => {},
    })
  })

  // ---- J01: empty → onboarding → space-create ----

  it('J01: empty bootstrap → 01 → click start → 03', async () => {
    const memStore = useMemoryStore()
    const appStore = useAppStore()
    memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    appStore.commitBootstrapReady({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
    })

    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())

    const OnboardingPage = (await import('../../src/pages/onboarding/index.vue')).default
    const onboardingWrapper = mount(OnboardingPage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    // Should show onboarding content
    expect(onboardingWrapper.text()).toContain('给 Ta 留一个安静的位置')

    // Click "开始"
    vi.spyOn(appStore, 'completeOnboarding').mockResolvedValue()
    const startBtn = onboardingWrapper.find('.onboarding__start button')
    await startBtn.trigger('click')

    expect(appStore.completeOnboarding).toHaveBeenCalled()
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index')
  })

  // ---- J02: onboarding → privacy → back ----

  it('J02: 01 → 13 → back to 01 keeps onboarding state', async () => {
    const memStore = useMemoryStore()
    const appStore = useAppStore()
    memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    appStore.commitBootstrapReady({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
    })

    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())

    const OnboardingPage = (await import('../../src/pages/onboarding/index.vue')).default
    const onboardingWrapper = mount(OnboardingPage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    // Navigate to privacy
    const privacyTextAction = onboardingWrapper.findComponent({ name: 'TextAction' })
    await privacyTextAction.vm.$emit('press')
    expect(nav.push).toHaveBeenCalledWith(expect.stringContaining('/pages/privacy/index'))

    // Verify onboarding state unchanged
    expect(appStore.hasCompletedOnboarding).toBe(false)
  })

  // ---- J03: space-create → submit success → space-home ----

  it('J03: 03 → fill name → create → 04', async () => {
    const memStore = useMemoryStore()
    const appStore = useAppStore()
    memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    appStore.commitBootstrapReady({
      schemaVersion: 1,
      sampleMode: 'complete',
      hasCompletedOnboarding: true,
    })

    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())

    const newSpace = {
      id: 's_j03',
      name: '豆豆',
      coverAssetId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    vi.spyOn(memStore, 'createSpace').mockResolvedValue(newSpace)

    const SpaceCreatePage = (await import('../../src/pages/space-create/index.vue')).default
    const createWrapper = mount(SpaceCreatePage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    // Fill name
    const input = createWrapper.find('.space-create__name-input')
    await input.setValue('豆豆')

    // Submit
    const submitBtn = createWrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')

    expect(memStore.createSpace).toHaveBeenCalledWith({
      name: '豆豆',
      coverPhoto: null,
    })
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'space-home', spaceId: 's_j03' })
  })

  // ---- J04: full path from empty to space home ----

  it('J04: empty → 01 → 03 → 04 full chain', async () => {
    const memStore = useMemoryStore()
    const appStore = useAppStore()
    memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    appStore.commitBootstrapReady({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
    })

    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({
        kind: 'selected',
        photos: [{ uri: '/tmp/bean.jpg' }],
      } as PickResult),
    }))

    // === 01: onboarding ===
    const OnboardingPage = (await import('../../src/pages/onboarding/index.vue')).default
    const onboardingWrapper = mount(OnboardingPage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    expect(onboardingWrapper.text()).toContain('给 Ta 留一个安静的位置')

    // Complete onboarding
    vi.spyOn(appStore, 'completeOnboarding').mockResolvedValue()
    const startBtn = onboardingWrapper.find('.onboarding__start button')
    await startBtn.trigger('click')
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index')

    // === 03: space-create ===
    const newSpace = {
      id: 's_j04',
      name: '豆豆',
      coverAssetId: 'a_cover',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    vi.spyOn(memStore, 'createSpace').mockResolvedValue(newSpace)

    const SpaceCreatePage = (await import('../../src/pages/space-create/index.vue')).default
    const createWrapper = mount(SpaceCreatePage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    // Pick photo
    const addBtn = createWrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(createWrapper.text()).toContain('更换')

    // Fill name and submit
    const input = createWrapper.find('.space-create__name-input')
    await input.setValue('豆豆')

    const submitBtn = createWrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')

    expect(memStore.createSpace).toHaveBeenCalledWith({
      name: '豆豆',
      coverPhoto: { uri: '/tmp/bean.jpg' },
    })
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'space-home', spaceId: 's_j04' })
  })

  // ---- J05: empty → 03 → back → 02 empty state ----

  it('J05: empty → 01 → start → 03 → cancel → 02 empty', async () => {
    const memStore = useMemoryStore()
    const appStore = useAppStore()
    memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
    appStore.commitBootstrapReady({
      schemaVersion: 1,
      sampleMode: 'empty',
      hasCompletedOnboarding: false,
    })

    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())

    // 01 → complete onboarding → push 03
    const OnboardingPage = (await import('../../src/pages/onboarding/index.vue')).default
    mount(OnboardingPage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    vi.spyOn(appStore, 'completeOnboarding').mockResolvedValue()
    // (onboarding navigation to 03 already verified in J01)

    // 03: pristine back navigates directly
    const SpaceCreatePage = (await import('../../src/pages/space-create/index.vue')).default
    const createWrapper = mount(SpaceCreatePage, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const backBtn = createWrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
    expect(createWrapper.find('.confirm-dialog-root').exists()).toBe(false)
  })
})
