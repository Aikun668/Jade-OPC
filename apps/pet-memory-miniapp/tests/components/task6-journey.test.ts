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

function pageShellStub() {
  return {
    template: `
      <view class="mock-pageshell">
        <view>{{ $attrs.title || '' }}</view>
        <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
        <slot name="navigation-right" />
        <slot name="intro" />
        <slot />
        <slot name="actions" />
      </view>
    `,
    inheritAttrs: true,
  }
}

const testSpace = { id: 's_tuantu', name: '团团', coverAssetId: null, createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-01-10T00:00:00.000Z' }

const testDraft = {
  id: 'd_daily',
  spaceId: 's_tuantu',
  entry: 'daily' as const,
  text: '一段待完成的草稿',
  assetIds: [],
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:00:00.000Z',
}

describe('Task 6 journey (04 → 05 → 06 → 09 → 04)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  // ---- J6-01: 04 without draft → record-entry ----

  it('J6-01: 04 "留下一段" without draft navigates to record-entry', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({ spaces: [testSpace] }))

    const SpaceHomePage = await import('../../src/pages/space-home/index.vue')
    const wrapper = mount(SpaceHomePage.default, {
      global: { stubs: { PageShell: pageShellStub(), MemoryList: true, DraftNotice: true } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    // Click "留下一段"
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Should navigate to record-entry (no draft, no dialog)
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-entry/index?spaceId=s_tuantu'),
    )
  })

  // ---- J6-02: record-entry → record-text with entry param ----

  it('J6-02: record-entry "日常" navigates to record-text with entry=daily', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({ spaces: [testSpace] }))

    const RecordEntryPage = await import('../../src/pages/record-entry/index.vue')
    const wrapper = mount(RecordEntryPage.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    // Click the "日常" entry
    const items = wrapper.findAll('.record-entry__item')
    const dailyItem = items.find(i => i.text().includes('日常'))
    await dailyItem!.trigger('click')

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-text/index?spaceId=s_tuantu&entry=daily'),
    )
  })

  // ---- J6-03: record-text save → resetTo memory-detail ----

  it('J6-03: record-text saveMemory → resetTo memory-detail with new memoryId', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({ spaces: [testSpace] }))
    vi.spyOn(memStore, 'saveMemory').mockResolvedValue({
      id: 'm_new', spaceId: 's_tuantu', entry: 'daily',
      originalText: '团团爱晒太阳', aiCandidateText: null,
      assetIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const RecordTextPage = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(RecordTextPage.default, {
      global: { stubs: { PageShell: pageShellStub(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's_tuantu', entry: 'daily' })
    vm._setTextForTest('团团爱晒太阳')
    await wrapper.vm.$nextTick()

    // Click save button
    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.saveMemory).toHaveBeenCalled()
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'memory-detail', memoryId: 'm_new', source: 'new-memory' })
  })

  // ---- J6-04: memory-detail renders saved memory content ----

  it('J6-04: memory-detail shows saved memory date, eyebrow, and originalText', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [{
        id: 'm_saved',
        spaceId: 's_tuantu',
        entry: 'daily' as const,
        originalText: '团团今天在窗台上晒了一下午太阳。',
        aiCandidateText: null,
        assetIds: [],
        createdAt: '2026-07-22T15:00:00.000Z',
        updatedAt: '2026-07-22T15:00:00.000Z',
      }],
    }))

    const MemoryDetailPage = await import('../../src/pages/memory-detail/index.vue')
    const wrapper = mount(MemoryDetailPage.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ memoryId: 'm_saved' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('2026年7月22日')
    expect(wrapper.text()).toContain('你留下的话')
    expect(wrapper.text()).toContain('团团今天在窗台上晒了一下午太阳。')
  })

  // ---- J6-05: 04 shows new memory after save via store ----

  it('J6-05: space-home MemoryList receives newly saved memory', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [
        {
          id: 'm_newest',
          spaceId: 's_tuantu',
          entry: 'meeting' as const,
          originalText: '第一次见到团团那天，它正从纸箱里探出脑袋。',
          aiCandidateText: null,
          assetIds: [],
          createdAt: '2026-08-01T12:00:00.000Z',
          updatedAt: '2026-08-01T12:00:00.000Z',
        },
      ],
    }))

    const SpaceHomePage = await import('../../src/pages/space-home/index.vue')
    const wrapper = mount(SpaceHomePage.default, {
      global: { stubs: { PageShell: pageShellStub(), MemoryList: false, DraftNotice: true } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    // MemoryList should receive the memory
    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    expect(memoryList.exists()).toBe(true)
    expect(memoryList.props('items')).toHaveLength(1)
    expect(memoryList.props('items')[0].summary).toContain('第一次见到团团那天')
  })

  // ---- J6-06: 04 with draft → resume dialog → "继续写" → record-text ----

  it('J6-06: 04 with draft shows resume dialog, "继续写" navigates to record-text', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      drafts: [testDraft],
    }))

    const SpaceHomePage = await import('../../src/pages/space-home/index.vue')
    const wrapper = mount(SpaceHomePage.default, {
      global: { stubs: { PageShell: pageShellStub(), MemoryList: true, DraftNotice: { template: '<view/>', props: ['title'] }, ConfirmDialog: false } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    // Click the compact "留下一段记忆" link
    const recordBtn = wrapper
      .findAllComponents({ name: 'TextAction' })
      .find((action) => action.classes().includes('space-home__new-memory-link'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Resume dialog should appear
    expect(wrapper.text()).toContain('你还有一段没写完的')

    // Click "继续写这段"
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-text/index?spaceId=s_tuantu&entry=daily&draftId=d_daily'),
    )
  })

  // ---- J6-07: record-text pre-fills from draft ----

  it('J6-07: record-text pre-fills text when navigated from draft', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      drafts: [testDraft],
    }))

    const RecordTextPage = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(RecordTextPage.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's_tuantu', draftId: 'd_daily' })
    await wrapper.vm.$nextTick()

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('一段待完成的草稿')
  })

  // ---- J6-08: memory-detail back returns to previous page ----

  it('J6-08: memory-detail back navigates via nav.back()', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [testSpace],
      memories: [{
        id: 'm1',
        spaceId: 's_tuantu',
        entry: 'daily' as const,
        originalText: '测试',
        aiCandidateText: null,
        assetIds: [],
        createdAt: '2026-07-22T00:00:00.000Z',
        updatedAt: '2026-07-22T00:00:00.000Z',
      }],
    }))

    const MemoryDetailPage = await import('../../src/pages/memory-detail/index.vue')
    const wrapper = mount(MemoryDetailPage.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })
    ;(wrapper.vm as any)._setQueryForTest({ memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })
})
