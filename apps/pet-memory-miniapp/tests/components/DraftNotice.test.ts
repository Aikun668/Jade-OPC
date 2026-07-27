import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DraftNotice from '../../src/components/DraftNotice.vue'

function mountDraft(overrides = {}) {
  return mount(DraftNotice, {
    props: { title: '有一段还没写完的记录', ...overrides },
  })
}

describe('DraftNotice', () => {
  it('renders title', () => {
    const wrapper = mountDraft()
    expect(wrapper.text()).toContain('有一段还没写完的记录')
  })

  it('renders custom title', () => {
    const wrapper = mountDraft({ title: '有一条未完成的记录' })
    expect(wrapper.text()).toContain('有一条未完成的记录')
  })

  it('renders continue label and arrow together in button', () => {
    const wrapper = mountDraft({ continueLabel: '继续写' })
    const btn = wrapper.find('.draft-notice__continue-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('继续写')
    // Arrow icon is inside the same button
    expect(btn.find('.draft-notice__arrow-icon').exists()).toBe(true)
  })

  it('emits continue event when button is clicked', async () => {
    const wrapper = mountDraft({ continueLabel: '继续写' })
    await wrapper.find('.draft-notice__continue-btn').trigger('click')
    expect(wrapper.emitted('continue')).toBeTruthy()
    expect(wrapper.emitted('continue')).toHaveLength(1)
  })

  it('clicking arrow icon also emits continue (same button)', async () => {
    const wrapper = mountDraft()
    // Clicking the arrow image should trigger the button's click event
    await wrapper.find('.draft-notice__arrow-icon').trigger('click')
    expect(wrapper.emitted('continue')).toBeTruthy()
  })

  it('renders material image', () => {
    const wrapper = mountDraft()
    expect(wrapper.find('.draft-notice__material').exists()).toBe(true)
  })

  it('keeps content visible after material load failure', async () => {
    const wrapper = mountDraft()
    await wrapper.find('.draft-notice__material').trigger('error')
    expect(wrapper.text()).toContain('有一段还没写完的记录')
    // Continue button should still be present
    expect(wrapper.find('.draft-notice__continue-btn').exists()).toBe(true)
  })
})
