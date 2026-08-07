import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../../src/stores/app'
import { useMemoryStore } from '../../src/stores/memory'
import { provideNavigation, _resetNavigation } from '../../src/adapters/navigation-deps'
import { providePhotoPicker, _resetPhotoPicker } from '../../src/adapters/photo-picker-deps'
import type { NavigationAdapter } from '../../src/adapters/navigation'
import type { PhotoPicker, PickResult } from '../../src/adapters/photo-picker'
import SpaceCreatePage from '../../src/pages/space-create/index.vue'

// ---- helpers ----

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
    pick: vi.fn().mockResolvedValue({ kind: 'cancelled' } as PickResult),
    ...overrides,
  }
}

function mountPage() {
  return mount(SpaceCreatePage, {
    global: {
      stubs: {
        PageShell: {
          template: `
            <view class="mock-pageshell">
              <view v-if="$attrs['show-back'] || $attrs.showBack" class="mock-back" @click="$emit('back')">back</view>
              <view class="mock-keyboard">{{ $attrs.keyboardOpen ? 'kb-open' : 'kb-closed' }}</view>
              <slot name="intro" />
              <slot />
              <slot name="actions" />
            </view>
          `,
          inheritAttrs: true,
        },
      },
    },
  })
}

function setReady() {
  const appStore = useAppStore()
  const memStore = useMemoryStore()
  memStore._commitSnapshot({ spaces: [], memories: [], drafts: [], assets: [] })
  appStore.commitBootstrapReady({
    schemaVersion: 1,
    sampleMode: 'complete',
    hasCompletedOnboarding: true,
  })
}

describe('Space-create page (03)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetNavigation()
    _resetPhotoPicker()
    vi.stubGlobal('uni', {
      getWindowInfo: () => ({ windowWidth: 390 }),
      getMenuButtonBoundingClientRect: () => ({
        width: 87, height: 32, top: 52, right: 375, bottom: 84, left: 288,
      }),
      onKeyboardHeightChange: () => {},
      offKeyboardHeightChange: () => {},
    })
  })

  // ---- rendering ----

  it('renders page title and intro', () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('创建 Ta 的空间')
    expect(wrapper.text()).toContain('照片可以以后再补。名字是这里唯一需要先留下的内容。')
  })

  it('shows name input with placeholder and helper text', () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('最多 20 个字')
  })

  it('shows photo picker placeholder initially', () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('添加一张照片')
  })

  // ---- name validation ----

  it('T5B-M22: shows name error when submitting empty name', async () => {
    provideNavigation(mockNavigation())
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const wrapper = mountPage()
    const submitBtn = wrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')
    expect(wrapper.text()).toContain('先写下 Ta 的名字')
  })

  it('T5B-M38: does not call store when name validation fails', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const memStore = useMemoryStore()
    const spy = vi.spyOn(memStore, 'createSpace')

    const wrapper = mountPage()
    const submitBtn = wrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')

    expect(spy).not.toHaveBeenCalled()
  })

  // ---- photo picker ----

  it('T5B-M27: cancelled keeps original state without error', async () => {
    const picker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({ kind: 'cancelled' } as PickResult),
    })
    provideNavigation(mockNavigation())
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    // No error message should appear
    expect(wrapper.text()).not.toContain('权限')
    expect(wrapper.text()).not.toContain('失败')
  })

  it('T5B-M28: denied shows permission message', async () => {
    const picker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({ kind: 'denied' } as PickResult),
    })
    provideNavigation(mockNavigation())
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('权限')
  })

  it('T5B-M28: failed shows error message', async () => {
    const picker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({ kind: 'failed' } as PickResult),
    })
    provideNavigation(mockNavigation())
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('失败')
  })

  it('T5B-M29: replace failure keeps old photo', async () => {
    const picker = mockPhotoPicker({
      pick: vi.fn()
        .mockResolvedValueOnce({ kind: 'selected', photos: [{ uri: '/tmp/photo1.jpg' }] } as PickResult)
        .mockResolvedValueOnce({ kind: 'failed' } as PickResult),
    })
    provideNavigation(mockNavigation())
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    // First selection succeeds
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('更换')

    // Replace fails
    const replaceBtn = wrapper.find('.space-create__photo-replace')
    await replaceBtn.trigger('click')
    // Should still have the old photo (replace button visible)
    expect(wrapper.text()).toContain('更换')
  })

  it('T5B-M30: remove clears photo and shows add button again', async () => {
    const picker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({ kind: 'selected', photos: [{ uri: '/tmp/photo1.jpg' }] } as PickResult),
    })
    provideNavigation(mockNavigation())
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    // Add photo
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('移除')

    // Remove it
    const removeBtn = wrapper.find('.space-create__photo-remove')
    await removeBtn.trigger('click')
    expect(wrapper.text()).toContain('添加一张照片')
  })

  // ---- double-click prevention ----

  it('T5B-A08: double click only creates one space', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const memStore = useMemoryStore()
    let resolveCreate: (v: any) => void
    const createPromise = new Promise<any>(r => { resolveCreate = r })
    const spy = vi.spyOn(memStore, 'createSpace').mockReturnValue(createPromise)

    const wrapper = mountPage()
    const input = wrapper.find('.space-create__name-input')
    await input.setValue('团团')

    const submitBtn = wrapper.find('.space-create__submit button')
    // Fire first click (starts but doesn't finish), then second immediately
    const firstClick = submitBtn.trigger('click')
    await submitBtn.trigger('click')
    // Resolve the first call so the test can finish
    resolveCreate!({
      id: 's_double',
      name: '团团',
      coverAssetId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await firstClick

    expect(spy).toHaveBeenCalledTimes(1)
  })

  // ---- fail → retry → success ----

  it('T5B-A09: fail then retry succeeds with full recovery', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'createSpace')
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({
        id: 's_retry',
        name: '团团',
        coverAssetId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    const wrapper = mountPage()
    const input = wrapper.find('.space-create__name-input')
    await input.setValue('团团')

    // First attempt fails
    const submitBtn = wrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')
    expect(wrapper.text()).toContain('准备好')
    expect(nav.resetTo).not.toHaveBeenCalled()

    // Retry succeeds
    await submitBtn.trigger('click')
    expect(nav.resetTo).toHaveBeenCalledWith({ page: 'space-home', spaceId: 's_retry' })
  })

  // ---- photo-only dirty back ----

  it('T5B-M34: photo-only dirty triggers return protection', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    const picker = mockPhotoPicker({
      pick: vi.fn().mockResolvedValue({ kind: 'selected', photos: [{ uri: '/tmp/p.jpg' }] } as PickResult),
    })
    providePhotoPicker(picker)
    setReady()
    const wrapper = mountPage()
    // Select a photo without entering a name
    const addBtn = wrapper.find('.space-create__photo-add')
    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('更换')

    // Back should trigger return protection
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).not.toHaveBeenCalled()
    expect(wrapper.find('.confirm-dialog-root').exists()).toBe(true)
  })

  // ---- return protection ----

  it('T5B-M33: pristine back navigates directly', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const wrapper = mountPage()
    const backBtn = wrapper.find('.mock-back')
    await backBtn.trigger('click')
    expect(nav.back).toHaveBeenCalled()
    expect(wrapper.find('.confirm-dialog-root').exists()).toBe(false)
  })

  // ---- submit ----

  it('T5B-M43: submit success navigates to space-home with new space id', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const memStore = useMemoryStore()
    const newSpace = {
      id: 's_new123',
      name: '团团',
      coverAssetId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    vi.spyOn(memStore, 'createSpace').mockResolvedValue(newSpace)

    const wrapper = mountPage()
    // Type a name
    const input = wrapper.find('.space-create__name-input')
    await input.setValue('团团')

    const submitBtn = wrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')

    expect(memStore.createSpace).toHaveBeenCalled()
    expect(nav.resetTo).toHaveBeenCalledWith({
      page: 'space-home',
      spaceId: 's_new123',
    })
  })

  it('T5B-M40: submit failure keeps form values and shows error', async () => {
    const nav = mockNavigation()
    provideNavigation(nav)
    providePhotoPicker(mockPhotoPicker())
    setReady()
    const memStore = useMemoryStore()
    vi.spyOn(memStore, 'createSpace').mockRejectedValue(new Error('fail'))

    const wrapper = mountPage()
    const input = wrapper.find('.space-create__name-input')
    await input.setValue('团团')

    const submitBtn = wrapper.find('.space-create__submit button')
    await submitBtn.trigger('click')

    // Should still have the name
    expect((input.element as HTMLInputElement).value).toBe('团团')
    // Should show submit error
    expect(wrapper.text()).toContain('准备好')
    // Should NOT navigate
    expect(nav.resetTo).not.toHaveBeenCalled()
  })
})
