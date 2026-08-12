import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
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
      <view
        class="mock-pageshell"
        :data-keyboard-open="$attrs['keyboard-open'] || $attrs.keyboardOpen || 'false'"
      >
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

const testMemory = {
  id: 'm1',
  spaceId: 's1',
  entry: 'daily' as const,
  originalText: '团团今天在窗台上晒了一下午太阳。',
  aiCandidateText: '那天下午，阳光落在团团柔软的毛上。',
  assetIds: [],
  createdAt: '2026-07-22T15:00:00.000Z',
  updatedAt: '2026-07-22T15:00:00.000Z',
}

interface MemoryEditPageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as MemoryEditPageExposed)._setQueryForTest(query)
}

describe('Memory-edit page (10)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  // ---- missing / not-found ----

  it('T8-E01: missing memoryId shows missing state', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('无法找到这段记忆')
    expect(wrapper.text()).toContain('缺少记忆信息')
  })

  it('T8-E02: memory not found shows not-exist state', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm_nonexistent' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('这段记忆已经不存在了')
  })

  // ---- pre-fill ----

  it('T8-E03: textarea pre-filled with originalText', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('团团今天在窗台上晒了一下午太阳。')
  })

  it('keeps the bottom actions layout fixed when the editor receives focus', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    await wrapper.find('textarea').trigger('focus')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-pageshell').attributes('data-keyboard-open')).toBe('false')
  })

  it('keeps a reserved actions region before the route memory is ready', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'loading' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    expect(wrapper.find('.memory-edit__actions').exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'PrimaryButton' })).toHaveLength(0)

    setQuery(wrapper, { memoryId: 'm1' })
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.memory-edit__actions').exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'PrimaryButton' })).toHaveLength(1)
  })

  // ---- save ----

  it('T8-E04: save after modification calls updateMemory and navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    vi.spyOn(memStore, 'updateMemory').mockResolvedValue()

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Modify text
    const textarea = wrapper.find('textarea')
    await textarea.setValue('修改后的内容')
    await wrapper.vm.$nextTick()

    // Click save
    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.updateMemory).toHaveBeenCalledWith({
      kind: 'original-text',
      memoryId: 'm1',
      originalText: '修改后的内容',
    })
    expect(nav.back).toHaveBeenCalled()
  })

  it('updates the editor from a mini-program input event detail value', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, { global: { stubs: { PageShell: stubPageShell() } } })
    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    await wrapper.find('textarea').trigger('input', { detail: { value: '来自微信事件的新内容' } })
    await wrapper.vm.$nextTick()

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('来自微信事件的新内容')
  })

  it('shows the leave warning description in its confirmation dialog', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, { global: { stubs: { PageShell: stubPageShell() } } })
    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()
    await wrapper.find('textarea').setValue('modified')
    await wrapper.find('.mock-back').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('现在离开，刚才的修改不会保留。')
  })

  it('disables save when the edited text exceeds the limit', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, { global: { stubs: { PageShell: stubPageShell() } } })
    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()
    await wrapper.find('textarea').setValue('a'.repeat(2001))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.memory-edit__save button').attributes('disabled')).toBeDefined()
  })

  // ---- "这次先不改" (no modifications) ----

  it('T8-E05: "这次先不改" without modifications navigates back directly', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Click "这次先不改"
    const textActions = wrapper.findAll('.text-action')
    const cancelBtn = textActions.find(ta => ta.text().includes('这次先不改'))
    await cancelBtn!.trigger('click')

    expect(nav.back).toHaveBeenCalled()
  })

  // ---- return protection (with modifications) ----

  it('T8-E06: back with modifications shows ConfirmDialog', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Modify text
    const textarea = wrapper.find('textarea')
    await textarea.setValue('修改后的内容')
    await wrapper.vm.$nextTick()

    // Click back
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('修改还没保存')
  })

  it('T8-E07: ConfirmDialog "继续修改" stays on page', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Modify text
    const textarea = wrapper.find('textarea')
    await textarea.setValue('modified')
    await wrapper.vm.$nextTick()

    // Click back
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Click "继续修改" (cancel)
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    // Should NOT have navigated
    expect(nav.back).not.toHaveBeenCalled()
    // Text should be preserved
    expect(wrapper.find('textarea').element.value).toBe('modified')
  })

  it('T8-E08: ConfirmDialog "先不保存" navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('modified')
    await wrapper.vm.$nextTick()

    // Click back
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Click "先不保存" (discard)
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('discard')
    await wrapper.vm.$nextTick()

    expect(nav.back).toHaveBeenCalled()
  })

  // ---- char limit ----

  it('T8-E09: over 2000 chars does not call updateMemory, shows hint, keeps text', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    vi.spyOn(memStore, 'updateMemory')

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const longText = 'x'.repeat(2001)
    const textarea = wrapper.find('textarea')
    await textarea.setValue(longText)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('已超过 2000 字')

    // Click save — should not call updateMemory
    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.updateMemory).not.toHaveBeenCalled()
    // Text still in textarea
    expect(wrapper.find('textarea').element.value).toBe(longText)
  })

  // ---- save error ----

  it('T8-E10: updateMemory error shows save error and allows retry', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    vi.spyOn(memStore, 'updateMemory').mockRejectedValue(new Error('Storage write failed'))

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('修改内容')
    await wrapper.vm.$nextTick()

    // Click save — fails
    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('刚才没有保存成功')
    // Text retained
    expect(wrapper.find('textarea').element.value).toBe('修改内容')
    // Did not navigate
    expect(nav.back).not.toHaveBeenCalled()

    // Retry
    vi.mocked(memStore.updateMemory).mockResolvedValue()
    await saveBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(nav.back).toHaveBeenCalled()
  })

  // ---- double-click guard ----

  it('T8-E11: double-click save only calls updateMemory once', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    // Use a delayed promise to simulate async save
    let resolveSave: (v: any) => void = () => {}
    const savePromise = new Promise<any>(resolve => { resolveSave = resolve })
    vi.spyOn(memStore, 'updateMemory').mockReturnValue(savePromise)

    const page = await import('../../src/pages/memory-edit/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('modified')
    await wrapper.vm.$nextTick()

    // Click save twice rapidly
    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')
    await saveBtn.trigger('click')

    // Resolve the pending save
    resolveSave({ success: true, value: { ...testMemory, originalText: 'modified' } })
    await wrapper.vm.$nextTick()

    expect(memStore.updateMemory).toHaveBeenCalledTimes(1)
  })
})
