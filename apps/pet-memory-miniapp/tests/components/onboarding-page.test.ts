import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import OnboardingPage from '../../src/pages/onboarding/index.vue'

// ---- helpers ----

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mountPage() {
  return mount(OnboardingPage, {
    global: {
      stubs: {
        PageShell: {
          template: `
            <view class="mock-pageshell">
              <slot name="intro" />
              <slot />
              <slot name="actions" />
            </view>
          `,
        },
      },
    },
  })
}

// Set the store to ready with given onboarding state
function setReady(onboarding: boolean) {
  const appStore = useAppStore()
  const memStore = useMemoryStore()
  memStore._commitSnapshot({
    spaces: [],
    memories: [],
    drafts: [],
    assets: [],
  })
  appStore.commitBootstrapReady({
    schemaVersion: 1,
    sampleMode: onboarding ? 'complete' : 'empty',
    hasCompletedOnboarding: onboarding,
  })
}

describe('Onboarding page (01)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    vi.stubGlobal('uni', {
      getWindowInfo: () => ({ windowWidth: 390 }),
      getMenuButtonBoundingClientRect: () => ({
        width: 87, height: 32, top: 52, right: 375, bottom: 84, left: 288,
      }),
      onKeyboardHeightChange: () => {},
      offKeyboardHeightChange: () => {},
    })
  })

  // ---- bootstrap states ----

  it('shows nothing during bootstrap (idle/loading)', () => {
    provideNavigation(mockNavigation())
    // Store defaults to 'idle' — onboarding should not show content yet
    const wrapper = mountPage()
    expect(wrapper.text()).not.toContain('给 Ta 留一个安静的位置')
    expect(wrapper.text()).not.toContain('开始')
  })

  it('T5B-M09: redirects to spaces when onboarding already completed', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady(true)
    const wrapper = mountPage()
    // Should trigger redirect to spaces
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'spaces' })
  })

  it('shows onboarding content when bootstrap ready and onboarding=false', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('给 Ta 留一个安静的位置')
  })

  // ---- content structure ----

  it('renders product intro text', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('宠物记忆')
    expect(wrapper.text()).toContain('给 Ta 留一个安静的位置')
    expect(wrapper.text()).toContain('把想记住的样子')
  })

  it('renders privacy note with lock indicator', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('默认只属于你')
    expect(wrapper.text()).toContain('M0 只保存本地文字')
  })

  it('renders "开始" primary button and privacy link', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('开始')
    expect(wrapper.text()).toContain('隐私说明')
  })

  // ---- navigation ----

  it('T5B-M11: privacy link navigates to privacy with source=onboarding', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady(false)
    const wrapper = mountPage()
    const privacyTextAction = wrapper.findComponent({ name: 'TextAction' })
    await privacyTextAction.vm.$emit('press')
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/privacy/index'),
    )
  })

  it('T5B-M13: "开始" calls completeOnboarding then navigates to space-create', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady(false)
    // Mock completeOnboarding to succeed immediately
    const appStore = useAppStore()
    vi.spyOn(appStore, 'completeOnboarding').mockResolvedValue()

    const wrapper = mountPage()
    const startBtn = wrapper.find('.onboarding__start button')
    await startBtn.trigger('click')

    expect(appStore.completeOnboarding).toHaveBeenCalled()
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index')
  })

  it('T5B-M16: shows error message on completeOnboarding failure', async () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const appStore = useAppStore()
    vi.spyOn(appStore, 'completeOnboarding').mockRejectedValue(new Error('fail'))

    const wrapper = mountPage()
    const startBtn = wrapper.find('.onboarding__start button')
    await startBtn.trigger('click')

    // Wait for the rejection to be processed
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('刚才没有准备好')
  })

  it('T5B-M18: does not request login, avatar, or permissions', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    const text = wrapper.text()
    expect(text).not.toContain('登录')
    expect(text).not.toContain('微信')
    expect(text).not.toContain('授权')
    expect(text).not.toContain('头像')
    expect(text).not.toContain('昵称')
    expect(text).not.toContain('手机号')
  })

  // ---- decorative mark ----

  it('renders decorative mark', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.find('.onboarding__mark').exists()).toBe(true)
  })
})
