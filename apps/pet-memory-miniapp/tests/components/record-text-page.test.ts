import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useMemoryStore } from '../../src/stores/memory'
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

function setPhotos(wrapper: ReturnType<typeof mount>, photos: any[]) {
  ;(wrapper.vm as any)._setPhotosForTest(photos)
}

function stubPageShell() {
  return {
    template: `
      <view class="mock-pageshell">
        <view>{{ $attrs.title || '' }}</view>
        <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
        <slot name="intro" />
        <slot />
        <slot name="actions" />
      </view>
    `,
    inheritAttrs: true,
  }
}

function setReady() {
  const memStore = useMemoryStore()
  memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
}

describe('Record-text page (06)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetPhotoPicker()
  })

  // ---- rendering ----

  it('renders page title "留下一段"', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    expect(wrapper.text()).toContain('留下一段')
  })

  it('shows eyebrow and correct prompt for daily entry', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    // Simulate onLoad with entry=daily
    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('一个小问题')
  })

  it('shows textarea with placeholder', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()
    const textareaEl = wrapper.find('textarea')
    expect(textareaEl.attributes('placeholder')).toContain('想到什么')
  })

  it('shows over-limit message when text exceeds 2000 chars', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setTextForTest) vm._setTextForTest('a'.repeat(2001))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('已超过')
  })

  it('has save and draft action buttons', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn"><slot /></view>' } } },
    })
    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('留下这段原话')
    expect(wrapper.text()).toContain('先留在草稿里')
  })

  it('shows add-photo button', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn"><slot /></view>' } } },
    })
    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('加一张照片')
  })

  it('renders a small image icon before the add-photo action', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.record-text__add-photo-icon').exists()).toBe(true)
  })

  // ---- actions ----

  it('saveMemory navigates to memory-detail on success', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'saveMemory').mockResolvedValue({
      id: 'm_new',
      spaceId: 's1',
      entry: 'daily',
      originalText: 'hello',
      aiCandidateText: null,
      assetIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('hello')
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.saveMemory).toHaveBeenCalledWith({
      spaceId: 's1',
      entry: 'daily',
      originalText: 'hello',
      assets: [],
      sourceDraftId: null,
    })
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'memory-detail', memoryId: 'm_new', source: 'new-memory' })
  })

  it('saveDraft navigates back on success', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'saveDraft').mockResolvedValue({
      id: 'd_new',
      spaceId: 's1',
      entry: 'daily',
      text: 'draft text',
      assetIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('draft text')
    await wrapper.vm.$nextTick()

    // Find the TextAction "先留在草稿里"
    const draftActions = wrapper.findAll('.text-action')
    const draftBtn = draftActions.find(b => b.text().includes('草稿'))
    await draftBtn!.trigger('click')

    expect(memStore.saveDraft).toHaveBeenCalled()
    expect(nav.back).toHaveBeenCalled()
  })

  // ---- help panel ----

  it('"有点想不起来" toggles help panel visibility', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })
    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('有点想不起来')
    // Panel should be hidden initially
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(false)

    // Click "有点想不起来" → panel opens
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('换个更小的片段')
    expect(wrapper.text()).toContain('先写下一个动作')
    expect(wrapper.text()).toContain('这次先不写')

    // Click again → panel closes
    await helpBtn.trigger('click')
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(false)
  })

  it('"换个更小的片段" closes panel, shows hint, does not change text', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('我的原话')
    await wrapper.vm.$nextTick()

    // Open help panel
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(true)

    // Click "换个更小的片段"
    const options = wrapper.findAll('.record-text__help-option')
    const smallerOption = options.find(o => o.text().includes('更小的片段'))
    await smallerOption!.trigger('click')

    // Panel closed
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(false)
    // Hint shown
    expect(wrapper.text()).toContain('试试只写下此刻最清晰的那一个画面')
    // Text unchanged
    expect(vm._setTextForTest).toBeDefined()
  })

  it('"先写下一个动作" closes panel, shows hint, does not change text', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('我的原话')
    await wrapper.vm.$nextTick()

    // Open help panel
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')

    // Click "先写下一个动作"
    const options = wrapper.findAll('.record-text__help-option')
    const actionOption = options.find(o => o.text().includes('动作'))
    await actionOption!.trigger('click')

    // Panel closed
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(false)
    // Hint shown
    expect(wrapper.text()).toContain('从 Ta 刚刚做的一个动作开始写')
  })

  it('"这次先不写" triggers return protection when dirty', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('有内容')
    await wrapper.vm.$nextTick()

    // Open help panel
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')

    // Click "这次先不写"
    const options = wrapper.findAll('.record-text__help-option')
    const exitOption = options.find(o => o.text().includes('先不写'))
    await exitOption!.trigger('click')

    // Panel closed
    expect(wrapper.find('.record-text__help-panel').exists()).toBe(false)
    // Return protection dialog shown
    expect(wrapper.text()).toContain('这段还没保存')
  })

  it('"这次先不写" navigates back directly when not dirty', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    // Open help panel
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')

    // Click "这次先不写" with empty text
    const options = wrapper.findAll('.record-text__help-option')
    const exitOption = options.find(o => o.text().includes('先不写'))
    await exitOption!.trigger('click')

    expect(nav.back).toHaveBeenCalled()
  })

  it('help hint clears when user starts typing', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    // Open help panel and select "smaller"
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')
    const options = wrapper.findAll('.record-text__help-option')
    const smallerOption = options.find(o => o.text().includes('更小的片段'))
    await smallerOption!.trigger('click')

    expect(wrapper.text()).toContain('试试只写下此刻最清晰的那一个画面')

    // Simulate text input — hint should disappear
    const textarea = wrapper.find('textarea')
    await textarea.trigger('input', { detail: { value: '新内容' } })
    expect(wrapper.text()).not.toContain('试试只写下此刻最清晰的那一个画面')
  })

  it('help hint clears when toggling help panel', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    // Open help panel, select option to show hint
    const helpBtn = wrapper.find('.record-text__help .text-action')
    await helpBtn.trigger('click')
    const options = wrapper.findAll('.record-text__help-option')
    const smallerOption = options.find(o => o.text().includes('更小的片段'))
    await smallerOption!.trigger('click')
    expect(wrapper.text()).toContain('试试只写下此刻最清晰的那一个画面')

    // Open help again — hint should clear
    await helpBtn.trigger('click')
    expect(wrapper.text()).not.toContain('试试只写下此刻最清晰的那一个画面')
  })

  it('back button navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
  })

  // ---- return-protection (Step 4.6) ----

  it('"放弃" in return-protection navigates back without saving draft', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'saveDraft')

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('有内容')
    await wrapper.vm.$nextTick()

    // Trigger back → return protection dialog
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('这段还没保存')
    expect(wrapper.text()).toContain('放弃')

    // Click "放弃"
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('discard')
    await wrapper.vm.$nextTick()

    expect(nav.back).toHaveBeenCalled()
    expect(memStore.saveDraft).not.toHaveBeenCalled()
  })

  it('"继续写" in return-protection closes dialog and stays', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    if (vm._setTextForTest) vm._setTextForTest('有内容')
    await wrapper.vm.$nextTick()

    // Trigger back → return protection dialog
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Click "继续写" (cancel)
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    // Should NOT have navigated
    expect(nav.back).not.toHaveBeenCalled()
  })

  // ---- draft pre-fill (Step 4.6) ----

  it('pre-fills text and entry when draftId is in query params', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const memStore = useMemoryStore()
    memStore._commitSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      drafts: [{ id: 'd1', spaceId: 's1', entry: 'meeting' as const, text: '预填内容', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' }],
      memories: [],
      assets: [],
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', draftId: 'd1' })
    await wrapper.vm.$nextTick()

    // Text should be pre-filled from draft
    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('预填内容')
  })

  it('saveMemory passes sourceDraftId when loaded from draft', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    setReady()
    const memStore = useMemoryStore()
    memStore._commitSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      drafts: [{ id: 'd1', spaceId: 's1', entry: 'daily' as const, text: '草稿内容', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' }],
      memories: [],
      assets: [],
    })
    vi.spyOn(memStore, 'saveMemory').mockResolvedValue({
      id: 'm_new', spaceId: 's1', entry: 'daily',
      originalText: '草稿内容', aiCandidateText: null,
      assetIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', draftId: 'd1' })
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.saveMemory).toHaveBeenCalledWith(expect.objectContaining({
      sourceDraftId: 'd1',
      originalText: '草稿内容',
    }))
  })

  it('ignores draftId from different space', async () => {
    provideNavigation(mockNavigation())
    setReady()
    const memStore = useMemoryStore()
    memStore._commitSnapshot({
      spaces: [{ id: 's2', name: 'other', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      drafts: [{ id: 'd1', spaceId: 's2', entry: 'daily' as const, text: '其他空间的草稿', assetIds: [], createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' }],
      memories: [],
      assets: [],
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    if (vm._setQueryForTest) vm._setQueryForTest({ spaceId: 's1', draftId: 'd1' })
    await wrapper.vm.$nextTick()

    // Text should NOT be pre-filled (draft belongs to different space)
    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('')
  })

  // ---- photo integration (Task 7) ----

  it('shows photo thumb after successful pick', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker({
      kind: 'selected',
      photos: [{ uri: '/tmp/photo1.png' }],
    }))
    setReady()

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    await wrapper.vm.$nextTick()

    // Click "加一张照片"
    const addBtn = wrapper.find('.record-text__add-photo .text-action')
    await addBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Photo thumb should appear
    const thumbs = wrapper.findAll('.record-text__photo-thumb')
    expect(thumbs.length).toBe(1)
    expect(thumbs[0].attributes('src')).toBe('/tmp/photo1.png')
  })

  it('can remove a selected photo', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/tmp/keep.png' } }, { kind: 'new', photo: { uri: '/tmp/remove.png' } }])
    await wrapper.vm.$nextTick()

    // Two thumbnails visible
    expect(wrapper.findAll('.record-text__photo-thumb').length).toBe(2)

    // Click first "移除" button (removes index 1)
    const removeBtns = wrapper.findAll('.record-text__photo-item .text-action')
    await removeBtns[1].trigger('click')
    await wrapper.vm.$nextTick()

    // One thumbnail left
    expect(wrapper.findAll('.record-text__photo-thumb').length).toBe(1)
  })

  it('saveMemory includes photo assets', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()

    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'saveMemory').mockResolvedValue({
      id: 'm_photo', spaceId: 's1', entry: 'daily',
      originalText: 'hi', aiCandidateText: null,
      assetIds: ['a1'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    vm._setTextForTest('hi')
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/tmp/p1.png' } }])
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.primary-btn')
    await saveBtn.trigger('click')

    expect(memStore.saveMemory).toHaveBeenCalledWith(expect.objectContaining({
      spaceId: 's1',
      originalText: 'hi',
      assets: [{ kind: 'new', asset: { uri: '/tmp/p1.png' } }],
    }))
  })

  it('return protection triggers when photos are dirty (even with no text)', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/tmp/p1.png' } }])
    await wrapper.vm.$nextTick()

    // Trigger back → return protection dialog should appear (photos are dirty)
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('这段还没保存')
  })

  it('return protection "保存草稿" saves with photo assets', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()

    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'saveDraft').mockResolvedValue({
      id: 'd_photo', spaceId: 's1', entry: 'daily',
      text: '', assetIds: ['a_new'],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', entry: 'daily' })
    setPhotos(wrapper, [{ kind: 'new', photo: { uri: '/tmp/p1.png' } }])
    await wrapper.vm.$nextTick()

    // Trigger back → return protection
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Click "保存草稿" (confirm)
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()

    expect(memStore.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      spaceId: 's1',
      assets: [{ kind: 'new', asset: { uri: '/tmp/p1.png' } }],
    }))
    expect(nav.back).toHaveBeenCalled()
  })

  it('pre-fills photos when draft with assets is loaded', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()

    const memStore = useMemoryStore()
    memStore._commitSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      drafts: [{
        id: 'd_assets', spaceId: 's1', entry: 'daily' as const,
        text: '有图的草稿', assetIds: ['a_existing1', 'a_existing2'],
        createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z',
      }],
      memories: [],
      assets: [],
    })

    const page = await import('../../src/pages/record-text/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: stubPageShell() } },
    })

    const vm = wrapper.vm as any
    vm._setQueryForTest({ spaceId: 's1', draftId: 'd_assets' })
    await wrapper.vm.$nextTick()

    // Text pre-filled
    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('有图的草稿')

    // Photo items restored as 'existing' kind — check via remove buttons
    const removeBtns = wrapper.findAll('.record-text__photo-item .text-action')
    expect(removeBtns.length).toBe(2)
  })
})
