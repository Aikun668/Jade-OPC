import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import SpacesPage from '../../src/pages/spaces/index.vue'

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('Spaces page (02)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
  })

  // T5A-M16: loading state — no empty state display
  it('T5A-M16: shows loading state during bootstrap (idle)', () => {
    provideNavigation(mockNavigation())
    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })
    const text = wrapper.text()
    expect(text).not.toContain('还没有记忆空间')
    expect(text).not.toContain('暂时没有打开这里')
  })

  // T5A-M16: empty state shows create prompt when ready with no spaces
  it('T5A-M16: empty state shows create prompt when no spaces and ready', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._reset()

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('还没有记忆空间')
    const btn = wrapper.findComponent({ name: 'PrimaryButton' })
    expect(btn.exists()).toBe(true)
  })

  // T5A-M18: uses sortedSpaces
  it('T5A-M18: renders spaces using sortedSpaces order', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore._reset()

    memStore._commitSnapshot({
      spaces: [
        { id: 's-b', name: 'Beta', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 's-a', name: 'Alpha', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's-a', entry: 'daily' as const, originalText: 'Alpha latest', aiCandidateText: null, assetIds: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
        { id: 'm2', spaceId: 's-b', entry: 'daily' as const, originalText: 'Beta older', aiCandidateText: null, assetIds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      drafts: [],
      assets: [],
    })

    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /><slot name="navigation-right" /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('.spaces__item')
    expect(items.length).toBe(2)
    expect(items[0].text()).toContain('Alpha')
    expect(items[1].text()).toContain('Beta')

    // Structure assertions per baseline
    const text = wrapper.text()
    expect(text).toContain('每一个 Ta，都有自己的位置。')
    expect(text).toContain('+')
    expect(text).toContain('再为一位 Ta 创建空间')
  })

  // T5A-M19: no memories → "还没有留下记忆"
  it('T5A-M19: shows "还没有留下记忆" for space with no memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '无记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [],
      drafts: [],
      assets: [],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('还没有留下记忆')
  })

  // T5A-M20: with memories shows originalText and date
  it('T5A-M20: shows latest originalText and date for space with memories', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '有记忆', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: '今天团团很乖', aiCandidateText: 'AI改写版', assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
      drafts: [],
      assets: [],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('今天团团很乖')
    expect(text).not.toContain('AI改写版')
    expect(text).toContain('年')
  })

  // T5A-M20: empty originalText (photo-only memory) renders without crash
  it('T5A-M20: empty originalText renders card without crash', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '照片空间', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'photo' as const, originalText: '', aiCandidateText: null, assetIds: ['a1'], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
      drafts: [],
      assets: [
        { id: 'a1', ownerType: 'memory', ownerId: 'm1', uri: '/static/fixtures/test.jpg', persistence: 'bundled', availability: 'available', order: 0 },
      ],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    // Item should still render with an empty summary
    expect(wrapper.find('.spaces__item').exists()).toBe(true)
  })

  // T5A-M21: entire item clickable — pushes to space-home
  it('T5A-M21: clicking space item navigates to space-home', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [],
      drafts: [],
      assets: [],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    await wrapper.find('.spaces__item').trigger('click')
    expect(nav.push).toHaveBeenCalledWith('/pages/space-home/index?spaceId=s1')
  })

  // T5A-M21: no settings/delete/more buttons on items
  it('T5A-M21: space items have no settings, delete, or more buttons', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [],
      drafts: [],
      assets: [],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).not.toContain('设置')
    expect(text).not.toContain('删除')
    expect(text).not.toContain('更多')
  })

  // T5A-M22: root page has no back button
  it('T5A-M22: PageShell receives showBack=false', () => {
    provideNavigation(mockNavigation())
    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: false } },
    })
    const pageShell = wrapper.findComponent({ name: 'PageShell' })
    expect(pageShell.props('showBack')).toBe(false)
  })

  // T5A-M08: space item renders coverUri when available
  it('T5A-M08: renders cover image when space has available cover asset', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '封面空间', coverAssetId: 'a_cover', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [
        { id: 'm1', spaceId: 's1', entry: 'daily' as const, originalText: 'text', aiCandidateText: null, assetIds: [], createdAt: '2026-04-15T14:00:00.000Z', updatedAt: '2026-04-15T14:00:00.000Z' },
      ],
      drafts: [],
      assets: [
        { id: 'a_cover', ownerType: 'space', ownerId: 's1', uri: '/static/fixtures/cover.jpg', persistence: 'bundled', availability: 'available', order: 0 },
      ],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const img = wrapper.find('.spaces__item-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/static/fixtures/cover.jpg')
  })

  // T5A-M23: create button click navigates to /pages/space-create/index
  it('T5A-M23: create button click navigates to create page (empty state)', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._reset()

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const btn = wrapper.findComponent({ name: 'PrimaryButton' })
    await btn.trigger('click')
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index')
  })

  // T5A-M23: create link click navigates in with-spaces state
  it('T5A-M23: create link click navigates to create page (with-spaces state)', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot({
      spaces: [
        { id: 's1', name: '测试', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      memories: [],
      drafts: [],
      assets: [],
    })

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    // Find the create link by text — low-emphasis TextAction
    const actions = wrapper.findAllComponents({ name: 'TextAction' })
    const createAction = actions.find(b => b.text().includes('创建'))
    expect(createAction).toBeTruthy()
    await createAction!.vm.$emit('press')
    expect(nav.push).toHaveBeenCalledWith('/pages/space-create/index')
  })

  // T5A-M16: error state shows retry
  it('T5A-M16: error state shows retry and not empty spaces', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore._reset()
    appStore.$patch({ bootstrapStatus: 'error' } as any)

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('暂时没有打开这里')
    expect(text).not.toContain('还没有记忆空间')
  })

  // T5A-M16: error state retry calls bootstrap
  it('T5A-M16: retry button calls bootstrap', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()

    appStore._reset()
    appStore.$patch({ bootstrapStatus: 'error' } as any)

    let called = false
    appStore.bootstrap = async () => { called = true }

    const wrapper = mount(SpacesPage, {
      global: { stubs: { PageShell: { template: '<view><slot /></view>' } } },
    })

    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'PrimaryButton' })
    await button.vm.$emit('press')
    expect(called).toBe(true)
  })
})
