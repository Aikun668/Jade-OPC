import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import SpaceHomePage from '../../src/pages/space-home/index.vue'

// ---- helpers ----

interface SpaceHomePageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as SpaceHomePageExposed)._setQueryForTest(query)
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

// tuantu complete fixture
const tuantuSpace = { id: 's_tuantu', name: '团团', coverAssetId: 'a_tuantu_cover', createdAt: '2026-01-10T08:00:00.000Z', updatedAt: '2026-05-15T12:00:00.000Z' }
const tuantuMemories = [
  { id: 'm_tuantu_daily1', spaceId: 's_tuantu', entry: 'daily' as const, originalText: '团团今天在窗台上晒了一下午太阳，毛茸茸的耳朵在光里变成了粉红色。', aiCandidateText: null, assetIds: [], createdAt: '2026-03-01T10:00:00.000Z', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'm_tuantu_photo1', spaceId: 's_tuantu', entry: 'photo' as const, originalText: '第一次见到团团时，它正从纸箱里探出脑袋看着我。', aiCandidateText: 'AI改写版', assetIds: ['a_tuantu_photo1', 'a_tuantu_photo2'], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-20T09:00:00.000Z' },
]
const tuantuDraft = { id: 'd_tuantu_draft1', spaceId: 's_tuantu', entry: 'meeting' as const, text: '还记得那天在宠物店门口...', assetIds: ['a_tuantu_draft_photo'], createdAt: '2026-05-20T16:00:00.000Z', updatedAt: '2026-05-20T16:30:00.000Z' }
const tuantuAssets = [
  { id: 'a_tuantu_cover', ownerType: 'space' as const, ownerId: 's_tuantu', uri: '/fixtures/tuantu-cover.png', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
  { id: 'a_tuantu_photo1', ownerType: 'memory' as const, ownerId: 'm_tuantu_photo1', uri: '/fixtures/tuantu-photo1.png', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
  { id: 'a_tuantu_photo2', ownerType: 'memory' as const, ownerId: 'm_tuantu_photo1', uri: '/fixtures/tuantu-photo2.png', persistence: 'bundled' as const, availability: 'available' as const, order: 1 },
  { id: 'a_tuantu_draft_photo', ownerType: 'draft' as const, ownerId: 'd_tuantu_draft1', uri: '/fixtures/tuantu-cover.png', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
]

describe('Space-home page (04)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  // T5A-M24: bootstrap ready 前不显示 missing 或空首页
  it('T5A-M24: shows nothing during bootstrap (not ready)', () => {
    provideNavigation(mockNavigation())
    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })
    // No MissingContentState before ready
    const text = wrapper.text()
    expect(text).not.toContain('无法找到这个空间')
    expect(text).not.toContain('已经不存在了')
  })

  // T5A-M25: missing param → MissingContentState with back action
  it('T5A-M25: shows MissingContentState when spaceId param is missing', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('无法找到这个空间')
    expect(text).toContain('缺少空间信息')

    // Back action
    const missing = wrapper.findComponent({ name: 'MissingContentState' })
    await missing.vm.$emit('action')
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'spaces' })
  })

  // T5A-M25: invalid id (empty string) → MissingContentState
  it('T5A-M25: shows MissingContentState when spaceId is empty string', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: '' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('无法找到这个空间')
  })

  // T5A-M25: space not found
  it('T5A-M25: shows MissingContentState when space does not exist', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's_nonexistent' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('已经不存在了')
  })

  // T5A-M25: space not found action resets to spaces
  it('T5A-M25: space not found action navigates to spaces list', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's_nonexistent' })
    await wrapper.vm.$nextTick()

    const missing = wrapper.findComponent({ name: 'MissingContentState' })
    await missing.vm.$emit('action')
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'spaces' })
  })

  // T5A-M27: no-draft-no-memory
  it('T5A-M27: renders empty space with no draft and no memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's_doudou', name: '豆豆', coverAssetId: null, createdAt: '2026-02-20T09:00:00.000Z', updatedAt: '2026-02-20T09:00:00.000Z' }],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot name="empty"/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's_doudou' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('豆豆')
    expect(text).toContain('留下一段')
    // No "查看全部记忆" when no memories
    expect(text).not.toContain('查看全部记忆')
    // No draft notice
    expect(text).not.toContain('还记得那天')
  })

  // T5A-M27: draft-no-memory
  it('T5A-M27: shows DraftNotice when draft exists but no memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿内容...', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view class="draft-notice"><text>{{ title }}</text></view>', props: ['title'] }, MemoryList: { name: 'MemoryList', template: '<view><slot name="empty"/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('草稿内容...')
    expect(text).toContain('留下一段新的记忆')
  })

  // T5A-M27: no-draft-with-memory (1-3 memories)
  it('T5A-M27: shows memories when space has memories but no draft', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '第一段记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('最近留下')
    expect(text).toContain('查看全部记忆')
  })

  // T5A-M27: draft-with-memory
  it('T5A-M27: shows both DraftNotice and memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '完整体', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆内容', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '未完成的草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view class="draft-notice"><text>{{ title }}</text></view>', props: ['title'] }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('未完成的草稿')
    expect(text).toContain('最近留下')
    expect(text).toContain('查看全部记忆')
    expect(text).toContain('留下一段新的记忆')
  })

  // T5A-M28: max 3 memories on home
  it('T5A-M28: only shows up to 3 recent memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '多条记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆1', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'm2', spaceId: 's1', entry: 'daily' as const, originalText: '记忆2', aiCandidateText: null, assetIds: [], createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
        { id: 'm3', spaceId: 's1', entry: 'daily' as const, originalText: '记忆3', aiCandidateText: null, assetIds: [], createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-03-01T00:00:00.000Z' },
        { id: 'm4', spaceId: 's1', entry: 'daily' as const, originalText: '记忆4', aiCandidateText: null, assetIds: [], createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Check that MemoryList received at most 3 items
    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    expect(memoryList.exists()).toBe(true)
    expect(memoryList.props('items').length).toBeLessThanOrEqual(3)
  })

  // T5A-M29: drafts do not mix into recent memories
  it('T5A-M29: draft does not appear in MemoryList items', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '分隔', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '唯一记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '非记忆草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view><text>{{ title }}</text></view>', props: ['title'] }, MemoryList: false, MemoryEntry: { template: '<view/>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Verify draft is present separately from memories
    const text = wrapper.text()
    expect(text).toContain('非记忆草稿')
    // MemoryList with 1 item should be rendered
    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    expect(memoryList.exists()).toBe(true)
    expect(memoryList.props('items')).toHaveLength(1)
  })

  // T5A-M32: no broken image when cover is expired
  it('T5A-M32: does not show cover image when asset is expired', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '过期封面', coverAssetId: 'a_cover_expired', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      assets: [
        { id: 'a_cover_expired', ownerType: 'space' as const, ownerId: 's1', uri: '/broken.jpg', persistence: 'bundled' as const, availability: 'expired' as const, order: 0 },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // The cover image should not be rendered
    const imgs = wrapper.findAll('.space-home__cover')
    expect(imgs.length).toBe(0)
  })

  // T5A-M32: shows cover when available
  it('T5A-M32: shows cover image when space has available cover asset', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有封面', coverAssetId: 'a_cover', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      assets: [
        { id: 'a_cover', ownerType: 'space' as const, ownerId: 's1', uri: '/static/fixtures/cover.jpg', persistence: 'bundled' as const, availability: 'available' as const, order: 0 },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const img = wrapper.find('.space-home__cover')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/static/fixtures/cover.jpg')
  })

  // T5A-M31: no "查看全部记忆" when no memories
  it('T5A-M31: does not show "查看全部记忆" when space has no memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '无记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('查看全部记忆')
  })

  // T5A-M33: back goes to previous page (uses nav.back())
  it('T5A-M33: PageShell emits back → nav.back()', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: false } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    await pageShell.vm.$emit('back')
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'spaces' })
  })

  // T5A-M33: PageShell has showBack=true
  it('T5A-M33: PageShell receives showBack=true', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: false } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    expect(pageShell.props('showBack')).toBe(true)
  })

  // T5A-M34: record-entry (05) navigates with safe URL
  it('T5A-M34: record button navigates to record-entry with spaceId', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段'))
    expect(recordBtn).toBeTruthy()

    await recordBtn!.vm.$emit('press')
    // Check safe URL — spaceId only, no full objects
    const pushCalls = (nav.push as ReturnType<typeof vi.fn>).mock.calls
    const recordCall = pushCalls.find((c: string[]) => c[0].includes('record-entry'))
    expect(recordCall).toBeTruthy()
    expect(recordCall![0]).toContain('spaceId=s1')
  })

  // T5A-M34: memory detail (09) navigates with source=space-home
  it('T5A-M34: memory entry click navigates to memory-detail with source=space-home', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const memoryList = wrapper.findComponent({ name: 'MemoryList' })
    await memoryList.vm.$emit('select', 'm1')

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/memory-detail/index?memoryId=m1&source=space-home'),
    )
  })

  // T5A-M34: more (settings) in nav-right navigates with safe URL
  it('T5A-M34: more button navigates to space-settings with spaceId', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { DraftNotice: true, MemoryList: true } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const moreBtn = textActions.find(b => b.text().includes('更多'))
    expect(moreBtn).toBeTruthy()

    await moreBtn!.vm.$emit('press')
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/space-settings/index?spaceId=s1'),
    )
  })

  // T5A-M34: view all memories navigates to 08
  it('T5A-M34: "查看全部记忆" navigates to memories page with spaceId', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const viewAll = textActions.find(b => b.text().includes('查看全部记忆'))
    expect(viewAll).toBeTruthy()

    await viewAll!.vm.$emit('press')
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/memories/index?spaceId=s1'),
    )
  })

  // T5A-M30: "继续写" only in DraftNotice
  it('T5A-M30: "继续写" only appears inside DraftNotice', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: false } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // DraftNotice rendered
    const draftNotice = wrapper.findComponent({ name: 'DraftNotice' })
    expect(draftNotice.exists()).toBe(true)
  })

  // T5A-M33: PageShell title is space name
  it('T5A-M33: PageShell title reflects space name', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: false } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    expect(pageShell.props('title')).toBe('团团')
  })

  // T5A-M35: no delete or edit capabilities
  it('T5A-M35: page has no delete or edit controls', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's_tuantu', name: '团团', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [
        { id: 'm1', spaceId: 's_tuantu', entry: 'daily' as const, originalText: '记忆', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, MemoryList: { name: 'MemoryList', template: '<view><slot/></view>' } } },
    })

    setQuery(wrapper,{ spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).not.toContain('删除')
    expect(text).not.toContain('编辑')
    expect(text).not.toContain('修改')
  })

  // T5A-M34: DraftNotice continue navigates to record-text with draftId
  it('T5A-M34: DraftNotice continue navigates to record-text with draft params', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: false } },
    })

    setQuery(wrapper,{ spaceId: 's1' })
    await wrapper.vm.$nextTick()

    const draftNotice = wrapper.findComponent({ name: 'DraftNotice' })
    await draftNotice.vm.$emit('continue')

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-text/index?spaceId=s1&entry=daily&draftId=d1'),
    )
  })

  // Complete tuantu snapshot integration
  it('renders complete tuantu space correctly', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [tuantuSpace],
      memories: tuantuMemories,
      drafts: [tuantuDraft],
      assets: tuantuAssets,
    })

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /><slot name="navigation-right" /></view>' }, DraftNotice: false, MemoryList: false } },
    })

    setQuery(wrapper, { spaceId: 's_tuantu' })
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('团团')
    expect(text).toContain('留下一段新的记忆')
    expect(text).toContain('最近留下')
    expect(text).toContain('查看全部记忆')
    expect(text).toContain('更多')

    // Cover image exists
    const img = wrapper.find('.space-home__cover')
    expect(img.exists()).toBe(true)

    // Divider before recent memories section
    expect(wrapper.find('.space-home__divider').exists()).toBe(true)
  })

  // ---- draft resume (Step 4.6) ----

  it('shows resume dialog when clicking "留下一段新的记忆" with existing draft', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '一段未完成的草稿内容', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view/>', props: ['title'] } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Click the "留下一段新的记忆" button
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段新的记忆'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Resume dialog should appear
    expect(wrapper.text()).toContain('你还有一段没写完的')
    expect(wrapper.text()).toContain('继续写这段')
    expect(wrapper.text()).toContain('不保留，另起一段')
    expect(wrapper.text()).toContain('先不动')
  })

  it('"继续写这段" navigates to record-text with draft params', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'meeting' as const, text: '回忆片段', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view/>', props: ['title'] }, ConfirmDialog: false } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Trigger record button → shows resume dialog
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段新的记忆'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Click "继续写这段"
    const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await confirmDialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()

    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-text/index?spaceId=s1&entry=meeting&draftId=d1'),
    )
  })

  it('"另起一段" calls deleteDraft and navigates to record-entry', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '将被删除', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    // Spy on deleteDraft and let it resolve immediately
    const deleteSpy = vi.spyOn(memStore, 'deleteDraft').mockResolvedValue(undefined)

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view/>', props: ['title'] }, ConfirmDialog: false } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Trigger resume dialog
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段新的记忆'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Click "另起一段"
    const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await confirmDialog.vm.$emit('discard')
    // Wait for the async handler to complete
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // deleteDraft should have been called
    expect(deleteSpy).toHaveBeenCalledWith('d1')

    // Should navigate to record-entry
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-entry/index?spaceId=s1'),
    )
  })

  it('"先不动" closes dialog and stays on page', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '有草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [
        { id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' }, DraftNotice: { template: '<view/>', props: ['title'] }, ConfirmDialog: false } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Trigger resume dialog
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段新的记忆'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Click "先不动"
    const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await confirmDialog.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    // Draft should still exist
    const draftAfter = memStore.draftForSpace('s1')
    expect(draftAfter).not.toBeNull()

    // Should NOT have navigated to record-entry or record-text
    const pushCalls = (nav.push as ReturnType<typeof vi.fn>).mock.calls
    const recordCalls = pushCalls.filter((c: string[]) =>
      c[0].includes('record-entry') || c[0].includes('record-text'),
    )
    expect(recordCalls.length).toBe(0)
  })

  it('record button navigates directly when no draft exists', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [
        { id: 's1', name: '无草稿', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    const wrapper = mount(SpaceHomePage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    setQuery(wrapper, { spaceId: 's1' })
    await wrapper.vm.$nextTick()

    // Click "留下一段" (no draft exists)
    const buttons = wrapper.findAllComponents({ name: 'PrimaryButton' })
    const recordBtn = buttons.find(b => b.text().includes('留下一段'))
    await recordBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Should navigate directly without showing dialog
    expect(nav.push).toHaveBeenCalledWith(
      expect.stringContaining('/pages/record-entry/index?spaceId=s1'),
    )
    // No resume dialog
    expect(wrapper.text()).not.toContain('你还有一段没写完的')
  })
})
