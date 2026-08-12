import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import { provideAiDraftService, _resetAiDraftService } from '../../src/services/ai-draft-service-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import type { AiDraftService } from '../../src/services/ai-draft-service'
import type { AiDraftResult, CreateAiDraftInput } from '../../src/types/ai'

function mockNavigation(overrides: Partial<NavigationAdapter> = {}): NavigationAdapter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    resetTo: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function pageShellStub() {
  return {
    props: {
      layout: { type: String, default: '' },
      compactIntro: { type: Boolean, default: false },
    },
    template: `
      <view
        class="mock-pageshell"
        :data-layout="layout"
        :data-compact-intro="String(compactIntro)"
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
  aiCandidateText: null,
  assetIds: [],
  createdAt: '2026-07-22T15:00:00.000Z',
  updatedAt: '2026-07-22T15:00:00.000Z',
}

const CANDIDATE = '那天下午，阳光落在团团柔软的毛上。我们没有做什么，只是安静地坐在窗边，把那一小段温暖留在了彼此身边。'

interface AiDraftPageExposed {
  _setQueryForTest: (query: Record<string, unknown>) => void
  _overridePageStateForTest: (state: string) => void
}

function setQuery(wrapper: ReturnType<typeof mount>, query: Record<string, unknown>): void {
  ;(wrapper.vm as unknown as AiDraftPageExposed)._setQueryForTest(query)
}

describe('AI draft page (Task 8 Step 5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetAiDraftService()
  })

  // ---- missing / not-found ----

  it('T8-A01: missing memoryId shows missing state', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('无法找到这段记忆')
  })

  it('T8-A02: memory not found shows not-exist state', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
    }))

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm_nonexistent' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('这段记忆已经不存在了')
  })

  // ---- authorization-required ----

  it('T8-A03: shows authorization prompt with confirm button', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-pageshell').attributes('data-layout')).toBe('standard-flow')
    expect(wrapper.find('.mock-pageshell').attributes('data-compact-intro')).toBe('true')
    expect(wrapper.find('.ai-draft__consent--flow').exists()).toBe(true)
    expect(wrapper.find('.ai-draft__actions--flow').exists()).toBe(true)
    expect(wrapper.text()).toContain('生成一版草稿')
    expect(wrapper.text()).toContain('将基于这段原话生成一版可编辑的草稿。原话会一直保留。')
    expect(wrapper.text()).toContain('团团今天在窗台上晒了一下午太阳。')
  })

  // ---- success state ----

  it('T8-A04: after authorization shows AI candidate text and action buttons', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    provideAiDraftService({
      createDraft: vi.fn().mockResolvedValue({ kind: 'success', candidate: CANDIDATE } as AiDraftResult),
    })

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Click "生成一版草稿" (PrimaryButton)
    const authBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('生成一版草稿'))
    await authBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    // Should show candidate text in editable textarea
    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toContain('那天下午，阳光落在团团柔软的毛上')
    expect(wrapper.find('.ai-draft__candidate').exists()).toBe(true)
    expect(wrapper.find('.ai-draft__actions--flow').exists()).toBe(true)
    expect(wrapper.text()).toContain('使用这版草稿')
    // "重新生成" should NOT appear in success state
    expect(wrapper.text()).not.toContain('重新生成')
  })

  it('T8-A04b: existing saved candidate opens directly in editable state', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [{ ...testMemory, aiCandidateText: CANDIDATE }],
    }))

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('textarea').element.value).toBe(CANDIDATE)
    expect(wrapper.text()).toContain('使用这版草稿')
    expect(wrapper.text()).not.toContain('生成一版草稿')
  })

  // ---- insufficient state ----

  it('T8-A05: insufficient result shows message and re-generate option', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    provideAiDraftService({
      createDraft: vi.fn().mockResolvedValue({ kind: 'insufficient' } as AiDraftResult),
    })

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Click "生成一版草稿" (PrimaryButton)
    const authBtn2 = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('生成一版草稿'))
    await authBtn2!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('不足以')
  })

  // ---- unavailable state ----

  it('T8-A06: unavailable result shows message', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    provideAiDraftService({
      createDraft: vi.fn().mockResolvedValue({ kind: 'unavailable' } as AiDraftResult),
    })

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const authBtn3 = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('生成一版草稿'))
    await authBtn3!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('不可用')
  })

  // ---- save success ----

  it('T8-A07: save candidate calls updateMemory and navigates back', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    provideAiDraftService({
      createDraft: vi.fn().mockResolvedValue({ kind: 'success', candidate: CANDIDATE } as AiDraftResult),
    })
    vi.spyOn(memStore, 'updateMemory').mockResolvedValue()

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Authorize and wait for success
    const authBtn4 = wrapper.findAll('.primary-btn').find(b => b.text().includes('生成一版草稿'))
    await authBtn4!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click "使用这版草稿"
    const saveBtn = wrapper.findAll('.primary-btn').find(b => b.text().includes('使用这版草稿'))
    await saveBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(memStore.updateMemory).toHaveBeenCalledWith({
      kind: 'ai-candidate',
      memoryId: 'm1',
      aiCandidateText: CANDIDATE,
    })
    expect(nav.back).toHaveBeenCalled()
  })

  it('updates the candidate from a mini-program input event detail value', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()
    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [{ ...testMemory, aiCandidateText: CANDIDATE }],
    }))

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, { global: { stubs: { PageShell: pageShellStub() } } })
    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    await wrapper.find('textarea').trigger('input', { detail: { value: '来自微信事件的候选稿' } })
    await wrapper.vm.$nextTick()

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('来自微信事件的候选稿')
  })

  // ---- save error ----

  it('T8-A08: save error shows error message and allows retry', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    provideAiDraftService({
      createDraft: vi.fn().mockResolvedValue({ kind: 'success', candidate: CANDIDATE } as AiDraftResult),
    })
    vi.spyOn(memStore, 'updateMemory').mockRejectedValue(new Error('Storage error'))

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub(), PrimaryButton: { template: '<view class="primary-btn" @click="$emit(\'press\')"><slot /></view>' } } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const authBtn5 = wrapper.findAll('.primary-btn').find(b => b.text().includes('生成一版草稿'))
    await authBtn5!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click save — fails
    const saveBtn2 = wrapper.findAll('.primary-btn').find(b => b.text().includes('使用这版草稿'))
    await saveBtn2!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('没有保存成功')

    // Retry
    vi.mocked(memStore.updateMemory).mockResolvedValue()
    await saveBtn2!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(nav.back).toHaveBeenCalled()
  })

  // ---- re-generate ----

  it('T8-A09: "重新生成" in insufficient state calls createDraft again', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    const mockCreateDraft = vi.fn()
      .mockResolvedValueOnce({ kind: 'insufficient' } as AiDraftResult)
      .mockResolvedValueOnce({ kind: 'success', candidate: CANDIDATE } as AiDraftResult)

    provideAiDraftService({ createDraft: mockCreateDraft })

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    // Click "生成一版草稿" → goes to insufficient
    const authBtn6 = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('生成一版草稿'))
    await authBtn6!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(mockCreateDraft).toHaveBeenCalledTimes(1)

    // Click "重新生成" (PrimaryButton in insufficient state)
    const retryBtn = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('重新生成'))
    await retryBtn!.vm.$emit('press')
    await wrapper.vm.$nextTick()

    expect(mockCreateDraft).toHaveBeenCalledTimes(2)
  })

  // ---- double-click guard on authorize ----

  it('T8-A10: double-click authorize only calls createDraft once', async () => {
    provideNavigation(mockNavigation())
    const appStore = useAppStore()
    const memStore = useMemoryStore()

    appStore.$patch({ bootstrapStatus: 'ready' } as any)
    memStore._commitSnapshot(mkSnapshot({
      spaces: [{ id: 's1', name: 'test', coverAssetId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      memories: [testMemory],
    }))

    let resolveDraft: (v: AiDraftResult) => void = () => {}
    const draftPromise = new Promise<AiDraftResult>(resolve => { resolveDraft = resolve })
    const mockCreateDraft = vi.fn().mockReturnValue(draftPromise)

    provideAiDraftService({ createDraft: mockCreateDraft })

    const page = await import('../../src/pages/ai-draft/index.vue')
    const wrapper = mount(page.default, {
      global: { stubs: { PageShell: pageShellStub() } },
    })

    setQuery(wrapper, { memoryId: 'm1' })
    await wrapper.vm.$nextTick()

    const authBtn7 = wrapper.findAllComponents({ name: 'PrimaryButton' }).find(b => b.text().includes('生成一版草稿'))
    await authBtn7!.vm.$emit('press')
    await authBtn7!.vm.$emit('press')

    resolveDraft({ kind: 'success', candidate: CANDIDATE })
    await wrapper.vm.$nextTick()

    expect(mockCreateDraft).toHaveBeenCalledTimes(1)
  })
})
