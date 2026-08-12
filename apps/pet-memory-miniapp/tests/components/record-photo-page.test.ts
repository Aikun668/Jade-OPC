import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('uses the shared empty media frame and choice descriptions without a photo', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.record-photo__media--empty').exists()).toBe(true)
    expect(wrapper.find('.record-photo__add-photo-icon').exists()).toBe(true)
    expect(wrapper.findAll('.record-photo__choice')).toHaveLength(0)
    expect(wrapper.find('.record-photo__session-note').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('先只留下照片')
    expect(wrapper.text()).not.toContain('说说最先想起的事')
  })

  it('keeps the same media frame and choice descriptions after a photo is selected', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.record-photo__media--selected').exists()).toBe(true)
    expect(wrapper.find('.record-photo__single-preview').exists()).toBe(true)
    expect(wrapper.find('.record-photo__media--empty').exists()).toBe(false)
    expect(wrapper.find('.record-photo__list').exists()).toBe(false)
    expect(wrapper.find('.record-photo__post-photo').exists()).toBe(true)
    expect(wrapper.findAll('.record-photo__choice')).toHaveLength(2)
    expect(wrapper.text()).toContain('只问一个问题，不会自动追问')
  })

  it('asks for confirmation before removing the selected photo', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
    await wrapper.vm.$nextTick()

    await wrapper.find('.record-photo__remove-button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.confirm-dialog-root').exists()).toBe(true)
    expect(wrapper.text()).toContain('要移除这张照片吗？')
  })

  it('removes the photo only after confirmation and restores the empty state', async () => {
    vi.useFakeTimers()
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    try {
      const wrapper = mount(page.default, {
        global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
      })
      setQuery(wrapper, { spaceId: 's_tuantu' })
      setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
      await wrapper.vm.$nextTick()

      await wrapper.find('.record-photo__remove-button').trigger('click')
      await wrapper.find('.confirm-dialog-root .primary-button').trigger('click')
      vi.advanceTimersByTime(240)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.record-photo__media--empty').exists()).toBe(true)
      expect(wrapper.find('.record-photo__media--selected').exists()).toBe(false)
      expect(wrapper.findAll('.record-photo__choice')).toHaveLength(0)
      expect(wrapper.find('.record-photo__session-note').exists()).toBe(false)
      expect(wrapper.find('.confirm-dialog-root').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the photo when removal is cancelled', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
    await wrapper.vm.$nextTick()

    await wrapper.find('.record-photo__remove-button').trigger('click')
    await wrapper.find('.confirm-dialog-root .text-action').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.record-photo__media--selected').exists()).toBe(true)
    expect(wrapper.find('.record-photo__media--empty').exists()).toBe(false)
  })

  it('uses the centered list layout for the unsaved-photo exit dialog', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
    await wrapper.vm.$nextTick()

    await wrapper.find('.mock-back').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.confirm-dialog__panel--list').exists()).toBe(true)
    expect(wrapper.findAll('.confirm-dialog__list-action')).toHaveLength(3)
    expect(wrapper.text()).toContain('照片还没处理，要离开吗？')
    expect(wrapper.text()).toContain('离开前照片不会自动保存。')
  })

  it('shows session note', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
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
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/photo.png', name: 'photo.png' } }])
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('先只留下照片')
    expect(wrapper.text()).toContain('说说最先想起的事')
  })

  it('replaces a single selected photo instead of appending another one', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker({
      kind: 'selected',
      photos: [{ uri: '/fixtures/replacement.png' }],
    }))
    const page = await import('../../src/pages/record-photo/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), MissingContentState: true, PhotoStack: true, PhotoViewer: true } },
    })
    setQuery(wrapper, { spaceId: 's_tuantu' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/fixtures/original.png' } }])
    await wrapper.vm.$nextTick()

    await wrapper.find('.record-photo__photo-actions .text-action').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.record-photo__single-preview')).toHaveLength(1)
    expect(wrapper.find('.record-photo__single-preview').attributes('src')).toBe('/fixtures/replacement.png')
  })

  it('locks the photo-only save while a draft save is in progress', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/record-photo/index.vue'),
      'utf8',
    )

    expect(source).toMatch(/function handleSavePhotosOnly\(\): Promise<void> \{\s*if \(isSavingMemory\.value \|\| isSavingDraft\.value\) return/)
  })

  it('uses compact sizing for the replacement-photo action', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/pages/record-photo/index.vue'),
      'utf8',
    )

    expect(source).toMatch(
      /\.record-photo__photo-actions\s*\{[\s\S]*?min-height:\s*\$pm-control-height-compact;/,
    )
    expect(source).toMatch(
      /\.record-photo__photo-actions\s*\{[\s\S]*?padding-inline:\s*\$pm-space-2;/,
    )
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
