import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import { providePhotoPicker, _resetPhotoPicker } from '../../src/adapters/photo-picker-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import type { PhotoPicker } from '../../src/adapters/photo-picker'

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
    pick: vi.fn().mockResolvedValue({ kind: 'cancelled' }),
    ...overrides,
  }
}

function pageShellStub() {
  return {
    template: `
      <view class="mock-pageshell">
        <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
        <view>{{ $attrs.title || '' }}</view>
        <slot name="intro" />
        <slot />
        <slot name="actions" />
      </view>
    `,
    inheritAttrs: true,
  }
}

function mkSnapshot(overrides: {
  spaces?: any[]
  memories?: any[]
  drafts?: any[]
  assets?: any[]
} = {}) {
  return {
    spaces: overrides.spaces ?? [],
    memories: overrides.memories ?? [],
    drafts: overrides.drafts ?? [],
    assets: overrides.assets ?? [],
  }
}

const testSpace = {
  id: 's1',
  name: '团团',
  coverAssetId: 'a1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-22T15:00:00.000Z',
}

const testAsset = {
  id: 'a1',
  ownerType: 'space' as const,
  ownerId: 's1',
  uri: '/local/cover.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const testMemory = {
  id: 'm1',
  spaceId: 's1',
  entry: 'daily' as const,
  originalText: 'a memory',
  aiCandidateText: null,
  assetIds: [],
  createdAt: '2026-07-22T15:00:00.000Z',
  updatedAt: '2026-07-22T15:00:00.000Z',
}

interface SpaceSettingsPageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as SpaceSettingsPageExposed)._setQueryForTest(query)
}

describe('Space-settings page (Task 9 Step 9-2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetPhotoPicker()
  })

  // ---- missing / not-found ----

  it('T9-S01: missing spaceId shows missing state', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('无法找到这个空间')
  })

  it('T9-S02: space not found shows not-exist state', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's_nonexistent' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('这个空间已经不存在了')
  })

  // ---- pre-fill ----

  it('T9-S03: pre-fills name and shows current cover for valid space', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Name pre-filled
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('团团')

    // Cover shown
    expect(wrapper.text()).toContain('更换')
    expect(wrapper.find('.space-settings__cover-remove').attributes('aria-label')).toBeTruthy()

    expect(wrapper.find('.space-settings__cover-frame').exists()).toBe(true)
    expect(wrapper.find('.space-settings__cover-tools').exists()).toBe(false)
    expect(wrapper.find('.space-settings__cover-remove').exists()).toBe(true)
    expect(wrapper.find('.space-settings__cover-remove .space-settings__close-icon').exists()).toBe(true)
    expect(wrapper.find('.space-settings__cover-replace').exists()).toBe(true)
    expect(wrapper.find('.space-settings__cover-replace').attributes('hover-class')).toBe('none')
    expect(wrapper.find('.space-settings__cover-replace .space-settings__photo-icon').exists()).toBe(false)
    expect(wrapper.find('.space-settings__cover-replace .text-action__label').exists()).toBe(true)

    // Privacy entry exists
    expect(wrapper.text()).toContain('隐私说明')
    expect(wrapper.find('.space-settings__row-arrow').element.tagName.toLowerCase()).toBe('image')
    expect(wrapper.find('.space-settings__row-arrow').attributes('src')).toBe('/ui/draft-arrow.svg')

    // Danger zone exists
    expect(wrapper.text()).toContain('删除这个空间')
  })

  // ---- name validation ----

  it('T9-S04: empty name does not call updateSpace', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'updateSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Clear name
    const input = wrapper.find('input')
    await input.setValue('')
    await wrapper.vm.$nextTick()

    // Try to save
    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(memStore.updateSpace).not.toHaveBeenCalled()
  })

  // ---- save with keep ----

  it('T9-S05: save with name change calls updateSpace with keep', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'updateSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Change name
    const input = wrapper.find('input')
    await input.setValue('豆豆')
    await wrapper.vm.$nextTick()

    // Save
    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(memStore.updateSpace).toHaveBeenCalledWith({
      spaceId: 's1',
      name: '豆豆',
      coverPhotoChange: { kind: 'keep' },
    })
    // Stays on page (no back navigation)
    expect(nav.back).not.toHaveBeenCalled()
  })

  // ---- remove cover ----

  it('T9-S06: remove cover calls updateSpace with remove', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'updateSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Click the top-right remove control
    await wrapper.find('.space-settings__cover-remove').trigger('click')
    await wrapper.vm.$nextTick()

    // Now save
    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(memStore.updateSpace).toHaveBeenCalledWith({
      spaceId: 's1',
      name: '团团',
      coverPhotoChange: { kind: 'remove' },
    })
  })

  // ---- replace cover ----

  it('T9-S07: replace cover calls updateSpace with replace', async () => {
    provideNavigation(mockNavigation())
    const photoPicker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({
        kind: 'selected' as const,
        photos: [{ uri: '/local/new-cover.png' }],
      }),
    })
    providePhotoPicker(photoPicker)
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'updateSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Click "更换" (TextAction)
    const replaceBtn = wrapper.findAllComponents({ name: 'TextAction' }).find(b => b.text().includes('更换'))
    await replaceBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Now save
    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(memStore.updateSpace).toHaveBeenCalledWith({
      spaceId: 's1',
      name: '团团',
      coverPhotoChange: { kind: 'replace', photo: { uri: '/local/new-cover.png' } },
    })
  })

  // ---- save failure ----

  it('T9-S08: save failure retains input and shows error hint', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'updateSpace').mockRejectedValue(new Error('save failed'))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Change name and save
    const input = wrapper.find('input')
    await input.setValue('新名字')
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Name still retained
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('新名字')
    expect(wrapper.text()).toContain('保存')
  })

  // ---- double-click guard ----

  it('T9-S09: double-click save only calls updateSpace once', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    let resolveUpdate: () => void = () => {}
    const updatePromise = new Promise<void>(r => { resolveUpdate = r })
    vi.spyOn(memStore, 'updateSpace').mockReturnValue(updatePromise)

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('保存'))
    await saveBtn!.vm.$emit('press')
    await saveBtn!.vm.$emit('press')

    resolveUpdate()
    await wrapper.vm.$nextTick()

    expect(memStore.updateSpace).toHaveBeenCalledTimes(1)
  })

  // ---- privacy entry ----

  it('T9-S10: privacy entry navigates with source=settings', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Find and click the privacy section row
    const privacySection = wrapper.find('.space-settings__row')
    await privacySection.trigger('click')
    await wrapper.vm.$nextTick()

    expect(nav.push).toHaveBeenCalledWith('/pages/privacy/index?source=settings')
  })

  // ---- back navigation ----

  it('T9-S11: back navigates correctly', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(nav.back).toHaveBeenCalled()
  })

  // ---- danger zone exists (deletion implementation in step 9-6) ----

  it('T9-S12: danger zone section is present with descriptive text', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('删除这个空间')
    // Should mention memory count or neutral phrasing — not hardcoded demo text
    const text = wrapper.text()
    expect(text).toMatch(/记忆|照片/)
  })

  // ---- Task 9: space deletion ----

  it('T9-S13: delete button opens ConfirmDialog', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Find the delete TextAction and trigger it
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const deleteAction = textActions.find(ta => ta.text().includes('删除'))
    await deleteAction!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    expect(dialog.exists()).toBe(true)
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('tone')).toBe('danger')
    expect(dialog.props('title')).toContain('删除')
  })

  it('T9-S14: cancel closes dialog without calling deleteSpace', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'deleteSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Open dialog
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const deleteAction = textActions.find(ta => ta.text().includes('删除'))
    await deleteAction!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Cancel
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    expect(memStore.deleteSpace).not.toHaveBeenCalled()
    expect(dialog.props('open')).toBe(false)
  })

  it('T9-S15: confirm calls deleteSpace and resets to spaces on success', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'deleteSpace').mockResolvedValue()

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Open dialog
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const deleteAction = textActions.find(ta => ta.text().includes('删除'))
    await deleteAction!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Confirm
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()

    expect(memStore.deleteSpace).toHaveBeenCalledWith('s1')
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'spaces' })
  })

  it('T9-S16: double-click guard — confirm only calls deleteSpace once', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))

    let resolveDelete: () => void = () => {}
    const deletePromise = new Promise<void>(r => { resolveDelete = r })
    vi.spyOn(memStore, 'deleteSpace').mockReturnValue(deletePromise)

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Open dialog
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const deleteAction = textActions.find(ta => ta.text().includes('删除'))
    await deleteAction!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Double-click confirm
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await dialog.vm.$emit('confirm')

    resolveDelete()
    await wrapper.vm.$nextTick()

    expect(memStore.deleteSpace).toHaveBeenCalledTimes(1)
  })

  it('T9-S17: delete failure keeps dialog open with error', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [testMemory],
      assets: [testAsset],
    }))
    vi.spyOn(memStore, 'deleteSpace').mockRejectedValue(new Error('Delete failed'))

    const page = await import('../../src/pages/space-settings/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Open dialog
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const deleteAction = textActions.find(ta => ta.text().includes('删除'))
    await deleteAction!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Confirm
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Dialog stays open with error
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('error')).toBe('删除失败，请重试')
    // Page content still present
    expect(wrapper.text()).toContain('团团')
  })
})
