import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function stubPageShell() {
  return {
    template: `
      <view class="mock-pageshell">
        <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
        <slot name="intro" />
        <slot />
        <slot name="actions" />
      </view>
    `,
    inheritAttrs: true,
  }
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>) {
  ;(wrapper.vm as any)._setQueryForTest(query)
}

describe('Record-entry page (05)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  it('renders title and intro', async () => {
    provideNavigation(mockNavigation())
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('今天想从哪里开始？')
    expect(wrapper.text()).toContain('不用全部完成')
  })

  it('shows 3 text entry cards plus photo entry', async () => {
    provideNavigation(mockNavigation())
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('日常')
    expect(wrapper.text()).toContain('相遇')
    expect(wrapper.text()).toContain('你们的关系')
    expect(wrapper.text()).toContain('一张照片')
  })

  it('clicking daily entry navigates to record-text with correct params', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('.record-entry__item')
    const dailyItem = items.find(i => i.text().includes('日常'))
    await dailyItem!.trigger('click')

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-text/index'),
    )
  })

  it('each entry card triggers navigation', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.record-entry__item')
    for (const btn of buttons) {
      await btn.trigger('click')
    }

    expect(nav.push).toHaveBeenCalledTimes(4)
  })

  it('"这次先看看" navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const skipBtn = wrapper.find('.record-entry__skip .text-action')
    await skipBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })

  it('back button navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })

  it('shows MissingContentState when spaceId is invalid', async () => {
    provideNavigation(mockNavigation())
    const page = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    // Don't set query — onLoad called with empty options, route parse fails
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('无法打开记录入口')
    expect(wrapper.text()).toContain('空间信息不正确')
  })
})
