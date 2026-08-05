import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import { providePhotoPicker, _resetPhotoPicker } from '../../src/adapters/photo-picker-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import type { PhotoPicker, PickResult } from '../../src/adapters/photo-picker'

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mockPhotoPicker(result: PickResult = { kind: 'cancelled' }): PhotoPicker {
  return { pick: vi.fn().mockResolvedValue(result) }
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

function setPhotos(wrapper: ReturnType<typeof mount>, photos: any[]) {
  ;(wrapper.vm as any)._setPhotosForTest(photos)
}

describe('Record-photo page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetPhotoPicker()
  })

  it('renders title and intro', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('先把这张照片留在这里')
    expect(wrapper.text()).toContain('照片不需要说明')
  })

  it('shows add photo button when no photos selected', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('添加一张照片')
  })

  it('shows session note', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('M0')
    expect(wrapper.text()).toContain('本次会话预览')
  })

  it('shows save and continue buttons', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('先只留下照片')
    expect(wrapper.text()).toContain('说说最先想起的事')
  })

  it('shows MissingContentState when spaceId is invalid', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('无法打开照片记录')
    expect(wrapper.text()).toContain('页面参数不正确')
  })

  it('back button navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })
})
