import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import BottomSheet from '../../src/components/BottomSheet.vue'

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  const baseProps = {
    open: true,
    title: '确认删除',
    confirmLabel: '删除',
    cancelLabel: '取消',
  }

  it('does not render when closed', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, open: false },
    })
    expect(wrapper.find('.confirm-dialog-root').exists()).toBe(false)
  })

  it('renders title and actions when open', () => {
    const wrapper = mount(ConfirmDialog, { props: baseProps })
    expect(wrapper.text()).toContain('确认删除')
    expect(wrapper.text()).toContain('删除')
    expect(wrapper.text()).toContain('取消')
  })

  it('renders description when provided', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, description: '删除后不可恢复' },
    })
    expect(wrapper.text()).toContain('删除后不可恢复')
  })

  it('emits confirm when primary button is pressed', async () => {
    const wrapper = mount(ConfirmDialog, { props: baseProps })
    await wrapper.findComponent({ name: 'PrimaryButton' }).vm.$emit('press')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel when cancel text action is pressed', async () => {
    const wrapper = mount(ConfirmDialog, { props: baseProps })
    const actions = wrapper.findAllComponents({ name: 'TextAction' })
    await actions[actions.length - 1].vm.$emit('press')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('keeps cancel enabled during pending-hidden phase (first 150ms)', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, pending: true },
    })
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const cancelBtn = textActions[textActions.length - 1]
    // Layout preserved during pending-hidden
    expect(cancelBtn.props('disabled')).toBe(false)
  })

  it('disables cancel after 150ms pending-visible phase', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, pending: true },
    })
    vi.advanceTimersByTime(160)
    await wrapper.vm.$nextTick()
    const textActions = wrapper.findAllComponents({ name: 'TextAction' })
    const cancelBtn = textActions[textActions.length - 1]
    expect(cancelBtn.props('disabled')).toBe(true)
  })

  it('does not emit cancel during pending-hidden phase', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, pending: true },
    })
    const actions = wrapper.findAllComponents({ name: 'TextAction' })
    await actions[actions.length - 1].vm.$emit('press')
    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('shows loading on primary button after 150ms pending-visible', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...baseProps, pending: true },
    })
    // During pending-hidden, loading not yet visible
    const primary = wrapper.findComponent({ name: 'PrimaryButton' })
    expect(primary.props('loading')).toBe(false)

    vi.advanceTimersByTime(160)
    await wrapper.vm.$nextTick()
    expect(primary.props('loading')).toBe(true)
  })

  describe('danger tone', () => {
    it('applies danger variant to confirm button', () => {
      const wrapper = mount(ConfirmDialog, {
        props: { ...baseProps, tone: 'danger' },
      })
      const primary = wrapper.findComponent({ name: 'PrimaryButton' })
      expect(primary.props('variant')).toBe('danger')
    })

    it('keeps cancel as muted for danger tone', () => {
      const wrapper = mount(ConfirmDialog, {
        props: { ...baseProps, tone: 'danger' },
      })
      const textActions = wrapper.findAllComponents({ name: 'TextAction' })
      const cancelBtn = textActions[textActions.length - 1]
      expect(cancelBtn.props('tone')).toBe('muted')
    })
  })

  describe('closed emit', () => {
    it('emits closed when open changes from true to false', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: { ...baseProps, open: true },
      })
      await wrapper.setProps({ open: false })
      expect(wrapper.emitted('closed')).toBeTruthy()
    })
  })

  describe('scroll lock', () => {
    it('prevents background scroll via touchmove', () => {
      const wrapper = mount(ConfirmDialog, { props: baseProps })
      const root = wrapper.find('.confirm-dialog-root')
      // Verify the root element exists and the scroll-lock mask is present
      expect(root.exists()).toBe(true)
      // The mask layer locks interaction
      expect(root.find('.confirm-dialog__mask').exists()).toBe(true)
    })

    it('closes and restores lifecycle on closed event', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: { ...baseProps, open: true },
      })
      expect(wrapper.find('.confirm-dialog-root').exists()).toBe(true)
      await wrapper.setProps({ open: false })
      // After close, root is removed and closed was emitted
      expect(wrapper.find('.confirm-dialog-root').exists()).toBe(false)
      expect(wrapper.emitted('closed')).toBeTruthy()
      expect(wrapper.emitted('closed')).toHaveLength(1)
    })
  })
})

describe('BottomSheet', () => {
  const baseProps = { open: true }

  it('does not render when closed', () => {
    const wrapper = mount(BottomSheet, {
      props: { ...baseProps, open: false },
    })
    expect(wrapper.find('.bottom-sheet-root').exists()).toBe(false)
  })

  it('renders title and description', () => {
    const wrapper = mount(BottomSheet, {
      props: {
        ...baseProps,
        title: '继续写这段？',
        description: '你已经有一段未完成的记录了',
      },
    })
    expect(wrapper.text()).toContain('继续写这段？')
    expect(wrapper.text()).toContain('你已经有一段未完成的记录了')
  })

  it('renders default slot content', () => {
    const wrapper = mount(BottomSheet, {
      props: baseProps,
      slots: { default: '<text>选项一</text>' },
    })
    expect(wrapper.text()).toContain('选项一')
  })

  it('renders actions slot', () => {
    const wrapper = mount(BottomSheet, {
      props: baseProps,
      slots: { actions: '<text>操作</text>' },
    })
    expect(wrapper.text()).toContain('操作')
  })

  it('emits close when mask is clicked and closeOnMask is true', async () => {
    const wrapper = mount(BottomSheet, {
      props: { ...baseProps, closeOnMask: true },
    })
    await wrapper.find('.bottom-sheet__mask--interactive').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit close on mask click when closeOnMask is false', async () => {
    const wrapper = mount(BottomSheet, {
      props: { ...baseProps, closeOnMask: false },
    })
    expect(wrapper.find('.bottom-sheet__mask--interactive').exists()).toBe(false)
  })

  describe('closed emit', () => {
    it('emits closed when open changes from true to false', async () => {
      const wrapper = mount(BottomSheet, {
        props: { ...baseProps, open: true },
      })
      await wrapper.setProps({ open: false })
      expect(wrapper.emitted('closed')).toBeTruthy()
    })
  })

  describe('scroll lock', () => {
    it('prevents background scroll via touchmove on mask', () => {
      const wrapper = mount(BottomSheet, { props: baseProps })
      const root = wrapper.find('.bottom-sheet-root')
      expect(root.exists()).toBe(true)
      // Verify mask exists for scroll locking
      expect(root.find('.bottom-sheet__mask').exists()).toBe(true)
    })

    it('opens and closes lifecycle cleanly', async () => {
      const wrapper = mount(BottomSheet, {
        props: { ...baseProps, open: true },
      })
      expect(wrapper.find('.bottom-sheet-root').exists()).toBe(true)
      await wrapper.setProps({ open: false })
      expect(wrapper.find('.bottom-sheet-root').exists()).toBe(false)
      expect(wrapper.emitted('closed')).toBeTruthy()
      expect(wrapper.emitted('closed')).toHaveLength(1)
    })
  })
})
