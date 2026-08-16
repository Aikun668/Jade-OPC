import { describe, it, expect, beforeEach, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import OnboardingPage from '../../src/pages/onboarding/index.vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
    ;(globalThis as typeof globalThis & {
      __uniLifecycle: { onShow: Array<() => void> }
    }).__uniLifecycle.onShow.length = 0
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

  it('T5B-M09: waits for the first page render before replacing completed onboarding', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady(true)
    mountPage()
    // Startup only needs to replace the onboarding page; reLaunch can time out while
    // the mini-program page stack is still settling during dev hot reload.
    expect(nav.replace).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(nav.replace).toHaveBeenCalledWith('/pages/spaces/index')
    expect(nav.resetTo).not.toHaveBeenCalled()
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
    expect(wrapper.text()).toContain('把想记住的样子，慢慢留在这里……')
  })

  it('keeps the entry copy above the lower action area so the dog photo remains unobstructed', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    const scene = wrapper.find('.onboarding__scene')
    const copy = wrapper.find('.onboarding__copy')
    const footer = wrapper.find('.onboarding__footer')

    expect(scene.exists()).toBe(true)
    expect(scene.element.tagName.toLowerCase()).toBe('image')
    expect(scene.attributes('src')).toBe('/ui/onboarding-photo-album-hero-v3-sunlit.jpg')
    expect(copy.text()).toContain('宠物记忆')
    expect(wrapper.find('.onboarding__note').exists()).toBe(false)
    expect(footer.exists()).toBe(true)
    expect(copy.element.compareDocumentPosition(footer.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(footer.find('.onboarding__brand').exists()).toBe(false)
  })

  it('uses the warm editorial type treatment from the approved visual reference', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*font-family:\s*"Songti SC",\s*STSong,\s*serif/)
    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*font-size:\s*80rpx/)
    expect(source).toMatch(/\.onboarding__brand\s*\{[\s\S]*color:\s*#5b371f/)
    expect(source).toMatch(/\.onboarding__title\s*\{[\s\S]*font-size:\s*32rpx[\s\S]*color:\s*#80583a/)
    expect(source).toMatch(/\.onboarding__body\s*\{[\s\S]*font-size:\s*30rpx[\s\S]*color:\s*#80583a/)
    expect(source).toMatch(/\.onboarding__copy\s*\{[\s\S]*top:\s*18%/)
    expect(source).toMatch(/\.onboarding__start[\s\S]*\.primary-button__label[\s\S]*font-size:\s*34rpx/)
  })

  it('reveals the full entry copy as one soft upward fade before the lower actions', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/onboarding/index.vue'),
      'utf-8',
    )

    expect(source).toMatch(/\.onboarding__copy\s*\{[\s\S]*animation:\s*onboarding-copy-in\s+1100ms[\s\S]*160ms/)
    expect(source).toMatch(/\.onboarding__footer\s*\{[\s\S]*animation:\s*onboarding-footer-in\s+1400ms\s+cubic-bezier\(0\.25,\s*0\.1,\s*0\.25,\s*1\)\s+1500ms/)
    expect(source).toMatch(/@keyframes onboarding-copy-in\s*\{[\s\S]*translateY\(12rpx\)/)
    expect(source).not.toMatch(/\.onboarding__brand\s*\{[^}]*animation:/)
    expect(source).not.toMatch(/\.onboarding__title\s*\{[^}]*animation:/)
    expect(source).not.toMatch(/\.onboarding__body\s*\{[^}]*animation:/)
    expect(source).toMatch(/@keyframes onboarding-footer-in\s*\{[\s\S]*opacity:\s*0[\s\S]*opacity:\s*1/)
  })

  it('does not keep the superseded onboarding hero in the shipped static assets', () => {
    expect(existsSync(resolve(__dirname, '../../static/ui/onboarding-photo-album-hero-v2.png'))).toBe(false)
    expect(existsSync(resolve(__dirname, '../../static/ui/onboarding-photo-album-hero-v3-sunlit.png'))).toBe(false)
  })

  it('places the underlined privacy action before the local-storage reassurance', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    const privacy = wrapper.find('.onboarding__privacy')
    const privacyLink = wrapper.find('.onboarding__privacy-link')
    const privacyCopy = wrapper.find('.onboarding__privacy-copy')

    expect(privacyLink.text()).toBe('隐私说明')
    expect(privacyCopy.text()).toContain('默认仅存于本机')
    expect(privacyLink.element.compareDocumentPosition(privacyCopy.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(privacy.exists()).toBe(true)
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
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index?source=onboarding')
  })

  it('marks the space-create route as coming from onboarding', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady(false)

    const appStore = useAppStore()
    vi.spyOn(appStore, 'completeOnboarding').mockImplementation(async () => {
      appStore.hasCompletedOnboarding = true
    })

    const wrapper = mountPage()
    await Promise.resolve()
    const startBtn = wrapper.find('.onboarding__start button')
    await startBtn.trigger('click')

    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index?source=onboarding')
    expect(nav.replace).not.toHaveBeenCalled()
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

  it('keeps the welcome page focused on entering and privacy', () => {
    provideNavigation(mockNavigation())
    setReady(false)
    const wrapper = mountPage()
    expect(wrapper.find('.onboarding__mark').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('创建 Ta 的空间')
    expect(wrapper.text()).not.toContain('登录')
    expect(wrapper.text()).not.toContain('注册')
  })
})
