import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import PrivacyPage from '../../src/pages/privacy/index.vue'

// ---- helpers ----

interface PrivacyPageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as PrivacyPageExposed)._setQueryForTest(query)
}

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mountPage(query: Record<string, unknown> = {}) {
  const wrapper = mount(PrivacyPage, {
    global: {
      stubs: {
        PageShell: {
          template: `
            <view class="mock-pageshell">
              <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
              <view class="mock-title">{{ $attrs.title }}</view>
              <slot name="intro" />
              <slot />
              <slot name="actions" />
            </view>
          `,
          inheritAttrs: true,
        },
      },
    },
  })
  if (Object.keys(query).length > 0) {
    setQuery(wrapper, query)
  }
  return wrapper
}

describe('Privacy page (13)', () => {
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

  // ---- structure ----

  it('renders PageShell with reading layout and title', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    expect(wrapper.text()).toContain('隐私说明')
  })

  it('renders intro heading and body', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    expect(wrapper.text()).toContain('你的记忆，默认只属于你')
    expect(wrapper.text()).toContain('M0 本地 Mock')
  })

  it('renders privacy sections covering all 7 acceptance items', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    const text = wrapper.text()
    // 1. 内容默认私密
    expect(text).toContain('默认只属于你')
    // 2. M0 本地 Mock
    expect(text).toContain('本地 Mock')
    // 3. 照片会话级临时
    expect(text).toContain('照片')
    // 4. M1 CloudBase
    expect(text).toContain('M1')
    // 5. AI Mock
    expect(text).toContain('AI')
    // 6. 删除不可恢复
    expect(text).toContain('删除不可恢复')
    // 7. 无导出
    expect(text).toContain('导出')
  })

  it('renders "我知道了" primary button', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    expect(wrapper.text()).toContain('我知道了')
  })

  it('does not render an export button', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    expect(wrapper.text()).not.toContain('导出数据')
    expect(wrapper.text()).not.toContain('下载')
  })

  // ---- source handling ----

  it('T5B-M12: "我知道了" button navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const wrapper = mountPage({ source: 'onboarding' })
    const confirmBtn = wrapper.find('.privacy__confirm button')
    await confirmBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })

  it('T5B-M12: does not modify onboarding state on visit', () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const before = appStore.hasCompletedOnboarding
    mountPage({ source: 'onboarding' })
    expect(appStore.hasCompletedOnboarding).toBe(before)
  })

  it('falls back safely for illegal source values', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'attack' as string })
    // Should still render without crash
    expect(wrapper.text()).toContain('隐私说明')
  })

  it('falls back safely when source is missing', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({})
    expect(wrapper.text()).toContain('隐私说明')
  })

  // ---- structure details ----

  it('uses semantic sections with headings', () => {
    provideNavigation(mockNavigation())
    const wrapper = mountPage({ source: 'onboarding' })
    // Verify we have multiple <h3> or section heading equivalents
    const text = wrapper.text()
    // At least 4 distinct sections from the acceptance standard
    const sectionCount = [
      text.includes('默认只属于你'),
      text.includes('本地 Mock'),
      text.includes('AI'),
      text.includes('删除不可恢复'),
      text.includes('导出'),
    ].filter(Boolean).length
    expect(sectionCount).toBeGreaterThanOrEqual(4)
  })
})
