import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import MemoriesPage from '../../src/pages/memories/index.vue'

// ---- helpers ----

interface MemoriesPageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as MemoriesPageExposed)._setQueryForTest(query)
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

// tuantu complete fixture — memories for space s_tuantu
const tuantuSpace = { id: 's_tuantu', name: '团团', coverAssetId: 'a_tuantu_cover', createdAt: '2026-01-10T08:00:00.000Z', updatedAt: '2026-05-15T12:00:00.000Z' }
const tuantuMemories = [
  { id: 'm_tuantu_daily1', spaceId: 's_tuantu', entry: 'daily' as const, originalText: '团团今天在窗台上晒了一下午太阳，毛茸茸的耳朵在光里变成了粉红色。', aiCandidateText: null, assetIds: [], createdAt: '2026-03-01T10:00:00.000Z', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'm_tuantu_photo1', spaceId: 's_tuantu', entry: 'photo' as const, originalText: '第一次见到团团时，它正从纸箱里探出脑袋看着我。', aiCandidateText: 'AI改写版', assetIds: ['a_tuantu_photo1', 'a_tuantu_photo2'], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-20T09:00:00.000Z' },
]
const tuantuAssets = [
  { id: 'a_tuantu_photo1', ownerType: 'memory' as const, ownerId: 'm_tuantu_photo1', uri: '/static/fixtures/tuantu-photo1.jpg', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
  { id: 'a_tuantu_photo2', ownerType: 'memory' as const, ownerId: 'm_tuantu_photo1', uri: '/static/fixtures/tuantu-photo2.jpg', persistence: 'bundled' as const, availability: 'available' as const, order: 1 },
]

describe('Memories page (08)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  // T5A-M24 bootstrap: page shows nothing meaningful during loading
  it('shows nothing during bootstrap loading', () => {
    provideNavigation(mockNavigation())
    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })
    const text = wrapper.text()
    expect(text).not.toContain('无法找到这个空间')
    expect(text).not.toContain('已经不存在了')
    expect(text).not.toContain('还没有留下记忆')
  })

  // T5A-M25: missing param → MissingContentState
  it('shows MissingContentState when spaceId param is missing', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('无法找到这个空间')
    expect(text).toContain('缺少空间信息')

    const missing = wrapper.findComponent({ name: 'MissingContentState' })
    await missing.vm.$emit('action')
    expect(nav.back).toHaveBeenCalled()
  })

  // T5A-M25: space not found
  it('shows MissingContentState when space does not exist', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's_nonexistent' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('已经不存在了')
  })

  // T5A-M43: space exists but empty → not confused with error
  it('shows empty state when space has no memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's_doudou', name: '豆豆', coverAssetId: null, createdAt: '2026-02-20T09:00:00.000Z', updatedAt: '2026-02-20T09:00:00.000Z' }],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's_doudou' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('豆豆')
    expect(text).not.toContain('暂时没有打开这里')
    expect(text).not.toContain('已经不存在了')
    expect(text).toContain('0 段记忆')
  })

  // T5A-M37: all memories shown sorted by time desc
  it('shows all formal memories sorted by time descending', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '有记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '最旧的记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'm2', spaceId: 's1', entry: 'daily' as const, originalText: '最新的记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    expect(memoryList.exists()).toBe(true)
    expect(memoryList.props('items')).toHaveLength(2)
    // Time desc: latest first
    expect(memoryList.props('items')[0].summary).toBe('最新的记忆')
    expect(memoryList.props('items')[1].summary).toBe('最旧的记忆')
  })

  // T5A-M38: drafts do not enter the memory list
  it('does not include drafts in memory list', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '分隔', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '正式记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿内容', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    expect(memoryList.props('items')).toHaveLength(1)
    expect(memoryList.props('items')[0].summary).toBe('正式记忆')
  })

  // T5A-M39 + M40: with photo shows thumbnail, without photo has no empty slot
  it('shows thumbnail for memories with photos and no thumbnail slot for those without', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '混合', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '纯文字', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
        { id: 'm2', spaceId: 's1', entry: 'photo' as const, originalText: '有照片', aiCandidateText: null, assetIds: ['a1'], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
      assets: [
        { id: 'a1', ownerType: 'memory' as const, ownerId: 'm2', uri: '/static/fixtures/photo.jpg', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    const items = memoryList.props('items') as any[]
    // Memory with photo should have thumbnailUri
    const photoEntry = items.find((i: any) => i.summary === '有照片')
    expect(photoEntry.thumbnailUri).toBe('/static/fixtures/photo.jpg')
    // Memory without photo should NOT have thumbnailUri
    const textEntry = items.find((i: any) => i.summary === '纯文字')
    expect(textEntry.thumbnailUri).toBeUndefined()
  })

  // T5A-M39: expired photos don't produce broken URIs
  it('does not output thumbnailUri for expired photos', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '过期', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'photo' as const, originalText: '过期照片', aiCandidateText: null, assetIds: ['a_expired'], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
      assets: [
        { id: 'a_expired', ownerType: 'memory' as const, ownerId: 'm1', uri: '/broken.jpg', persistence: 'bundled' as const, availability: 'expired' as const, order: 0 },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    const items = memoryList.props('items') as any[]
    expect(items).toHaveLength(1)
    // Expired photo should NOT produce thumbnailUri
    expect(items[0].thumbnailUri).toBeUndefined()
  })

  // T5A-M42: click entry carries source=memories
  it('memory entry click navigates with source=memories', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    await memoryList.vm.$emit('select', 'm1')

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/memory-detail/index?memoryId=m1&source=memories'),
    )
  })

  // T5A-M42: back goes to space-home (04)
  it('back navigates to space-home', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: false } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    await pageShell.vm.$emit('back')
    expect(nav.back).toHaveBeenCalled()
  })

  // T5A-M44: no search, filter, tags, calendar, or waterfall UI
  it('has no search, filter, tags, calendar or waterfall controls', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).not.toContain('搜索')
    expect(text).not.toContain('筛选')
    expect(text).not.toContain('标签')
    expect(text).not.toContain('日历')
  })

  // T5A-M41: whole row = single detail semantic, no split targets
  it('whole row leads to detail only — no delete/edit split targets', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).not.toContain('删除')
    expect(text).not.toContain('编辑')
    expect(text).not.toContain('修改')
  })

  // ShowBack=true for non-root pages
  it('renders PageShell with showBack=true', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: false } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    expect(pageShell.props('showBack')).toBe(true)
  })

  // Complete tuantu fixture integration
  it('renders complete tuantu space memories correctly', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [tuantuSpace],
      memories: tuantuMemories,
      drafts: [],
      assets: tuantuAssets,
    })

    const wrapper = mount(MemoriesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('团团')
    expect(text).toContain('2 段记忆')

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    const items = memoryList.props('items') as any[]
    expect(items).toHaveLength(2)

    // Photo entry has thumbnail
    const photoEntry = items.find((i: any) => i.summary.includes('第一次'))
    expect(photoEntry.thumbnailUri).toBe('/static/fixtures/tuantu-photo1.jpg')

    // Text-only entry has no thumbnail
    const textEntry = items.find((i: any) => i.summary.includes('窗台'))
    expect(textEntry.thumbnailUri).toBeUndefined()
  })
})
